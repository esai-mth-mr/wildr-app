import { Inject, UseFilters, UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '@verdzie/server/auth/current-user';
import {
  JwtAuthGuard,
  OptionalJwtAuthGuard,
} from '@verdzie/server/auth/jwt-auth.guard';
import { somethingWentWrongSmartError } from '@verdzie/server/common';
import { SmartExceptionFilter } from '@verdzie/server/common/smart-exception.filter';
import {
  GetCategoriesOutput,
  GetCategoriesWithTypesOutput,
} from '@verdzie/server/generated-graphql';
import { WildrSpan } from '@verdzie/server/opentelemetry/openTelemetry.decorators';
import { toPostCategoryTypeLabel } from '@verdzie/server/post-category/postCategory.entity';
import { PostCategoryService } from '@verdzie/server/post-category/postCategory.service';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Resolver('PostCategory')
export class PostCategoryResolver {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger,
    private readonly service: PostCategoryService
  ) {
    this.logger = this.logger.child({ context: PostCategoryResolver.name });
  }

  @Query()
  @UseGuards(OptionalJwtAuthGuard)
  @UseFilters(new SmartExceptionFilter())
  @WildrSpan()
  async getCategoriesWithTypes(): Promise<GetCategoriesWithTypesOutput> {
    const orderedCategories = await this.service.getOrderedPostCategories();
    if (orderedCategories.isErr()) {
      this.logger.error(
        'error getting ordered categories',
        orderedCategories.error
      );
      return somethingWentWrongSmartError;
    }
    const categoryTypeWithCategories = orderedCategories.value.map(
      categoryGroup => {
        const typeName = toPostCategoryTypeLabel(categoryGroup.parent);
        return {
          name: typeName,
          categories: categoryGroup.subCategories.map(category => {
            return {
              id: category.id,
              type: typeName,
              value: category.name,
            };
          }),
        };
      }
    );
    return {
      __typename: 'GetCategoriesWithTypesResult',
      categories: categoryTypeWithCategories,
    };
  }

  /**
   * For onboarding. Requires logged-in user
   */
  @Query()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new SmartExceptionFilter())
  @WildrSpan()
  async getCategories(
    @CurrentUser() currentUser: UserEntity
  ): Promise<GetCategoriesOutput> {
    try {
      const { userCategoryInterests, categories } =
        await this.service.getCategoriesForInterests({
          currentUser,
        });
      return {
        __typename: 'GetCategoriesResult',
        categories: categories.map(category => {
          return {
            __typename: 'PostCategory',
            id: category.id,
            value: category.name,
            type: toPostCategoryTypeLabel(category.type),
          };
        }),
        userCategoryInterests,
      };
    } catch (error) {
      this.logger.error('error getting categories', error);
      return {
        __typename: 'SmartError',
        message: 'Something went wrong',
      };
    }
  }
}
