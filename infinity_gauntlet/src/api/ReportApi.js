import {getRequest, putRequest} from "@/api/common";

const base = "report/";

export async function getReports(date, limit) {
    return await getRequest(base+ `?date=${date}&limit=${limit}`)
}
export async function getReporters(id) {
    return await getRequest(base+ `users/${id}`)
}
export async function updateReport(id, reviewerId, reviewResult, reviewerComment, violatedGuideline) {
    return await putRequest(base, {id, reviewerId, reviewResult, reviewerComment, violatedGuideline})
}