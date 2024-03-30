import '../../../tsconfig-paths-bootstrap';
import '../../../env/admin-local-config';

import { WorkflowId } from '@verdzie/server/scanner/workflow-manager/workflow-manager.types';
import { adminClient } from '@verdzie/scripts/admin/util/admin-client';

export function startScan(workflowId: WorkflowId) {
  return adminClient.post(`/scanner/request-scan`, { workflowId });
}

async function main() {
  const result = await startScan(WorkflowId.USER_STATS_SYNC);
  console.log(result);
}

main();
