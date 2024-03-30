import { HttpStatus, Injectable, NotFoundException, NotImplementedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ethers } from 'ethers';
import { Wallets } from 'src/wallets/wallets.entity';
import { Repository } from 'typeorm';
import { Payments } from './payments.entity';
import { WtestABI } from '../abi/Wtest.ABI';
import { ConfigService } from '@nestjs/config';
import { CommonServices } from 'src/common/common.services';
import { Tokens } from './tokens.entity';


@Injectable()
export class PaymentsService {
  constructor(
    private readonly commonServices: CommonServices,

    @InjectRepository(Payments)
    private readonly paymentsRepository: Repository<Payments>,

    @InjectRepository(Wallets)
    private readonly walletsRepository: Repository<Wallets>,

    @InjectRepository(Tokens)
    private readonly tokensRepository: Repository<Tokens>,

    private configService: ConfigService
  ) { }

  async savePaymentData(data: any) {
    try {
      const payment = new Payments();
      payment.userId = data.metadata.user_id ? data.metadata.user_id : "",
        payment.paymentId = data.id ? data.id : ""
      payment.amount = data.amount
      payment.amountReceived = data.amount_received
      payment.clientSecret = data.client_secret ? data.client_secret : ""
      payment.createdAt = data.created ? data?.created : ""
      payment.currency = data.currency ? data?.currency : ""
      payment.paymentMethod = data.payment_method ? data.payment_method : ""
      payment.status = data.status
      const result = await this.paymentsRepository.save(payment);
      if (result && data.status === "succeeded") {
        this.sendTokenToWallet(result)
      }
    } catch (error) {
      throw new NotImplementedException('Payment not saved');
    }
  }

  async getUserPaymets(userId: string, res: any): Promise<Payments> {
    let payments;
    try {
      payments = await this.paymentsRepository.find({ where: { userId: userId } })
    } catch (error) {
      throw new NotFoundException('Could not find any payment.');
    }
    if (!payments) {
      throw new NotFoundException('Could not find any payment.');
    }
    return res.status(HttpStatus.OK).json({
      status: 'success',
      data: payments,
      message: "User payments data found!"
    });
  }

  async sendTokenToWallet(data: any) {
    const wallet = await this.walletsRepository.findOneBy({ userId: data.userId });
    if (wallet) {
      const provider = new ethers.providers.JsonRpcProvider(this.configService.get("RPC_URL"))
      const signer = new ethers.Wallet(this.configService.get("OWNER_PRIVATE_KEY"), provider)
      const contract = new ethers.Contract(
        this.configService.get("WTEST_CONTRACT_ADDRESS"),
        WtestABI,
        signer
      );
      const decimals = await contract.decimals();
      const amount = data.amount / 100;
      const tokenAmount = amount * 1000;
      const response = await contract.transfer(wallet.walletAddress, (this.commonServices.convertWithDecimal(tokenAmount, 10 ** decimals)))
      response.userId = data.userId
      response.paymentId = data.paymentId
      response.amountReceived = data.amountReceived
      response.tokenAmount = tokenAmount
      this.saveTokenTransferData(response)
    } else {
      throw new NotFoundException('Could not find user.');
    }
  }

  async saveTokenTransferData(data: any) {
    try {
      const token = new Tokens();
      token.userId = data.userId
      token.paymentId = data.paymentId
      token.amountReceived = data.amountReceived
      token.transHash = data.hash
      token.tokenAmount = data.tokenAmount
      token.nonce = data.nonce
      token.to = data.to
      token.from = data.from
      token.data = data.data
      return this.tokensRepository.save(token);
    } catch (error) {
      throw new NotImplementedException('Payment not saved');
    }
  }

  async getUserTokenTrasferHistory(userId: string, res: any): Promise<Tokens> {
    let tokens;
    try {
      tokens = await this.tokensRepository.find({ where: { userId: userId } })
    } catch (error) {
      throw new NotFoundException('Could not find any payment.');
    }
    if (!tokens) {
      throw new NotFoundException('Could not find any payment.');
    }
    return res.status(HttpStatus.OK).json({
      status: 'success',
      data: tokens,
      message: "Transfer history data found!"
    });
  }
}