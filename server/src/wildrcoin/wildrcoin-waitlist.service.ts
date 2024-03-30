import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository, InjectConnection } from '@nestjs/typeorm';
import { fromTransaction } from '@verdzie/server/common/transaction-result';
import {
  PostgresQueryFailedException,
  PostgresTransactionFailedException,
  PostgresUpdateFailedException,
  PostgresUpsertFailedException,
} from '@verdzie/server/typeorm/postgres-exceptions';
import {
  AlreadyJoinedWildrcoinWaitlistException,
  UserEntity,
} from '@verdzie/server/user/user.entity';
import { UserNotFoundException } from '@verdzie/server/user/user.service';
import {
  WaitlistEntity,
  WaitlistType,
} from '@verdzie/server/waitlist/waitlist.entity';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Result, err, fromPromise, ok } from 'neverthrow';
import { Connection, Repository } from 'typeorm';
import { Logger } from 'winston';

@Injectable()
export class WildrcoinWaitlistService {
  private readonly transactionRetryCount = 3;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @InjectConnection()
    private readonly connection: Connection,
    @InjectRepository(WaitlistEntity)
    private readonly waitlistRepo: Repository<WaitlistEntity>
  ) {
    this.logger = logger.child({ context: this.constructor.name });
  }

  async addUser({
    currentUser,
  }: {
    currentUser: UserEntity;
  }): Promise<
    Result<
      boolean,
      | AlreadyJoinedWildrcoinWaitlistException
      | PostgresQueryFailedException
      | UserNotFoundException
      | PostgresUpdateFailedException
      | PostgresTransactionFailedException
    >
  > {
    const context = {
      methodName: WildrcoinWaitlistService.prototype.addUser.name,
      userId: currentUser.id,
    };
    this.logger.info('adding user to wc waitlist', context);
    const queryRunner = this.connection.createQueryRunner();
    const result = await fromTransaction<
      boolean,
      | AlreadyJoinedWildrcoinWaitlistException
      | PostgresQueryFailedException
      | UserNotFoundException
      | PostgresUpdateFailedException
      | PostgresTransactionFailedException
    >({
      queryRunner,
      context,
      txn: async ({ queryRunner }) => {
        const userRepo = queryRunner.manager.getRepository(UserEntity);
        const userFindResult = await fromPromise(
          userRepo.findOne({
            where: { id: currentUser.id },
          }),
          error => new PostgresQueryFailedException({ error, ...context })
        );
        if (userFindResult.isErr()) {
          this.logger.error('error finding user joining wc waitlist', {
            ...context,
            error: userFindResult.error,
          });
          return err(userFindResult.error);
        }
        const user = userFindResult.value;
        if (!user) {
          this.logger.error('user not found joining wc waitlist', context);
          return err(new UserNotFoundException({ id: currentUser.id }));
        }
        const result = user.joinWildrCoinWaitlist();
        if (result.isErr()) {
          this.logger.warn('error joining wc waitlist', {
            ...context,
            error: result.error,
          });
          return err(result.error);
        }
        const userUpdateResult = await fromPromise(
          userRepo.update(user.id, {
            bannerData: user.bannerData,
            wildrcoinData: user.wildrcoinData,
          }),
          error => new PostgresUpdateFailedException({ error, ...context })
        );
        if (userUpdateResult.isErr()) {
          this.logger.error('error updating user joining wc waitlist', {
            ...context,
            error: userUpdateResult.error,
          });
          return err(userUpdateResult.error);
        }
        return ok(true);
      },
      logger: this.logger,
      retryCount: this.transactionRetryCount,
      shouldRetry: error => {
        if (
          error instanceof PostgresQueryFailedException ||
          error instanceof PostgresUpdateFailedException ||
          error instanceof PostgresTransactionFailedException
        ) {
          return true;
        }
        return false;
      },
    });
    return result;
  }

  async addEmail({
    email,
  }: {
    email: string;
  }): Promise<Result<boolean, PostgresQueryFailedException>> {
    const context = {
      methodName: WildrcoinWaitlistService.prototype.addEmail.name,
      email,
    };
    this.logger.info('adding email to wc waitlist', context);
    // We don't check if the user has already joined the waitlist here because
    // returning an error would leak the fact that a user with that email
    // already exists.
    const upsertResult = await fromPromise(
      this.waitlistRepo.upsert(
        { email, waitlistType: WaitlistType.WILDRCOIN },
        [WaitlistEntity.kFields.email, WaitlistEntity.kFields.waitlistType]
      ),
      error => new PostgresUpsertFailedException({ error, ...context })
    );
    if (upsertResult.isErr()) {
      this.logger.error('error upserting wc waitlist', {
        error: upsertResult.error,
        ...context,
      });
      return err(upsertResult.error);
    }
    return ok(true);
  }
}
