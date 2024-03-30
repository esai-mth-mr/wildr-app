// initialized in a different file to avoid hoisting.
// dd-trace is deprecated but keeping the code around till full transition to
// opentelemetry.

const kGQLOpTypeAttr = 'graphql.operation.type';
const kGQLOpNameAttr = 'graphql.operation.name';
const kGQLOpNameHeader = 'x-wildr-op-name';

if (process.env.WILDR_ENABLE_DD_TRACE === true) {
  const tracer = require('dd-trace').init();
  tracer
    .init({
      profiling: process.env.DD_PROFILING_ENABLED ?? false,
      orphanable: false,
      logInjection: false,
      service: process.env.WILDR_SERVICE_NAME ?? undefined,
    })
    .use('graphql', {
      enabled: true,
      service: 'wildr-graphql',
      signature: false,
    })
    .use('express', {
      measured: true,
      blocklist: ['/health'],
    })
    .use('ioredis', {
      // Bull keeps sending these every few seconds
      blocklist: ['brpoplpush', 'evalsha'],
    });
}

const secondsToMilliseconds = require('date-fns/secondsToMilliseconds');
const opentelemetry = require('@opentelemetry/sdk-node');
const otel = require('@opentelemetry/api');
const {
  getNodeAutoInstrumentations,
} = require('@opentelemetry/auto-instrumentations-node');
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');
const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const {
  CompositePropagator,
  W3CTraceContextPropagator,
  W3CBaggagePropagator,
} = require('@opentelemetry/core');
const {
  OTLPTraceExporter,
} = require('@opentelemetry/exporter-trace-otlp-http');
const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-base');
const {
  OTLPMetricExporter,
} = require('@opentelemetry/exporter-metrics-otlp-http');
const {
  AsyncLocalStorageContextManager,
} = require('@opentelemetry/context-async-hooks');
const { Resource } = require('@opentelemetry/resources');
const {
  SemanticResourceAttributes,
} = require('@opentelemetry/semantic-conventions');
const {
  MeterProvider,
  PeriodicExportingMetricReader,
  ConsoleMetricExporter,
} = require('@opentelemetry/sdk-metrics');

// For troubleshooting, set the log level to DiagLogLevel.DEBUG
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

const resource = Resource.default().merge(
  new Resource({
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]:
      process.env.WILDR_ENV_NAME,
    [SemanticResourceAttributes.SERVICE_NAME]:
      process.env.WILDR_SERVICE_NAME ?? 'wildr-server',
    [SemanticResourceAttributes.SERVICE_VERSION]:
      process.env.WILDR_SERVICE_VERSION ?? '0.0.1',
  })
);
const metricsExporter =
  process.env.DD_EXPORTER === 'console'
    ? new ConsoleMetricExporter()
    : new OTLPMetricExporter({
        keepAlive: true,
      });

const traceExporter =
  process.env.DD_EXPORTER === 'console'
    ? new ConsoleSpanExporter()
    : new OTLPTraceExporter({
        keepAlive: true,
      });
const metricReader = new PeriodicExportingMetricReader({
  exporter: metricsExporter,
  exportIntervalMillis: secondsToMilliseconds(30),
});

const myServiceMeterProvider = new MeterProvider({
  resource: resource,
});

const sdk = new opentelemetry.NodeSDK({
  metricReader: metricReader,
  traceExporter: traceExporter,
  spanProcessor: new BatchSpanProcessor(traceExporter),
  metricInterval: 1000,
  spanProcessor: new BatchSpanProcessor(traceExporter),
  contextManager: new AsyncLocalStorageContextManager(),
  propagators: [new W3CTraceContextPropagator(), new W3CBaggagePropagator()],
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
      '@opentelemetry/instrumentation-net': {
        enabled: false,
      },
      '@opentelemetry/instrumentation-dns': {
        enabled: false,
      },

      '@opentelemetry/instrumentation-graphql': {
        mergeItems: true,
        ignoreTrivialResolveSpans: true,
        responseHook: (span, data) => {
          const operationType = span.attributes[kGQLOpTypeAttr];
          const operationName = span.attributes[kGQLOpNameAttr];
          if (operationType && operationName) {
            span.updateName(`${operationType}.${operationName}`);
            span.setAttribute(kGQLOpTypeAttr, operationType);
            span.setAttribute(kGQLOpNameAttr, operationName);
          }
        },
      },
      '@opentelemetry/instrumentation-http': {
        requestHook: (span, request) => {
          const url = request.url;
          const op = request.headers[kGQLOpNameHeader] ?? 'unknown';
          span.setAttribute(kGQLOpNameAttr, op);
          const method = request.method ?? 'GET'
          span.updateName(`${method} ${url}?op=${op}`);
        },
      },
    }),
  ],
  resource: resource,
});
process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(
      () => console.log('OpenTelemetry SDK shutdown successfully'),
      err => console.error('OpenTelemetry SDK shutdown error:', err)
    )
    .finally(() => process.exit(0));
});
sdk.start();
