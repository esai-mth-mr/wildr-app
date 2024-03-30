const routes = [
  {
    path: '/',
    component: ()=>import('../MainLayout/MainLayout'),
    children: [
      {
        path: '/',
        name: 'HomePage',
        component: () => import('../views/HomeView.vue')
      },
      // {
      //   path: '/team',
      //   name: 'TeamPage',
      //   component: () => import('../views/TeamView.vue')
      // },
      {
        path: '/contact',
        name: 'ContactPage',
        component: () => import('../views/ContactUsView.vue')
      },
      {
        path: '/legal/counter-notification/report',
        name: 'counterNotificationForm',
        component: () => import('../components/LegalComponents/LegalContact/CounterNotificationForm.vue')
      },
      {
        path: '/legal/copyright/contact',
        name: 'copyrightForm',
        component: () => import('../components/LegalComponents/LegalContact/ReportCopyrightForm.vue')
      },
      {
        path: '/legal/feedback/contact',
        name: 'copyrightForm',
        component: () => import('../components/LegalComponents/LegalContact/FeedbackForm.vue')
      },
      {
        path: '/legal/privacy/contact',
        name: 'requestPrivacyInfo',
        component: () => import('../components/LegalComponents/LegalContact/RequestPrivacyInfoForm.vue')
      },
      {
        path: '/legal/trademark/report',
        name: 'trademarkInfo',
        component: () => import('../components/LegalComponents/LegalContact/TrademarkForm.vue')
      }
    ],
  },
  {
    path: "/legal",
    redirect: "/legal/terms-of-service"
  },
  {
    path: '/legal/:doc',
    name: 'Legal',
    component: () => import('../views/LegalPageView.vue')
  },
  {
    path:'/404',
    name: '404',
    component: ()=> import('../views/404View')
  },
  {
    path: "/admin",
    name: 'AdminView',
    component: () => import('../views/AdminView.vue')
  },
  {
    path: '*',
    redirect: '/404'
  },
]
const siteMapRoutes = routes.filter(r=>!r.path.includes('legal'))
module.exports = {routes, siteMapRoutes}
