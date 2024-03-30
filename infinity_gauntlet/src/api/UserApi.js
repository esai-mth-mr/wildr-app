import { getRequest, postRequest, putRequest } from '@/api/common';

const base = 'user/';

export async function getUsers(date, limit) {
  return await getRequest(base + `?date=${date}&limit=${limit}`);
}

export async function getUser(id) {
  return await getRequest(base + id);
}

export async function getUsersByIds(userIds) {
  return await postRequest(base, { userIds });
}

export async function getUserByHandle(handle) {
  return await getRequest(base + `handle/${handle}`);
}

export async function updateUser(id, data) {
  return await putRequest(base, { id, data });
}

export async function suspend(id) {
  return await putRequest(base + `suspend/${id}`);
}

export async function unsuspend(id) {
  return await putRequest(base + `un-suspend/${id}`);
}
export async function takedown(id) {
  return await putRequest(base + `takedown/${id}`);
}
export async function respawn(id) {
  return await putRequest(base + `respawn/${id}`);
}

export async function getRealIdVerifiedFaces(startDate, endDate){
  return getRequest(base+ `real-id/verified?startDate=${startDate}&endDate=${endDate}`)
}
export async function rejectVerifiedRealId(id, reason){
  return await putRequest(base + `real-id/reject-verified`, {id, reason});
}