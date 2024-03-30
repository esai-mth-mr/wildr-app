import { ContentIO } from '../content/content.io';

export interface FileProperties {
  id: string;
  path: string;
  type: string;
}

type MultiPostProperties =
  | UnknownPostProperties
  | TextPostProperties
  | ImagePostProperties
  | VideoPostProperties;

export interface UnknownPostProperties {
  type: 'UnknownPostProperties';
}

export function isTextPostProperties(
  props: MultiPostProperties
): props is TextPostProperties {
  return props.type === 'TextPostProperties';
}

export interface TextPostProperties {
  type: 'TextPostProperties';
  content: ContentIO;
  bodyStr?: string;
  negativeConfidenceValue?: number;
}

export function isImagePostProperties(
  props: MultiPostProperties
): props is ImagePostProperties {
  return props.type === 'ImagePostProperties';
}

export interface ImagePostProperties {
  type: 'ImagePostProperties';
  caption?: ContentIO;
  imageFile: FileProperties;
  thumbnailFile?: FileProperties;
  captionBodyStr?: string;
}

export function isVideoPostProperties(
  props: MultiPostProperties
): props is VideoPostProperties {
  return props.type === 'VideoPostProperties';
}

export interface VideoPostProperties {
  type: 'VideoPostProperties';
  caption?: ContentIO;
  videoFile: FileProperties;
  thumbnailFile?: FileProperties;
  captionBodyStr?: string;
}
