import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { FeedService, toFeedId } from '@verdzie/server/feed/feed.service';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { UserEntity } from '@verdzie/server/user/user.entity';
import axios, { AxiosBasicCredentials, AxiosRequestConfig } from 'axios';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ESearchType, ESInput, ESItem, Post } from '../generated-graphql';
import { PostService } from '../post/post.service';
import { TagService, toTagObject } from '../tag/tag.service';
import { UserService } from '../user/user.service';
import { PostVisibilityAccess } from '@verdzie/server/post/postAccessControl';
import https from 'https';
import { AppContext, setupParentPostsForReposts } from '@verdzie/server/common';
import { FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { In, Not } from 'typeorm';

const k_ES_USER_INDEX = 'users';
const k_ES_POST_CONTENT_INDEX = 'post_content';
const k_POST_CONTENT_CONTENT = 'content';
const k_ES_HASHTAGS_INDEX = 'hashtags';

@Injectable()
export class OpenSearchService {
  private readonly esMaster: string = '';
  private readonly esPassword: string = '';
  private readonly esEndpoint: string = '';
  private readonly openSearchShowEmptySearchResults: string;

  constructor(
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    @Inject(forwardRef(() => TagService))
    private tagService: TagService,
    @Inject(forwardRef(() => PostService))
    private postService: PostService,
    @Inject(forwardRef(() => FeedService))
    private feedService: FeedService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({ context: 'OpenSearchService' });
    if (!process.env.ES_MASTER || process.env.ES_MASTER === '') {
      throw Error('Specify the ES_MASTER environment variable');
    }
    if (!process.env.ES_PASSWORD || process.env.ES_PASSWORD === '') {
      throw Error('Specify the ES_PASSWORD environment variable');
    }
    if (!process.env.ES_ENDPOINT || process.env.ES_ENDPOINT === '') {
      throw Error('Specify the ES_ENDPOINT environment variable');
    }
    if (
      !process.env.OPEN_SEARCH_SHOW_EMPTY_SEARCH_RESULTS ||
      process.env.OPEN_SEARCH_SHOW_EMPTY_SEARCH_RESULTS === ''
    ) {
      throw Error(
        'Specify the OPEN_SEARCH_SHOW_EMPTY_SEARCH_RESULTS environment variable'
      );
    }
    this.openSearchShowEmptySearchResults =
      process.env.OPEN_SEARCH_SHOW_EMPTY_SEARCH_RESULTS!;
    if (
      !process.env.OPEN_SEARCH_CATEGORY_FILTER ||
      process.env.OPEN_SEARCH_CATEGORY_FILTER === ''
    ) {
      throw Error(
        'Specify the OPEN_SEARCH_CATEGORY_FILTER environment variable'
      );
    }

    this.esMaster = process.env.ES_MASTER.toString();
    this.esPassword = process.env.ES_PASSWORD.toString();
    this.esEndpoint = process.env.ES_ENDPOINT.toString();
  }

  getEmptyQuery(type: ESearchType): object {
    if (type === ESearchType.POST) {
      return {
        size: 24,
        query: {
          match: {
            categories: process.env.OPEN_SEARCH_CATEGORY_FILTER,
          },
        },
        sort: {
          updated_at: {
            order: 'desc',
          },
        },
      };
    }
    return {
      size: 24,
      query: {
        match_all: {},
      },
      sort: {
        updated_at: {
          order: 'desc',
        },
      },
    };
  }

  ///SEARCH
  async search(
    input: ESInput,
    ctx: AppContext,
    currentUser?: UserEntity
  ): Promise<ESItem[] | string> {
    const query = input.query!;
    const type = input.type;
    if (this.openSearchShowEmptySearchResults !== 'true' && query.length == 0) {
      switch (type) {
        case ESearchType.POST:
          return 'Please start typing to search for posts';
        case ESearchType.USER:
          return 'Please start typing to search for users';
        case ESearchType.HASHTAGS:
          return 'Please start typing to search for tags';
      }
    }
    this.print(`Searching Query -> ${query} ;  Type ${type}`);
    let index: string;
    let data: string;
    if (query.length == 0) data = JSON.stringify(this.getEmptyQuery(type!));
    else data = this.getSearchQuery(input);
    switch (type) {
      case ESearchType.POST:
        index = k_ES_POST_CONTENT_INDEX + '/';
        break;
      case ESearchType.USER:
        index = k_ES_USER_INDEX + '/';
        break;
      case ESearchType.HASHTAGS:
        index = k_ES_HASHTAGS_INDEX + '/';
        break;
      default:
        index =
          k_ES_USER_INDEX +
          ',' +
          k_ES_HASHTAGS_INDEX +
          ',' +
          k_ES_POST_CONTENT_INDEX +
          '/';
        break;
    }
    const url = this.esEndpoint + '/' + index + '_search';
    this.print('search getSearchQuery', { query: data, url: url });
    const basicCred: AxiosBasicCredentials = {
      username: this.esMaster,
      password: this.esPassword,
    };
    const config: AxiosRequestConfig = {
      url,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      data: data,
      auth: basicCred,
      ...(process.env.DANGEROUSLY_DISABLE_SSL_VERIFICATION === 'true' && {
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      }),
    };

    try {
      const result = await axios.request(config);
      this.print('search result status', {
        status: result.status,
        text: result.statusText,
        data: result.data ?? '<no data>',
      });
      if (result.status === 200) {
        try {
          const jsonRes = JSON.stringify(result.data);
          const jsonData = JSON.parse(jsonRes);
          const hits = jsonData.hits;
          if (hits) {
            const total = hits.total.value;
            const items: ESItem[] = [];
            if (typeof total === 'number') {
              if (total === 0) {
                return 'No results found';
              } else {
                const hitsArray = hits.hits;
                if (type === ESearchType.POST) {
                  const postIds: string[] = [];
                  for (const element of hitsArray) postIds.push(element._id);
                  let resultPosts = await this.postService.findAllNonExpired(
                    postIds,
                    []
                  );
                  resultPosts = resultPosts.filter(post => post !== undefined);
                  if (resultPosts && resultPosts.length > 0) {
                    resultPosts = await this.filterPrivatePosts(
                      resultPosts,
                      currentUser
                    );
                    resultPosts =
                      await this.filterPostsByBlockedUsersOnEitherSide(
                        resultPosts,
                        currentUser
                      );
                    await setupParentPostsForReposts(
                      resultPosts,
                      ctx,
                      this.postService,
                      this.logger
                    );
                    for (const post of resultPosts) {
                      const postObj: Post | undefined =
                        this.postService.toGqlPostObject(post);
                      if (postObj) items.push(postObj);
                    }
                  }
                } else if (type === ESearchType.USER) {
                  const userIds: string[] = [];
                  for (const element of hitsArray) {
                    userIds.push(element._id);
                  }
                  let userIdsToSkip: string[] = [];
                  if (currentUser) {
                    const blockedByUsersList = await this.feedService.find(
                      toFeedId(
                        FeedEntityType.BLOCKED_BY_USERS_LIST,
                        currentUser.id
                      )
                    );
                    if (
                      blockedByUsersList &&
                      blockedByUsersList.ids.length > 0
                    ) {
                      userIdsToSkip = blockedByUsersList.ids;
                    }
                  }
                  const resultUsers = await this.userService.findAllById(
                    userIds,
                    {
                      where: {
                        id: Not(In(userIdsToSkip)),
                      },
                    }
                  );
                  for (const user of resultUsers) {
                    if (user === undefined) continue;
                    if (!user.isAlive()) continue;
                    const gqlUserObj = await this.userService.toUserObject({
                      user,
                    });
                    items.push(gqlUserObj);
                  }
                } else {
                  let userIdsToSkip: string[] = [];
                  if (currentUser) {
                    const blockedByUsersList = await this.feedService.find(
                      toFeedId(
                        FeedEntityType.BLOCKED_BY_USERS_LIST,
                        currentUser.id
                      )
                    );
                    if (
                      blockedByUsersList &&
                      blockedByUsersList.ids.length > 0
                    ) {
                      userIdsToSkip = blockedByUsersList.ids;
                    }
                  }
                  for (const element of hitsArray) {
                    const id = element._id;
                    if (element._index === k_ES_USER_INDEX) {
                      if (userIdsToSkip.includes(id)) continue;
                      const user = await this.userService.findById(id);
                      if (user) {
                        if (!user.isAlive()) {
                          this.logger.info('User TAKEN_DOWN', { id: user.id });
                          continue;
                        }
                        items.push(
                          await this.userService.toUserObject({ user })
                        );
                      }
                    } else if (element._index === k_ES_POST_CONTENT_INDEX) {
                      let posts = await this.postService.findAllNonExpired(
                        [id],
                        []
                      );

                      posts = posts.filter(function (post) {
                        if (post === undefined) return false;
                        return !userIdsToSkip.includes(post.authorId);
                      });
                      await setupParentPostsForReposts(
                        posts,
                        ctx,
                        this.postService,
                        this.logger
                      );
                      if (posts && posts.length > 0) {
                        posts = await this.filterPrivatePosts(
                          posts,
                          currentUser
                        );
                        await setupParentPostsForReposts(
                          posts,
                          ctx,
                          this.postService,
                          this.logger
                        );
                        const postObj: Post | undefined =
                          this.postService.toGqlPostObject(posts[0]);
                        if (postObj) {
                          items.push(postObj);
                        }
                      } else {
                        this.print('No post found with this ID', { id: id });
                      }
                    } else {
                      const tags = await this.tagService.findAllById([id]);
                      if (tags.length > 0) {
                        const tagObj = tags[0];
                        items.push(toTagObject(tagObj));
                      }
                    }
                  }
                }
                return items;
              }
            } else {
              this.print('"hits.total" is empty or null');
              return 'No results found';
            }
          } else {
            this.print('"Hits" is empty or null');
          }
        } catch (error) {
          this.print(`JSON parsing error ${error}`);
        }
      }
      return 'Something went wrong';
    } catch (error) {
      this.print(`[ERROR] ${error}`);
      // if (error.response) {
      //   this.print(error.response.data);
      // }
      return 'Something went wrong';
    }
  }

  private async filterPrivatePosts(
    posts: PostEntity[],
    currentUser?: UserEntity
  ): Promise<PostEntity[]> {
    const currentUserFollowingFeed = await this.feedService.find(
      currentUser?.followingFeedId ?? ''
    );
    const filteredPosts: PostEntity[] = [];
    const privatePostIndices: number[] = [];
    for (const postIndex in posts) {
      const post = posts[postIndex];
      if (
        post.accessControl?.postVisibilityAccessData.access ===
        PostVisibilityAccess.INNER_CIRCLE
      ) {
        this.logger.info('Ignoring inner circle post form search results', {});
        continue;
      }
      if (post.isPrivate && post.authorId !== (currentUser?.id ?? '')) {
        this.logger.info('Pushing in privatePostIndices', {
          postIndex,
          id: post.id,
        });
        privatePostIndices.push(Number(postIndex));
        continue;
      }
      //Pushing public posts
      filteredPosts.push(post);
    }
    if (currentUserFollowingFeed) {
      const availablePrivatePosts: PostEntity[] = privatePostIndices
        .filter(index =>
          //Checking whether currentUser is following the author of the post
          currentUserFollowingFeed!.page.ids.includes(posts[index].authorId)
        )
        .map(index => posts[index]);
      filteredPosts.concat(availablePrivatePosts);
    }
    return filteredPosts;
  }

  private async filterPostsByBlockedUsersOnEitherSide(
    posts: PostEntity[],
    currentUser?: UserEntity
  ): Promise<PostEntity[]> {
    if (!currentUser) return posts;
    const userList: string[] =
      await this.userService.userIdsOfBlockedUsersOnEitherSide(currentUser);
    posts = posts.filter(post => !userList.includes(post.authorId));
    return posts;
  }

  private getSearchQuery(
    input: ESInput,
    includeHighlightedFields = false
  ): string {
    let result = `
    {
      "from": ${input.from ?? 0},
      "size": 24,
      "query": {
        "multi_match": {
          "query": "${input.query}",
          "type": "bool_prefix"
        }
      },
      "sort": {
        "updated_at": {
            "order": "desc"
        }
      }
    }
    `;
    if (includeHighlightedFields) {
      let fields = '';
      if (input.type === ESearchType.ALL || input.type === ESearchType.POST) {
        fields = `"${k_POST_CONTENT_CONTENT}": {}`;
      }
      result += `, "highlight": { "fields": { ${fields} } } `;
    }
    return result;
  }

  /// Delete
  async deletePost(id: string): Promise<boolean> {
    return await this.deleteItem(k_ES_POST_CONTENT_INDEX, id);
  }

  private async deleteItem(index: string, id: string): Promise<boolean> {
    const url = this.esEndpoint + '/' + index + '/' + '_doc' + '/' + id;
    const basicCred: AxiosBasicCredentials = {
      username: this.esMaster,
      password: this.esPassword,
    };
    const config: AxiosRequestConfig = {
      url,
      method: 'DELETE',
      auth: basicCred,
      ...(process.env.DANGEROUSLY_DISABLE_SSL_VERIFICATION === 'true' && {
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      }),
    };
    try {
      const result = await axios.request(config);
      this.print('search result status', {
        status: result.status,
        text: result.statusText,
        data: result.data ?? '<no data>',
      });
      if (result.status === 200) {
        return true;
      } else {
        this.print('[Error] Failed to delete an item from OpenSearch');
        this.logger.error(result);
      }
    } catch (err) {
      this.logger.error(err);
    }
    return false;
  }

  /// Misc.
  private print(content: string, props: any = {}) {
    this.logger.debug(content, { ...props });
  }
}
