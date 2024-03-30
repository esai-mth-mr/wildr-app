export enum RealIdVerificationStatus {
  UNVERIFIED,
  PENDING_REVIEW,
  REVIEW_REJECTED,
  VERIFIED,
}

export enum RealIdHandGesture {
  PEACE,
  THUMBS_UP,
  THUMBS_DOWN,
  CROSSED_FINGERS,
  FIST,
  HORN_FINGERS,
  RAISED_HAND,
  HANG_LOOSE,
  POINT_FINGER,
}

export function getRealIdHandGesture(
  getRealIdHandGesture: string
): RealIdHandGesture {
  switch (getRealIdHandGesture) {
    case 'PEACE':
      return RealIdHandGesture.PEACE;
    case 'THUMBS_UP':
      return RealIdHandGesture.THUMBS_UP;
    case 'THUMBS_DOWN':
      return RealIdHandGesture.THUMBS_DOWN;
    case 'CROSSED_FINGERS':
      return RealIdHandGesture.CROSSED_FINGERS;
    case 'FIST':
      return RealIdHandGesture.FIST;
    case 'HORN_FINGERS':
      return RealIdHandGesture.HORN_FINGERS;
    case 'RAISED_HAND':
      return RealIdHandGesture.RAISED_HAND;
    case 'HANG_LOOSE':
      return RealIdHandGesture.HANG_LOOSE;
    case 'POINT_FINGER':
      return RealIdHandGesture.POINT_FINGER;
    default:
      throw Error('Not a valid enum');
  }
}

export interface RealIdFaceData {
  faceSignature: number[];
}

export class RealIdFailedVerificationImageData {
  isSmiling: boolean;
  imageUrl: string;
  handGesture: RealIdHandGesture;

  constructor(
    isSmiling: boolean,
    imageUrl: string,
    handGesture: RealIdHandGesture
  ) {
    this.isSmiling = isSmiling;
    this.imageUrl = imageUrl;
    this.handGesture = handGesture;
  }
}
