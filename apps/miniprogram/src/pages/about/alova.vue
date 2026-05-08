<route lang="json5" type="page">
{
  layout: 'default',
  style: {
    navigationBarTitleText: 'Alova 请求演示',
  },
}
</route>

<script lang="ts" setup>
import { useRequest } from 'alova/client'
import { foo } from '@/api/alova-foo'

const initialData = undefined
const IOS_BLUE = '#0A84FF'

const { loading, data, send } = useRequest(foo, {
  initialData,
  immediate: true,
})
console.log(data)
function reset() {
  data.value = initialData
}
</script>

<template>
  <view class="ios-page">
    <view class="px-5 pt-6">
      <view class="ios-title">
        Alova 演示
      </view>
      <view class="ios-subtitle mt-2">
        请求/重置示例（保持功能不变）。
      </view>
    </view>

    <view class="px-5 pt-6 pb-10">
      <view class="ios-card" style="padding: 26rpx;">
        <button class="ios-btn ios-btn--primary w-full" :style="{ backgroundColor: IOS_BLUE }" @click="send">
          {{ loading ? '请求中…' : '发送请求' }}
        </button>

        <view class="mt-5">
          <view class="text-[24rpx] text-[#6B7280]">
            返回数据
          </view>
          <view class="mt-2 ios-card" style="padding: 18rpx; box-shadow: none; background: rgba(17,24,39,0.04);">
            <view v-if="loading" class="text-[26rpx] text-[#6B7280]">
              loading…
            </view>
            <view v-else class="text-[24rpx] leading-relaxed text-[#111827]" style="word-break: break-all;">
              {{ JSON.stringify(data) }}
            </view>
          </view>
        </view>

        <button class="ios-btn ios-btn--secondary mt-5 w-full" :disabled="!data" @click="reset">
          重置数据
        </button>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
//
</style>
