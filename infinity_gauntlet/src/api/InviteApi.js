import {getRequest, putRequest} from "@/api/common";

const base = 'invite/'

export async function getInvitesByHandle(handle) {
    return await getRequest(base + `handle/${handle}`)
}

export async function addReferralAndGetInvite(utmName, handle, sourceName) {
    return await putRequest(base + `create-referral`, {utmName, handle, sourceName})
}

export async function addInvites(userId, numberOfInvites) {
    return await putRequest(base + 'add', {userId, numberOfInvites})
}