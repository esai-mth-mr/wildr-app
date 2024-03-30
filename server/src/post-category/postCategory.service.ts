import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import {
  PostCategoryEntity,
  PostCategoryType,
} from '@verdzie/server/post-category/postCategory.entity';
import { generateId } from '@verdzie/server/common/generateId';
import { UserService } from '@verdzie/server/user/user.service';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { Result, err, fromPromise, ok } from 'neverthrow';
import { PostgresQueryFailedException } from '@verdzie/server/typeorm/postgres-exceptions';

@Injectable()
export class PostCategoryService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(PostCategoryEntity)
    public repo: Repository<PostCategoryEntity>,
    private readonly userService: UserService
  ) {
    this.logger = this.logger.child({ context: 'PostCategoryService' });
  }

  async createCategory({
    name,
    type,
  }: {
    name: string;
    type?: PostCategoryType;
  }): Promise<PostCategoryEntity> {
    this.logger.info('createCategory', { name });
    const existingCategory = await this.repo.findOne({
      where: `"name" ILIKE '${name}'`,
    });
    if (existingCategory) {
      this.logger.info('existingCategory found with ', { name });
      return existingCategory;
    }
    const category = new PostCategoryEntity();
    category.id = generateId();
    category.createdAt = new Date();
    category.name = name;
    if (type) category.type = type;
    return await this.repo.save(category);
  }

  async getCategoriesFromIds(ids: string[]): Promise<PostCategoryEntity[]> {
    return await this.repo.findByIds(ids);
  }

  async getAllCategories() {
    return await this.repo.find();
  }

  /**
   * @deprecated Use getCategoriesForInterests instead
   */
  async getOnboardingCategories({
    currentUser,
  }: {
    currentUser: UserEntity;
  }): Promise<{
    categories: PostCategoryEntity[];
    userCategoryInterests: string[];
  }> {
    const [userCategoryInterests, categories] = await Promise.all([
      this.userService.getCategoryInterestIds(currentUser.id),
      this.getAllCategories(),
    ]);
    const filteredCategories: PostCategoryEntity[] = [];
    for (const category of categories) {
      // Include deprecated categories if the user has already selected them
      // or UI will break
      if (!category.deprecated || userCategoryInterests.includes(category.id)) {
        filteredCategories.push(category);
      }
    }
    return {
      categories: filteredCategories,
      userCategoryInterests: userCategoryInterests,
    };
  }

  async getCategoriesWithParentTypes(): Promise<
    Map<PostCategoryType, PostCategoryEntity[]>
  > {
    const categoryEntities = await this.repo.find({
      where: [
        {
          _type: Not(IsNull()),
          deprecated: false,
        },
        {
          _type: Not(IsNull()),
          deprecated: IsNull(),
        },
      ],
    });
    const categoryTypeToEntitiesMap: Map<
      PostCategoryType,
      PostCategoryEntity[]
    > = new Map();
    categoryEntities.forEach(category => {
      const subCategories: PostCategoryEntity[] =
        categoryTypeToEntitiesMap.get(category.type) ?? [];
      subCategories.push(category);
      categoryTypeToEntitiesMap.set(category.type, subCategories);
    });
    return categoryTypeToEntitiesMap;
  }

  async getOrderedPostCategories(): Promise<
    Result<
      {
        parent: PostCategoryType;
        subCategories: PostCategoryEntity[];
      }[],
      PostgresQueryFailedException
    >
  > {
    const logTags = {
      context: 'getOrderedPostCategories',
    };
    const categoryEntities = await fromPromise(
      this.repo.find({
        where: [
          {
            _type: Not(IsNull()),
            deprecated: false,
          },
          {
            _type: Not(IsNull()),
            deprecated: IsNull(),
          },
        ],
      }),
      error => new PostgresQueryFailedException({ error, ...logTags })
    );
    if (categoryEntities.isErr()) {
      this.logger.error('error getting categories', categoryEntities.error);
      return err(categoryEntities.error);
    }
    return ok(
      orderedPostCategoryTypes.map(type => {
        const subCategories = categoryEntities.value.filter(
          c => c.type === type
        );
        return {
          parent: type,
          subCategories,
        };
      })
    );
  }

  async getCategoriesForInterests({
    currentUser,
  }: {
    currentUser: UserEntity;
  }): Promise<{
    categories: PostCategoryEntity[];
    userCategoryInterests: string[];
  }> {
    const [userCategoryInterests, postCategories] = await Promise.all([
      this.userService.getCategoryInterestIds(currentUser.id),
      this.repo.find(),
    ]);
    const liveCategories = postCategories.filter(c => !c.deprecated);
    const liveCategoryInterests = userCategoryInterests.filter(interest =>
      liveCategories.map(c => c.id).includes(interest)
    );
    const categoriesOrderedByType = liveCategories.sort(
      (a, b) =>
        orderedPostCategoryTypes.indexOf(a.type) -
        orderedPostCategoryTypes.indexOf(b.type)
    );
    return {
      categories: categoriesOrderedByType,
      userCategoryInterests: liveCategoryInterests,
    };
  }
}

const orderedPostCategoryTypes: PostCategoryType[] = [
  PostCategoryType.FINANCE_INCOME,
  PostCategoryType.HEALTH_WELLNESS,
  PostCategoryType.ART_ENTERTAINMENT,
  PostCategoryType.EDUCATION_LEARNING,
  PostCategoryType.LIFESTYLE_PERSONAL,
  PostCategoryType.LEISURE_HOBBIES,
  PostCategoryType.MISC,
];
