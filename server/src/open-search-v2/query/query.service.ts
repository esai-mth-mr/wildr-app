import { Inject, Injectable } from '@nestjs/common';
import { PaginationInput } from '@verdzie/server/generated-graphql';
import {
  IndexVersion,
  IndexVersionName,
  IndexVersionService,
} from '@verdzie/server/open-search-v2/index-version/index-version.service';
import { OpenSearchClient } from '@verdzie/server/open-search-v2/open-search.client';
import { Logger } from 'winston';
import { SSMParamsService } from '@verdzie/server/ssm-params/ssm-params.service';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { DEFAULT_INDEX_VERSION_ALIAS } from '@verdzie/server/open-search-v2/index-state/index-state.service';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@verdzie/server/exceptions/wildr.exception';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { UserEntity } from '@verdzie/server/user/user.entity';

export const DEFAULT_PAGE_SIZE = 20;

@Injectable()
export class OSQueryService {
  private readonly postIndexVersionName: IndexVersionName;
  private readonly postEmptyQueryIndexVersionName: IndexVersionName | undefined;
  private readonly userIndexVersionName: IndexVersionName;
  private readonly userEmptyQueryIndexVersionName: IndexVersionName | undefined;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly openSearchClient: OpenSearchClient,
    private readonly indexVersionService: IndexVersionService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
    this.searchUsersAndReturnIds;
    this.userIndexVersionName =
      (SSMParamsService.Instance.openSearchParams
        .OPEN_SEARCH_USER_QUERY_INDEX as IndexVersionName) ??
      ('user_search_v1' as IndexVersionName);
    this.userEmptyQueryIndexVersionName = SSMParamsService.Instance
      .openSearchParams.OPEN_SEARCH_EMPTY_USER_QUERY_INDEX as IndexVersionName;
    this.postIndexVersionName =
      (SSMParamsService.Instance.openSearchParams
        .OPEN_SEARCH_POST_QUERY_INDEX as IndexVersionName) ??
      ('post_search_v1' as IndexVersionName);
    this.postEmptyQueryIndexVersionName = SSMParamsService.Instance
      .openSearchParams.OPEN_SEARCH_EMPTY_POST_QUERY_INDEX as IndexVersionName;
  }

  private async searchAndReturnIds({
    queryString,
    indexVersion,
    paginationInput,
  }: {
    queryString: string;
    indexVersion: IndexVersion<any, any>;
    paginationInput: PaginationInput;
  }): Promise<string[]> {
    const logContext = {
      queryString,
      paginationInput,
      indexVersionName: indexVersion.name,
      methodName: OSQueryService.prototype.searchAndReturnIds.name,
    };
    const result = await this.openSearchClient.client
      .post(`/${indexVersion.name}_${DEFAULT_INDEX_VERSION_ALIAS}/_search`, {
        from: 0,
        size: SSMParamsService.Instance.openSearchParams.OPEN_SEARCH_QUERY_SIZE,
        query: indexVersion.getQuery(queryString),
        ...(indexVersion.getSort && {
          sort: indexVersion.getSort(queryString),
        }),
      })
      .catch(error => {
        if (error.response?.data?.status === 404) {
          this.logger.error('no results found', {
            ...logContext,
          });
          throw new NotFoundException('no results found', logContext);
        }
        this.logger.error('error searching for ids', {
          ...logContext,
        });
        throw error;
      });
    const ids: string[] =
      result.data?.hits?.hits?.map((hit: { _id: string }) => hit._id) ?? [];
    if (paginationInput.after || paginationInput.includingAndAfter) {
      let start = 0;
      if (paginationInput.after) {
        start = Math.max(
          ids.findIndex((id: string) => id === paginationInput.after) + 1,
          0
        );
      } else if (paginationInput.includingAndAfter) {
        start = Math.max(
          ids.findIndex(
            (id: string) => id === paginationInput.includingAndAfter
          ),
          0
        );
      }
      return ids.slice(
        start,
        start + (paginationInput.take ?? DEFAULT_PAGE_SIZE)
      );
    }

    if (paginationInput.before || paginationInput.includingAndBefore) {
      let end = 10;
      if (paginationInput.before) {
        end = Math.max(
          ids.findIndex((id: string) => id === paginationInput.before),
          paginationInput.take ?? DEFAULT_PAGE_SIZE
        );
      } else if (paginationInput.includingAndBefore) {
        end = Math.max(
          ids.findIndex(
            (id: string) => id === paginationInput.includingAndBefore
          ) + 1,
          paginationInput.take ?? DEFAULT_PAGE_SIZE
        );
      }
      return ids.slice(
        Math.max(end - (paginationInput.take ?? DEFAULT_PAGE_SIZE), 0),
        end
      );
    }

    return ids.slice(0, paginationInput.take ?? DEFAULT_PAGE_SIZE);
  }

  private getPostSearchIndexVersionName(queryString: string): IndexVersionName {
    return queryString
      ? this.postIndexVersionName
      : this.postEmptyQueryIndexVersionName ?? this.postIndexVersionName;
  }

  async searchPostsAndReturnIds({
    queryString,
    paginationInput,
  }: {
    queryString: string;
    paginationInput: PaginationInput;
  }): Promise<string[]> {
    const indexVersionName = this.getPostSearchIndexVersionName(queryString);
    const indexVersions = this.indexVersionService.findIndexVersions(
      PostEntity,
      [indexVersionName]
    );
    if (!indexVersions.length)
      throw new InternalServerErrorException(
        'No index version found for post search',
        {
          indexVersionName,
        }
      );
    return this.searchAndReturnIds({
      queryString,
      indexVersion: indexVersions[0],
      paginationInput,
    });
  }

  private getUserSearchIndexVersionName(queryString: string): IndexVersionName {
    return queryString
      ? this.userIndexVersionName
      : this.userEmptyQueryIndexVersionName ?? this.userIndexVersionName;
  }

  async searchUsersAndReturnIds({
    queryString,
    paginationInput,
  }: {
    queryString: string;
    paginationInput: PaginationInput;
  }): Promise<string[]> {
    const indexVersionName = this.getUserSearchIndexVersionName(queryString);
    const indexVersions = this.indexVersionService.findIndexVersions(
      UserEntity,
      [indexVersionName]
    );
    if (!indexVersions.length)
      throw new InternalServerErrorException(
        'No index version found for user search',
        {
          indexVersionName,
        }
      );
    return this.searchAndReturnIds({
      queryString,
      indexVersion: indexVersions[0],
      paginationInput,
    });
  }
}
