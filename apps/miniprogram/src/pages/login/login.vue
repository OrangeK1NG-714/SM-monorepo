<!-- 使用 type="home" 属性设置首页，其他页面不需要设置，默认为page；推荐使用json5，更强大，且允许注释 -->
<route lang="json5" type="home">
{
  layout: "tabbar",
  style: {
    // 'custom' 表示开启自定义导航栏，默认 'default'
    navigationStyle: "custom",
    navigationBarTitleText: "登录",
  },
}
</route>

<script lang="ts" setup>
import { getUserInfo, login } from '@/api/login'
import { saveOpenid } from '@/api/stdInfo'
import { useUserStore } from '@/store/user'

defineOptions({
  name: 'Home',
})

const IOS_BLUE = '#0A84FF'

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

// 表单数据
const username = ref('')
const password = ref('')
const isSubmitting = ref(false)
const focusedField = ref<'username' | 'password' | null>(null)
const errorText = ref('')

function validate() {
  errorText.value = ''
  if (!username.value.trim() || !password.value.trim()) {
    errorText.value = '请输入账号和密码'
    uni.showToast({ title: errorText.value, icon: 'none' })
    return false
  }
  return true
}
// 登录
async function handleLogin() {
  if (isSubmitting.value)
    return
  if (!validate())
    return
  try {
    isSubmitting.value = true
    uni.showLoading({
      title: '登录中...',
    })
    // 调用登录接口
    const res = await login({
      username: username.value,
      password: password.value,
    })
    if (res.code === 200) {
      uni.showToast({
        title: '登录成功',
        icon: 'success',
      })
      // 存储双token
      const useStore = useUserStore()
      const {
        username: resUsername,
        role,
        accessToken,
        refreshToken,
        expiresIn,
      } = res.data

      console.log('[login] res.data:', JSON.stringify(res.data))
      console.log('[login] accessToken:', accessToken)
      console.log('[login] refreshToken:', refreshToken)

      // 兼容旧版本单token：后端可能只返回 token 字段
      const finalAccessToken = accessToken || (res.data as any).token
      const finalRefreshToken = refreshToken || (res.data as any).token

      // 设置用户信息
      useStore.setUserInfo(resUsername, role)
      // 设置双token（先同步存储到本地，确保后续请求能获取到）
      useStore.setTokens(finalAccessToken, finalRefreshToken, expiresIn)

      // 验证token是否已存储
      const storedToken = uni.getStorageSync('accessToken')
      console.log(
        '[login] after setTokens, storedToken:',
        storedToken ? 'exists' : 'null',
      )

      // 确保token已存储后再发起请求
      // 获取用户详细信息
      console.log('[login] calling getUserInfo...')
      const resUserInfo = await getUserInfo(resUsername, role)
      console.log(resUserInfo)
      console.log(res)

      // 仅小程序端：登录成功后获取 openid 并上报后端
      // #ifdef MP-WEIXIN
      if (role === 'student') {
        try {
          const loginRes = await new Promise<UniApp.LoginRes>(
            (resolve, reject) => {
              uni.login({ provider: 'weixin', success: resolve, fail: reject })
            },
          )
          await saveOpenid(loginRes.code, resUsername)
          console.log('[login] openid 上报成功')
        }
        catch (wxErr) {
          console.warn('[login] openid 上报失败（不影响登录）:', wxErr)
        }
      }
      // #endif

      if (role === 'student' && resUserInfo.isEmpty === 0) {
        // 跳转页面
        uni.navigateTo({
          url: '/pages/userMsg/index',
        })
      }
      else {
        // 跳转页面
        uni.navigateTo({
          url: '/pages/index/index',
        })
      }
    }
  }
  catch (error) {
    console.log(error)
    uni.showToast({ title: '登录失败，请稍后重试', icon: 'none' })
  }
  finally {
    isSubmitting.value = false
    uni.hideLoading()
  }
}

// 重置密码
async function handleResetPassword() {
  if (isSubmitting.value)
    return
  uni.navigateTo({
    url: '/pages/resetPassword/index',
  })
}
// 测试 uni API 自动引入
onLoad(() => {
  console.log()
})
</script>

<template>
  <view
    class="ios-page"
    :style="{ paddingTop: `${safeAreaInsets?.top || 0}px` }"
  >
    <view class="px-5 pt-8">
      <view class="ios-title">
        登录
      </view>
      <view class="ios-subtitle mt-2">
        浙江科技大学数媒专业导师互选系统
      </view>
    </view>

    <view class="px-5 pt-6">
      <view class="ios-card">
        <view
          class="ios-cell ios-cell--first"
          :class="{ 'ios-cell--focused': focusedField === 'username' }"
        >
          <view class="ios-cell__label">
            账号
          </view>
          <view class="ios-cell__content">
            <input
              v-model="username"
              class="ios-input"
              placeholder="学号 / 工号"
              :disabled="isSubmitting"
              @focus="focusedField = 'username'"
              @blur="focusedField = null"
            >
          </view>
        </view>

        <view class="ios-divider" />

        <view
          class="ios-cell ios-cell--last"
          :class="{ 'ios-cell--focused': focusedField === 'password' }"
        >
          <view class="ios-cell__label">
            密码
          </view>
          <view class="ios-cell__content">
            <input
              v-model="password"
              class="ios-input"
              placeholder="请输入密码"
              password
              :disabled="isSubmitting"
              @focus="focusedField = 'password'"
              @blur="focusedField = null"
              @confirm="handleLogin"
            >
          </view>
        </view>
      </view>

      <view class="mt-3 px-1 text-xs text-[#6B7280]">
        学生账号为学号，老师账号为工号
      </view>
      <view v-if="errorText" class="mt-2 px-1 text-xs text-[#FF3B30]">
        {{ errorText }}
      </view>

      <view class="mt-8 space-y-3">
        <button
          class="ios-btn ios-btn--primary"
          :style="{ backgroundColor: IOS_BLUE }"
          :disabled="isSubmitting"
          @click="handleLogin"
        >
          {{ isSubmitting ? "登录中…" : "登录" }}
        </button>
        <button
          class="ios-btn ios-btn--secondary"
          :disabled="isSubmitting"
          @click="handleResetPassword"
        >
          修改密码
        </button>
      </view>
    </view>
  </view>

  <!-- <view class="mt-10">
      <image src="/static/logo.svg" alt="" class="mx-auto block h-28 w-28" />
    </view>
    <view class="mt-4 text-center text-4xl text-[#d14328]">
      unibest
    </view>
    <view class="mb-8 mt-2 text-center text-2xl">
      最好用的 uniapp 开发模板
    </view>

    <view class="m-auto mb-2 max-w-100 text-justify indent text-4">
      {{ description }}
    </view>
    <view class="mt-4 text-center">
      作者：
      <text class="text-green-500">
        菲鸽
      </text>
    </view>
    <view class="mt-4 text-center">
      官网地址：
      <text class="text-green-500">
        https://unibest.tech
      </text>
    </view>
    <view class="mt-6 h-1px bg-#eee" />
    <view class="mt-8 text-center">
      当前平台是：
      <text class="text-green-500">
        {{ PLATFORM.platform }}
      </text>
    </view>
    <view class="mt-4 text-center">
      模板分支是：
      <text class="text-green-500">
        base
      </text>
    </view> -->
</template>

<style scoped>
.ios-page {
  min-height: 100vh;
  background: #f2f2f7;
}
.ios-title {
  font-size: 44rpx;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.02em;
}
.ios-subtitle {
  font-size: 26rpx;
  color: #6b7280;
  line-height: 1.5;
}
.ios-card {
  background: #ffffff;
  border-radius: 32rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
  overflow: hidden;
}
.ios-divider {
  height: 1px;
  background: rgba(17, 24, 39, 0.08);
  margin-left: 28rpx;
}
.ios-cell {
  display: flex;
  align-items: center;
  padding: 22rpx 28rpx;
}
.ios-cell--focused {
  background: rgba(10, 132, 255, 0.06);
}
.ios-cell__label {
  width: 120rpx;
  font-size: 28rpx;
  color: #111827;
}
.ios-cell__content {
  flex: 1;
}
.ios-input {
  width: 100%;
  font-size: 28rpx;
  color: #111827;
}
.ios-btn {
  width: 100%;
  border-radius: 28rpx;
  padding: 22rpx 24rpx;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1;
}
.ios-btn[disabled] {
  opacity: 0.6;
}
.ios-btn--primary {
  color: #ffffff;
}
.ios-btn--secondary {
  background: rgba(17, 24, 39, 0.06);
  color: #111827;
}
.ios-btn:active {
  transform: scale(0.99);
  opacity: 0.92;
}
</style>
