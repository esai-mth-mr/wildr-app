export class WaitlistEntity {
  id: string;
  email: string;
  waitlistType: WaitlistType;
  createdAt?: Date;

  static readonly kFields = {
    id: 'id',
    email: 'email',
    waitlistType: 'waitlistType',
    createdAt: 'createdAt',
  };

  static readonly kColumnNames = {
    id: 'id',
    email: 'email',
    waitlistType: 'waitlist_type',
    createdAt: 'created_at',
  };

  constructor(props: Partial<WaitlistEntity> = {}) {
    this.id = props.id ?? '';
    this.email = props.email ?? '';
    this.waitlistType = props.waitlistType ?? WaitlistType.WILDRCOIN;
    this.createdAt = new Date();
  }
}

export enum WaitlistType {
  WILDRCOIN = 0,
}
