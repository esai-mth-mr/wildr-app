import {
  WildrException,
  InternalServerErrorException,
} from '@verdzie/server/exceptions/wildr.exception';
import { copyMetadataFromFunctionToFunction } from '../opentelemetry/openTelemetry.decorators';

function wrapError(error: unknown, args: any[], key: string, context: string) {
  if (error instanceof WildrException) {
    if (error.debugData.arguments) {
      return error;
    } else {
      error.debugData.methodName = key;
      error.debugData.context = context;
      return error;
    }
  } else if (error instanceof Error) {
    const wrappedError = new InternalServerErrorException(
      error.message,
      { args, methodName: key, context },
      error
    );
    return wrappedError;
  }
  return error;
}

export function WildrExceptionDecorator() {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    const originalFunction = descriptor.value;
    const wrappedFunction = function (...args: any[]) {
      if (originalFunction.constructor.name === 'AsyncFunction') {
        return (
          originalFunction
            // @ts-ignore
            .apply(this, args)
            // @ts-ignore
            .catch(error => {
              const wrappedError = wrapError(
                error,
                args,
                key,
                // @ts-ignore
                this?.constructor.name
              );
              throw wrappedError;
            })
        );
      }

      try {
        // @ts-ignore
        const result = originalFunction.apply(this, args);
        return result;
      } catch (error) {
        // @ts-ignore
        const wrappedError = wrapError(error, args, key, this.constructor.name);
        throw wrappedError;
      }
    };
    copyMetadataFromFunctionToFunction(originalFunction, wrappedFunction);
    descriptor.value = wrappedFunction;

    return descriptor;
  };
}
