import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _ from 'lodash';
import { Repository } from 'typeorm';
import { Activity } from '../activity/activity';
import {
  ActivityStreamCursor,
  ActivityStreamEntity,
  toActivityStreamCursor,
} from './activity.stream.entity';

@Injectable()
export class ActivityStreamService {
  // const feed = new FeedEntity()
  // feed.id = toFeedId(feedType, id)
  // return feed

  constructor(
    @InjectRepository(ActivityStreamEntity)
    private repo: Repository<ActivityStreamEntity>
  ) {}

  async create(userId: string): Promise<ActivityStreamEntity> {
    const stream = new ActivityStreamEntity();
    stream.id = userId;
    await this.repo.save(stream);
    return stream;
  }

  async save(obj: ActivityStreamEntity) {
    await this.repo.save(obj);
  }

  async update(id: string, update: Partial<ActivityStreamEntity>) {
    await this.repo.update(id, update);
  }

  async findById(userId: string): Promise<ActivityStreamEntity | undefined> {
    return await this.repo.findOne(userId);
  }

  private filterActivityPage(
    cursor: ActivityStreamCursor,
    activities: Activity[]
  ): Activity[] {
    switch (cursor.type) {
      case 'ActivityStreamCursorUp':
        return _.takeRight(
          cursor.before
            ? _.dropRight(
                _.dropRightWhile(
                  activities,
                  activity => activity.id !== cursor.before
                )
              )
            : activities,
          cursor.last
        );
      case 'ActivityStreamCursorDown':
        return _.take(
          cursor.after
            ? _.drop(
                _.dropWhile(
                  activities,
                  activity => activity.id !== cursor.after
                )
              )
            : activities,
          cursor.first
        );
    }
  }

  async getPage(
    activityStream: ActivityStreamEntity,
    first?: number,
    after?: string,
    last?: number,
    before?: string
  ): Promise<[Activity[], boolean, boolean]> {
    const cursor = toActivityStreamCursor(first, after, last, before);
    const activities: Activity[] = this.filterActivityPage(
      cursor,
      activityStream.activities
    );
    const hasPreviousPage = false;
    const hasNextPage = false;
    return [activities, hasNextPage, hasPreviousPage];
  }
}
