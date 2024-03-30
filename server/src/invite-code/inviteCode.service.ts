import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { QueryFailedError, Repository } from 'typeorm';
import { Logger } from 'winston';
import { generateId } from '@verdzie/server/common/generateId';
import { InviteCodeEntity } from '@verdzie/server/invite-code/inviteCode.entity';
import { InviteCodeAction } from '@verdzie/server/invite-code/inviteCode.helper';
import { POSTGRES_UNIQUE_VIOLATION_CODE } from '@verdzie/server/typeorm/postgres-driver.constants';

@Injectable()
export class InviteCodeService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(InviteCodeEntity)
    private repo: Repository<InviteCodeEntity>
  ) {
    this.logger = this.logger.child({ context: 'InviteCodeService' });
  }

  generateCode(): number {
    return Math.floor(100000 + Math.random() * 900000);
  }

  async findByUTMName(utmName: string): Promise<InviteCodeEntity | undefined> {
    return await this.repo.findOne({ where: { utmName } });
  }

  async getExitingCode(
    inviterId: string,
    action?: InviteCodeAction
  ): Promise<InviteCodeEntity | undefined> {
    try {
      if (action) {
        return this.repo.findOne({
          where: { inviterId: inviterId, action },
          order: { generatedAt: 'DESC' },
        });
      }
      return this.repo.findOne({
        where: { inviterId: inviterId },
        order: { generatedAt: 'DESC' },
      });
    } catch (e) {
      this.logger.error(e);
    }
  }

  async createInviteCode({
    inviterId,
    utmName,
    alreadyGeneratedInviteCodeEntity,
    retryCount,
    action,
  }: {
    inviterId: string;
    utmName?: string;
    alreadyGeneratedInviteCodeEntity?: InviteCodeEntity;
    retryCount?: number;
    action?: InviteCodeAction;
  }): Promise<InviteCodeEntity | undefined> {
    this.logger.info(`createInviteCode inviterId '${inviterId}'`, {});
    if (retryCount === 3) {
      this.logger.error('Count = 3');
      return;
    }
    if (retryCount) {
      this.logger.info('Found count ', { retryCount });
      retryCount += 1;
    } else {
      retryCount = 1;
    }
    let inviteCodeEntity: InviteCodeEntity | undefined =
      alreadyGeneratedInviteCodeEntity;
    if (inviteCodeEntity) {
      inviteCodeEntity.code = this.generateCode();
    } else {
      inviteCodeEntity = new InviteCodeEntity();
      inviteCodeEntity.id = generateId();
      inviteCodeEntity.code = this.generateCode();
      inviteCodeEntity.utmName = utmName;
      inviteCodeEntity.generatedAt = new Date();
      inviteCodeEntity.inviterId = inviterId?.trim();
    }
    inviteCodeEntity.action = action;
    try {
      await this.repo.save(inviteCodeEntity);
      return inviteCodeEntity;
    } catch (e) {
      if (e instanceof QueryFailedError) {
        if (e.driverError.code === POSTGRES_UNIQUE_VIOLATION_CODE) {
          this.logger.error(
            'Duplicate Key Failure, retrying generation of code'
          );
          return this.createInviteCode({
            inviterId,
            alreadyGeneratedInviteCodeEntity: inviteCodeEntity,
            retryCount,
          });
        }
      }
      this.logger.error(e);
    }
  }

  async findByInviteCode(code: number): Promise<InviteCodeEntity | undefined> {
    return await this.repo.findOne({
      where: { code },
    });
  }

  /**
   * TODO: fix race condition in invite code entity update
   */
  async checkAndRedeem(
    inviteCode: InviteCodeEntity,
    redeemerId?: string | undefined
  ): Promise<CheckAndRedeemInviteCodeResult> {
    const context = {
      inviteCodeId: inviteCode.id,
      redeemerId,
      methodName: 'checkAndRedeem',
    };
    try {
      this.logger.info('Found invite code entity', context);
      if (inviteCode.redeemedAt) {
        this.logger.info('Has already been redeemed', context);
        let isReusable = false;
        if (process.env.REUSABLE_CODE) {
          isReusable = inviteCode.code === Number(process.env.REUSABLE_CODE!);
          this.logger.info('isReusable', { isReusable });
        }
        if (!isReusable) {
          return {
            hasBeenRedeemed: true,
            isValid: true,
          };
        }
      }
      this.logger.info('Redeeming it now', context);
      inviteCode.redeemedAt = new Date();
      if (redeemerId) {
        inviteCode.redeemedByUserIds ??= [];
        inviteCode.redeemedByUserIds.push(redeemerId);
      }
      if (!inviteCode.redeemedCount) {
        inviteCode.redeemedCount = 0;
      }
      inviteCode.redeemedCount += 1;
      await this.repo.update(inviteCode.id, inviteCode);
      return {
        isValid: true,
      };
    } catch (error) {
      this.logger.error(error);
      return { hasError: true };
    }
  }

  async redeemInviteCode(
    redeemedByUserId: string,
    code: number
  ): Promise<InviteCodeEntity | undefined> {
    try {
      const inviteCode = await this.repo.findOne({ where: { code } });
      if (inviteCode) {
        inviteCode.redeemedByUserId = redeemedByUserId;
        inviteCode.redeemedByUserIds ??= [];
        inviteCode.redeemedByUserIds.push(redeemedByUserId);
        await this.repo.save(inviteCode);
        return inviteCode;
      } else {
        this.logger.error(
          'Failed to updated redeemedStatus, could not find inviteCode ',
          {
            code,
          }
        );
      }
    } catch (error) {
      this.logger.error('Failed to updated redeemedStatus ', error);
    }
  }
}

export interface CheckAndRedeemInviteCodeResult {
  hasBeenRedeemed?: boolean;
  isValid?: boolean;
  hasError?: boolean;
}
