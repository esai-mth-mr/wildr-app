import { createConnection, getConnectionManager } from 'typeorm';
import config from '@verdzie/server/typeorm/typeormconfig-wildr';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export const getTestConnection = async () => {
  const connectionManager = getConnectionManager();
  if (connectionManager.has('test-connection'))
    return connectionManager.get('test-connection');
  return await createConnection({
    ...config,
    name: 'test-connection',
  } as PostgresConnectionOptions);
};

export const closeTestConnection = async () => {
  const connectionManager = getConnectionManager();
  const defaultConnection = connectionManager.get('test-connection');
  await defaultConnection.close();
};

export const closeAllConnections = async () => {
  const connectionManager = getConnectionManager();
  for (const connection of connectionManager.connections) {
    await connection.close();
  }
};
