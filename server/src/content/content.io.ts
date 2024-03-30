export interface TagSegmentIO {
  type: 'TagSegmentIO';
  id: string;
  noSpace?: boolean;
}
export interface UserSegmentIO {
  type: 'UserSegmentIO';
  id: string;
}
export interface TextSegmentIO {
  type: 'TextSegmentIO';
  chunk: string;
  noSpace?: boolean;
  langCode: string;
}
export interface ContentSegmentIO {
  segment: TextSegmentIO | TagSegmentIO | UserSegmentIO;
}
export interface ContentIO {
  bodyStr?: string;
  segments: ContentSegmentIO[];
}
