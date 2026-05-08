<!-- 使用 type="home" 属性设置首页，其他页面不需要设置，默认为page；推荐使用json5，更强大，且允许注释 -->
<route lang="json5">
{
  layout: 'default',
  style: {
    navigationBarTitleText: '重置密码',
  },
}
</route>

<script lang="ts" setup>
import { updateStdPassword } from '@/api/stdInfo'
import { useUserStore } from '@/store/user'

defineOptions({
  name: 'Home',
})

onLoad(() => {
  const useStore = useUserStore()
  console.log(useStore.userInfo)
})
// 获取屏幕边界到安全区域距离
let safeAreaInsets
let systemInfo

// #ifdef MP-WEIXIN
// 微信小程序使用新的API
systemInfo = uni.getWindowInfo()
safeAreaInsets = systemInfo.safeArea
  ? {
      top: systemInfo.safeArea.top,
      right: systemInfo.windowWidth - systemInfo.safeArea.right,
      bottom: systemInfo.windowHeight - systemInfo.safeArea.bottom,
      left: systemInfo.safeArea.left,
    }
  : null
// #endif

// #ifndef MP-WEIXIN
// 其他平台继续使用uni API
systemInfo = uni.getSystemInfoSync()
safeAreaInsets = systemInfo.safeAreaInsets
// #endif

// 密码重置相关状态
const resetUsername = ref('')
const verifyCode = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const countDown = ref(0)
const isSending = ref(false)
const isSubmitting = ref(false)
let countdownTimer: ReturnType<typeof setInterval> | null = null
const focusedField = ref<string | null>(null)

function cleanupTimer() {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

onUnload(() => {
  cleanupTimer()
})

// 发送验证码
async function sendVerifyCode() {
  if (!resetUsername.value) {
    uni.showToast({ title: '请输入账号', icon: 'none' })
    return
  }
  if (isSending.value || countDown.value > 0)
    return
  // 调用发送验证码API
  // ...
  isSending.value = true
  cleanupTimer()
  countDown.value = 60
  countdownTimer = setInterval(() => {
    countDown.value--
    if (countDown.value <= 0) {
      cleanupTimer()
    }
  }, 1000)
  setTimeout(() => {
    isSending.value = false
  }, 300)
}

// 重置密码
async function handleResetPassword() {
  if (isSubmitting.value)
    return
  if (!resetUsername.value || !newPassword.value || !confirmPassword.value) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' })
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    uni.showToast({ title: '两次密码输入不一致', icon: 'none' })
    return
  }
  // 调用重置密码API
  // ...
  try {
    isSubmitting.value = true
    uni.showLoading({ title: '提交中…' })
    const res = await updateStdPassword({
      username: resetUsername.value,
      password: newPassword.value,
    })
    console.log(res)
    if (res.code === 200) {
      uni.showToast({ title: '密码重置成功', icon: 'success' })
    }
    uni.navigateTo({
      url: '/pages/login/index',
    })
  }
  catch (error) {
    console.log(error)

    uni.showToast({ title: `密码重置失败,${error.data.msg}`, icon: 'none' })
  }
  finally {
    isSubmitting.value = false
    uni.hideLoading()
  }
}
// 测试 uni API 自动引入
onLoad(() => {
  console.log()
})

console.log('index')
</script>

<template>
  <view class="ios-page" :style="{ paddingTop: `${safeAreaInsets?.top || 0}px` }">
    <view class="px-5 pt-6">
      <view class="ios-title">
        重置密码
      </view>
      <view class="ios-subtitle mt-2">
        请输入账号并设置新密码。
      </view>
    </view>

    <view class="px-5 pt-6 pb-10">
      <view class="ios-card">
        <view class="ios-cell" :class="{ 'ios-cell--focused': focusedField === 'username' }">
          <view class="ios-cell__label">
            账号
          </view>
          <view class="ios-cell__content">
            <input
              v-model="resetUsername"
              class="ios-input"
              placeholder="学号 / 工号"
              :disabled="isSubmitting"
              @focus="focusedField = 'username'"
              @blur="focusedField = null"
            >
          </view>
        </view>
        <view class="ios-divider" style="margin-left: 28rpx;" />
        <view class="ios-cell" :class="{ 'ios-cell--focused': focusedField === 'code' }">
          <view class="ios-cell__label">
            验证码
          </view>
          <view class="ios-cell__content flex items-center justify-between">
            <input
              v-model="verifyCode"
              class="ios-input"
              placeholder="选填"
              :disabled="isSubmitting"
              @focus="focusedField = 'code'"
              @blur="focusedField = null"
            >
            <button
              class="ios-btn ios-btn--secondary"
              style="padding: 14rpx 18rpx; font-size: 26rpx; margin-left: 12rpx;"
              :disabled="isSubmitting || isSending || countDown > 0"
              @click="sendVerifyCode"
            >
              {{ countDown > 0 ? `${countDown}s` : '发送' }}
            </button>
          </view>
        </view>
        <view class="ios-divider" style="margin-left: 28rpx;" />
        <view class="ios-cell" :class="{ 'ios-cell--focused': focusedField === 'new' }">
          <view class="ios-cell__label">
            新密码
          </view>
          <view class="ios-cell__content">
            <input
              v-model="newPassword"
              class="ios-input"
              password
              placeholder="请输入新密码"
              :disabled="isSubmitting"
              @focus="focusedField = 'new'"
              @blur="focusedField = null"
            >
          </view>
        </view>
        <view class="ios-divider" style="margin-left: 28rpx;" />
        <view class="ios-cell" :class="{ 'ios-cell--focused': focusedField === 'confirm' }">
          <view class="ios-cell__label">
            确认
          </view>
          <view class="ios-cell__content">
            <input
              v-model="confirmPassword"
              class="ios-input"
              password
              placeholder="再次输入新密码"
              :disabled="isSubmitting"
              @focus="focusedField = 'confirm'"
              @blur="focusedField = null"
              @confirm="handleResetPassword"
            >
          </view>
        </view>
      </view>

      <view class="mt-8">
        <button class="ios-btn ios-btn--primary w-full" :disabled="isSubmitting" @click="handleResetPassword">
          {{ isSubmitting ? '提交中…' : '确认重置' }}
        </button>
      </view>
    </view>
  </view>
</template>
