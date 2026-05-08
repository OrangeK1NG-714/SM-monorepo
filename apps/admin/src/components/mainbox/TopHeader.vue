<template>
  <el-header>
    <div class="left" @click="handleCollapsed">
      <el-icon>
        <Menu />
      </el-icon>
      <span>ZUST数媒导师双选助手后台管理系统</span>
    </div>
    <div class="right">
      <span>欢迎 {{ $store.state.userInfo.username }} 回来</span>
      <el-dropdown>
        <span class="el-dropdown-link">
          <el-icon :size="20" color="white"> <User /> </el-icon
        ></span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="handleCenter">个人中心</el-dropdown-item>
            <el-dropdown-item @click="handleLogout">退出</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </el-header>
</template>
<script setup>
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { Menu, User } from "@element-plus/icons-vue";

const store = useStore();
const router = useRouter();

const handleCollapsed = () => {
  store.commit("changeCollapsed");
};

const handleCenter = ()=>{
router.push("/center")
}

const handleLogout=()=>{
  localStorage.removeItem("token")
  store.commit("clearUserInfo")
  router.push("/login")
}
</script>
<style lang="scss" scoped>
.el-header {
  background-color: #2d3a4b;
  color: white;
  width: 100%;
  height: 60px;
  line-height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.left,
.right {
  display: flex;
}
.left {
  cursor: pointer;
  i {
    margin: auto;
  }
}
.right {
  .el-dropdown {
    margin: auto;
  }
}
</style>
