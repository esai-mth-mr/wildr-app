import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from '@verdzie/server/user/user.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Between, In, IsNull, Not, Repository, UpdateResult } from 'typeorm';
import { Logger } from 'winston';
import { RealIdVerificationStatus } from '../../real-id/realId';
import { UserEntity } from '../../user/user.entity';
import { AdminMailGunService } from '@verdzie/server/admin/mail-gun/adminMailGun.service';
import { FindConditions } from 'typeorm/find-options/FindConditions';

@Injectable()
export class AdminUserService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(UserEntity)
    private repo: Repository<UserEntity>,
    private userService: UserService,
    private adminMailGunService: AdminMailGunService
  ) {
    this.logger = this.logger.child({ context: 'AdminUserService' });
  }

  async findById(id: string): Promise<UserEntity | undefined> {
    return this.repo.findOne(id, {
      relations: [UserEntity.kActivityStreamRelation],
    });
  }

  async findByIds(ids: string[]): Promise<UserEntity[]> {
    return this.repo.findByIds(ids);
  }

  async findByHandle(handle: string): Promise<UserEntity | undefined> {
    return this.userService.findByHandle(handle);
  }

  async getUsers(endCursor: string, limit: number) {
    return await this.userService.parseAllUrls(
      await this.repo
        .createQueryBuilder('user_entity')
        .where('user_entity.created_at < :start_at', { start_at: endCursor })
        .orderBy('user_entity.created_at', 'DESC')
        .take(limit)
        .getMany()
    );
  }

  async getUsersById(ids: string[]) {
    return await this.userService.findAllById(ids);
  }

  async updateUser(id: string, data: any): Promise<UpdateResult> {
    return await this.repo.update(id, data);
  }

  async findByPendingRealIdReview(): Promise<UserEntity[]> {
    return await this.userService.parseAllUrls(
      await this.repo.find({
        select: [
          'realIdVerificationStatus',
          'id',
          'handle',
          'realIdFailedVerificationImageData',
          'realIdFaceUrl',
        ],
        where: {
          realIdVerificationStatus: RealIdVerificationStatus.PENDING_REVIEW,
        },
      })
    );
  }

  async updateRealIdReviewStatus(
    id: string,
    realIdVerificationStatus: RealIdVerificationStatus,
    message?: string
  ) {
    const result = await this.repo.update(id, {
      realIdVerificationStatus: realIdVerificationStatus,
      realIdFailedStatusMessage: message,
    });
    if (result) {
      if (result.affected !== 1) {
        throw new Error('Not a valid id');
      }
    }
  }

  async getAllFcmTokens(take: number, skip: number): Promise<string[]> {
    const users = await this.repo.find({
      where: { fcmToken: Not(IsNull()) },
      select: ['id', 'fcmToken'],
      take: take,
      skip: skip,
    });
    if (users != null) {
      return users
        .map(r => r.fcmToken)
        .filter((item: string | undefined): item is string => !!item);
    }
    return [];
  }

  async getUserIdentifiersFromRange({
    take,
    skip,
    findConditions,
  }: {
    take: number;
    skip: number;
    findConditions?: FindConditions<UserEntity>;
  }): Promise<
    {
      userId: string;
      fcmToken: string;
      handle: string;
    }[]
  > {
    findConditions ??= {};
    findConditions.fcmToken = Not(IsNull());
    const users = await this.repo.find({
      where: findConditions,
      select: ['id', 'fcmToken', 'handle'],
      take: take,
      skip: skip,
    });
    const idFcmTokenPairs = [];
    for (const user of users) {
      if (user.fcmToken && user.id) {
        idFcmTokenPairs.push({
          userId: user.id,
          fcmToken: user.fcmToken,
          handle: user.handle,
        });
      }
    }
    return idFcmTokenPairs;
  }

  async getUserIdentifiersFromIds(userIds: string[]): Promise<
    {
      userId: string;
      fcmToken: string;
      handle: string;
    }[]
  > {
    this.logger.info('getUserIdentifiersFromIds', { userIds });
    const users = await this.repo.findByIds(userIds, {
      select: ['id', 'fcmToken', 'handle'],
    });
    const idFcmTokenPairs = [];
    for (const user of users) {
      if (user.fcmToken && user.id) {
        idFcmTokenPairs.push({
          userId: user.id,
          fcmToken: user.fcmToken,
          handle: user.handle,
        });
      } else {
        this.logger.info('FCM token not found for ', { userId: user.id });
      }
    }
    return idFcmTokenPairs;
  }

  async takedown(id: string): Promise<boolean> {
    return await this.userService.takeDown(id);
  }

  async reindex(id: string) {
    const user = await this.userService.findById(id);
    if (!user) {
      this.logger.error('Could not find user', { userId: id });
      return;
    }
    await this.userService.index(user);
  }

  async getRealIdVerifiedUsers(
    startDate: Date,
    endDate: Date
  ): Promise<UserEntity[]> {
    const users = await this.repo.find({
      where: {
        realIdVerificationStatus: RealIdVerificationStatus.VERIFIED,
        realIdFailedVerificationImageData: IsNull(),
        realIdVerifiedAt: Between(startDate, endDate),
      },
      select: ['id', 'realIdFaceUrl', 'handle', 'realIdVerificationStatus'],
    });
    if (users != null) {
      return this.userService.parseAllUrls(users);
    }
    return [];
  }

  async rejectVerifiedRealId(userId: string, reason: string): Promise<boolean> {
    const user = await this.userService.findById(userId);
    if (!user) return false;
    if (user.realIdVerificationStatus === RealIdVerificationStatus.VERIFIED) {
      user.realIdVerificationStatus = RealIdVerificationStatus.REVIEW_REJECTED;
      await this.repo.save(user);
      await this.adminMailGunService.rejectVerifiedRealId(userId, reason);
      return true;
    } else {
      return false;
    }
  }

  async findByHandles(handles: string[]): Promise<UserEntity[]> {
    return await this.repo.find({
      where: {
        handle: In(handles),
      },
    });
  }
}
