import {getRequest} from "@/api/common";

const base = 'feed/'

export async function getUserFeed(id) {
    return await getRequest(base + `user/${id}`)
}