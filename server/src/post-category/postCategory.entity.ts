export class PostCategoryEntity {
  id: string;
  name: string;
  createdAt: Date;
  _type?: number;
  deprecated?: boolean;

  set type(type: PostCategoryType) {
    this._type = type;
  }

  get type(): PostCategoryType {
    return this._type ?? PostCategoryType.MISC;
  }
}

export enum PostCategoryType {
  MISC = 0,
  LIFESTYLE_PERSONAL = 1,
  HEALTH_WELLNESS = 2,
  EDUCATION_LEARNING = 3,
  ART_ENTERTAINMENT = 4,
  FINANCE_INCOME = 5,
  LEISURE_HOBBIES = 6,
}

const PostCategoryTypeLabels: Record<PostCategoryType, PostCategoryLabel> = {
  [PostCategoryType.MISC]: 'Miscellaneous',
  [PostCategoryType.LIFESTYLE_PERSONAL]: 'Lifestyle & Personal',
  [PostCategoryType.HEALTH_WELLNESS]: 'Health & Wellness',
  [PostCategoryType.EDUCATION_LEARNING]: 'Education & Learning',
  [PostCategoryType.ART_ENTERTAINMENT]: 'Art & Entertainment',
  [PostCategoryType.FINANCE_INCOME]: 'Finance & Income',
  [PostCategoryType.LEISURE_HOBBIES]: 'Leisure & Hobbies',
};

const PostCategoryLabelTypes: Record<PostCategoryLabel, PostCategoryType> = {
  Miscellaneous: PostCategoryType.MISC,
  'Lifestyle & Personal': PostCategoryType.LIFESTYLE_PERSONAL,
  'Health & Wellness': PostCategoryType.HEALTH_WELLNESS,
  'Education & Learning': PostCategoryType.EDUCATION_LEARNING,
  'Art & Entertainment': PostCategoryType.ART_ENTERTAINMENT,
  'Finance & Income': PostCategoryType.FINANCE_INCOME,
  'Leisure & Hobbies': PostCategoryType.LEISURE_HOBBIES,
};

export type PostCategoryLabel =
  | 'Lifestyle & Personal'
  | 'Health & Wellness'
  | 'Education & Learning'
  | 'Art & Entertainment'
  | 'Finance & Income'
  | 'Leisure & Hobbies'
  | 'Miscellaneous';

export const toPostCategoryTypeLabel = (
  type?: PostCategoryType
): PostCategoryLabel => {
  return type ? PostCategoryTypeLabels[type] : 'Miscellaneous';
};

export const toPostCategoryType = (
  label?: PostCategoryLabel
): PostCategoryType => {
  return label ? PostCategoryLabelTypes[label] : PostCategoryType.MISC;
};
