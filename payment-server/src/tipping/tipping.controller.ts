import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TippingService } from './tipping.service';

@Controller('auth/tipping')
export class TippingController {
  constructor(
    private readonly tippingService: TippingService
  ) { }

  @Post('sendTip')
  @UseGuards(AuthGuard('api-key'))
  async addWallet(
    @Body('userIdFrom') userIdFrom: string,
    @Body('userIdTo') userIdTo: string,
    @Body('tokenAmount') tokenAmount: string,
  ) {
    const response = await this.tippingService.sendTip(
      userIdFrom,
      userIdTo,
      tokenAmount
    );
    return {
      response: response,
      status: 200,
      timestamp: new Date().toISOString(),
      message: "Tip sent successfully"
    };
  }

  @Get('GetTipsHistory/:id')
  @UseGuards(AuthGuard('api-key'))
  getWallet(
    @Param('id') userId: string,
    @Query('type') type: string,
    @Res() res: any
  ) {
    return this.tippingService.getUserTippingHistory(userId, type, res);
  }
}