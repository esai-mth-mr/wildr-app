import { Entity } from 'typeorm';

export class Message {
  id: number;
  text: string;
  author_id: string;
  created_at: Date;
  updated_at: Date;
}
