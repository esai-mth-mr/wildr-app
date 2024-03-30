import axios from "axios";

const site = process.env.VUE_APP_SITE
const store = require('@/store/store')

export function AdminGetRequest(endpoint) {
    return new Promise((resolve, reject) => {
        axios.get(site + '/admin' + endpoint, {
            headers: {
                'Authorization': store.store.state.token,
            }
        })
            .then(r => resolve(r.data))
            .catch(catchError => reject(catchError))
    })
}

export function AdminPostRequest(endpoint, data) {
    return new Promise((resolve, reject) => {
        axios.post(site + '/admin' + endpoint, data, {
            headers: {
                'Authorization': store.store.state.token,
            }
        })
            .then(r => resolve(r.data))
            .catch(catchError => reject(catchError))
    })
}