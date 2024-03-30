import { PostEntity } from '@verdzie/server/post/post.entity';
import { UserEntity } from '@verdzie/server/user/user.entity';

export class PostSearchResponsePost {
  id: string;
  authorHandle: string;
  captionText: string;
  thumbnailPath?: string;

  constructor({ post, author }: { post: PostEntity; author: UserEntity }) {
    this.id = post.id;
    this.authorHandle = author.handle;
    this.captionText = post.captionBodyStr;
    this.thumbnailPath = post.thumbnailFile?.path;
  }
}

export class PostSearchResponseDTO {
  posts: PostSearchResponsePost[];

  constructor(posts: PostSearchResponsePost[]) {
    this.posts = posts;
  }
}
