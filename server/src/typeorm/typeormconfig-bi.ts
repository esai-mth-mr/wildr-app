import path from 'path';

export const BI_CONNECTION_NAME = 'wildr_bi';

export default {
  name: BI_CONNECTION_NAME,
  type: 'postgres',
  entities: [
    path.join(__dirname, '../**/*.entity.bi{.ts,.js}'),
    path.join(__dirname, '../**/*.schema.bi{.ts,.js}'),
  ],
  migrationsTableName: 'migrations',
  autoLoadEntities: true,
  logger: 'advanced-console',
  host: process.env.BI_DB_HOSTNAME,
  port: process.env.BI_DB_PORT,
  username: process.env.BI_DB_USERNAME,
  password: process.env.BI_DB_PASSWORD,
  database: process.env.BI_DB_NAME,
  logging: process.env.BI_DB_LOG_QUERIES,
  migrations: [
    path.join(
      __dirname,
      process.env.BI_MIGRATIONS_TABLE_PATH ?? '../bi-migrations/*.{ts,js}'
    ),
  ],
  cli: {
    migrationsDir: path.join(
      __dirname,
      process.env.BI_MIGRATIONS_DIR ?? '../bi-migrations'
    ),
  },
};
