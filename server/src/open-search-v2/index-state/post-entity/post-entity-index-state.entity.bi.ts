import {
  EntityIndexState,
  IndexRequests,
  IndexingState,
} from '@verdzie/server/open-search-v2/index-state/index-state.service';
import { PostSnapshot } from '@verdzie/server/open-search-v2/index-version/post-index-version.config';

export class PostEntityIndexState implements EntityIndexState {
  id: string;
  snapshot?: PostSnapshot;
  incrementalIndexState?: IndexingState;
  incrementalIndexRequests?: IndexRequests;
  reIndexState?: IndexingState;
  reIndexRequests?: IndexRequests;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    snapshot: PostSnapshot,
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
