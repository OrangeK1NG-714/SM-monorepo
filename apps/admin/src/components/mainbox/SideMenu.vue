<template>
  <el-aside width="auto">
    <el-menu :collapse="$store.state.isCollapsed" :router="true" :default-active="route.fullPath">
      <el-menu-item index="/index">
        <el-icon>
          <HomeFilled />
        </el-icon>
        <span>首页</span>
      </el-menu-item>
      <el-menu-item index="/center">
        <el-icon>
          <Avatar />
        </el-icon>
        <span>个人中心</span>
      </el-menu-item>
      <el-sub-menu index="/user-manage" v-admin>
        <template #title>
          <el-icon>
            <Menu />
          </el-icon>
          <span>用户管理</span>
        </template>
        <el-menu-item index="/user-manage/addUser">添加用户</el-menu-item>
        <el-menu-item index="/user-manage/userList">用户列表</el-menu-item>
      </el-sub-menu>

      <el-sub-menu index="/activity">
        <template #title>
          <el-icon>
            <Menu />
          </el-icon>
          <span>活动管理</span>
        </template>
        <el-menu-item index="/activity/addActivity">添加活动</el-menu-item>
        <el-menu-item index="/activity/activityList">活动列表</el-menu-item>
      </el-sub-menu>

        <el-sub-menu index="/volunteer">
        <template #title>
          <el-icon>
            <Menu />
          </el-icon>
          <span>志愿管理</span>
        </template>
        <el-menu-item index="/volunteer/selectVolunteerList">选择志愿列表</el-menu-item>
        <el-menu-item index="/volunteer/finalVolunteerList">最终志愿列表</el-menu-item>
        <el-menu-item index="/volunteer/volunteerAdd">添加志愿</el-menu-item>
      </el-sub-menu>
    </el-menu>
  </el-aside>
</template>
<script setup>
import { HomeFilled, Avatar, Menu } from "@element-plus/icons-vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
const route = useRoute();
console.log(route.fullPath);
const store = useStore();
// const vAdmin = {
//   mounted(el) {
//     console.log(el);
//     if (store.state.userInfo.role !== 1) {
//       el.parentNode.removeChild(el);
//     }
//   },
// };
</script>
<style lang="scss" scoped>
.el-aside {
  height: 100vh;
}
</style>
