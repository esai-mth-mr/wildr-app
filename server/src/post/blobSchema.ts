import { EntitySchema } from 'typeorm';
import { Blob } from './blob.entity';

export const BlobSchema = new EntitySchema<Blob>({
  name: 'Blob',
  target: Blob,
  columns: {
    s3_url: {
      name: 's3_url',
      type: 'varchar',
      length: 400,
      unique: true,
      primary: true,
    },
    type: {
      name: 'type',
      type: 'int',
    },
    created_at: {
      name: 'created_at',
      type: 'timestamp with time zone',
    },
    updated_at: {
      name: 'updated_at',
      type: 'timestamp with time zone',
    },
  },
});
