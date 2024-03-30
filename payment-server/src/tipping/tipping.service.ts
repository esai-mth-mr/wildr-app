import { HttpStatus, Injectable, NotFoundException, NotImplementedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BigNumber, ethers } from 'ethers';
import { Wallets } from 'src/wallets/wallets.entity';
import { Repository } from 'typeorm';
import { Tipping } from './tipping.entity';
import { WtestABI } from '../abi/Wtest.ABI';
import { ConfigService } from '@nestjs/config';
import { CommonServices } from 'src/common/common.services';
var CryptoJs = require('crypto-js')

const decryptData = (data: any, salt: any) => {
  return CryptoJs.AES.decrypt(data, salt).toString(CryptoJs.enc.Utf8);
}

@Injectable()
export class TippingService {
  constructor(
    private readonly commonServices: CommonServices,

    @InjectRepository(Wallets)
    private readonly walletsRepository: Repository<Wallets>,

    @InjectRepository(Tipping)
    private readonly tippingRepository: Repository<Tipping>,

    private configService: ConfigService
  ) { }


  async sendTip(userIdFrom: string, userIdTo: string, tokenAmount: string) {
    const walletFrom = await this.walletsRepository.findOneBy({ userId: userIdFrom });
    const walletTo = await this.walletsRepository.findOneBy({ userId: userIdTo });
    if (walletFrom && walletTo) {
      const provider = new ethers.providers.JsonRpcProvider(this.configService.get("RPC_URL"))
      const salt = this.configService.get('SECRET_SALT')
      const fromWalletPrivateKey = decryptData(walletFrom.walletPrivateKey, salt)
      const signer = new ethers.Wallet(fromWalletPrivateKey, provider)
      const contract = new ethers.Contract(
        this.configService.get("WTEST_CONTRACT_ADDRESS"),
        WtestABI,
        signer
      );
      const decimals = await contract.decimals();
      // const allowance = await contract.allowance(this.configService.get("OWNER_WALLET_ADDRESS"), walletFrom.walletAddress);
      // let approve: any;
      try {
        // if (allowance == 0) {
        //   const maxLimit = BigNumber.from(10).mul(BigNumber.from(10).pow(18))
        //   approve = await contract.approve(walletFrom.walletAddress, maxLimit)
        //   const estimateGas = await contract.estimateGas.transferFrom(walletFrom.walletAddress, walletTo.walletAddress, (this.commonServices.convertWithDecimal(tokenAmount, 10 ** decimals)))
        //   const response = await contract.transferFrom(walletFrom.walletAddress, walletTo.walletAddress, (this.commonServices.convertWithDecimal(tokenAmount, 10 ** decimals)), { gasLimit: estimateGas })
        //   response.userIdFrom = walletFrom.userId
        //   response.userIdTo = walletTo.userId
        //   response.tokenAmount = tokenAmount
        //   const result = await this.saveTokenTransferData(response)
        //   return result
        // } else {
          const estimateGas = await contract.estimateGas.transfer(walletTo.walletAddress, (this.commonServices.convertWithDecimal(tokenAmount, 10 ** decimals)))
          const response = await contract.transfer(walletTo.walletAddress, (this.commonServices.convertWithDecimal(tokenAmount, 10 ** decimals)), { from: walletFrom.walletAddress, gasLimit: estimateGas })
          response.userIdFrom = walletFrom.userId
          response.userIdTo = walletTo.userId
          response.tokenAmount = tokenAmount
          const result = await this.saveTokenTransferData(response)
          return result
        // }
      } catch (error) {
        throw new NotImplementedException(error);
      }
    } else {
      throw new NotFoundException('Could not find users.');
    }
  }

  async saveTokenTransferData(data: any) {
    try {
      const tipping = new Tipping();
      tipping.userIdFrom = data.userIdFrom
      tipping.userIdTo = data.userIdTo
      tipping.transHash = data.hash
      tipping.tokenAmount = data.tokenAmount
      tipping.nonce = data.nonce
      tipping.to = data.to
      tipping.from = data.from
      tipping.data = data.data
      return this.tippingRepository.save(tipping);
    } catch (error) {
      throw new NotImplementedException('Tipping not saved');
    }
  }

  async getUserTippingHistory(userId: string, type: string, res: any): Promise<Tipping> {
    let tipping: any;
    try {
      if (type === "sent") {
        tipping = await this.tippingRepository.find({ where: { userIdFrom: userId } })
      } else if (type === "received") {
        tipping = await this.tippingRepository.find({ where: { userIdTo: userId } })
      }
    } catch (error) {
      throw new NotFoundException('Could not find any tip.');
    }
    if (!tipping.length) {
      throw new NotFoundException('Could not find any tip.');
    }
    return res.status(HttpStatus.OK).json({
      status: 'success',
      data: tipping,
      message: "Tipping data found!"
    });
  }
}