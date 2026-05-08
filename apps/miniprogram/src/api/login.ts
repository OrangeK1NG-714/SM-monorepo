import type { ICaptcha, IUpdateInfo, IUpdatePassword, IUserInfoVo, IUserLogin } from './types/login'
import { http } from '@/utils/http'
// 本地127.0.0.1:7001
// 服务器47.118.26.28:7001
// const localhost = 'http://localhost:7001'
const localhost = 'https://richardq.tech'
/**
 * 登录表单
 */
export interface ILoginForm {
  username: string
  password: string
  // code: string
  // uuid: string
}

/**
 * 获取验证码
 * @returns ICaptcha 验证码
 */
export function getCode() {
  return http.get<ICaptcha>('/user/getCode')
}

/**
 * 用户登录
 * @param loginForm 登录表单
 */
export function login(loginForm: ILoginForm) {
  return http.post<IUserLogin>(`${localhost}/api/user/login`, loginForm)
}

/**
 * 获取用户信息(需要token)
 */
export function getUserInfo(username: string, role: string) {
  return http.get<IUserInfoVo>(`${localhost}/api/user/detail`, { username, role }, undefined, { requireAuth: true })
}

/**
 * 退出登录
 */
export function logout() {
  return http.get<void>('/user/logout', undefined, undefined, { requireAuth: true })
}

/**
 * 修改用户信息
 */
export function updateInfo(data: IUpdateInfo) {
  return http.post('/user/updateInfo', data, undefined, undefined, { requireAuth: true })
}

/**
 * 修改用户密码
 */
export function updateUserPassword(data: IUpdatePassword) {
  return http.post('/user/updatePassword', data, undefined, undefined, { requireAuth: true })
}

/**
 * 获取微信登录凭证
 * @returns Promise 包含微信登录凭证(code)
 */
export function getWxCode() {
  return new Promise<UniApp.LoginRes>((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: res => resolve(res),
      fail: err => reject(new Error(err)),
    })
  })
}

/**
 * 微信登录参数
 */

/**
 * 微信登录
 * @param params 微信登录参数，包含code
 * @returns Promise 包含登录结果
 */
export function wxLogin(data: { code: string }) {
  return http.post<IUserLogin>('/user/wxLogin', data)
}

/**
 * 刷新token参数
 */
export interface IRefreshTokenParams {
  refreshToken: string
}

/**
 * 刷新token返回结果
 */
export interface IRefreshTokenResult {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

/**
 * 刷新accessToken
 * @param refreshToken 刷新令牌
 * @returns Promise 包含新的token信息
 */
export function refreshToken(data: IRefreshTokenParams) {
  return http.post<IRefreshTokenResult>(`${localhost}/api/user/refresh`, data)
}
