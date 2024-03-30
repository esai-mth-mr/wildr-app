import { UserSnapshot } from '@verdzie/server/open-search-v2/index-version/user-index-version.config';
import {
  EntityIndexState,
  IndexRequestTuples,
  IndexRequests,
  IndexingState,
} from '@verdzie/server/open-search-v2/index-state/index-state.service';

export class UserEntityIndexState implements EntityIndexState {
  id: string;
  snapshot?: UserSnapshot;
  incrementalIndexState?: IndexingState;
  incrementalIndexRequests?: IndexRequests | IndexRequestTuples;
  reIndexState?: IndexingState;
  reIndexRequests?: IndexRequests | IndexRequestTuples;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    snapshot: UserSnapshot,
    incrementalIndexState: IndexingState = IndexingState.INDEXED,
    incrementalIndexRequests: IndexRequests = {},
    reIndexState: IndexingState = IndexingState.INDEXED,
    reIndexRequests: IndexRequests = {}
  ) {
    this.id = snapshot?.id;
    this.snapshot = snapshot;
    this.incrementalIndexState = incrementalIndexState;
    this.incrementalIndexRequests = incrementalIndexRequests;
    this.reIndexState = reIndexState;
    this.reIndexRequests = reIndexRequests;
  }
}
