import {
  Controller,
  Post,
  Body,
  UseGuards,
  Headers,
  Req,
  RawBodyRequest,
  Get,
  Param,
  Res
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { PaymentsService } from './payments.service';

@Controller('auth/payments')
export class PaymentsController {
  private stripe;
  constructor(
    private readonly paymentsService: PaymentsService,
    private configService: ConfigService
  ) {
    this.stripe = require("stripe")(this.configService.get('STRIPE_SK'));
  }

  @Post('create-payment-intent')
  @UseGuards(AuthGuard('api-key'))
  async createPaymentIntent(
    @Body('items') items: string,
  ) {
    // const customer = await this.stripe.customers.create({
    //   name: 'Jenny Rosen',
    //   address: {
    //     line1: '510 Townsend St',
    //     postal_code: '98140',
    //     city: 'San Francisco',
    //     state: 'CA',
    //     country: 'US',
    //   },
    // });
    // console.log('customer', customer)
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: 2000, // $20
      currency: "usd",
      description: 'Token Transfer',
      customer: 'cus_Mo5FZqHDt1jySx',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        user_id: 'shdcbdhsvhsdbcjhsdbvdhbv2328',
      },
    });
    return { clientSecret: paymentIntent.client_secret, };
  }

  @Post('webhook')
  //@UseGuards(AuthGuard('api-key'))
  async listenEvent(
    @Headers('stripe-signature') sig: any,
    @Req() req: RawBodyRequest<Request>
  ) {
    const endpointSecret = this.configService.get('STRIPE_WEBHOOK_KEY')
    const rawBody = req.rawBody;
    let event;
    try {
      event = await this.stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } catch (err) {
      return `Webhook Error: ${err.message}`;
    }
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const eventData = event.data.object;
        this.paymentsService.savePaymentData(eventData)
        break;
      case 'payment_intent.payment_failed':
        const eventDataFailed = event.data.object;
        this.paymentsService.savePaymentData(eventDataFailed)
        break;
      case 'payment_intent.canceled':
        const eventDataCancelled = event.data.object;
        this.paymentsService.savePaymentData(eventDataCancelled)
        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  }

  @Get('getPaymentsByUserId/:id')
  @UseGuards(AuthGuard('api-key'))
  getUserPayments(@Param('id') userId: string, @Res() res: any) {
    return this.paymentsService.getUserPaymets(userId, res);
  }

  @Get('getUserTokenTrasferHistoryByUserId/:id')
  @UseGuards(AuthGuard('api-key'))
  getUserTokenTrasferHistory(@Param('id') userId: string, @Res() res: any) {
    return this.paymentsService.getUserTokenTrasferHistory(userId, res);
  }
}
