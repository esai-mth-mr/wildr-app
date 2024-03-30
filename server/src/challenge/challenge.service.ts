import { Inject, Injectable } from '@nestjs/common';
import {
  ChallengeCover,
  ChallengeCoverImage,
  ChallengeCoverPreset,
  ChallengeCoverType,
  fromGqlChallengeCoverPreset,
} from '@verdzie/server/challenge/challenge-data-objects/challenge.cover';
import {
  ChallengeEntity,
  ChallengeTrollDetectionData,
} from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import {
  AfterChallengeCreatedTasksResult,
  ChallengeCreatedResult,
  ChallengeParticipant,
  ChallengeTrollDetectionResult,
  fromFeaturedChallengeIdString,
  getChallengeLeaderboardFeedId,
  getChallengeParticipantsFeedId,
  toFeaturedChallengesIdString,
} from '@verdzie/server/challenge/challenge-data-objects/challenge.service.helper';
import {
  ChallengeRepository,
  ChallengeTxMethodOpts,
} from '@verdzie/server/challenge/challenge-repository/challenge.repository';
import { ChallengeUpdateStatsService } from '@verdzie/server/challenge/challenge-update-stats/challengeUpdateStats.service';
import {
  addJoinedChallenge,
  AlreadyJoinedChallengeException,
  fromUserJoinedChallengeString,
  hasChallengeEntryToday,
  HasNotJoinedChallengeException,
  isChallengeParticipant,
  JoinedChallengeEntry,
  removeJoinedChallenge,
} from '@verdzie/server/challenge/userJoinedChallenges.helper';
import {
  CommentParentType,
  CommentService,
} from '@verdzie/server/comment/comment.service';
import {
  AppContext,
  kSomethingWentWrong,
  retryWithBackoff,
} from '@verdzie/server/common';
import { ID_SEPARATOR } from '@verdzie/server/common/generateId';
import { WildrExceptionDecorator } from '@verdzie/server/common/wildr-exception.decorator';
import { withSerializationRetries } from '@verdzie/server/common/with-serialization-retries';
import { ContentIO } from '@verdzie/server/content/content.io';
import { ContentService } from '@verdzie/server/content/content.service';
import { ContextService } from '@verdzie/server/context/context.service';
import { preserveOrderByIds } from '@verdzie/server/data/common';
import {
  getFirstFeedPageId,
  PageIdsAndInfo,
  PageNotFoundError,
} from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';
import {
  BadRequestException,
  BadRequestExceptionCodes,
  ForbiddenException,
  ForbiddenExceptionCodes,
  InternalServerErrorException,
  NotFoundException,
  NotFoundExceptionCodes,
  WildrException,
} from '@verdzie/server/exceptions/wildr.exception';
import { ExistenceState } from '@verdzie/server/existenceStateEnum';
import { FeedEntity, FeedEntityType } from '@verdzie/server/feed/feed.entity';
import {
  FeedNotFoundException,
  FeedService,
  PaginateFeedResponse,
  emptyFeedPage,
} from '@verdzie/server/feed/feed.service';
import {
  Challenge,
  ChallengeListType,
  ChallengeState,
  ChallengeStats as GqlChallengeStats,
  ChallengeTrollDetectionError as GqlChallengeTrollDetectionError,
  Content,
  EditChallengeResult,
  GetChallengesInput,
  PaginationInput,
  ReportType,
} from '@verdzie/server/generated-graphql';
import {
  CreateChallengeInput,
  EditChallengeInput,
} from '@verdzie/server/graphql';
import { PostCategoryEntity } from '@verdzie/server/post-category/postCategory.entity';
import { PostCategoryService } from '@verdzie/server/post-category/postCategory.service';
import { ReportObjectTypeEnum } from '@verdzie/server/report/report.entity';
import { TrollDetectorService } from '@verdzie/server/troll-detector/troll-detector.service';
import { UploadService } from '@verdzie/server/upload/upload.service';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserService } from '@verdzie/server/user/user.service';
import { NotifyChallengeAuthorParticipantJoinProducer } from '@verdzie/server/worker/notify-challenge-author-participant-join/notify-challenge-author-participant-join.producer';
import { NotifyFollowersOfChallengeCreationProducer } from '@verdzie/server/worker/notify-followers-challenge-creation/notify-followers-challenge-creation.producer';
import { ReportProducer } from '@verdzie/server/worker/report/report.producer';
import { format, getTimezoneOffset } from 'date-fns-tz';
import _, { first, last } from 'lodash';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { err, fromPromise, ok, Result } from 'neverthrow';
import {
  FindConditions,
  FindOneOptions,
  QueryRunner,
  Repository,
} from 'typeorm';
import { Logger } from 'winston';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { UpdateChallengeParticipantsDataProducer } from '@verdzie/server/worker/update-challenge-participants-data/updateChallengeParticipantsData.producer';
import { ChallengeNotificationService } from '@verdzie/server/challenge/challenge-notification/challenge-notification.service';
import { LoginRequiredException } from '@verdzie/server/exceptions/forbidden.exception';

const DATE_FORMAT = 'yyyy-MM-dd';

@Injectable()
export class ChallengeService {
  private readonly postToViewEnabled: boolean;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly repo: ChallengeRepository,
    private readonly userService: UserService,
    private readonly contentService: ContentService,
    private readonly feedService: FeedService,
    private readonly uploadService: UploadService,
    private readonly trollDetectorService: TrollDetectorService,
    private readonly updateStatsService: ChallengeUpdateStatsService,
    private readonly commentService: CommentService,
    private readonly notifyChallengeAuthorParticipantJoinProducer: NotifyChallengeAuthorParticipantJoinProducer,
    private readonly notifyFollowersOfChallengeCreationProducer: NotifyFollowersOfChallengeCreationProducer,
    private readonly reportProducer: ReportProducer,
    private readonly challengeNotificationService: ChallengeNotificationService,
    private readonly contextService: ContextService,
    private readonly postCategoryService: PostCategoryService,
    private readonly prepareUpdateUsersBatchProducer: UpdateChallengeParticipantsDataProducer
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
    // Enable by default backward compatibility
    // TODO: Move to backend feature cleaner flags
    this.postToViewEnabled =
      (process.env.CHALLENGE_POST_TO_VIEW_ENABLED === 'false' ? false : true) ??
      true;
  }

  //Get challenge
  async findById({
    id,
    findOptions,
    txOptions,
  }: {
    id: string;
    findOptions?: FindOneOptions<ChallengeEntity>;
    txOptions?: ChallengeTxMethodOpts;
  }): Promise<ChallengeEntity | undefined> {
    return this.repo.findOne({ id, findOptions, txOptions });
  }

  async findByIdIncludingSoftDelete(id: string): Promise<ChallengeEntity[]> {
    return this.repo.find({
      findOptions: { where: id },
      shouldSkipDeleted: false,
    });
  }

  async findAll({
    ids,
    relations,
    where,
  }: {
    ids: string[];
    relations?: string[];
    where?: FindConditions<ChallengeEntity>;
  }): Promise<ChallengeEntity[]> {
    try {
      return await this.repo.findByIds({
        ids,
        findOptions: {
          relations,
          where,
        },
      });
    } catch (e) {
      this.logger.error(e);
      return [];
    }
  }

  async findWithAuthorRelation(
    id: string
  ): Promise<ChallengeEntity | undefined> {
    return _.first(await this.findAllWithAuthorRelation([id]));
  }

  async findAllWithAuthorRelation(ids: string[]): Promise<ChallengeEntity[]> {
    return await this.repo.findByIds({
      ids,
      findOptions: { relations: [ChallengeEntity.kAuthorRelation] },
    });
  }

  //Create
  private async sendChallengeCreatedNotificationToFollowers(
    challenge: ChallengeEntity
  ) {
    await this.notifyFollowersOfChallengeCreationProducer.notifyAllFollowers({
      challengeId: challenge.id,
    });
  }

  private async sendJoinedChallengeNotification(
    challenge: ChallengeEntity,
    participant: UserEntity
  ) {
    if (challenge.authorId === participant.id) {
      this.logger.info('Challenge authorId = participantId', {
        challengeId: challenge.id,
      });
      return;
    }
    return retryWithBackoff({
      fn: () =>
        this.notifyChallengeAuthorParticipantJoinProducer.notifyAuthor({
          challengeId: challenge.id,
          participantId: participant.id,
        }),
      retryCount: 3,
      throwAfterFailedRetries: false,
      logFailure: e =>
        this.logger.error(
          'Error creating joined challenge notification job ' + e,
          {
            challengeId: challenge.id,
            participantId: participant.id,
          }
        ),
    });
  }

  async findOrCreateParticipantsFeed(
    feedRepo: Repository<FeedEntity>,
    challenge: ChallengeEntity
  ): Promise<FeedEntity> {
    const participantsFeedId = getChallengeParticipantsFeedId(challenge.id);
    let participantsFeed = await feedRepo.findOne(
      { id: participantsFeedId },
      { lock: { mode: 'pessimistic_write' } }
    );
    if (!participantsFeed) {
      this.logger.info('Creating participants feed', { participantsFeedId });
      participantsFeed = await this.feedService.createWithId(
        participantsFeedId,
        { repo: feedRepo }
      );
    }
    return participantsFeed;
  }

  /**
   * Updates @param challenge stats
   */
  private async joinChallengeInTxt({
    challenge,
    participant,
    feedRepo,
    userRepo,
    challengeRepo,
  }: {
    challenge: ChallengeEntity;
    participant: UserEntity;
    feedRepo: Repository<FeedEntity>;
    userRepo: Repository<UserEntity>;
    challengeRepo: Repository<ChallengeEntity>;
  }) {
    this.logger.info('Join challenge in TxT');
    const participantsFeed = await this.findOrCreateParticipantsFeed(
      feedRepo,
      challenge
    );
    const participantEntry: ChallengeParticipant = {
      id: participant.id,
      entryCount: 0,
    };
    const result = await this.feedService.tryAndPushEntry(
      participantsFeed.id,
      JSON.stringify(participantEntry),
      { repo: feedRepo }
    );
    if (!result) {
      throw new Error('Could not join challenge');
    }
    if (!result.didAddEntry) {
      throw new Error('Already part of the challenge');
    }
    const participantCount = (result.entity as FeedEntity).count;
    //Update challenge entry count
    await this.updateStatsService.jsonbSetStatsInTxT({
      id: challenge.id,
      statsKey: 'participantCount',
      statsValue: participantCount,
      repo: challengeRepo,
    });
    challenge.stats.participantCount = participantCount;
    this.logger.info('participantCount', { participantCount });
    let previewParticipantsStr = challenge.stats.previewParticipants;
    const previewParticipants =
      previewParticipantsStr.length === 0
        ? []
        : previewParticipantsStr.split(ID_SEPARATOR);
    const previewParticipantSet = new Set(previewParticipants);
    if (previewParticipants.length < 3) {
      previewParticipantSet.add(participant.id);
      previewParticipantsStr = [...previewParticipantSet].join(ID_SEPARATOR);
      this.logger.info(`previewParticipants -${previewParticipantsStr}-`);
      await this.updateStatsService.jsonbSetStatsInTxT({
        id: challenge.id,
        statsKey: 'previewParticipants',
        statsValue: previewParticipantsStr,
        repo: challengeRepo,
      });
      challenge.stats.previewParticipants = previewParticipantsStr;
    }
    const participantForUpdate = await userRepo.findOne(participant.id, {
      lock: { mode: 'pessimistic_write' },
    });
    if (!participantForUpdate) {
      throw new NotFoundException(kSomethingWentWrong, {
        participantId: participant.id,
        method: 'joinChallengeInTxt',
        exceptionCode: NotFoundExceptionCodes.USER_NOT_FOUND,
      });
    }
    const joinChallengeResult = addJoinedChallenge({
      user: participantForUpdate,
      challenge,
    });
    if (joinChallengeResult.isErr()) {
      if (
        joinChallengeResult.error instanceof AlreadyJoinedChallengeException
      ) {
        throw new BadRequestException('Already part of the challenge');
      }
      throw new InternalServerErrorException('Error joining challenge', {
        participantId: participant.id,
        method: 'joinChallengeInTxt',
        challengeId: challenge.id,
        error: joinChallengeResult.error,
      });
    }
    await userRepo.update(participant.id, {
      challengeContext: participantForUpdate.challengeContext,
    });
    return challenge;
  }

  async joinChallenge(
    challenge: ChallengeEntity,
    participant: UserEntity
  ): Promise<ChallengeEntity> {
    if (challenge.authorId === participant.id)
      throw new BadRequestException(`You can't join your own challenge`);
    if (challenge.isCompleted)
      throw new BadRequestException(`You can't join a completed challenge`);
    if (
      isChallengeParticipant({ user: participant, challengeId: challenge.id })
    )
      throw new BadRequestException(`You are already part of this challenge`);
    const isBlockedByAuthor = await this.userService.hasBlocked({
      userWhoBlockedId: challenge.authorId,
      userIdToCheck: participant.id,
    });
    if (isBlockedByAuthor) {
      throw new BadRequestException(
        `You can't join this challenge due to restrictions set by the creator`
      );
    }
    await this.repo.repo.manager.transaction(async manager => {
      const feedRepo = manager.getRepository(FeedEntity);
      const challengeRepo = manager.getRepository(ChallengeEntity);
      const userRepo = manager.getRepository(UserEntity);
      challenge = await this.joinChallengeInTxt({
        challenge,
        participant,
        feedRepo,
        userRepo,
        challengeRepo,
      });
      await this.sendJoinedChallengeNotification(challenge, participant);
      await this.challengeNotificationService.subscribeToChallengeNotifications(
        {
          challenge,
          userId: participant.id,
        }
      );
    });
    return challenge;
  }

  /**
   * Adds pessimistic_write to both the feed rows
   */
  async lockGlobalChallengeFeedsForWrite(
    repo: Repository<FeedEntity>
  ): Promise<{
    globalAllChallengesFeed: FeedEntity;
    globalActiveChallengesFeed: FeedEntity;
  }> {
    this.logger.info('lockGlobalChallengeFeedsForWrite...');
    const feeds = await repo.findByIds(
      [globalAllChallengesFeedId, globalActiveChallengesFeedId],
      {
        lock: { mode: 'pessimistic_write' },
      }
    );
    const globalAllChallengesFeed =
      feeds.find(feed => feed.id === globalAllChallengesFeedId) ??
      (await this.feedService.createWithId(globalAllChallengesFeedId, {
        repo,
      }));
    const globalActiveChallengesFeed =
      feeds.find(feed => feed.id === globalActiveChallengesFeedId) ??
      (await this.feedService.createWithId(globalActiveChallengesFeedId, {
        repo,
      }));
    return {
      globalAllChallengesFeed,
      globalActiveChallengesFeed,
    };
  }

  /**
   * `pessimistic_write` lock preferred
   */
  private async afterChallengeCreated(
    challenge: ChallengeEntity,
    creator: UserEntity
  ): Promise<AfterChallengeCreatedTasksResult | undefined> {
    this.logger.info('After challenge created');
    await this.repo.repo.manager.transaction(async manager => {
      const feedRepo = manager.getRepository(FeedEntity);
      const userRepo = manager.getRepository(UserEntity);
      // Add entry to GLOBAL_ALL_CHALLENGES and GLOBAL_ACTIVE_CHALLENGES
      await this.lockGlobalChallengeFeedsForWrite(feedRepo);
      await this.feedService.tryAndPushEntry(
        globalAllChallengesFeedId,
        challenge.id,
        { repo: feedRepo }
      );
      await this.feedService.tryAndPushEntry(
        globalActiveChallengesFeedId,
        challenge.id,
        { repo: feedRepo }
      );
      challenge = await this.joinChallengeInTxt({
        challenge,
        participant: creator,
        feedRepo: feedRepo,
        userRepo: userRepo,
        challengeRepo: manager.getRepository(ChallengeEntity),
      });
    });
    await this.sendChallengeCreatedNotificationToFollowers(challenge);
    await this.challengeNotificationService.subscribeToChallengeNotifications({
      challenge,
      userId: creator.id,
    });
    return {
      creator,
      challenge,
    };
  }

  async detectTrollingInChallenge({
    name,
    description,
  }: {
    name: string;
    description?: ContentIO;
  }): Promise<Result<undefined, ChallengeTrollDetectionResult>> {
    const nameTrollDetectionResult = await this.trollDetectorService.detect(
      name
    );
    if (nameTrollDetectionResult) {
      return err({
        nameResult: nameTrollDetectionResult,
      });
    }
    if (description && description.bodyStr) {
      const descriptionTrollDetectionResult =
        await this.trollDetectorService.detect(description.bodyStr);
      if (descriptionTrollDetectionResult) {
        return err({
          descriptionResult: descriptionTrollDetectionResult,
        });
      }
    }
    return ok(undefined);
  }

  toChallengeTrollDetectionError(
    result: ChallengeTrollDetectionResult
  ): GqlChallengeTrollDetectionError {
    return {
      __typename: 'ChallengeTrollDetectionError',
      message: 'Trolling Detected',
      name: result.nameResult
        ? {
            __typename: 'ChallengeTrollDetectionData',
            result: result.nameResult,
          }
        : undefined,
      description: result.descriptionResult
        ? {
            __typename: 'ChallengeTrollDetectionData',
            result: result.descriptionResult,
          }
        : {},
    };
  }

  async updateFeaturedChallengeEntry(
    queryRunner: QueryRunner,
    challenge: ChallengeEntity
  ) {
    const repo = queryRunner.manager.getRepository(FeedEntity);
    const entityId = globalPastChallengesFeedId;
    await repo.findOneOrFail(globalFeaturedChallengesFeedId, {
      lock: { mode: 'pessimistic_write' },
    });
    const existingFeaturedChallengeEntry =
      await this.feedService.findEntryWithDetails({
        entityId,
        entryToFind: challenge.id,
        opts: { repo },
      });
    if (existingFeaturedChallengeEntry) {
      if (existingFeaturedChallengeEntry.index === -1) {
        this.logger.info('Challenge not found under Featured Challenges');
        return;
      }
      const replacedEntry = await this.feedService.replaceEntry({
        entityId,
        repo,
        entryToReplace: toFeaturedChallengesIdString({
          id: challenge.id,
          endDate: challenge.endDate,
        }),
        entryIndex: existingFeaturedChallengeEntry.index,
        pageNumber: existingFeaturedChallengeEntry.pageNumber,
      });
      this.logger.info('Updated Featured Challenges Entry ', {
        didReplace: replacedEntry?.didReplaceEntry,
      });
    }
  }

  async editChallenge(
    input: EditChallengeInput,
    currentUser: UserEntity
  ): Promise<
    Result<
      EditChallengeResult | GqlChallengeTrollDetectionError,
      | NotFoundException
      | InternalServerErrorException
      | ForbiddenException
      | BadRequestException
    >
  > {
    this.logger.info('Edit Challenge');
    let queryRunner: QueryRunner | undefined;
    try {
      queryRunner = this.repo.manager.connection.createQueryRunner();
      await queryRunner.startTransaction();
      const manager = queryRunner.manager;
      const challengeRepo = manager.getRepository(ChallengeEntity);
      const challenge: ChallengeEntity | undefined =
        await challengeRepo.findOne(input.id, {
          lock: { mode: 'pessimistic_write' },
        });
      if (!challenge) {
        await queryRunner?.rollbackTransaction();
        return err(
          new NotFoundException('Challenge not found', {
            challengeId: input.id,
          })
        );
      }
      if (challenge.isCompleted) {
        await queryRunner?.rollbackTransaction();
        return err(
          new BadRequestException(
            'Can not edit a completed challenge',
            {},
            {
              exceptionCode: ForbiddenExceptionCodes.CHALLENGE_ENDED,
              challengeId: input.id,
            }
          )
        );
      }
      if (challenge.authorId !== currentUser.id) {
        await queryRunner?.rollbackTransaction();
        return err(
          new ForbiddenException(
            'Only the creator of the challenge can edit it',
            {
              exceptionCode: ForbiddenExceptionCodes.AUTHOR_REQUIRED,
              challengeId: input.id,
            }
          )
        );
      }
      //Edit challenge date only if the Challenge hasn't started yet
      if (input.startDate || input.endDate) {
        if (challenge.startDate <= new Date(Date.now())) {
          await queryRunner?.rollbackTransaction();
          return err(
            new BadRequestException(
              'Can not edit date of a challenge that is already started',
              {},
              {
                exceptionCode: ForbiddenExceptionCodes.CHALLENGE_IN_PROGRESS,
                challengeId: input.id,
              }
            )
          );
        }
        const setupStartAndEndDateResult = this.setupStartAndEndDate(
          input,
          challenge
        );
        if (setupStartAndEndDateResult?.errorMessage) {
          await queryRunner?.rollbackTransaction();
          return err(
            new BadRequestException(setupStartAndEndDateResult.errorMessage)
          );
        }
      }
      let description: undefined | ContentIO;
      if (input.description) {
        description = await this.contentService.getContentIO(input.description);
      }
      let trollDetectionOverride: ChallengeTrollDetectionData | undefined;
      if (!input.trollDetectionOverride) {
        const trollDetectionResult = await this.detectTrollingInChallenge({
          name: challenge.name,
          description: challenge.description,
        });
        if (trollDetectionResult.isErr()) {
          await queryRunner?.rollbackTransaction();
          const challengeTrollDetectionError: GqlChallengeTrollDetectionError =
            this.toChallengeTrollDetectionError(trollDetectionResult.error);
          return ok(challengeTrollDetectionError);
        }
      } else {
        challenge.addTrollDetectionOverride(input.trollDetectionOverride);
        trollDetectionOverride = challenge.trollDetectionData ?? undefined;
      }
      const cover = input.deleteCoverImage
        ? undefined
        : await this.parseChallengeCover(input);
      const updateChallengeInput: QueryDeepPartialEntity<ChallengeEntity> = {
        ...(input.name && { name: input.name }),
        ...(description && { description }),
        ...(cover && { cover }),
        ...(input.deleteCoverImage && { cover: undefined }),
        ...(trollDetectionOverride && { trollDetectionOverride }),
        ...(input.categoryIds && { categoryIds: input.categoryIds }),
        ...(input.startDate && { startDate: challenge.startDate }),
        ...(input.endDate && { endDate: challenge.endDate }),
      };
      this.logger.info('Updating challenge', {
        id: challenge.id,
        updateChallengeInput,
      });
      await challengeRepo.update(challenge.id, updateChallengeInput);
      this.logger.info('Challenge updated successfully', { id: challenge.id });
      if (input.startDate || input.endDate) {
        await this.updateFeaturedChallengeEntry(queryRunner, challenge);
        //JOINED (via worker: every participant's ChallengeContext and Feed)
        await this.prepareUpdateUsersBatchProducer.onEditChallengeDate({
          challengeId: challenge.id,
          ...(input.startDate && { startDate: challenge.startDate }),
          ...(input.endDate && { endDate: challenge.endDate }),
        });
      }
      await queryRunner.commitTransaction();
      const updatedChallenge = await challengeRepo.findOneOrFail({
        id: challenge.id,
      });
      const editChallengeResult: EditChallengeResult = {
        __typename: 'EditChallengeResult',
        challenge: this.toGqlChallengeObject(updatedChallenge),
        creator: this.userService.toUserObject({
          user: currentUser,
          isCurrentUserRequestingTheirDetails: true,
        }),
      };
      return ok(editChallengeResult);
    } catch (error) {
      await queryRunner?.rollbackTransaction().catch(e => {
        this.logger.warn(
          '[updateJoinedChallengeEntryPostInTxt] error rolling back transaction ',
          e
        );
      });
      return err(
        new InternalServerErrorException(
          kSomethingWentWrong,
          {
            challengeId: input.id,
            methodName: 'editChallenge',
          },
          error
        )
      );
    } finally {
      await queryRunner?.release();
    }
  }

  async parseChallengeCover(
    input: CreateChallengeInput | EditChallengeInput
  ): Promise<ChallengeCover | undefined> {
    let type: ChallengeCoverType | undefined;
    let coverImage: ChallengeCoverImage | undefined;
    let preset: ChallengeCoverPreset | undefined;

    if (input.coverImage) {
      type = ChallengeCoverType.IMAGE_UPLOAD;
      const [file, thumbnailFile] = await Promise.all([
        this.uploadService.uploadFile(input.coverImage.image),
        this.uploadService.uploadFile(input.coverImage.thumbnail),
      ]);
      coverImage = {
        image: {
          id: file.id,
          path: file.path,
          type: file.mimetype.toLocaleLowerCase(),
        },
        thumbnail: {
          id: thumbnailFile.id,
          path: thumbnailFile.path,
          type: thumbnailFile.mimetype.toLocaleLowerCase(),
        },
      };
    } else if (input.coverEnum) {
      type = ChallengeCoverType.PRESET;
      preset = fromGqlChallengeCoverPreset(input.coverEnum);
    }
    if (!type) return;
    return { type, preset, coverImage };
  }

  setupStartAndEndDate(
    input: CreateChallengeInput | EditChallengeInput,
    challenge: ChallengeEntity
  ):
    | {
        errorMessage: string;
      }
    | undefined {
    if (input.startDate) {
      if (isNaN(Date.parse(input.startDate)))
        return { errorMessage: 'Invalid Start Date' };
      const startDate = new Date(input.startDate);
      const presentDate = new Date();
      if (
        startDate.getFullYear() <= presentDate.getFullYear() &&
        startDate.getMonth() <= presentDate.getMonth() &&
        startDate.getDate() < new Date().getDate()
      ) {
        return { errorMessage: "Start Date can't be earlier than today" };
      }
      challenge.startDate = startDate;
    }
    if (input.endDate) {
      if (isNaN(Date.parse(input.endDate)))
        return { errorMessage: 'Invalid End Date' };
      const endDate = new Date(input.endDate);
      if (endDate < challenge.startDate) {
        return { errorMessage: "End Date can't be less than start date" };
      }
      challenge.endDate = endDate;
    } else if (input.challengeLengthInDays && input.challengeLengthInDays > 0) {
      const currentDate = new Date();
      challenge.endDate = new Date(
        currentDate.setDate(currentDate.getDate() + input.challengeLengthInDays)
      );
    } else {
      //end date is infinite
      challenge.endDate = undefined;
    }
  }

  async createChallenge(
    input: CreateChallengeInput,
    currentUser: UserEntity
  ): Promise<ChallengeCreatedResult | undefined> {
    this.logger.info('Create Challenge');
    let challenge: ChallengeEntity | undefined = new ChallengeEntity();
    challenge.authorId = currentUser.id;
    const startAndEndDateError = this.setupStartAndEndDate(input, challenge);
    if (startAndEndDateError?.errorMessage) {
      return startAndEndDateError;
    }
    challenge.name = input.name;
    if (input.description) {
      challenge.description = await this.contentService.getContentIO(
        input.description
      );
    }
    if (!input.trollDetectionOverride) {
      const trollDetectionResult = await this.detectTrollingInChallenge({
        name: challenge.name,
        description: challenge.description,
      });
      if (trollDetectionResult.isErr()) {
        return {
          trollDetection: trollDetectionResult.error,
        };
      }
    } else {
      challenge.addTrollDetectionOverride(input.trollDetectionOverride);
    }
    const cover = await this.parseChallengeCover(input);
    if (!cover) {
      throw new BadRequestException(
        `Both the coverImage and coverImage can not be null`,
        {
          userId: currentUser.id,
        }
      );
    }
    challenge.cover = cover;
    challenge.categoryIds = input.categoryIds;
    challenge = await this.repo.insert({ challenge });
    if (!challenge) {
      this.logger.error('Failed to save challenge');
      return;
    }
    const result = await this.afterChallengeCreated(challenge, currentUser);
    if (!result) {
      this.logger.info('Failed to perform onChallengeCreated tasks');
      //TODO: Make sure the notification failure isn't causing this empty return type
      await this.repo.repo.remove([challenge]);
      return;
    }
    challenge = result.challenge;
    challenge.author = currentUser;
    return {
      createdChallenge: {
        challenge,
        creator: result.creator,
      },
    };
  }

  //Prepare GQL objects
  toGqlChallengeObject(challenge: ChallengeEntity): Challenge {
    return {
      __typename: 'Challenge',
      id: challenge.id,
      name: challenge.name,
      author: challenge.author
        ? this.userService.toUserObject({ user: challenge.author })
        : undefined,
      ts: {
        createdAt: challenge.createdAt,
        updatedAt: challenge.updatedAt,
        expiry: challenge.endDate,
        start: challenge.startDate,
      },
      willBeDeleted: challenge.willBeDeleted,
      stats: challenge.stats,
      isCompleted: challenge.isCompleted,
      pinnedCommentId: challenge.pinnedCommentId,
      pinnedComment: challenge.pinnedComment
        ? this.commentService.toCommentObject(challenge.pinnedComment)
        : undefined,
    };
  }

  async getGqlDescription(
    challenge: ChallengeEntity
  ): Promise<Content | undefined> {
    if (challenge.description) {
      return await this.contentService.resolve(
        challenge.description,
        challenge.description.bodyStr
      );
    }
    this.logger.warn('Description not found for challenge', {
      id: challenge.id,
    });
  }

  @WildrExceptionDecorator()
  async getCommentCountForUser(
    challengeId: string,
    currentUser?: UserEntity
  ): Promise<number> {
    return this.commentService.getCommentCountForUser(
      challengeId,
      CommentParentType.CHALLENGE,
      currentUser
    );
  }

  async getStatsForUser(
    challenge: ChallengeEntity,
    currentUser?: UserEntity
  ): Promise<GqlChallengeStats> {
    const baseStats = {
      entryCount: challenge.stats?.entryCount ?? 0,
      participantCount: challenge.stats?.participantCount ?? 0,
      shareCount: challenge.stats?.shareCount ?? 0,
      commentCount: challenge.stats?.commentCount ?? 0,
      reportCount: challenge.stats?.reportCount ?? 0,
      hasHiddenComments: challenge.stats?.hasHiddenComments ?? false,
    };
    if (challenge.stats.hasHiddenComments) {
      baseStats.commentCount = await this.getCommentCountForUser(
        challenge.id,
        currentUser
      );
    }
    return baseStats;
  }

  //Helper Functions
  async getChallengeEntityFromContext(
    id: string,
    ctx: AppContext,
    shouldAddAuthor = false
  ): Promise<ChallengeEntity | undefined> {
    if (ctx.challenges[id]) return ctx.challenges[id];
    const challenge = await this.findById({
      id,
      findOptions: {
        relations: shouldAddAuthor ? [ChallengeEntity.kAuthorRelation] : [],
      },
    });
    if (!challenge) return;
    ctx.challenges[id] = challenge;
    if (shouldAddAuthor && challenge.author) {
      ctx.users[challenge.authorId] = challenge.author;
    }
    return challenge;
  }

  async getChallenges({
    input,
    currentUser,
  }: {
    input: GetChallengesInput;
    currentUser: UserEntity | undefined;
  }): Promise<
    Result<
      PaginateFeedResponse<ChallengeEntity>,
      | LoginRequiredException
      | FeedNotFoundException
      | InternalServerErrorException
    >
  > {
    const context = {
      input,
      userId: currentUser?.id,
      methodName: 'getChallenges',
    };
    try {
      let feed: FeedEntity | undefined;
      const listType: ChallengeListType = input.type ?? ChallengeListType.ALL;
      switch (listType) {
        case ChallengeListType.MY_CHALLENGES:
          if (!currentUser) return err(new LoginRequiredException());
          return this.paginateJoinedChallenges({
            currentUser,
            paginationInput: input.paginationInput,
          });
        case ChallengeListType.OWNED_CHALLENGES:
          if (!currentUser) return err(new LoginRequiredException());
          return this.paginateOwnedChallenges({
            currentUser,
            paginationInput: input.paginationInput,
          });
        case ChallengeListType.FEATURED:
          return this.paginateFeaturedChallenges({
            currentUser,
            paginationInput: input.paginationInput,
          });
        case ChallengeListType.ALL_ACTIVE:
          feed = await this.feedService.findOrCreateWithId(
            globalActiveChallengesFeedId
          );
          return this.paginateAllActiveChallenges({
            paginationInput: input.paginationInput,
          });
        case ChallengeListType.ALL_PAST:
          feed = await this.feedService.findOrCreateWithId(
            globalPastChallengesFeedId
          );
          break;
        case ChallengeListType.ALL:
          feed = await this.feedService.findOrCreateWithId(
            globalAllChallengesFeedId
          );
          break;
      }
      if (!feed) {
        this.logger.error('feed not found paginating challenges', context);
        return err(new FeedNotFoundException(context));
      }
      const response = await fromPromise(
        this.feedService.paginateEntries(feed.id, input.paginationInput),
        error =>
          new InternalServerErrorException('error paginating entries', {
            error,
            ...context,
          })
      );
      if (response.isErr()) {
        this.logger.error('error paginating challenge entries', {
          error: response.error,
          ...context,
        });
        return err(response.error);
      }
      const challengesResponse = await fromPromise(
        this.repo.findByIds({
          ids: response.value.ids,
        }),
        error =>
          new InternalServerErrorException('error finding challenges', {
            error,
            ...context,
          })
      );
      if (challengesResponse.isErr()) {
        this.logger.error('error finding challenges', {
          error: challengesResponse.error,
          ...context,
        });
        return err(challengesResponse.error);
      }
      return ok({
        items: challengesResponse.value,
        pageInfo: {
          hasNextPage: response.value.hasMoreItems,
          hasPreviousPage: response.value.hasPreviousItems,
          count: challengesResponse.value.length,
          totalCount: response.value.totalCount,
          startCursor: first(challengesResponse.value)?.id,
          endCursor: last(challengesResponse.value)?.id,
        },
      });
    } catch (error) {
      return err(
        new InternalServerErrorException('error getting challenges', {
          error,
          ...context,
        })
      );
    }
  }

  async paginateAllActiveChallenges({
    paginationInput,
  }: {
    paginationInput: PaginationInput;
  }): Promise<
    Result<PaginateFeedResponse<ChallengeEntity>, InternalServerErrorException>
  > {
    try {
      const { stitchedIdsList } = await this.feedService
        .getAllEntriesFromEveryPage({
          feedId: globalActiveChallengesFeedId,
        })
        .catch(e => {
          if (e instanceof PageNotFoundError) {
            return { stitchedIdsList: [] };
          }
          throw e;
        });
      if (!stitchedIdsList.length) return ok(emptyFeedPage);
      const challenges: ChallengeEntity[] = [];
      const cursorDown =
        paginationInput.after || paginationInput.includingAndAfter;
      let firstLoop = true;
      let firstHasMoreItems = false;
      let firstHasPreviousItems = false;
      let currentResponse: PageIdsAndInfo = {
        ids: [],
        hasMoreItems: false,
        hasPreviousItems: false,
        totalCount: 0,
      };
      while (challenges.length < (paginationInput.take || 6)) {
        currentResponse = this.feedService.getPageOfIdsFromFeedIds({
          allFeedIds: stitchedIdsList,
          paginationInput,
        });
        const foundChallenges = await this.repo.findByIds({
          ids: currentResponse.ids,
        });
        const currentDate = new Date();
        for (const challenge of foundChallenges) {
          if (
            challenge.startDate < currentDate &&
            (!challenge.endDate || challenge.endDate > currentDate)
          ) {
            challenges.push(challenge);
            if (challenges.length === (paginationInput.take || 6)) {
              break;
            }
          }
        }
        if (paginationInput.after || paginationInput.includingAndAfter) {
          if (!currentResponse.hasMoreItems) {
            break;
          }
          paginationInput.after = last(currentResponse.ids);
          paginationInput.includingAndAfter = undefined;
        } else if (
          paginationInput.before ||
          paginationInput.includingAndBefore
        ) {
          if (!currentResponse.hasPreviousItems) {
            break;
          }
          paginationInput.before = first(currentResponse.ids);
          paginationInput.includingAndBefore = undefined;
        } else {
          paginationInput.after = last(currentResponse.ids);
          paginationInput.includingAndAfter = undefined;
        }
        if (firstLoop) {
          firstHasMoreItems = currentResponse.hasMoreItems;
          firstHasPreviousItems = currentResponse.hasPreviousItems;
          firstLoop = false;
        }
      }
      return ok({
        items: challenges,
        pageInfo: {
          hasNextPage: cursorDown
            ? currentResponse.hasMoreItems
            : firstHasMoreItems,
          hasPreviousPage: !cursorDown
            ? firstHasPreviousItems
            : currentResponse.hasPreviousItems,
          count: challenges.length,
          totalCount: stitchedIdsList.length,
          startCursor: first(challenges)?.id,
          endCursor: last(challenges)?.id,
        },
      });
    } catch (error) {
      return err(
        new InternalServerErrorException(
          '[paginateAllActiveChallenges] ' + error,
          {
            paginationInput,
          },
          error
        )
      );
    }
  }

  async getPreviewParticipants(
    challenge: ChallengeEntity
  ): Promise<UserEntity[] | undefined> {
    const previewParticipantsIdsStr = challenge.stats.previewParticipants;
    if (!previewParticipantsIdsStr) {
      this.logger.error('previewParticipants empty for challenge', {
        challengeId: challenge.id,
      });
      return;
    }
    this.logger.info('previewParticipants', {
      previewParticipantsStr: previewParticipantsIdsStr,
    });
    const participantIds = previewParticipantsIdsStr.split(ID_SEPARATOR);
    return preserveOrderByIds(
      participantIds,
      await this.userService.findAllById(participantIds)
    );
  }

  @WildrExceptionDecorator()
  async leaveChallenge({
    challenge,
    currentUser,
  }: {
    challenge: ChallengeEntity;
    currentUser: UserEntity;
  }): Promise<ChallengeEntity> {
    this.logger.info('[leaveChallenge]', {
      challengeId: challenge.id,
      userId: currentUser.id,
    });
    if (currentUser.id === challenge.authorId) {
      throw new BadRequestException(`You can't leave your own challenge`, {
        challengeId: challenge.id,
        userId: currentUser.id,
        methodName: 'leaveChallenge',
      });
    }
    await withSerializationRetries(
      () =>
        this.repo.repo.manager.transaction(async manager => {
          const feedRepo = manager.getRepository(FeedEntity);
          const challengeRepo = manager.getRepository(ChallengeEntity);
          const userRepo = manager.getRepository(UserEntity);
          const [participantFeedResponse, user] = await Promise.all([
            this.feedService.removeEntry(
              getChallengeParticipantsFeedId(challenge.id),
              `"id":"${currentUser.id}"`,
              { repo: feedRepo }
            ),
            userRepo.findOne(currentUser.id, {
              lock: { mode: 'pessimistic_write' },
            }),
            this.feedService
              .removeEntry(
                getChallengeLeaderboardFeedId(challenge.id),
                `"participantId":"${currentUser.id}"`,
                { repo: feedRepo }
              )
              .catch(error => {
                if (error instanceof PageNotFoundError) return;
                throw error;
              }),
          ]);
          if (!user) {
            throw new NotFoundException(kSomethingWentWrong, {
              challengeId: challenge.id,
              userId: currentUser.id,
              exceptionCode: NotFoundExceptionCodes.USER_NOT_FOUND,
              methodName: 'leaveChallenge',
            });
          }
          const leaveChallengeResult = removeJoinedChallenge({
            challengeId: challenge.id,
            user,
          });
          if (
            leaveChallengeResult.isErr() &&
            leaveChallengeResult.error instanceof HasNotJoinedChallengeException
          ) {
            throw new InternalServerErrorException(
              kSomethingWentWrong,
              {
                challengeId: challenge.id,
                userId: currentUser.id,
                methodName: 'leaveChallenge',
              },
              leaveChallengeResult.error
            );
          }
          const newParticipantPreview = participantFeedResponse.entity.ids
            .slice(0, 3)
            .map(p => JSON.parse(p).id)
            .join(ID_SEPARATOR);
          await Promise.all([
            this.updateStatsService.jsonbSetStatsInTxT({
              id: challenge.id,
              statsKey: 'participantCount',
              statsValue: participantFeedResponse.entity.count,
              repo: challengeRepo,
            }),
            this.updateStatsService.jsonbSetStatsInTxT({
              id: challenge.id,
              statsKey: 'previewParticipants',
              statsValue: newParticipantPreview,
              repo: challengeRepo,
            }),
            userRepo.update(user.id, {
              challengeContext: user.challengeContext,
            }),
          ]);
          challenge.stats.previewParticipants = newParticipantPreview;
          challenge.stats.participantCount =
            participantFeedResponse.entity.count;
          this.logger.debug('[leaveChallenge] challenge stats updated', {
            challengeId: challenge.id,
            userId: currentUser.id,
          });
        }),
      2,
      this
    )();
    await this.challengeNotificationService.unsubscribeFromChallengeNotifications(
      {
        challenge,
        userId: currentUser.id,
      }
    );
    return challenge;
  }

  private getJoinedChallengeEntryPredicate(
    challengeState?: ChallengeState
  ): JoinedChallengeEntryPredicate {
    const currentDate = new Date();
    switch (challengeState) {
      case ChallengeState.CREATED:
        return (entry: JoinedChallengeEntry) => entry.startDate > currentDate;
      case ChallengeState.ACTIVE:
        return (entry: JoinedChallengeEntry) =>
          entry.startDate <= currentDate &&
          (!entry.endDate || entry.endDate >= currentDate);
      case ChallengeState.ENDED:
        return (entry: JoinedChallengeEntry) =>
          !!(entry.endDate && entry.endDate < currentDate);
      default:
        return () => true;
    }
  }

  @WildrExceptionDecorator()
  findJoinedChallenges({
    currentUser,
    challengeState,
  }: {
    currentUser: UserEntity;
    challengeState?: ChallengeState;
  }): Promise<ChallengeEntity[]> {
    const userJoinedChallengesStrings =
      currentUser.challengeContext?.joinedChallenges ?? [];
    const entries = [];
    for (const str of userJoinedChallengesStrings) {
      const entry = fromUserJoinedChallengeString(str);
      if (entry) {
        entries.push(entry);
      }
    }
    return this.repo.findByIds({
      ids: entries
        .filter(this.getJoinedChallengeEntryPredicate(challengeState))
        .map(id => id.challengeId),
    });
  }

  /**
   * Paginates through owned challenges. If challenge state is not provided it
   * will group challenges into created and ended challenges and paginate
   * through the created challenges first followed by the ended challenges.
   * This method will not throw errors and instead returns a result object.
   */
  async paginateOwnedChallenges({
    currentUser,
    challengeState,
    paginationInput,
  }: {
    currentUser: UserEntity;
    challengeState?: ChallengeState;
    paginationInput: PaginationInput;
  }): Promise<
    Result<PaginateFeedResponse<ChallengeEntity>, InternalServerErrorException>
  > {
    try {
      const userJoinedChallengesStrings =
        currentUser.challengeContext?.joinedChallenges;
      if (!userJoinedChallengesStrings?.length) {
        return ok({
          items: [],
          pageInfo: emptyPageInfo,
        });
      }
      let filteredIdsList = [];
      const currentDate = new Date();
      if (!challengeState) {
        const endedChallenges = [];
        const activeChallenges = [];
        for (const str of userJoinedChallengesStrings) {
          const entry = fromUserJoinedChallengeString(str);
          if (!entry || !(entry.authorId === currentUser.id)) {
            continue;
          }
          if (entry.endDate && entry.endDate < currentDate) {
            endedChallenges.push(entry);
          } else {
            activeChallenges.push(entry);
          }
        }
        filteredIdsList = endedChallenges.concat(activeChallenges);
      } else {
        for (const str of userJoinedChallengesStrings) {
          const entry = fromUserJoinedChallengeString(str);
          if (!entry || !(entry.authorId === currentUser.id)) {
            continue;
          }
          if (this.getJoinedChallengeEntryPredicate(challengeState)(entry)) {
            filteredIdsList.push(entry);
          }
        }
      }
      const feedPageAndInfo = this.feedService.getPageOfIdsFromFeedIds({
        allFeedIds: filteredIdsList.map(id => id.challengeId),
        paginationInput,
      });
      const challenges = await this.repo.findByIds({
        ids: feedPageAndInfo.ids,
      });
      return ok({
        items: challenges,
        pageInfo: {
          hasNextPage: feedPageAndInfo.hasMoreItems,
          hasPreviousPage: feedPageAndInfo.hasPreviousItems,
          startCursor: first(feedPageAndInfo.ids),
          endCursor: last(feedPageAndInfo.ids),
          count: challenges.length,
          totalCount: filteredIdsList.length,
        },
      });
    } catch (error) {
      return err(
        new InternalServerErrorException(
          '[paginateOwnedChallenges] ' + error,
          {
            userId: currentUser.id,
            challengeState,
            paginationInput,
            methodName: 'paginateOwnedChallenges',
          },
          error
        )
      );
    }
  }

  /**
   * Paginates through joined challenges. If challenge state is not provided it
   * will group challenges into created and ended challenges and paginate
   * through the created challenges first followed by the ended challenges.
   * This method will not throw errors and instead returns a result object.
   */
  async paginateJoinedChallenges({
    currentUser,
    challengeState,
    paginationInput,
  }: {
    currentUser: UserEntity;
    challengeState?: ChallengeState;
    paginationInput: PaginationInput;
  }): Promise<
    Result<PaginateFeedResponse<ChallengeEntity>, InternalServerErrorException>
  > {
    try {
      const userJoinedChallengesStrings =
        currentUser.challengeContext?.joinedChallenges;
      if (!userJoinedChallengesStrings?.length) {
        return ok({
          items: [],
          pageInfo: emptyPageInfo,
        });
      }
      let filteredIdsList = [];
      const currentDate = new Date();
      if (!challengeState) {
        const endedChallenges = [];
        const activeChallenges = [];
        for (const str of userJoinedChallengesStrings) {
          const entry = fromUserJoinedChallengeString(str);
          if (!entry) {
            continue;
          }
          if (!entry.joinedAt) {
            continue;
          }
          if (entry.endDate && entry.endDate < currentDate) {
            endedChallenges.push(entry);
          } else {
            activeChallenges.push(entry);
          }
        }
        filteredIdsList = endedChallenges.concat(activeChallenges);
      } else {
        for (const str of userJoinedChallengesStrings) {
          const entry = fromUserJoinedChallengeString(str);
          if (!entry) {
            continue;
          }
          if (!entry.joinedAt) {
            continue;
          }
          if (this.getJoinedChallengeEntryPredicate(challengeState)(entry)) {
            filteredIdsList.push(entry);
          }
        }
      }
      const feedPageAndInfo = this.feedService.getPageOfIdsFromFeedIds({
        allFeedIds: filteredIdsList.map(id => id.challengeId),
        paginationInput,
      });
      const challenges = await this.repo.findByIds({
        ids: feedPageAndInfo.ids,
      });
      return ok({
        items: challenges,
        pageInfo: {
          hasNextPage: feedPageAndInfo.hasMoreItems,
          hasPreviousPage: feedPageAndInfo.hasPreviousItems,
          startCursor: first(feedPageAndInfo.ids),
          endCursor: last(feedPageAndInfo.ids),
          count: challenges.length,
          totalCount: filteredIdsList.length,
        },
      });
    } catch (error) {
      return err(
        new InternalServerErrorException(
          '[paginateJoinedChallenges] ' + error,
          {
            userId: currentUser.id,
            challengeState,
            paginationInput,
            methodName: 'paginateJoinedChallenges',
          },
          error
        )
      );
    }
  }

  /**
   * Paginate through the featured challenges feed. This method will not throw
   * errors and instead returns a result object. Ended challenges are moved to
   * the end of the feed.
   */
  async paginateFeaturedChallenges({
    currentUser,
    challengeState,
    paginationInput,
  }: {
    currentUser?: UserEntity;
    challengeState?: ChallengeState;
    paginationInput: PaginationInput;
  }): Promise<
    Result<PaginateFeedResponse<ChallengeEntity>, InternalServerErrorException>
  > {
    try {
      const { stitchedIdsList } = await this.feedService
        .getAllEntriesFromEveryPage({
          feedId: globalFeaturedChallengesFeedId,
        })
        .catch(error => {
          if (error instanceof PageNotFoundError)
            return { stitchedIdsList: [] };
          throw error;
        });
      if (!stitchedIdsList.length)
        return ok({
          items: [],
          pageInfo: emptyPageInfo,
        });
      let filteredIdsList = [];
      const currentDate = new Date();
      const endedChallenges = [];
      const activeChallenges = [];
      for (const id of stitchedIdsList) {
        const entry = fromFeaturedChallengeIdString(id);
        if (!entry) continue;
        if (entry.endDate && entry.endDate < currentDate) {
          endedChallenges.push(entry);
        } else {
          activeChallenges.push(entry);
        }
      }
      filteredIdsList = endedChallenges.concat(activeChallenges);
      const feedPageAndInfo = this.feedService.getPageOfIdsFromFeedIds({
        allFeedIds: filteredIdsList.map(id => id.id),
        paginationInput,
      });
      const challenges = await this.repo.findByIds({
        ids: feedPageAndInfo.ids,
      });
      return ok({
        items: challenges,
        pageInfo: {
          hasNextPage: feedPageAndInfo.hasMoreItems,
          hasPreviousPage: feedPageAndInfo.hasPreviousItems,
          startCursor: first(feedPageAndInfo.ids),
          endCursor: last(feedPageAndInfo.ids),
          count: challenges.length,
          totalCount: filteredIdsList.length,
        },
      });
    } catch (error) {
      if (error instanceof WildrException) err(error);
      return err(
        new InternalServerErrorException(
          '[paginateFeaturedChallenges] ' + error,
          {
            userId: currentUser?.id,
            challengeState,
            paginationInput,
            methodName: 'paginateFeaturedChallenges',
          },
          error
        )
      );
    }
  }

  private async addReportForChallenge({
    challengeId,
    currentUser,
    reportType,
    context,
  }: {
    challengeId: string;
    currentUser: UserEntity;
    reportType: ReportType;
    context: AppContext;
  }): Promise<
    Result<
      ChallengeEntity,
      | NotFoundException
      | ForbiddenException
      | BadRequestException
      | InternalServerErrorException
    >
  > {
    try {
      const addReportResult = await this.repo.repo.manager.transaction(
        async manager => {
          const challengeRepo = manager.getRepository(ChallengeEntity);
          const feedRepo = manager.getRepository(FeedEntity);
          const challenge = await challengeRepo.findOne(challengeId);
          if (!challenge)
            return err(
              new NotFoundException('Challenge not found', {
                challengeId,
                userId: currentUser.id,
                exceptionCode: NotFoundExceptionCodes.CHALLENGE_NOT_FOUND,
              })
            );
          if (
            challenge.willBeDeleted ||
            challenge.existenceState !== ExistenceState.ALIVE
          )
            return err(
              new BadRequestException('Challenge has been deleted', {
                challengeId,
                userId: currentUser.id,
                exceptionCode: BadRequestExceptionCodes.CHALLENGE_DELETED,
              })
            );
          let userReportedChallengesFeed = await feedRepo.findOne(
            getFirstFeedPageId(
              FeedEntityType.REPORT_CHALLENGES,
              currentUser.id
            ),
            {
              lock: { mode: 'pessimistic_write' },
            }
          );
          const tasks: Promise<any>[] = [];
          if (!userReportedChallengesFeed) {
            userReportedChallengesFeed = new FeedEntity();
            userReportedChallengesFeed.page.ids = [challengeId];
            userReportedChallengesFeed.count = 1;
            userReportedChallengesFeed.id = getFirstFeedPageId(
              FeedEntityType.REPORT_CHALLENGES,
              currentUser.id
            );
            tasks.push(feedRepo.insert(userReportedChallengesFeed));
          } else {
            if (userReportedChallengesFeed.hasEntry(challengeId))
              return err(
                new BadRequestException(
                  `You have already reported this challenge`,
                  {
                    challengeId,
                    userId: currentUser.id,
                    exceptionCode:
                      BadRequestExceptionCodes.CHALLENGE_ALREADY_REPORTED,
                  }
                )
              );
            userReportedChallengesFeed.page.ids.push(challengeId);
            userReportedChallengesFeed.count =
              userReportedChallengesFeed.page.ids.length;
            tasks.push(
              feedRepo.update(
                userReportedChallengesFeed.id,
                userReportedChallengesFeed
              )
            );
          }
          tasks.push(
            this.updateStatsService.jsonbSetStatsInTxT({
              id: challengeId,
              statsKey: 'reportCount',
              statsValue: userReportedChallengesFeed.count,
              repo: challengeRepo,
            })
          );
          await Promise.all(tasks);
          challenge.stats.reportCount = userReportedChallengesFeed.count;
          context.challenges[challengeId] = challenge;
          return ok(challenge);
        }
      );
      if (addReportResult.isErr()) return addReportResult;
      this.reportProducer.createReport({
        objectAuthorId: addReportResult.value.authorId,
        objectType: ReportObjectTypeEnum.CHALLENGE,
        objectId: challengeId,
        reporterId: currentUser.id,
        reportType,
      });
      return addReportResult;
    } catch (error) {
      return err(
        new InternalServerErrorException(
          '[addReportForChallenge] ' + error,
          {
            userId: currentUser.id,
            challengeId,
            reportType,
            methodName: 'addReportForChallenge',
          },
          error
        )
      );
    }
  }

  private async removeReportForChallenge({
    challengeId,
    currentUser,
    context,
  }: {
    challengeId: string;
    currentUser: UserEntity;
    context: AppContext;
  }): Promise<
    Result<
      ChallengeEntity,
      | NotFoundException
      | ForbiddenException
      | BadRequestException
      | InternalServerErrorException
    >
  > {
    try {
      return await this.repo.repo.manager.transaction(async manager => {
        const challengeRepo = manager.getRepository(ChallengeEntity);
        const feedRepo = manager.getRepository(FeedEntity);
        const challenge = await challengeRepo.findOne(challengeId);
        if (!challenge)
          return err(
            new NotFoundException('Challenge not found', {
              challengeId,
              userId: currentUser.id,
              exceptionCode: NotFoundExceptionCodes.CHALLENGE_NOT_FOUND,
              methodName: 'removeReportForChallenge',
            })
          );
        if (
          challenge.willBeDeleted ||
          challenge.existenceState !== ExistenceState.ALIVE
        )
          return err(
            new BadRequestException('Challenge has been deleted', {
              challengeId,
              userId: currentUser.id,
              exceptionCode: BadRequestExceptionCodes.CHALLENGE_DELETED,
              methodName: 'removeReportForChallenge',
            })
          );
        const userReportedChallengesFeed = await feedRepo.findOne(
          getFirstFeedPageId(FeedEntityType.REPORT_CHALLENGES, currentUser.id),
          {
            lock: { mode: 'pessimistic_write' },
          }
        );
        if (
          !userReportedChallengesFeed ||
          !userReportedChallengesFeed.hasEntry(challengeId)
        )
          return err(
            new BadRequestException(`You have not reported this challenge`, {
              challengeId,
              userId: currentUser.id,
              exceptionCode: BadRequestExceptionCodes.CHALLENGE_NOT_REPORTED,
              methodName: 'removeReportForChallenge',
            })
          );
        userReportedChallengesFeed.page.ids =
          userReportedChallengesFeed.page.ids.filter(id => id !== challengeId);
        userReportedChallengesFeed.count =
          userReportedChallengesFeed.page.ids.length;
        await Promise.all([
          feedRepo.update(
            userReportedChallengesFeed.id,
            userReportedChallengesFeed
          ),
          this.updateStatsService.jsonbSetStatsInTxT({
            id: challengeId,
            statsKey: 'reportCount',
            statsValue: userReportedChallengesFeed.count,
            repo: challengeRepo,
          }),
        ]);
        challenge.stats.reportCount = userReportedChallengesFeed.count;
        context.challenges[challengeId] = challenge;
        return ok(challenge);
      });
    } catch (error) {
      return err(
        new InternalServerErrorException(
          '[removeReportForChallenge] ' + error,
          {
            userId: currentUser.id,
            challengeId,
            methodName: 'removeReportForChallenge',
          },
          error
        )
      );
    }
  }

  async reportChallenge({
    currentUser,
    challengeId,
    reportType,
    context,
  }: {
    currentUser: UserEntity;
    challengeId: string;
    reportType: ReportType;
    context: AppContext;
  }): Promise<
    Result<
      ChallengeEntity,
      | NotFoundException
      | ForbiddenException
      | BadRequestException
      | InternalServerErrorException
    >
  > {
    try {
      if (currentUser.isSuspended)
        return err(
          new ForbiddenException(
            `You can't report a challenge while suspended`,
            {
              userId: currentUser.id,
              challengeId,
              exceptionCode: ForbiddenExceptionCodes.USER_SUSPENDED,
              methodName: 'reportChallenge',
            }
          )
        );
      if (reportType === ReportType.UNREPORT)
        return await this.removeReportForChallenge({
          challengeId,
          currentUser,
          context,
        });
      return await this.addReportForChallenge({
        challengeId,
        currentUser,
        reportType,
        context,
      });
    } catch (error) {
      return err(
        new InternalServerErrorException(
          '[reportChallenge] ' + error,
          {
            userId: currentUser.id,
            challengeId,
            reportType,
            methodName: 'reportChallenge',
          },
          error
        )
      );
    }
  }

  async checkIfPostIsHiddenOnChallenge({
    challengeId,
    postId,
    currentUser,
    context,
  }: {
    challengeId: string;
    postId: string;
    currentUser?: UserEntity;
    context: AppContext;
  }): Promise<
    Result<boolean, NotFoundException | InternalServerErrorException>
  > {
    if (!this.postToViewEnabled) return ok(false);

    try {
      if (!context.timezoneOffset) {
        this.logger.warn(
          '[checkIfPostIsHiddenOnChallenge] timezone not provided'
        );
        return ok(true);
      }
      const [challenge, post] = await Promise.all([
        this.contextService.getChallengeEntityFromContext({
          id: challengeId,
          context,
        }),
        this.contextService.getPostEntityFromContext({
          id: postId,
          context,
        }),
      ]);
      if (!challenge) {
        return err(
          new NotFoundException(
            '[checkIfPostIsHiddenOnChallenge] challenge not found',
            {
              challengeId,
              userId: currentUser?.id,
              methodName: 'checkIfPostIsHiddenOnChallenge',
              exceptionCode: NotFoundExceptionCodes.CHALLENGE_NOT_FOUND,
            }
          )
        );
      }
      if (!post) {
        return err(
          new NotFoundException(
            '[checkIfPostIsHiddenOnChallenge] post not in context',
            {
              challengeId,
              postId,
              userId: currentUser?.id,
              methodName: 'checkIfPostIsHiddenOnChallenge',
              exceptionCode: NotFoundExceptionCodes.POST_NOT_FOUND,
            }
          )
        );
      }
      const timezoneOffsetMs = getTimezoneOffset(
        context.timezoneOffset || 'America/Los_Angeles'
      );
      const postCreatedDateFormatted = format(
        new Date(+post.createdAt + timezoneOffsetMs),
        DATE_FORMAT
      );
      const currentDateFormatted = format(
        new Date(Date.now() + timezoneOffsetMs),
        DATE_FORMAT
      );
      if (postCreatedDateFormatted !== currentDateFormatted) {
        return ok(false);
      }
      if (challenge.authorId === currentUser?.id) {
        return ok(false);
      }
      if (challenge.authorId !== post.authorId) {
        return ok(false);
      }
      if (!currentUser) {
        return ok(true);
      }
      const userHasEntryTodayResult = hasChallengeEntryToday({
        challengeId: challengeId,
        user: currentUser,
        timezoneOffset: context.timezoneOffset,
      });
      if (userHasEntryTodayResult) {
        return ok(false);
      }
      return ok(true);
    } catch (error) {
      return err(
        new InternalServerErrorException(
          '[checkIfPostIsHiddenOnChallenge] ' + error,
          {
            userId: currentUser?.id,
            challengeId,
            methodName: 'checkIfPostIsHiddenOnChallenge',
          },
          error
        )
      );
    }
  }

  async getCategories({
    challengeOrId,
    context,
  }: {
    challengeOrId: ChallengeEntity | string;
    context: AppContext;
  }): Promise<
    Result<
      PostCategoryEntity[],
      NotFoundException | InternalServerErrorException
    >
  > {
    try {
      const challenge =
        challengeOrId instanceof ChallengeEntity
          ? challengeOrId
          : await this.contextService.getChallengeEntityFromContext({
              id: challengeOrId,
              context,
            });
      if (!challenge) {
        return err(
          new NotFoundException('[getCategories] Challenge not found', {
            challengeId:
              challengeOrId instanceof ChallengeEntity
                ? challengeOrId.id
                : challengeOrId,
            methodName: 'getCategories',
            exceptionCode: NotFoundExceptionCodes.CHALLENGE_NOT_FOUND,
          })
        );
      }
      if (!challenge.categoryIds || challenge.categoryIds.length === 0) {
        return ok([]);
      }
      const categories = await this.postCategoryService.getCategoriesFromIds(
        challenge.categoryIds
      );
      return ok(categories);
    } catch (error) {
      return err(
        new InternalServerErrorException(
          '[getCategories] ' + error,
          {
            challengeOrId,
            methodName: 'getCategories',
          },
          error
        )
      );
    }
  }
}

type JoinedChallengeEntryPredicate = (id: JoinedChallengeEntry) => boolean;

export interface GetChallengesResponse {
  errorMessage?: string;
  challenges?: ChallengeEntity[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalCount: number;
}

export const globalAllChallengesFeedId = getFirstFeedPageId(
  FeedEntityType.GLOBAL_ALL_CHALLENGES,
  ''
);

export const globalActiveChallengesFeedId = getFirstFeedPageId(
  FeedEntityType.GLOBAL_ACTIVE_CHALLENGES,
  ''
);

export const globalPastChallengesFeedId = getFirstFeedPageId(
  FeedEntityType.GLOBAL_PAST_CHALLENGES,
  ''
);

export const globalFeaturedChallengesFeedId = getFirstFeedPageId(
  FeedEntityType.GLOBAL_FEATURED_CHALLENGES,
  ''
);

export const emptyPageInfo = {
  hasNextPage: false,
  hasPreviousPage: false,
  endCursor: '',
  startCursor: '',
  count: 0,
  totalCount: 0,
};
