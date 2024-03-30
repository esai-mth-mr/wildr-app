import '../../tsconfig-paths-bootstrap';
import * as dotenv from 'dotenv';
import '../../env/admin-local-config';

import { SQS } from 'aws-sdk';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import {
  TimepointEntity,
  TimepointState,
} from '@verdzie/server/notification-scheduler/composer/timepoint/timepoint.entity';
import { toTimepointId } from '@verdzie/server/notification-scheduler/composer/timepoint/timepoint.service';
import { getBITestConnection } from '@verdzie/test/utils/wildr-bi-db';
import { TimepointArchiveEntity } from '@verdzie/server/notification-scheduler/timepoint-archiver/timepoint-archive.entity.bi';

async function main() {
  const conn = await getTestConnection();
  const biConn = await getBITestConnection();
  console.log('connected to db');
  await conn.synchronize(true);
  await biConn.synchronize(true);
  console.log('synced db');
  const timepointRepo = conn.getRepository(TimepointEntity);
  const timepointFake = new TimepointEntity({
    id: toTimepointId({ hour: 1, parentId: '3', shardKey: 1 }),
    state: TimepointState.TO_BE_ARCHIVED,
    processMetadata: {
      startDate: new Date(),
      expirationDate: new Date(),
    },
  });
  await timepointRepo.insert(timepointFake);
  console.log('inserted timepoint', timepointFake.id);
  const sqs = new SQS();
  await new Promise<void>(resolve => {
    sqs.sendMessage(
      {
        QueueUrl: 'http://localhost:9324/queue/queue-timepoint-archiver',
        MessageBody: 'none',
      },
      (err, data) => {
        if (err) {
          console.log('Error sending message', err);
          resolve();
        } else {
          console.log('Sent message', data);
          resolve();
        }
      }
    );
  });
  await new Promise(resolve => setTimeout(resolve, 3000));
  const timepoint = await timepointRepo.findOne(timepointFake.id);
  console.log('old timepoint', timepoint);
  await conn.close();
  const biTimepoint = await biConn
    .getRepository(TimepointArchiveEntity)
    .findOne(timepointFake.id);
  console.log('archived timepoint', biTimepoint);
  await biConn.close();
}

main();
