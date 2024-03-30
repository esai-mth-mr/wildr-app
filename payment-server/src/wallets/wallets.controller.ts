import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Res,
  HttpStatus
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { WalletsService } from './wallets.service';

@Controller('auth')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) { }

  @Post('addUserWallet')
  @UseGuards(AuthGuard('api-key'))
  async addWallet(
    @Body('userId') userId: string,
    @Res() res: any,
  ) {
    const generatedId = await this.walletsService.insertWallet(
      userId
    );
    return res.status(HttpStatus.OK).json({
      status: 'success',
      data: { id: generatedId },
      message: "User wallet created"
    });
  }

  @Get('getWalletByUserId/:id')
  @UseGuards(AuthGuard('api-key'))
  getWallet(@Param('id') userId: string, @Res() res: any) {
    return this.walletsService.getUserWallet(userId, res);
  }

  @Get('getWalletBalance/:id')
  @UseGuards(AuthGuard('api-key'))
  getWalletBalance(@Param('id') userId: string, @Res() res: any) {
    return this.walletsService.getUserWalletBalance(userId, res);
  }
}