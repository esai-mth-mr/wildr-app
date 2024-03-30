import Vue from 'vue'
import App from './App.vue'
import {routes} from '@/router'

import vuetify from './plugins/vuetify'
import Router from 'vue-router'
import VueAgile from 'vue-agile'
import Notifications from 'vue-notification'
import {VueReCaptcha} from 'vue-recaptcha-v3'
import VueSimpleAlert from "vue-simple-alert";

Vue.use(VueSimpleAlert, {backdrop: true});
Vue.use(Router);
Vue.use(VueReCaptcha, {siteKey: process.env.VUE_APP_RECAPTCHA_KEY})
Vue.use(Notifications)
Vue.use(VueAgile)

import 'animate.css'
import {store} from '@/store/store'
import "@/plugins/firebase"
import axios from "axios";
import {EventBus} from "@/store/EventBus";

const router = new Router({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
})

Vue.config.productionTip = false

new Vue({
    router,
    vuetify,
    store,
    mounted() {
        axios.interceptors.response.use(async response => {
            return response
        }, async response => {
            if (response.response.data === "Token expired") {
                this.$store.commit('SET_TOKEN', '');
                this.$notify({
                    group: 'web',
                    type: 'error',
                    title: 'Error',
                    text: "Login expired please login in again"
                });
                EventBus.$emit('checkLoginStatus')
                return response;
            } else return response
        })
    },
    render: h => h(App)
}).$mount('#app')
