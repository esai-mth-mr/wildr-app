import axios from "axios";

export function SendContact(data, reCaptchaToken) {
    return new Promise((resolve, reject) => {
        axios.post(process.env.VUE_APP_SITE + '/contact/send', {...data}, {headers:{reCaptchaToken}})
            .then(r => resolve(r.data))
            .catch(error => reject(error.response.data))
    })
}