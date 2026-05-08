<template>
  <div>
    <!-- 粒子背景 -->
    <vue-particles
      id="tsparticles"
      :particlesLoaded="particlesLoaded"
      :options="options"
    />
    <!-- 登录表单 -->
    <div class="formContainer">
      <h3>数媒双选助手后台管理系统</h3>
      <el-form
        :model="loginForm"
        status-icon
        :rules="loginRules"
        ref="loginFormRef"
        label-width="80px"
        class="loginForm"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            type="password"
            v-model="loginForm.password"
            autocomplete="off"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitForm()">登录</el-button>
          <!-- <el-button @click="resetForm('ruleForm')">重置</el-button> -->
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>
<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import axios from "axios";
import { useStore } from "vuex";
const store = useStore();
const handleLogin = () => {};
//表单绑定的响应式对象
const loginForm = reactive({
  username: "",
  password: "",
});
//表单的引用对象
const loginFormRef = ref();
//表单校验规则
const loginRules = reactive({
  username: [
    {
      required: true,
      message: "请输入用户名",
      trigger: "blur",
    },
  ],
  password: [
    {
      required: true,
      message: "请输入密码",
      trigger: "blur",
    },
  ],
});
//引用router钩子
const router = useRouter();
//登录按钮的回调函数
const submitForm = () => {
  //1.  校验表单
  loginFormRef.value.validate((valid) => {
    if (valid) {
      axios.post("/api/user/login", loginForm).then((res) => {
        console.log(res.data);
        if (res.data.code === 200) {
          console.log(123);
          
          store.commit("changeUserInfo", res.data.data);
          store.commit("changeGetterRouter", false);
          router.push("/index");
        } else {
          ElMessage.error("用户名和密码不匹配");
        }
      });
    }
  });
  //2.  拿到表单数据，提交后台
  //3.  设置token
  // localStorage.setItem("token", "kerwin");
};
//配置Login页面粒子背景
const options = {
  background: {
    color: {
      value: "#2d3a4b",
    },
  },
  fpsLimit: 120,
  interactivity: {
    events: {
      onClick: {
        enable: true,
        mode: "push",
      },
      onHover: {
        enable: true,
        mode: "repulse",
      },
    },
    modes: {
      bubble: {
        distance: 400,
        duration: 2,
        opacity: 0.8,
        size: 40,
      },
      push: {
        quantity: 4,
      },
      repulse: {
        distance: 200,
        duration: 0.4,
      },
    },
  },
  particles: {
    color: {
      value: "#ffffff",
    },
    links: {
      color: "#ffffff",
      distance: 150,
      enable: true,
      opacity: 0.5,
      width: 1,
    },
    move: {
      direction: "none",
      enable: true,
      outModes: "bounce",
      random: false,
      speed: 6,
      straight: false,
    },
    number: {
      density: {
        enable: true,
      },
      value: 80,
    },
    opacity: {
      value: 0.5,
    },
    shape: {
      type: "circle",
    },
    size: {
      value: { min: 1, max: 5 },
    },
  },
  detectRetina: true,
};
</script>

<style lang="scss" scoped>
.formContainer {
  width: 500px;
  height: 300px;
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background: rgba($color: #000000, $alpha: 0.5);
  color: white;
  text-align: center;
  padding: 20px;

  h3 {
    font-size: 24px;
  }
  .loginForm {
    margin: 20px;
  }
}
:deep() .el-form-item__label {
  color: white;
}
</style>
