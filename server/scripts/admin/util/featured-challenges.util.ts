import { adminClient } from './admin-client';

export async function addToFeatured(id: string) {
  const { data } = await adminClient.put(`/challenge/${id}/add-to-featured`);
  console.log(data);
}

export async function removeFromFeatured(id: string) {
  const { data } = await adminClient.put(
    `/challenge/${id}/remove-from-featured`
  );
  console.log(data);
}
