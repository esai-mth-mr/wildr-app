import { ID_SEPARATOR } from '@verdzie/server/common/generateId';

export class UserListEntity {
  id: string;
  name: string;
  iconUrl?: string;
  ids: string[];
  metaData?: UserListMetaData;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(props: Partial<UserListEntity> = {}) {
    this.id = props.id ?? '';
    this.name = props.name ?? '';
    this.iconUrl = props.iconUrl;
    this.ids = props.ids ?? [];
    this.metaData = props.metaData;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  getCreatorId(): string {
    return this.id.split(ID_SEPARATOR)[0];
  }
}

export interface UserListMetaData {
  memberCount: number;
}
