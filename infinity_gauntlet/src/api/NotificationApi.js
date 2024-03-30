import {postRequest} from "@/api/common";

const base = 'notification/'
export async function sendNotification(scope, title, body, userIds, marketingTag) {
    return await postRequest(base, {scope, title, body, userIds, marketingTag})
}