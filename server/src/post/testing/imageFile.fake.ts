import { faker } from '@faker-js/faker';
import { FileProperties } from '@verdzie/server/post/postProperties';
import { nanoid } from 'nanoid';

export const FilePropertiesFake = (
  overrides: Partial<FileProperties> = {}
): FileProperties => ({
  id: nanoid(16),
  path: faker.system.filePath(),
  type: faker.system.fileExt(),
  ...overrides,
});
