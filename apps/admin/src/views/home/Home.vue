<template>
  <div>
    <el-page-header content="首页" icon="" title="3D扫描数字化后台管理系统" />

    <el-card class="box-card">
      <el-row>
        <el-col :span="4">
          <el-avatar :size="80" :src="avatarUrl" />
        </el-col>
        <el-col :span="20">
          <h3 style="line-height: 100px">
            欢迎{{ store.state.userInfo.username }}回来,{{ welcomeText }}
          </h3>
        </el-col>
      </el-row>
    </el-card>

  </div>
</template>
<script setup>
import { useStore } from "vuex";
import { computed, onMounted, ref } from "vue";
import axios from "axios";

const store = useStore();
console.log(store.state);
const loopList = ref([]);
const avatarUrl = computed(() =>
  store.state.userInfo.avatar
    ? "http://localhost:3000" + store.state.userInfo.avatar
    : `https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png`
);
const welcomeText = computed(() =>
  new Date().getHours() < 12 ? "开心每一天." : "喝杯coffee~"
);

// onMounted(() => {
//   getData();
// });
// const getData = async () => {
//   const res = await axios.get(`/adminapi/product/list`);
//   console.log(res.data.data);
//   loopList.value = res.data.data;
//   console.log(loopList.value);
// };

// axios.get("/adminapi/user/home").then((res) => {
//   console.log(res.data);
// });
</script>
<style lang="scss" scoped>
.box-card {
  margin-top: 50px;
}

.el-carousel__item h3 {
  color: white;
  opacity: 0.75;
  line-height: 200px;
  margin: 0;
  text-align: center;
}

.el-carousel__item:nth-child(2n) {
  background-color: #99a9bf;
}

.el-carousel__item:nth-child(2n + 1) {
  background-color: #d3dce6;
}
</style>
