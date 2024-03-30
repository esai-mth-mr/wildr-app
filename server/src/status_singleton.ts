export class StatusSingleton {
  static hasSuccessfullyMovedAllPrivatePosts = false;

  static _instance = new StatusSingleton();

  constructor() {
    if (StatusSingleton._instance) {
      throw new Error(
        'Error: Instantiation failed: Use StatusSingleton.getInstance() instead of new.'
      );
    }
    StatusSingleton._instance = this;
  }

  public static get Instance() {
    // Do you need arguments? Make it a regular static method instead.
    return this._instance || (this._instance = new this());
  }
}
