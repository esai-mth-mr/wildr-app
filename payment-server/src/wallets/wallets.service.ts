import { HttpStatus, Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallets } from './wallets.entity';
import { WtestABI } from '../abi/Wtest.ABI';

var ethers = require('ethers')
var bip = require('bip39')
var CryptoJs = require('crypto-js')


const { utils, Wallet } = ethers;

const encryptData = (data: any, salt: any) => {
  return CryptoJs.AES.encrypt(data, salt).toString();
}

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallets)
    private readonly walletsRepository: Repository<Wallets>,
    private configService: ConfigService
  ) { }

  async insertWallet(userId: string): Promise<Wallets> {
    const salt = this.configService.get('SECRET_SALT')
    const mnemonic = await bip.entropyToMnemonic(utils.randomBytes(16));
    const walletDetail = Wallet.fromMnemonic(
      mnemonic,
      `m/44'/60'/0'/0/0`
    );
    const walletAddress = walletDetail.address
    const walletPrivateKey = encryptData(walletDetail.privateKey, salt)
    const walletSeedPhase = encryptData(mnemonic, salt)
    const wallet = await this.walletsRepository.findOneBy({ userId: userId });
    if (!wallet) {
      const wallet = new Wallets();
      wallet.userId = userId;
      wallet.walletAddress = walletAddress
      wallet.walletPrivateKey = walletPrivateKey
      wallet.walletSeedPhase = walletSeedPhase
      return this.walletsRepository.save(wallet);
    } else {
      throw new NotAcceptableException('Already Exsist');
    }
  }

  async getUserWallet(id: string, res: any): Promise<Wallets> {
    let wallet: any;
    try {
      wallet = await this.walletsRepository.findOneBy({ userId: id });
    } catch (error) {
      throw new NotFoundException('Could not find user.');
    }
    if (!wallet) {
      throw new NotFoundException('Could not find user.');
    }
    //return wallet;
    return res.status(HttpStatus.OK).json({
      status: 'success',
      data: wallet,
      message: "user data found!"
    });
  }

  async getUserWalletBalance(id: string, res: any): Promise<Wallets> {
    let wallet: any;
    let balance: any;
    try {
      wallet = await this.walletsRepository.findOneBy({ userId: id });
      if (wallet.walletAddress) {
        const provider = new ethers.providers.JsonRpcProvider(this.configService.get("RPC_URL"))
        const walletAddress = wallet.walletAddress
        const contract = new ethers.Contract(
          this.configService.get("WTEST_CONTRACT_ADDRESS"),
          WtestABI,
          provider
        );
        const decimals = await contract.decimals();
        const getBalance = await contract.balanceOf(walletAddress);
        balance = ethers.utils.formatEther(getBalance, decimals)
      }
    } catch (error) {
      throw new NotFoundException('Could not find user.');
    }
    if (!wallet) {
      throw new NotFoundException('Could not find user.');
    }
    //return wallet;
    return res.status(HttpStatus.OK).json({
      status: 'success',
      data: { walletAddress: wallet.walletAddress, balance: balance },
      message: "user data found!"
    });
  }
}



