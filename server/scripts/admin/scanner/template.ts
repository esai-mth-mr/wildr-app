import '../../../tsconfig-paths-bootstrap';
import '../../../env/admin-local-config';

import { WorkflowId } from '@verdzie/server/scanner/workflow-manager/workflow-manager.types';
import { adminClient } from '@verdzie/scripts/admin/util/admin-client';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';

export function startScan(workflowId: WorkflowId) {
  return adminClient.post(`/scanner/request-scan`, { workflowId });
}

async function main() {
  const conn = await getTestConnection();
  const userRepo = conn.getRepository(UserEntity);
  await userRepo.delete({});
  const users = Array.from({ length: 10 }, () => UserEntityFake({}));
  await userRepo.insert(users);
  const result = await startScan(WorkflowId.TEMPLATE);
  console.log(result);
  await conn.close();
}

main();
