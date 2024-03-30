import { Controller, Get, Injectable } from '@nestjs/common';

@Injectable()
@Controller()
export class AdminController {
  @Get('/ping')
  ping(): string {
    return 'Pong';
  }
}
