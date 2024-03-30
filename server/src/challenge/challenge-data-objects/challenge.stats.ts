export interface ChallengeStats {
  entryCount: number; //count of CHALLENGE_ALL_ENTRIES
  participantCount: number; //count of CHALLENGE_PARTICIPANTS
  commentCount: number; //count of COMMENT
  shareCount: number;
  reportCount: number;
  hasHiddenComments: boolean;
  previewParticipants: string; //creator_id + 2 participants_ids
}

export const getEmptyChallengeStats = (): ChallengeStats => {
  return {
    entryCount: 0,
    participantCount: 0,
    commentCount: 0,
    shareCount: 0,
    reportCount: 0,
    hasHiddenComments: false,
    previewParticipants: '',
  };
};
