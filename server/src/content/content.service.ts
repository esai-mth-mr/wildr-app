import { Inject, Injectable } from '@nestjs/common';
import { ValidationError } from 'apollo-server-errors';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Content, ContentInput, ContentSegment } from '../graphql';
import { TagEntity } from '@verdzie/server/tag/tag.entity';
import { TagService, toTagObject } from '@verdzie/server/tag/tag.service';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserService } from '@verdzie/server/user/user.service';
import {
  ContentIO,
  ContentSegmentIO,
} from '@verdzie/server/content/content.io';

@Injectable()
export class ContentService {
  constructor(
    private userService: UserService,
    private tagService: TagService,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger
  ) {
    this.logger = this.logger.child({ context: 'ContentService' });
  }

  toContentSegmentObject(
    segment: ContentSegmentIO,
    userMap: Map<string, UserEntity>,
    tagMap: Map<string, TagEntity>
  ): ContentSegment {
    switch (segment.segment.type) {
      case 'TextSegmentIO':
        return {
          __typename: 'Text',
          chunk: segment.segment.chunk,
          noSpace: segment.segment.noSpace,
          lang: {
            __typename: 'Language',
            code: segment.segment.langCode,
          },
        };
      case 'TagSegmentIO':
        const tag = tagMap.get(segment.segment.id);
        if (!tag) {
          this.logger.warn('TAG is null');
          return { __typename: 'Tag', id: '' };
        }
        return toTagObject(tag, segment.segment.noSpace ?? false, true);
      case 'UserSegmentIO':
        const user = userMap.get(segment.segment.id);
        if (!user) {
          this.logger.warn('User is null');
          return { __typename: 'User', score: 0, id: '' };
        }
        return this.userService.toUserObject({ user });
    }
  }

  toContentObject(
    content: ContentIO,
    users: UserEntity[],
    tags: TagEntity[],
    bodyStr: string
  ): Content {
    const userMap = new Map<string, UserEntity>();
    users.forEach(u => userMap.set(u.id, u));
    const tagMap = new Map<string, TagEntity>();
    tags.forEach(t => tagMap.set(t.id, t));
    return {
      __typename: 'Content',
      body: bodyStr,
      segments: content.segments.map(s =>
        this.toContentSegmentObject(s, userMap, tagMap)
      ),
      // segments: undefined,
    };
  }

  /**
   * Outcome:
   *   - If body is set, return a single segment result for backward compatibility.
   *   - Check if user ID does not exist, return error
   *   - If a tag ID does not exist, return error
   *   - If a tag name does not exist, create it
   *   - Create a corresponding ContentIO with text, user or tag segments.
   * Steps:
   *   - Return early if body is provided
   *   - Create a segment map of position => tag | text | user
   *   - Validate User Ids
   *   - Validate tags ids
   *   - Create tags and add to segment map
   *   - Get a list of segment map elements, sorted by position
   *   - Convert this to ContentIO
   */
  public async getContentIO(
    contentInput: ContentInput,
    bodyStrArrRef?: string[]
  ): Promise<ContentIO> {
    const result: ContentIO = { segments: [] };
    const bodyStrArr: string[] = [];
    if (contentInput.segments?.length === 0 ?? false) return result;
    const segments: Map<number, ContentSegmentIO> = new Map<
      number,
      ContentSegmentIO
    >();
    const userIds = [];
    const tagIds = [];
    const positionAndTagsWithoutIdsMap: Map<
      number,
      {
        name: string;
        id: string;
        noSpace: boolean;
      }
    > = new Map();
    for (const segmentPositionInput of contentInput.segments ?? []) {
      switch (segmentPositionInput.segmentType) {
        case 'TEXT':
          segments.set(segmentPositionInput.position, {
            segment: { type: 'TextSegmentIO', chunk: '', langCode: '' },
          });
          break;
        case 'USER':
          segments.set(segmentPositionInput.position, {
            segment: { type: 'UserSegmentIO', id: '' },
          });
          break;
        case 'TAG':
          segments.set(segmentPositionInput.position, {
            segment: { type: 'TagSegmentIO', id: '' },
          });
      }
    }
    for (const textSegmentInput of contentInput.textSegments ?? []) {
      const mappedSegment = segments.get(textSegmentInput.position)?.segment;
      if (!mappedSegment) throw new ValidationError('Segment not found');
      if (mappedSegment?.type !== 'TextSegmentIO') {
        throw new ValidationError(
          `Invalid input segment, type does not match for text: ${JSON.stringify(
            textSegmentInput
          )} `
        );
      }
      const chunk = textSegmentInput.text.chunk;
      if (bodyStrArr) bodyStrArr[textSegmentInput.position] = chunk;
      mappedSegment.chunk = chunk;
      mappedSegment.noSpace = textSegmentInput.text.noSpace ?? false;
      mappedSegment.langCode = textSegmentInput.text.langCode;
    }
    for (const userSegmentInput of contentInput.userSegments ?? []) {
      const mappedSegment = segments.get(userSegmentInput.position)?.segment;
      if (mappedSegment?.type !== 'UserSegmentIO') {
        throw new ValidationError(
          `Invalid input segment, type does not match for user: ${userSegmentInput} `
        );
      }
      userIds.push(userSegmentInput.userId);
      if (bodyStrArr) {
        const user = await this.userService.findById(userSegmentInput.userId);
        if (user) {
          bodyStrArr[userSegmentInput.position] = '@' + user?.handle;
        } else {
          //What if someone had deleted that user?
          bodyStrArr[userSegmentInput.position] = '@[deleted_user]';
        }
      }
      mappedSegment.id = userSegmentInput.userId;
    }
    const tagNames: Set<string> = new Set();
    for (const tagSegmentInput of contentInput.tagSegments ?? []) {
      const mappedSegment = segments.get(tagSegmentInput.position)?.segment;
      if (mappedSegment?.type !== 'TagSegmentIO') {
        throw new ValidationError(
          `Invalid input segment, type does not match for tag: ${tagSegmentInput} `
        );
      }
      if (tagSegmentInput.tag.id) {
        tagIds.push(tagSegmentInput.tag.id);
        mappedSegment.id = tagSegmentInput.tag.id;
        mappedSegment.noSpace = tagSegmentInput.tag.noSpace;
        if (bodyStrArr) {
          const tags = await this.tagService.findAllById([
            tagSegmentInput.tag.id,
          ]);
          if (tags.length > 0) {
            bodyStrArr[tagSegmentInput.position] = '#' + tags[0].name;
          } else {
            this.logger.warn('Tags is empty');
          }
        }
      } else if (tagSegmentInput.tag.name) {
        if (bodyStrArr) {
          bodyStrArr[tagSegmentInput.position] = '#' + tagSegmentInput.tag.name;
        }
        positionAndTagsWithoutIdsMap.set(tagSegmentInput.position, {
          id: 'UNKNOWN',
          name: tagSegmentInput.tag.name,
          noSpace: tagSegmentInput.tag.noSpace ?? false,
        });
        tagNames.add(tagSegmentInput.tag.name);
      } else {
        throw new ValidationError(
          'Invalid tag segment, no id or tag name provided'
        );
      }
    }
    if (userIds.length > 0) {
      const found = await this.userService.filter(userIds);
      const missing = userIds.filter(id => !found.includes(id));
      if (missing.length > 0) {
        throw new ValidationError(`Invalid input, unknown userIds: ${missing}`);
      }
    }
    if (tagIds.length > 0) {
      const found = await this.tagService.filter(tagIds);
      const missing = tagIds.filter(id => !found.includes(id));
      if (missing.length > 0) {
        throw new ValidationError(`Invalid input, unknown tagIds: ${missing}`);
      }
    }
    const newTags = await this.tagService.findOrCreateAll([...tagNames]);
    positionAndTagsWithoutIdsMap.forEach((value, key) => {
      const name = value.name;
      const tag = newTags.find(tag => tag.name == name);
      if (!tag) {
        throw new ValidationError("Couldn't find tag even in the newTags()");
      }
      value.id = tag.id;
      const seg = segments.get(key);
      if (seg)
        seg.segment = {
          type: 'TagSegmentIO',
          ...value,
        };
    });
    for (const [position, segment] of segments) {
      result.segments[position] = segment;
    }
    result.bodyStr = bodyStrArr?.join('');
    bodyStrArrRef?.push(...bodyStrArr); //TODO: Test this
    return result;
  }

  public async resolve(content: ContentIO, bodyStr = ''): Promise<Content> {
    const usersFetch: Promise<UserEntity[]> = this.userService.findAllById(
      content.segments
        .map(s => (s.segment.type === 'UserSegmentIO' ? s.segment : undefined))
        .filter(u => u !== undefined)
        .map(u => u?.id ?? '')
    );
    const tagsFetch: Promise<TagEntity[]> = this.tagService.findAllById(
      content.segments
        .map(s => (s.segment.type === 'TagSegmentIO' ? s.segment : undefined))
        .filter(t => t !== undefined)
        .map(t => {
          return t?.id ?? '';
        })
    );
    const [users, tags] = await Promise.all([usersFetch, tagsFetch]);
    return this.toContentObject(content, users, tags, bodyStr);
  }
}
