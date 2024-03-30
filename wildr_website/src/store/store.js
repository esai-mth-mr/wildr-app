import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from "vuex-persistedstate";
import SecureLS from "secure-ls";
import {GoogleAuthProvider, signInWithPopup, getAuth} from "firebase/auth";
import {EventBus} from "@/store/EventBus";

Vue.use(Vuex)
const ls = new SecureLS({isCompression: false});
export const store = new Vuex.Store({
    plugins: [
        createPersistedState({
            paths: ['token'],
            storage: {
                getItem: key => ls.get(key),
                setItem: (key, value) => ls.set(key, value),
                removeItem: key => ls.remove(key)
            }
        })
    ],
    state: {
        token: '',
    },
    mutations: {
        SET_TOKEN(state, value) {
            state.token = value;
        },
    },
    getters:{
        isAuthenticated(state){
            return state.token!==''
        }
    },
    actions: {
        Login({commit}) {
            return new Promise((resolve, reject) => {
                const provider = new GoogleAuthProvider();
                const auth = getAuth();
                signInWithPopup(auth, provider)
                    .then(async (result) => {
                        if (result.user.email.split('@')[1] !== 'wildr.com') {
                            await auth.signOut()
                            commit('SET_TOKEN', '')
                            reject("Please login with a wildr account")
                            return;
                        }
                        const token = await auth.currentUser.getIdToken()
                        commit('SET_TOKEN', token)
                        EventBus.$emit('checkLoginStatus')
                        resolve("Login successful")
                    }).catch((error) => {

                    console.log(error)
                    reject("Login Failed")
                });
            })
        },
        SignOut({commit}) {
            return new Promise((resolve, reject) => {
                const auth = getAuth();
                auth.signOut().then(()=> {
                    commit('SET_TOKEN', '')
                    EventBus.$emit('checkLoginStatus')
                    resolve("Logout successful")
                }).catch(()=>reject("Logout successful"))
            })
        },
    },
    modules: {}
})
