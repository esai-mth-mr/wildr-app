import {
  PostCategoryLabel,
  PostCategoryType,
  toPostCategoryType,
} from '@verdzie/server/post-category/postCategory.entity';
import { adminClient } from './admin-client';

export async function getAllCategories() {
  const result = await adminClient.get('/category');
  return result.data;
}

export async function createCategory({
  name,
  label,
}: {
  name: string;
  label: PostCategoryLabel;
}) {
  const response = await adminClient.post('/category', {
    name,
    type: toPostCategoryType(label),
    createdAt: new Date(),
  });
  return response.data;
}

export async function updateCategory({
  id,
  name,
  type,
}: {
  id: string;
  name?: string;
  type?: PostCategoryType;
}) {
  const response = await adminClient.put(`/category/${id}`, {
    name,
    type,
  });
  return response.data;
}
