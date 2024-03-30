import { Controller, Get } from '@nestjs/common';

// TODO: Replace with Terminus's interface after upgrading nestjs to 8.x
export interface HealthCheckResult {
  status: string;
}
@Controller('health')
export class HealthController {
  @Get()
  async check(): Promise<HealthCheckResult> {
    return {
      status: 'ok',
    };
  }
}
