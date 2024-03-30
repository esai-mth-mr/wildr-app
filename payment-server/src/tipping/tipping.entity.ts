import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Tipping {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userIdFrom: string;

  @Column()
  userIdTo: string;

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