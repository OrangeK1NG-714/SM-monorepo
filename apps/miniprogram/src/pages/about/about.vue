<route lang="json5">
{
  layout: 'tabbar',
  style: {
    navigationBarTitleText: '关于',
  },
}
</route>

<script lang="ts" setup>
// @ts-expect-error Vetur 对自定义块（route）解析不完整
import RequestComp from './components/request.vue'
// @ts-expect-error Vetur 对自定义块（route）解析不完整
import UploadComp from './components/upload.vue'

// 获取屏幕边界到安全区域距离
const { safeAreaInsets } = uni.getSystemInfoSync()
const IOS_BLUE = '#0A84FF'

// 奇怪：同样的代码放在 vue 里面不会校验到错误，放在 .ts 文件里面会校验到错误
// const testOxlint = (name: string) => {
//   console.log('oxlint')
// }
// testOxlint('oxlint')
console.log('about')

function gotoAlova() {
  uni.navigateTo({
    url: '/pages/about/alova',
  })
}
</script>

<template>
  <view class="ios-page" :style="{ paddingTop: `${safeAreaInsets?.top || 0}px` }">
    <view class="px-5 pt-6">
      <view class="ios-title">
        关于
      </view>
      <view class="ios-subtitle mt-2">
        一些请求/上传演示页入口。
      </view>
    </view>

    <view class="px-5 pt-6 pb-10">
      <view class="ios-card" style="padding: 26rpx;">
        <view class="text-[28rpx] font-700 text-[#111827]">
          开发者
        </view>
        <view class="mt-2 text-[26rpx] text-[#6B7280]">
          鸽友们好，我是 <text class="font-700" style="color: var(--ios-blue);">菲鸽</text>
        </view>
        <button class="ios-btn ios-btn--primary mt-5 w-full" :style="{ backgroundColor: IOS_BLUE }" @click="gotoAlova">
          前往 Alova 演示
        </button>
      </view>

      <view class="mt-5">
        <RequestComp />
      </view>
      <view class="mt-5">
        <UploadComp />
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.test-css {
  // 16rpx=>0.5rem
  padding-bottom: 16rpx;
  // mt-4=>1rem=>16px;
  margin-top: 16px;
  text-align: center;
}
</style>
