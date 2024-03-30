import { OpenTelemetryModule } from 'nestjs-otel';

export const OpenTelemetryMetricsModule = OpenTelemetryModule.forRoot({
  metrics: {
    hostMetrics: true,
    apiMetrics: {
      enable: true,
      defaultAttributes: {
        service: 'wildr-server',
      },
      ignoreRoutes: ['/favicon.ico'],
      ignoreUndefinedRoutes: false,
    },
  },
});
