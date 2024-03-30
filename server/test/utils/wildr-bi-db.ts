import { createConnection, getConnectionManager } from 'typeorm';
import config from '@verdzie/server/typeorm/typeormconfig-bi';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

const BI_TEST_CONNECTION_NAME = 'bi-test-connection';

export const getBITestConnection = async () => {
  const connectionManager = getConnectionManager();
  if (connectionManager.has(BI_TEST_CONNECTION_NAME))
    return connectionManager.get(BI_TEST_CONNECTION_NAME);
  return await createConnection({
    ...config,
    name: BI_TEST_CONNECTION_NAME,
  } as PostgresConnectionOptions);
};

export const closeBITestConnection = async () => {
  const connectionManager = getConnectionManager();
  const defaultConnection = connectionManager.get(BI_TEST_CONNECTION_NAME);
  await defaultConnection.close();
};
