import {
  ChallengeLeaderboardEntry,
  ChallengeLeaderboardId,
} from '@verdzie/server/challenge/challenge-leaderboard/challenge-leaderboard.service';

export function toChallengeLeaderboardEdge({
  participantId,
  entryCount,
  latestEntryId,
}: {
  participantId: string;
  entryCount: number;
  latestEntryId: string;
}): ChallengeLeaderboardId {
  return JSON.stringify({
    participantId,
    entryCount,
    latestEntryId,
  });
}

export function fromChallengeLeaderboardEdge(
  edge: ChallengeLeaderboardId
): ChallengeLeaderboardEntry {
  return JSON.parse(edge);
}
