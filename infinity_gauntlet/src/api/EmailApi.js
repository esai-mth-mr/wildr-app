import {postRequest} from "@/api/common";

const base = 'email/'

export async function sendRealIdEmail(pass, userId, reason) {
    return await postRequest(base + "real-id", {pass, userId, reason})
}

export async function sendReportEmail(userId,
                                      reason,
                                      link,
                                      sectionNumber,
                                      section,
                                      reportId) {
    return await postRequest(base + "report", {
        userId,
        reason,
        link,
        sectionNumber,
        section,
        reportId
    })
}