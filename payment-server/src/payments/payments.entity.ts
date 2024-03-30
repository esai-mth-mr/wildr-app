import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Payments {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  paymentId: string;

  @Column()
  amount: number;

  @Column()
  amountReceived: number;

  @Column()
  clientSecret: string;

  @Column()
  createdAt: string;

  @Column()
  currency: string;

  @Column()
  paymentMethod: string;

  @Column()
  status: string;

}