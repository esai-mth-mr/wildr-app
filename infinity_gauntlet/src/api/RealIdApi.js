import {getRequest, putRequest} from "@/api/common";

const base = "user/";

export async function getRealIdManualReview() {
    return await getRequest(base + 'real-id')
}

export async function updateRealIdStatus(verified, id, message) {
    if (verified) {
        return await putRequest(base + 'real-id', {operation: 'VERIFY', id})
    } else {
        return await putRequest(base + 'real-id', {operation: 'REJECT', id, message})
    }
}