import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Tokens {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  paymentId: string;

  @Column()
  amountReceived: string;

  @Column()
  transHash: string;

  @Column()
  tokenAmount: number;

  @Column()
  nonce: number;

  @Column()
  to: string;

  @Column()
  from: string;

  @Column()
  data: string;

}