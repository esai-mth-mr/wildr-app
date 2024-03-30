import {
  Span as ApiSpan,
  SpanOptions,
  SpanStatusCode,
  trace,
  Counter,
  UpDownCounter,
  Histogram,
  ObservableGauge,
  ObservableCounter,
  ObservableUpDownCounter,
  MetricOptions,
  metrics,
  ValueType,
} from '@opentelemetry/api';

export type GenericMetric =
  | Counter
  | UpDownCounter
  | Histogram
  | ObservableGauge
  | ObservableCounter
  | ObservableUpDownCounter;

enum GenericMetricType {
  HISTOGRAM,
  COUNTER,
  //UP_DOWN_COUNTER,
  //OBSERVABLE_GAUGE,
  //OBSERVABLE_COUNTER,
  //OBSERVABLE_UP_DOWN_COUNTER,
}
export const copyMetadataFromFunctionToFunction = (
  // eslint-disable-next-line
  originalFunction: Function,
  // eslint-disable-next-line
  newFunction: Function
): void => {
  // Get the current metadata and set onto the wrapper
  // to ensure other decorators ( ie: NestJS EventPattern / RolesGuard )
  // won't be affected by the use of this instrumentation
  Reflect.getMetadataKeys(originalFunction).forEach(metadataKey => {
    Reflect.defineMetadata(
      metadataKey,
      Reflect.getMetadata(metadataKey, originalFunction),
      newFunction
    );
  });
};

const recordSpanException = (span: ApiSpan, error: any) => {
  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
};

export function WildrSpan(name?: string, options: SpanOptions = {}) {
  return (
    target: any,
    propertyKey: string,
    propertyDescriptor: PropertyDescriptor
  ) => {
    const originalFunction = propertyDescriptor.value;
    const wrappedFunction = function PropertyDescriptor(...args: any[]) {
      const tracer = trace.getTracer('default');
      const className = target.constructor.name;
      const spanName = name || `wildr.${className}.${propertyKey}`;

      return tracer.startActiveSpan(spanName, options, span => {
        if (originalFunction.constructor.name === 'AsyncFunction') {
          return (
            originalFunction
              // @ts-ignore
              .apply(this, args)
              // @ts-ignore
              .catch(error => {
                recordSpanException(span, error);
                throw error;
              })
              .finally(() => {
                span.end();
              })
          );
        }

        try {
          // @ts-ignore
          return originalFunction.apply(this, args);
        } catch (error) {
          recordSpanException(span, error);
          throw error;
        } finally {
          span.end();
        }
      });
    };
    // eslint-disable-next-line no-param-reassign
    propertyDescriptor.value = wrappedFunction;

    copyMetadataFromFunctionToFunction(originalFunction, wrappedFunction);
  };
}

const calculateDuration = (start: number): number => {
  return new Date().getTime() - start;
};

const WILDR_OTEL_METER_NAME = 'wildr-otel';

export const meterData: Map<string, GenericMetric> = new Map<
  string,
  GenericMetric
>();

export const getOrCreateHistogram = (
  name: string,
  options: MetricOptions = {}
): Histogram => {
  const histogram = meterData.get(name);
  if (histogram) return histogram as Histogram;

  const meter = metrics.getMeterProvider().getMeter(WILDR_OTEL_METER_NAME);
  const result = meter.createHistogram(name, options);
  meterData.set(name, result);
  return result;
};

export const getOrCreateCounter = (
  name: string,
  options: MetricOptions = {}
): Counter => {
  const metric = meterData.get(name);
  if (metric) return metric as Counter;

  const meter = metrics.getMeterProvider().getMeter(WILDR_OTEL_METER_NAME);
  const result = meter.createCounter(name, options);
  meterData.set(name, result);
  return result;
};

export function WildrMethodLatencyHistogram(
  name?: string,
  options: MetricOptions = { unit: 'milliseconds', valueType: ValueType.INT }
) {
  return (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => any>
  ) => {
    const originalFunction = descriptor.value;
    if (!originalFunction) return;
    const wrappedFunction = function PropertyDescriptor(...args: any[]) {
      const className = target.constructor.name;
      const histogramName = name ?? `wildr.${className}.${propertyKey}.latency`;
      const histogram = getOrCreateHistogram(histogramName, options);

      const start = new Date().getTime();
      if (originalFunction.constructor.name === 'AsyncFunction') {
        return (
          originalFunction
            // @ts-ignore
            .apply(this, args)
            // @ts-ignore
            .catch(error => {
              histogram.record(calculateDuration(start));
              throw error;
            })
            .finally(() => {
              histogram.record(calculateDuration(start));
            })
        );
      }
      try {
        // @ts-ignore
        return originalFunction.apply(this, args);
      } catch (error) {
        histogram.record(calculateDuration(start));
        throw error;
      } finally {
        histogram.record(calculateDuration(start));
      }
    };
    // eslint-disable-next-line no-param-reassign
    descriptor.value = wrappedFunction;
    copyMetadataFromFunctionToFunction(originalFunction, wrappedFunction);
  };
}

export function WildrMethodCounter(name?: string, options: MetricOptions = {}) {
  return (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => any>
  ) => {
    const originalFunction = descriptor.value;
    if (!originalFunction) return;
    const wrappedFunction = function PropertyDescriptor(...args: any[]) {
      const className = target.constructor.name;
      const counterName = name ?? `wildr.${className}.${propertyKey}.counter`;
      const counter = getOrCreateCounter(counterName, options);

      counter.add(1);
      // @ts-ignore
      return originalFunction.apply(this, args);
    };
    // eslint-disable-next-line no-param-reassign
    descriptor.value = wrappedFunction;
    copyMetadataFromFunctionToFunction(originalFunction, wrappedFunction);
  };
}

export function WildrFailureCounter(
  name?: string,
  options: MetricOptions = {}
) {
  return async (target: any, key: string, descriptor: PropertyDescriptor) => {
    const originalFunction = descriptor.value;
    const className = target.constructor.name;

    if (!originalFunction) return;

    const wrappedFunction = async function PropertyDescriptor(...args: any[]) {
      const counterName = name ?? `wildr.${className}.${key}.failure-counter`;
      const counter = getOrCreateCounter(counterName, options);

      try {
        // @ts-ignore
        const result = await originalFunction.apply(this, args);
        return result;
      } catch (error) {
        counter.add(1);
        throw error;
      }
    };
    // eslint-disable-next-line no-param-reassign
    descriptor.value = wrappedFunction;
    copyMetadataFromFunctionToFunction(originalFunction, wrappedFunction);
  };
}
