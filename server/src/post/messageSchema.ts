import { EntitySchema } from 'typeorm';
import { Message } from './message.entity';

export const MessageSchema = new EntitySchema<Message>({
  name: 'Message',
  target: Message,
  columns: {
    id: {
      name: 'id',
      type: 'char',
      primary: true,
      length: 16,
    },
    text: {
      name: 'text',
      type: 'varchar',
      length: 5000,
    },
    author_id: {
      name: 'author_id',
      type: 'char',
      length: 16,
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
