import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '../views/Login.vue'
import MainBox from '../views/MainBox.vue'
import Home from '../views/home/Home.vue'
import Center from '../views/center/Center.vue'

import RoutesConfig from './config'
import store from '@/store/index'
const routes = [
  {
    path: "/login",
    name: 'login',
    component: Login,
  },
  {
    path: "/MainBox",
    name: 'MainBox',
    component: MainBox,
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})
router.addRoute("MainBox", {
  path: "/index",
  component: Home
})
router.addRoute("MainBox", {
  path: "/center",
  component: Center
})
// //路由遍历加载
// RoutesConfig.forEach(item=>{
//   router.addRoute("MainBox",item)
// })

//路由拦截
//每次路由拦截之前
router.beforeEach((to, form, next) => {
  if (to.name === "login") {
    next()
  } else {
    if (!localStorage.getItem("token")) {
      next({
        path: "/login"
      })
    } else {
      if (!store.state.isGetterRouter) {
        //删除所有嵌套路由
        router.removeRoute("MainBox")
        ConfigRouter();
        next({
          path: to.fullPath
        });
      } else {
        next()
      }
    }
    // else {
    //   ConfigRouter();
    //   next();
    // }

  }
})

const ConfigRouter = () => {

  if (!router.hasRoute("MainBox")) {
    router.addRoute(
      {
        path: "/MainBox",
        name: 'MainBox',
        component: MainBox,
      }
    )
  }

  RoutesConfig.forEach(item => {
    checkPermission(item) && router.addRoute("MainBox", item)
  })
  //改变isGetterRouter = true
  store.commit("changeGetterRouter", true)
}

const checkPermission = (item) => {
  if (item.requireAdmin) {
    return store.state.userInfo.role === 1
  }
  return true
}
export default router
