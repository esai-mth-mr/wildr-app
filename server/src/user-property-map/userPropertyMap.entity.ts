import _ from 'lodash';

export type UserPropertyKvP = { [userId: string]: string[] };
export type UserPropertyMap = Map<string, string[]>;

export class UserPropertyMapEntity {
  id: string;
  userPropertyKvP?: UserPropertyKvP;

  constructor(id: string, userPropertyKvP?: UserPropertyKvP) {
    this.id = id;
    this.userPropertyKvP = userPropertyKvP;
  }

  get userPropertyMap(): UserPropertyMap {
    return userPropertyKvPToUserPropertyMap(this.userPropertyKvP ?? {});
  }

  /**
   * Updates {@link userPropertyKvP} by first converting it into a Map and
   * then converting that map back to KvP
   *
   * * Appends @params value into the existing list
   */
  setOrAppendProperty(key: string, value: string[]) {
    const map = this.userPropertyMap;
    const oldValues = map.get(key) || [];
    map.set(key, _.union(oldValues, value));
    this.userPropertyKvP = userPropertyMapToKvP(map);
  }

  removeProperties(key: string, values: string[]) {
    const map = this.userPropertyMap;
    if (map.has(key)) {
      const oldProperties = map.get(key);
      if (oldProperties) {
        _.remove(oldProperties, prop => values.includes(prop));
      }
      map.set(key, oldProperties ?? []);
    } else {
      map.set(key, []);
    }
    this.userPropertyKvP = userPropertyMapToKvP(map);
  }

  removeEntry(key: string) {
    const updatedMap: UserPropertyMap = this.userPropertyMap;
    updatedMap.delete(key);
    this.userPropertyKvP = userPropertyMapToKvP(updatedMap);
  }
}

export const userPropertyKvPToUserPropertyMap = (
  jsonb: UserPropertyKvP
): UserPropertyMap => new Map(Object.entries(jsonb));

export const userPropertyMapToKvP = (map: UserPropertyMap): UserPropertyKvP =>
  Object.fromEntries(map);
