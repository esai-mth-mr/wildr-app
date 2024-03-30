import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { Connection } from 'typeorm';

describe('Postgres', () => {
  let conn: Connection;

  beforeAll(async () => {
    conn = await getTestConnection();
  });

  describe('transactions', () => {
    it('should timeout if transactions deadlock', async () => {
      const resource1 = UserEntityFake();
      const resource2 = UserEntityFake();
      await conn.manager
        .getRepository(UserEntity)
        .insert([resource1, resource2]);
      const transaction = async () => {
        await conn.transaction(async manager => {
          await manager.getRepository(UserEntity).findOne(resource1.id, {
            lock: { mode: 'pessimistic_write' },
          });
          await new Promise(resolve => setTimeout(resolve, 50));
          await manager.getRepository(UserEntity).findOne(resource2.id, {
            lock: { mode: 'pessimistic_write' },
          });
        });
      };
      const conflictingTransaction = async () => {
        await conn.transaction(async manager => {
          await manager.getRepository(UserEntity).findOne(resource2.id, {
            lock: { mode: 'pessimistic_write' },
          });
          await new Promise(resolve => setTimeout(resolve, 50));
          await manager.getRepository(UserEntity).findOne(resource1.id, {
            lock: { mode: 'pessimistic_write' },
          });
        });
      };
      await Promise.all([transaction(), conflictingTransaction()]).catch(
        err => {
          expect(err.message).toMatch(/deadlock detected/);
        }
      );
    });
  });
});
