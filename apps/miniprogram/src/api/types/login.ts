/**
 * 用户信息
 */
export interface IUserInfoVo {
  username: string
  role: string
  token: string
  activityId?: string
  maxSelectNum?: number
}

/**
 * 登录返回的信息（双token版本）
 */
export interface IUserLogin {
  id: string
  username: string
  role: string
  /** 访问令牌，短期有效 */
  accessToken: string
  /** 刷新令牌，长期有效 */
  refreshToken: string
  /** 访问令牌过期时间（秒） */
  expiresIn?: number
}

/**
 * 获取验证码
 */
export interface ICaptcha {
  captchaEnabled: boolean
  uuid: string
  image: string
}
/**
 * 上传成功的信息
 */
export interface IUploadSuccessInfo {
  fileId: number
  originalName: string
  fileName: string
  storagePath: string
  fileHash: string
  fileType: string
  fileBusinessType: string
  fileSize: number
}
/**
 * 更新用户信息
 */
export interface IUpdateInfo {
  id: number
  name: string
  sex: string
}
/**
 * 更新用户信息
 */
export interface IUpdatePassword {
  id: number
  oldPassword: string
  newPassword: string
  confirmPassword: string
}
