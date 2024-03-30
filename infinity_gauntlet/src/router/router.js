import Vue from 'vue'
import VueRouter from 'vue-router'
import HomeView from '../views/HomeView.vue'
import RealIdView from "@/views/RealIdView";
import PostTableView from "@/views/PostTableView";
import ReportView from "@/views/ReportView";
import InviteView from "@/views/InviteView";
import UserTableView from "@/views/UserTableView";
import CategoryInterestsView from "@/views/CategoryInterestsView";
import AddCategoryView from "@/views/AddCategoryView";
import NotificationView from "@/views/NotificationView";
import UserView from "@/views/UserView";
import PostView from "@/views/PostView";
import RandomRequestsView from "@/views/RandomRequestsView";
import RealIdVerifiedView from "@/views/RealIdVerifiedView";

Vue.use(VueRouter)

const routes = [
    {
        path: '/',
        name: 'home',
        component: HomeView
    },
    {
        path: '/real-id',
        name: 'Real_Id',
        component: RealIdView
    },
    {
        path: '/posts',
        name: 'posts',
        component: PostView
    },
    {
        path: '/post-table',
        name: 'post-table',
        component: PostTableView
    },
    {
        path: '/report',
        name: 'Report',
        component: ReportView
    },
    {
        path: '/random',
        name: 'RandomRequests',
        component: RandomRequestsView
    },
    {
        path: '/invite',
        name: 'Invite',
        component: InviteView
    },
    {
        path: '/users',
        name: 'users',
        component: UserView
    },
    {
        path: '/user-table',
        name: 'user-table',
        component: UserTableView
    },
    {
        path: '/category',
        name: 'category',
        component: CategoryInterestsView
    },
    {
        path: '/add-category',
        name: 'add-category',
        component: AddCategoryView
    },
    {
        path: '/notification',
        name: 'notification',
        component: NotificationView
    },
    {
        path: '/real-id-verified',
        name: 'real-id-verified',
        component: RealIdVerifiedView
    }
]

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
})

export default router
