import {
  default as express,
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from 'express';
import * as tf from '@tensorflow/tfjs-node';
import { ToxicityClassifier } from '@tensorflow-models/toxicity';

const app = express();
app.use(express.json());
const host = process.env.TROLL_SCORER_LOCALHOST ?? '0.0.0.0';
const port = parseInt(process.env.TROLL_SCORER_PORT ?? '7070');
const threshold = parseFloat(process.env.TROLL_SCORER_THRESHOLD ?? '0.9');

let model: ToxicityClassifier;

app.listen(port, host, async () => {
  console.log('tf backend loading started...');
  await tf.ready()
  console.log('tf backend loading completed');

  console.log('Loading model started...', {threshold});
  model = new ToxicityClassifier(threshold);
  await model.load();
  console.log('Loading model completed', {threshold});
  console.log(`Server running on port: ${port}`);
});

const SENTIMENT_POSITIVE = 'positive';
const SENTIMENT_NEGATIVE = 'negative';

interface PredictionConfidence {
  negative: number;
  positive: number;
}
interface PredictSentimentResponse {
  text: string;
  sentiment: string;
  confidence: PredictionConfidence;
  classificationResult: ClassificationResult;
}
const getDefaultPredictSentimentResponse = (
  txt: string,
): PredictSentimentResponse => {
  return {
    text: txt,
    sentiment: SENTIMENT_POSITIVE,
    confidence: { positive: 1, negative: 0 },
    classificationResult: { results: [] },
  };
};

interface PredictSentimentRequest {
  text: string;
}
interface LabelResult {
  match: boolean;
  probabilities: Float32Array;
}
interface LabelClassificationResult {
  label: string;
  results: LabelResult[];
}
interface ClassificationResult {
  results: LabelClassificationResult[];
}
const predictSentiment = async (
  request: Request,
  response: Response<PredictSentimentResponse>,
  next: NextFunction,
) => {
  if (!request.body.text) {
    console.error('Received req no text found, body: ', request.body);
    response.statusMessage = "Invalid request, 'text' cannot be empty";
    return response.status(400).end();
  }
  const text = request.body.text;
  const res: LabelClassificationResult[] = await model.classify(text);
  if (!res || res.length === 0) {
    return response.status(200).json(getDefaultPredictSentimentResponse(text));
  }

  let label: string = 'none';
  let positive: number = 1;
  let negative: number = 0;
  res.forEach((r: LabelClassificationResult) => {
    for (const res of r.results) {
      if (!res.match) continue;
      if (!res.probabilities || res.probabilities.length < 2) {
        console.warn('Did not find both probabilities for: ', { label, text });
        continue;
      }
      const [pos_prob, neg_prob] = res.probabilities;
      if (negative < neg_prob) {
        label = r.label;
        positive = pos_prob;
        negative = neg_prob;
      }
    }
  });
  return response.status(200).json({
    text: request.body.text,
    sentiment: positive > negative ? SENTIMENT_POSITIVE : SENTIMENT_NEGATIVE,
    confidence: { negative, positive },
    classificationResult: { results: res },
  });
};

app.post('/sentiment', predictSentiment);
