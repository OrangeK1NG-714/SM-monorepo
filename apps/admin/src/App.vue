<template>
  <router-view />
</template>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
}
//左侧导航栏滚动条（若导航栏超过屏幕长度）
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
  position: absolute;
}
::-webkit-scrollbar-thumb {
  background-color: #1890ff;
}
::-webkit-scrollbar-track {
  background-color: #ddd;
}
</style>
