import path from 'path';

export default {
  type: 'postgres',
  name: 'default',
  entities: [
    path.join(__dirname, '../**/*.entity{.ts,.js}'),
    path.join(__dirname, '../**/*.schema{.ts,.js}'),
  ],
  migrationsTableName: 'migrations',
  autoLoadEntities: true,
  logger: 'advanced-console',
  host: process.env.DB_HOSTNAME,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  logging: process.env.DB_LOG_QUERIES,
  migrations: [
    path.join(
      __dirname,
      process.env.MIGRATIONS_TABLE_PATH ?? '../migrations/*.{ts,js}'
    ),
  ],
  cli: {
    migrationsDir: path.join(
      __dirname,
      process.env.MIGRATIONS_DIR ?? '../migrations'
    ),
  },
};
