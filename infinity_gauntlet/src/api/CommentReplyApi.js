import {getRequest} from "@/api/common";

const base = 'comment/'

export async function getCommentReplies(id) {
    return await getRequest(base + `${id}`)
}

export async function getPostFromCommentReply(commentOrReply, id) {
    return await getRequest(base + `post?commentOrReply=${commentOrReply}&id=${id}`)
}