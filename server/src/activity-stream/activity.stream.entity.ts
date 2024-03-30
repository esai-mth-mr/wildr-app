import { Activity } from '../activity/activity';

export class ActivityStreamEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  activities: Activity[]; //jsonb
}

// INTERFACES
export interface ActivityStreamCursorUp {
  type: 'ActivityStreamCursorUp';
  last: number;
  before: string;
}

export interface ActivityStreamCursorDown {
  type: 'ActivityStreamCursorDown';
  first: number;
  after: string;
}

export type ActivityStreamCursor =
  | ActivityStreamCursorUp
  | ActivityStreamCursorDown;

export const toActivityStreamCursor = (
  first?: number,
  after?: string,
  last?: number,
  before?: string
): ActivityStreamCursor => {
  if (last) {
    return <ActivityStreamCursorUp>{
      type: 'ActivityStreamCursorUp',
      last: last ?? 3,
      before: before,
    };
  }
  return <ActivityStreamCursorDown>{
    type: 'ActivityStreamCursorDown',
    first: first ?? 3,
    after: after,
  };
};

export interface ActivityStreamPage {
  ids: string[];
}
