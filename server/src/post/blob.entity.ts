import { Entity } from 'typeorm';

export class Blob {
  s3_url: string;
  type: number;
  created_at: Date;
  updated_at: Date;
}
