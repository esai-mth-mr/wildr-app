import axios from "axios";

export function SendEmail(email, reCaptchaToken) {
    return new Promise((resolve, reject) => {
        axios.post(process.env.VUE_APP_SITE + '/email/add', {email}, {headers:{reCaptchaToken}})
            .then(r => resolve(r.data))
            .catch(error => reject(error.response.data))
    })
}
export function SendLegalEmail(subject, formData, reCaptchaToken){
    return new Promise((resolve, reject) => {
    axios.post(process.env.VUE_APP_SITE + '/sendLegalEmail', {
        name: formData.name,
        email: formData.email,
        subject: subject,
        message: formData
    }, {headers:{reCaptchaToken}})
        .then(r => resolve(r.data))
        .catch(error => reject(error.response.data))
    })
}