import type { CustomRequestOptions } from '@/interceptors/request'

// 本地127.0.0.1:7001
// 服务器47.118.26.28:7001
// const localhost = 'http://localhost:7001'
const localhost = 'https://richardq.tech'
/**
 * 刷新token返回结果
 */
interface IRefreshTokenResult {
  code: number
  data: {
    accessToken: string
    refreshToken: string
    expiresIn: number
  }
  msg: string
}

// 是否正在刷新token
let isRefreshing = false
// 等待token刷新完成的请求队列
let requestQueue: Array<{
  resolve: (value: unknown) => void
  reject: (reason?: any) => void
  options: CustomRequestOptions
}> = []

/**
 * 处理请求队列
 * @param newToken 新的accessToken
 */
function processQueue(newToken: string) {
  requestQueue.forEach((request) => {
    request.options.header = {
      ...request.options.header,
      Authorization: `Bearer ${newToken}`,
    }
    executeRequest(request.options).then(request.resolve).catch(request.reject)
  })
  requestQueue = []
}

function clearAllToken() {
  uni.removeStorageSync('accessToken')
  uni.removeStorageSync('refreshToken')
  uni.removeStorageSync('accessTokenExpiresAt')
  uni.removeStorageSync('token')
}
/**
 * 执行实际请求
 */
function executeRequest<T>(options: CustomRequestOptions): Promise<IResData<T>> {
  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      dataType: 'json',
      // #ifndef MP-WEIXIN
      responseType: options.responseType || 'json',
      // #endif
      success(res) {
        // 状态码 2xx
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as IResData<T>)
        }
        else if (res.statusCode === 401) {
          // 401错误 -> 清理用户信息，跳转到登录页
          clearAllToken()
          uni.redirectTo({ url: '/pages/login/login' })
          reject(new Error('登录已过期，请重新登录'))
        }
        else {
          // 其他错误 -> 根据后端错误信息轻提示
          if (!options.hideErrorToast) {
            uni.showToast({
              icon: 'none',
              title: (res.data as IResData<T>).msg || '请求错误',
            })
          }
          reject(res)
        }
      },
      fail(err) {
        uni.showToast({
          icon: 'none',
          title: '网络错误，换个网络试试',
        })
        reject(err)
      },
    })
  })
}

/**
 * 刷新accessToken
 */
async function doRefreshToken(): Promise<string | null> {
  const refreshToken = uni.getStorageSync('refreshToken')

  if (!refreshToken) {
    return null
  }

  try {
    const res = await uni.request({
      url: `${localhost}/api/user/refresh`,
      method: 'POST',
      data: { refreshToken },
      dataType: 'json',
    })

    if (res.statusCode === 200 && (res.data as IRefreshTokenResult).code === 200) {
      const { accessToken, refreshToken: newRefreshToken, expiresIn } = (res.data as IRefreshTokenResult).data

      // 更新存储的token
      const expiresAt = Date.now() + expiresIn * 1000
      uni.setStorageSync('accessToken', accessToken)
      uni.setStorageSync('refreshToken', newRefreshToken)
      uni.setStorageSync('accessTokenExpiresAt', expiresAt)
      uni.setStorageSync('token', accessToken) // 兼容旧版本

      return accessToken
    }
    else {
      // 刷新失败，清除所有token
      clearAllToken()
      return null
    }
  }
  catch (error) {
    clearAllToken()
    return null
  }
}

/**
 * 判断是否为无效 token 字符串
 */
function isInvalidTokenStr(val: any): boolean {
  return !val || val === 'null' || val === 'undefined'
}

/**
 * 获取有效的accessToken
 */
function getValidAccessToken(): string | null {
  const accessToken = uni.getStorageSync('accessToken')
  const expiresAt = uni.getStorageSync('accessTokenExpiresAt')

  console.log('[http] getValidAccessToken:', { accessToken: accessToken ? 'exists' : 'null', expiresAt })

  if (isInvalidTokenStr(accessToken) || !expiresAt) {
    console.log('[http] no token or expiresAt, return null')
    return null
  }

  const now = Date.now()
  // 预留5分钟缓冲时间
  if (expiresAt > now + 5 * 60 * 1000) {
    console.log('[http] token is valid')
    return accessToken
  }

  console.log('[http] token expired or will expire soon')
  return null
}

/**
 * 检查token是否需要刷新（即将过期）
 */
function shouldRefreshToken(): boolean {
  const accessToken = uni.getStorageSync('accessToken')
  const expiresAt = uni.getStorageSync('accessTokenExpiresAt')
  const refreshToken = uni.getStorageSync('refreshToken')

  if (isInvalidTokenStr(accessToken) || !expiresAt || isInvalidTokenStr(refreshToken)) {
    return false
  }

  const now = Date.now()
  // 5分钟内过期，需要刷新
  return expiresAt > now && expiresAt < now + 5 * 60 * 1000
}

export function http<T>(options: CustomRequestOptions) {
  return new Promise<IResData<T>>((resolve, reject) => {
    console.log('[http] request:', options.url, 'requireAuth:', options.requireAuth)

    // 1. 检查是否需要认证
    if (options.requireAuth) {
      // 2. 获取有效的accessToken
      const accessToken = getValidAccessToken()
      console.log('[http] accessToken from getValidAccessToken:', accessToken ? 'exists' : 'null')

      // 3. 如果没有有效token，检查是否需要刷新
      if (!accessToken) {
        const refreshTokenValue = uni.getStorageSync('refreshToken')
        console.log('[http] no valid accessToken, refreshToken:', refreshTokenValue ? 'exists' : 'null')

        // 没有refreshToken，说明未登录
        if (isInvalidTokenStr(refreshTokenValue)) {
          console.log('[http] no refreshToken, redirect to login')
          uni.redirectTo({ url: '/pages/login/login' })
          reject(new Error('未登录，请先登录'))
          return
        }

        // 有refreshToken，尝试刷新
        if (isRefreshing) {
          // 正在刷新中，加入队列等待
          console.log('[http] token is refreshing, add to queue')
          requestQueue.push({ resolve, reject, options })
          return
        }

        // 开始刷新token
        console.log('[http] start refreshing token')
        isRefreshing = true
        doRefreshToken()
          .then((newToken) => {
            isRefreshing = false
            if (newToken) {
              // 刷新成功，处理队列中的请求
              processQueue(newToken)
              // 当前请求继续执行
              options.header = {
                ...options.header,
                Authorization: `Bearer ${newToken}`,
              }
              executeRequest<T>(options).then(resolve).catch(reject)
            }
            else {
              // 刷新失败，清空队列并跳转登录
              requestQueue.forEach((request) => {
                request.reject(new Error('登录已过期，请重新登录'))
              })
              requestQueue = []
              uni.redirectTo({ url: '/pages/login/login' })
              reject(new Error('登录已过期，请重新登录'))
            }
          })
          .catch((error) => {
            isRefreshing = false
            requestQueue.forEach((request) => {
              request.reject(error)
            })
            requestQueue = []
            uni.redirectTo({ url: '/pages/login/login' })
            reject(error)
          })
        return
      }

      // 4. 检查是否需要提前刷新token（即将过期）
      if (shouldRefreshToken() && !isRefreshing) {
        // 异步刷新token，不影响当前请求
        isRefreshing = true
        doRefreshToken().finally(() => {
          isRefreshing = false
        })
      }

      // 5. 添加Authorization请求头
      options.header = {
        ...options.header,
        Authorization: `Bearer ${accessToken}`,
      }
    }

    // 6. 执行请求
    executeRequest<T>(options).then(resolve).catch(reject)
  })
}

/**
 * GET 请求
 * @param url 后台地址
 * @param query 请求query参数
 * @param header 请求头，默认为json格式
 * @returns
 */
export function httpGet<T>(url: string, query?: Record<string, any>, header?: Record<string, any>, options?: Partial<CustomRequestOptions>) {
  return http<T>({
    url,
    query,
    method: 'GET',
    header,
    ...options,
  })
}

/**
 * POST 请求
 * @param url 后台地址
 * @param data 请求body参数
 * @param query 请求query参数，post请求也支持query，很多微信接口都需要
 * @param header 请求头，默认为json格式
 * @returns
 */
export function httpPost<T>(url: string, data?: Record<string, any>, query?: Record<string, any>, header?: Record<string, any>, options?: Partial<CustomRequestOptions>) {
  return http<T>({
    url,
    query,
    data,
    method: 'POST',
    header,
    ...options,
  })
}

/**
 * PUT 请求
 */
export function httpPut<T>(url: string, data?: Record<string, any>, query?: Record<string, any>, header?: Record<string, any>, options?: Partial<CustomRequestOptions>) {
  return http<T>({
    url,
    data,
    query,
    method: 'PUT',
    header,
    ...options,
  })
}

/**
 * DELETE 请求（无请求体，仅 query）
 */
export function httpDelete<T>(url: string, query?: Record<string, any>, header?: Record<string, any>, options?: Partial<CustomRequestOptions>) {
  return http<T>({
    url,
    query,
    method: 'DELETE',
    header,
    ...options,
  })
}

http.get = httpGet
http.post = httpPost
http.put = httpPut
http.delete = httpDelete
