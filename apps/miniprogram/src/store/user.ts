import type { IUserInfoVo } from '@/api/types/login'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getUserInfo as _getUserInfo,
  login as _login,
  logout as _logout,
  wxLogin as _wxLogin,
  getWxCode,
} from '@/api/login'
import { toast } from '@/utils/toast'

// 双token存储状态
interface ITokens {
  /** 访问令牌 */
  accessToken: string
  /** 刷新令牌 */
  refreshToken: string
  /** 访问令牌过期时间戳 */
  accessTokenExpiresAt: number
}

// 初始化状态
const userInfoState: IUserInfoVo = {
  username: '',
  role: '',
  token: '',
  activityId: '',
  maxSelectNum: 0,
}

const tokensState: ITokens = {
  accessToken: '',
  refreshToken: '',
  accessTokenExpiresAt: 0,
}

export const useUserStore = defineStore(
  'user',
  () => {
    // 定义用户信息
    const userInfo = ref<IUserInfoVo>({ ...userInfoState })
    // 定义双token信息
    const tokens = ref<ITokens>({ ...tokensState })

    /**
     * 设置用户信息（兼容旧版本单token，逐步迁移）
     * @param username - 用户名
     * @param role - 用户角色
     * @param token - 认证token（已废弃，保留兼容）
     */
    const setUserInfo = (username: string, role: string, token?: string) => {
      userInfo.value = {
        username,
        role,
        token: token || '',
      }
    }

    /**
     * 设置双token（新版本推荐）
     * @param accessToken - 访问令牌
     * @param refreshToken - 刷新令牌
     * @param expiresIn - 过期时间（秒）
     */
    const setTokens = (accessToken: string, refreshToken: string, expiresIn?: number) => {
      const expiresAt = expiresIn
        ? Date.now() + expiresIn * 1000
        : Date.now() + 2 * 60 * 60 * 1000 // 默认2小时

      tokens.value = {
        accessToken,
        refreshToken,
        accessTokenExpiresAt: expiresAt,
      }

      // 同时存储到本地，方便http拦截器使用
      uni.setStorageSync('accessToken', accessToken)
      uni.setStorageSync('refreshToken', refreshToken)
      uni.setStorageSync('accessTokenExpiresAt', expiresAt)

      // 兼容旧版本
      uni.setStorageSync('token', accessToken)
    }

    /**
     * 获取有效的访问令牌
     * @returns 有效的accessToken，如果过期返回null
     */
    const getValidAccessToken = (): string | null => {
      const now = Date.now()
      // 预留5分钟的缓冲时间
      if (tokens.value.accessToken && tokens.value.accessTokenExpiresAt > now + 5 * 60 * 1000) {
        return tokens.value.accessToken
      }
      return null
    }

    /**
     * 检查token是否即将过期
     * @returns 是否即将过期（5分钟内）
     */
    const isTokenExpiringSoon = (): boolean => {
      const now = Date.now()
      return !!(
        tokens.value.accessToken
        && tokens.value.accessTokenExpiresAt > now
        && tokens.value.accessTokenExpiresAt < now + 5 * 60 * 1000
      )
    }

    const setActivityId = (activityId: string) => {
      userInfo.value.activityId = activityId
    }

    const getUserInfo = () => {

    }

    /**
     * 清除用户信息（登出时使用）
     */
    const clearUserInfo = () => {
      userInfo.value = { ...userInfoState }
      tokens.value = { ...tokensState }
      uni.removeStorageSync('accessToken')
      uni.removeStorageSync('refreshToken')
      uni.removeStorageSync('accessTokenExpiresAt')
      uni.removeStorageSync('token')
    }

    return {
      userInfo,
      tokens,
      setActivityId,
      setUserInfo,
      setTokens,
      getValidAccessToken,
      isTokenExpiringSoon,
      clearUserInfo,
    }
  },
  {
    persist: true,
  },
)
