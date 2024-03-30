import {AdminGetRequest, AdminPostRequest} from "@/api/Client";

export function GetAllEmails() {
    return new Promise((resolve, reject) => {
        AdminGetRequest("/email/getAll")
            .then(r => resolve(r))
            .catch(catchError => reject(catchError))
    })
}

export function GetAllEmailsMobile() {
    return new Promise((resolve, reject) => {
        AdminGetRequest("/email/getAllMobile")
            .then(r => resolve(r))
            .catch(catchError => reject(catchError))
    })
}

export function SendInviteCodeEmails(emails) {
    return new Promise((resolve, reject) => {
        AdminPostRequest("/sendEmails", {emails})
            .then(r => resolve(r))
            .catch(catchError => reject(catchError))
    })
}

export function GetAllInvitesCodes() {
    return new Promise((resolve, reject) => {
        AdminGetRequest("/getAllInvites")
            .then(r => resolve(r))
            .catch(catchError => reject(catchError))
    })
}

export function GetAllFeedbacks(){
    return new Promise((resolve, reject)=>{
        AdminGetRequest('/feedback')
            .then(r => resolve(r))
            .catch(catchError => reject(catchError))
    })
}

export function GetAllUsers(){
    return new Promise((resolve, reject)=>{
        AdminGetRequest('/getUsers')
            .then(r => resolve(r))
            .catch(catchError => reject(catchError))
    })
}