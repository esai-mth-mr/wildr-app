import {getRequest, postRequest, putRequest} from "@/api/common";

const base = 'post/'

export async function getPost(date, limit, parseUrls) {
    return await getRequest(base + `?date=${date}&limit=${limit}&parseUrls=${parseUrls}`)
}

export async function getUnannotatedPost(date, limit, skip) {
    return await getRequest(base + `unannotated?date=${date}&limit=${limit}&skip=${skip}`)
}

export async function updatePost(id, data) {
    return await putRequest(base, {id, data})
}

export async function addCategoriesToPost(postId, categories) {
    return await postRequest(base + "category", {postId, categories})
}

export async function takeDown(postId) {
    return await putRequest(base + "take-down/" + postId,)
}

export async function respawn(postId) {
    return await putRequest(base + "respawn/" + postId,)
}
export async function sensitive(postId) {
    return await putRequest(base + "sensitive", {postId, status: "NSFW"})
}
export async function un_sensitive(postId) {
    return await putRequest(base + "sensitive", {postId})
}