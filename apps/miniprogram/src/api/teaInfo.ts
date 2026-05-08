// import type { IActivityList } from './types/userAction'
import { http } from '@/utils/http'

// const localhost = 'http://localhost:7001'
const localhost = 'https://richardq.tech'

interface ITeacherList {
  _id: string
  name: string
  teacherId: string
  msg: string
}

/**
 * 查询所有老师信息
 */
export function getTeacherList() {
  return http.get<ITeacherList>(`${localhost}/api/teacher/detail`, undefined, undefined, { requireAuth: true })
}

interface ISelectStd {
  studentId?: string
  teacherId?: string
  activityId?: string
  data?: object
  order?: number
}
/**
 *  老师选学生POST
 */
export function selectStudent(data: ISelectStd) {
  return http.post(`${localhost}/api/teacher/selectStudent`, data, undefined, undefined, { requireAuth: true })
}
/**
 *  老师选学生-即（修改学生选老师选项）
 */
export function updateChoose(data: ISelectStd) {
  return http.put(`${localhost}/api/student/updateTeacher`, data, undefined, undefined, { requireAuth: true })
}

/**
 *  老师取消选学生DELETE
 */
export function cancelSelect(data: ISelectStd) {
  return http.delete(`${localhost}/api/teacher/cancelSelect`, data, undefined, { requireAuth: true })
}

/**
 *  查询老师选学生状况GET
 */
export function getSelectState(data: ISelectStd) {
  return http.get(`${localhost}/api/teacher/getSelectList`, data, undefined, { requireAuth: true })
}

interface ITeacherListInActivity {
  _id: string
  activityId: string
  teacherId: string
}
/**
 * 查询某老师是否在活动中
 */
export function isTeacherInActivity(activityId: string, teacherId: string) {
  return http.get<ITeacherListInActivity>(`${localhost}/api/teacher/isInActivity`, {
    activityId,
    teacherId,
  }, undefined, { requireAuth: true })
}
/**
 * 查询老师的最大选择学生数
 */
export function getMaxSelectNum(teacherId: string, activityId: string) {
  return http.get(`${localhost}/api/user/getMaxSelectNum`, {
    teacherId,
    activityId,
  }, undefined, { requireAuth: true })
}
