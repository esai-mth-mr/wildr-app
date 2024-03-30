import { FilePropertiesFake } from '@verdzie/server/post/testing/imageFile.fake';
import { contentIOFake } from '../../content/testing/content-io.fake';
import { ImagePostProperties, TextPostProperties } from '../postProperties';
import { faker } from '@faker-js/faker';

export const TextPostPropertiesFake = (
  overrides: Partial<TextPostProperties> = {}
): TextPostProperties => ({
  type: 'TextPostProperties',
  content: contentIOFake(),
  bodyStr: faker.lorem.sentence(),
  negativeConfidenceValue: faker.datatype.number(),
  ...overrides,
});

export const ImagePostPropertiesFake = (
  overrides: Partial<ImagePostProperties> = {}
): ImagePostProperties => ({
  type: 'ImagePostProperties',
  imageFile: FilePropertiesFake(),
  ...overrides,
});
