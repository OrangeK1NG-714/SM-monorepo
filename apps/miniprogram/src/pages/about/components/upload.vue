<route lang="json5" type="page">
{
  layout: 'default',
  style: {
    navigationBarTitleText: '上传-状态一体化',
  },
}
</route>

<script lang="ts" setup>
const { loading, data, run } = useUpload()
const IOS_BLUE = '#0A84FF'
</script>

<template>
  <view class="ios-card" style="padding: 26rpx;">
    <view class="text-[28rpx] font-700 text-[#111827]">
      上传演示
    </view>
    <view class="mt-2 text-[26rpx] text-[#6B7280]">
      选择图片并上传，查看返回结果。
    </view>

    <button class="ios-btn ios-btn--primary mt-5 w-full" :style="{ backgroundColor: IOS_BLUE }" @click="run">
      选择图片并上传
    </button>

    <view v-if="loading" class="mt-3 text-[24rpx]" :style="{ color: IOS_BLUE }">
      上传中…
    </view>
    <template v-else>
      <view class="mt-4 text-[24rpx] text-[#6B7280]">
        返回数据：
      </view>
      <view class="mt-2 ios-card" style="padding: 18rpx; box-shadow: none; background: rgba(17,24,39,0.04);">
        <view class="text-[24rpx] leading-relaxed text-[#111827]" style="word-break: break-all;">
          {{ data }}
        </view>
      </view>
      <view v-if="data" class="mt-4 w-full" style="border-radius: 24rpx; overflow: hidden;">
        <image :src="data.url" mode="scaleToFill" style="width: 100%; height: 360rpx;" />
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
//
</style>
