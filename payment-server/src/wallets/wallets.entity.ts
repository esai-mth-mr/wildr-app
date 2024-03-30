import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Wallets {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  walletAddress: string;

  @Column()
  walletPrivateKey: string;

  @Column()
  walletSeedPhase: string;

}