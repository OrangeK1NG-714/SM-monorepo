<!-- 使用 type="home" 属性设置首页，其他页面不需要设置，默认为page；推荐使用json5，更强大，且允许注释 -->
<route lang="json5">
{
  style: {
    navigationBarTitleText: '老师选择页面',
  },
}
</route>

<script lang="ts" setup>
import { getStudentMsg } from '@/api/stdInfo'
import { cancelSelect, getMaxSelectNum, getSelectState, selectStudent, updateChoose } from '@/api/teaInfo'
import { getActivityList, getChooseCount, getMaxChooseNum } from '@/api/useraction'
import { useUserStore } from '@/store/user'

const IOS_BLUE = '#0A84FF'

const userStore = useUserStore()
console.log(userStore.userInfo)

const tabbar = ref('t_choose')// 底部导航栏

// 获取屏幕边界到安全区域距离
const safeAreaInsets = ref<any>(null)

// 表单数据
const activeTab = ref('first')
const scrollHeight = ref(0)
const majorList = ref<any[]>([])
const testDate = ref<any[]>([])
const formattedDate = ref('')

const showSubmitCard = ref(false)
const currentTeacher = ref('')

const priority = ref<number[]>([])
const isProgressPage = ref(true)

const firstList = ref<any[]>([])
const firstChoseStudentList = ref<any[]>([])
const secondList = ref<any[]>([])
const secondChoseStudentList = ref<any[]>([])
const thirdList = ref<any[]>([])
const thirdChoseStudentList = ref<any[]>([])
const dialogVisible = ref(false)

const currentStudent = ref<any>(null)
// 已选择人数
const selectedNum = ref(0)
// 当前活动(获取时间信息)
const thisActivity = ref<any>(null)
const navItems = [
  { name: 'index', label: '首页' },
  { name: 'myStudent', label: '我的学生' },
  { name: 't_choose', label: '选择情况' },
]

onLoad(async () => {
  const res: any = await getChooseCount(userStore.userInfo.username, userStore.userInfo.activityId)
  console.log(res, 'test')
  await categorizeByPriority(res)
  firstChoseStudentList.value = firstList.value.filter(item => item.finalTeacher === item.teacherId)
  secondChoseStudentList.value = secondList.value.filter(item => item.finalTeacher === item.teacherId)
  thirdChoseStudentList.value = thirdList.value.filter(item => item.finalTeacher === item.teacherId)
  // 计算已选择人数
  selectedNum.value = firstChoseStudentList.value.length + secondChoseStudentList.value.length + thirdChoseStudentList.value.length
  console.log(selectedNum.value, 'selectedNum')

  const maxSelectedNum: any = await getMaxSelectNum(userStore.userInfo.username, userStore.userInfo.activityId)
  console.log(maxSelectedNum, 'maxSelectedNum')
  userStore.userInfo.maxSelectNum = maxSelectedNum.maxSelectNum
  console.log(userStore.userInfo.maxSelectNum, 'maxSelectNum')

  // 加载时间数据
  const teacherActivityList: any = await getActivityList()
  thisActivity.value = teacherActivityList.find(item => item._id === userStore.userInfo.activityId)
  console.log(thisActivity.value, 'thisActivity')

  formattedDate.value = formatDate(new Date())
  console.log(formattedDate.value, 'formattedDate.value')
})

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')

  // 使用 iOS 兼容的格式：yyyy-MM-ddTHH:mm:ss
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`
}

// async function fetchTimeData() {
//   try {
//     const res = await getChooseTime() // 假设有一个获取选择时间的API
//     testDate.value = res.data || []
//   }
//   catch (error) {
//     console.log('获取时间数据失败:', error)
//     uni.showToast({
//       title: '获取时间数据失败',
//       icon: 'none',
//     })
//   }
// }

// async function getChooseData(teacherName: string) {
//   try {
//     uni.showLoading({ title: '加载中...' })
//     const chooseRes = await cloudCallFunction('getChooseData', { mentor_name: teacherName })

//     const result = (chooseRes as { data: any[] }).data
//     majorList.value = result

//     // 提取学生ID并查询学生信息
//     const stdIds = result.map(item => item.std_id)

//     if (stdIds.length > 0) {
//       await getStudentData(stdIds)
//     }
//   }
//   catch (err) {
//     console.error('加载失败:', err)
//     uni.showToast({ title: '数据加载失败', icon: 'none' })
//   }
//   finally {
//     uni.hideLoading()
//   }
// }

// async function getStudentData(studentIDs: string[]) {
//   try {
//     const studentRes = await cloudCallFunction('getStudentData', { studentIDs })

//     const studentDataList = (studentRes as { data: any[] }).data

//     // 1. 合并数据到 majorList
//     const updatedMajorList = majorList.value.map((mentor) => {
//       const matchedStudent = studentDataList.find(student => student.studentId === mentor.std_id)

//       if (matchedStudent) {
//         return {
//           ...mentor,
//           studentInfo: {
//             name: matchedStudent.data.name,
//             gender: matchedStudent.data.gender,
//             studentId: matchedStudent.data.studentId,
//             grade: matchedStudent.data.grade,
//             class: matchedStudent.data.class,
//             phone: matchedStudent.data.phone,
//             qq: matchedStudent.data.qq,
//             wechat: matchedStudent.data.wechat,
//             gpa: matchedStudent.data.gpa,
//             direction: matchedStudent.data.direction,
//             portfolio: matchedStudent.data.portfolio,
//             resume: matchedStudent.data.resumeName,
//           },
//           mentor: matchedStudent.mentor,
//         }
//       }
//       return mentor
//     })

//     // 2. 更新数据
//     studentList.value = studentDataList
//     majorList.value = updatedMajorList

//     categorizeByPriority()
//   }
//   catch (error) {
//     console.error('获取学生数据失败:', error)
//     uni.showToast({ title: '加载学生信息失败', icon: 'none' })
//   }
// }

function calculateScrollHeight() {
  const query = uni.createSelectorQuery()
  query.select('.header').boundingClientRect()
  query.select('.footer').boundingClientRect()
  query.exec((res) => {
    const headerHeight = res[0].height
    const footerHeight = res[1].top
    scrollHeight.value = uni.getSystemInfoSync().windowHeight - headerHeight - footerHeight - 80
  })
}

function switchTab(e: any) {
  const targetTab = e.currentTarget.dataset.tab
  console.log(targetTab)

  // 检查当前时间是否在允许选择的时间范围内
  const currentTime = new Date().getTime()
  let isInTime = false

  if (targetTab === 'first' && thisActivity.value) {
    const start = new Date(thisActivity.value.firstChooseStartDate).getTime()
    const end = new Date(thisActivity.value.firstChooseEndDate).getTime()
    isInTime = currentTime >= start && currentTime <= end
  }
  else if (targetTab === 'second' && thisActivity.value) {
    const start = new Date(thisActivity.value.secondChooseStartDate).getTime()
    const end = new Date(thisActivity.value.secondChooseEndDate).getTime()
    isInTime = currentTime >= start && currentTime <= end
  }
  else if (targetTab === 'third' && thisActivity.value) {
    const start = new Date(thisActivity.value.thirdChooseStartDate).getTime()
    const end = new Date(thisActivity.value.thirdChooseEndDate).getTime()
    isInTime = currentTime >= start && currentTime <= end
  }

  // 如果没有活动数据，默认允许切换（防止系统出错时无法操作）
  if (!thisActivity.value) {
    isInTime = true
  }

  if (isInTime) {
    activeTab.value = targetTab
  }
  else {
    uni.showToast({
      title: `不在${targetTab === 'first' ? '第一' : targetTab === 'second' ? '第二' : '第三'}志愿选择时间内`,
      icon: 'none',
      duration: 2000,
    })
  }
}

function viewDetail(data: any) {
  console.log(data)

  if (data) {
    dialogVisible.value = true
    currentStudent.value = data
  }
}

function handleCloseDialog() {
  dialogVisible.value = false
}

function hideTeacherForm() {
  currentTeacher.value = ''
}

async function toggleSelect(item: any) {
  console.log(item)

  // 检查当前是否在允许选择的时间范围内
  const currentTime = new Date().getTime()
  let isInTime = false
  const targetTab = item.order === 1 ? 'first' : item.order === 2 ? 'second' : 'third'

  if (targetTab === 'first' && thisActivity.value) {
    const start = new Date(thisActivity.value.firstChooseStartDate).getTime()
    const end = new Date(thisActivity.value.firstChooseEndDate).getTime()
    isInTime = currentTime >= start && currentTime <= end
  }
  else if (targetTab === 'second' && thisActivity.value) {
    const start = new Date(thisActivity.value.secondChooseStartDate).getTime()
    const end = new Date(thisActivity.value.secondChooseEndDate).getTime()
    isInTime = currentTime >= start && currentTime <= end
  }
  else if (targetTab === 'third' && thisActivity.value) {
    const start = new Date(thisActivity.value.thirdChooseStartDate).getTime()
    const end = new Date(thisActivity.value.thirdChooseEndDate).getTime()
    isInTime = currentTime >= start && currentTime <= end
  }

  // 如果没有活动数据，默认允许操作（防止系统出错时无法操作）
  if (!thisActivity.value) {
    isInTime = true
  }

  if (!isInTime) {
    uni.showToast({
      title: `不在${targetTab === 'first' ? '第一' : targetTab === 'second' ? '第二' : '第三'}志愿选择时间内`,
      icon: 'none',
      duration: 2000,
    })
    return
  }

  try {
    if (item.isChose) {
      const res = await cancelSelect({
        studentId: item.studentId,
        teacherId: userStore.userInfo.username,
        activityId: item.activityId,
      })
      console.log(item.studentId, item.teacherId, item.activityId)
      console.log(res)
      item.isChose = false
      item.finalTeacher = '' // 清空最终选择的老师
      selectedNum.value--
    }
    else {
      console.log(userStore.userInfo.maxSelectNum)

      // 判断当前选择人数是否小于最大允许人数
      if (selectedNum.value >= userStore.userInfo.maxSelectNum) {
        uni.showToast({
          title: `已达到最大选择人数限制(${userStore.userInfo.maxSelectNum}人)`,
          icon: 'none',
        })
        return
      }

      const res = await selectStudent({
        studentId: item.studentId,
        teacherId: item.teacherId,
        activityId: item.activityId,
        data: item.data,
        order: item.order,
      })

      console.log(res)
      item.isChose = true
      item.finalTeacher = userStore.userInfo.username // 设置为当前老师
      selectedNum.value++
    }

    // 重新计算三个志愿学生列表，确保UI显示的数量能够实时更新
    firstChoseStudentList.value = firstList.value.filter(item => item.finalTeacher === item.teacherId)
    secondChoseStudentList.value = secondList.value.filter(item => item.finalTeacher === item.teacherId)
    thirdChoseStudentList.value = thirdList.value.filter(item => item.finalTeacher === item.teacherId)
  }
  catch (error) {
    console.log(error)
  }
  const updateRes = await updateChoose({
    studentId: item.studentId,
    teacherId: item.teacherId,
    activityId: item.activityId,
  })
  console.log(updateRes)
}

function updateLocalData(_id: string, newStatus: boolean) {
  const index = majorList.value.findIndex(item => item._id === _id)
  if (index !== -1) {
    majorList.value[index].isChoose = newStatus
  }
}

function toggleSubmitCard() {
  showSubmitCard.value = !showSubmitCard.value
}

function changePriority(e: any) {
  const index = e.currentTarget.dataset.index
  const value = Number.parseInt(e.detail.value)
  priority.value[index] = value
}

function preventTouchMove() {

}

function closeCard() {
  showSubmitCard.value = false
}

async function categorizeByPriority(res: any) {
  const firstListTemp: any[] = []
  const secondListTemp: any[] = []
  const thirdListTemp: any[] = []

  const request = res.map(async (item) => {
    try {
      const response = await getStudentMsg(item.studentId)
      const chooseState: any = await getSelectState({
        studentId: item.studentId,
        // teacherId: item.teacherId,
        activityId: item.activityId,
      })
      // console.log(chooseState)
      // console.log(chooseState.length)
      if (chooseState.length > 0) {
        return {
          ...item,
          isChose: true,
          finalTeacher: chooseState[0].teacherId,
          data: response.data,
        }
      }
      else {
        return {
          ...item,
          isChose: false,
          finalTeacher: '',
          data: response.data,
        }
      }
    }
    catch (error) {
      console.error('获取学生数据失败:', error)
      return {
        ...item,
        data: {
          name: '数据异常',
          gender: '',
          class: '',
          grade: '',
        },
      }
    }
  })

  const processedData = await Promise.all(request)
  console.log(processedData)

  processedData.forEach((item) => {
    // // 确保数据结构稳定
    // const standardizedItem = {
    //   ...item,
    //   data: {
    //     name: String(item.data.name || ''),
    //     gender: ['男', '女'].includes(item.data.gender) ? item.data.gender : '未知',
    //     class: item.data.class ? `班级 ${item.data.class}` : '未分班',
    //     grade: item.data.grade ? `${item.data.grade}级` : '未设置',
    //   },
    // }
    // console.log(processedData)

    // 分配优先级
    switch (item.order) {
      case 1:
        firstListTemp.push(item)
        break
      case 2:
        secondListTemp.push(item)
        break
      case 3:
        thirdListTemp.push(item)
        break
    }
  })

  // 响应式更新
  firstList.value = firstListTemp
  secondList.value = secondListTemp
  thirdList.value = thirdListTemp
  console.log(firstListTemp, secondListTemp, thirdListTemp)
}

function handleTabChange(e: any) {
  if (e !== 't_choose') {
    uni.navigateTo({
      url: `/pages/${e}/index`,
    })
  }
}
</script>

<template>
  <view class="ios-page" :style="{ paddingTop: `${safeAreaInsets?.top || 0}px` }">
    <view class="px-5 pt-6">
      <view class="ios-title">
        学生选择
      </view>
      <view class="ios-subtitle mt-2">
        按志愿查看学生，并在允许时间内进行选择。
      </view>

      <view class="ios-seg mt-6">
        <view
          class="ios-seg__item"
          :class="{ 'ios-seg__item--active': activeTab === 'first' }"
          :style="activeTab === 'first' ? { color: IOS_BLUE } : {}"
          data-tab="first"
          @click="switchTab"
        >
          第一志愿
        </view>
        <view
          class="ios-seg__item"
          :class="{ 'ios-seg__item--active': activeTab === 'second' }"
          :style="activeTab === 'second' ? { color: IOS_BLUE } : {}"
          data-tab="second"
          @click="switchTab"
        >
          第二志愿
        </view>
        <view
          class="ios-seg__item"
          :class="{ 'ios-seg__item--active': activeTab === 'third' }"
          :style="activeTab === 'third' ? { color: IOS_BLUE } : {}"
          data-tab="third"
          @click="switchTab"
        >
          第三志愿
        </view>
      </view>
    </view>
    <!-- 使用学生信息弹窗组件 -->
    <StudentDialog :visible="dialogVisible" :info="currentStudent" @close="handleCloseDialog" />
    <!-- 可滚动的内容区域 -->
    <scroll-view scroll-y class="w-90% px-5 pb-40 pt-5" :style="{ height: `500px` }">
      <!-- 第一志愿列表 -->
      <template v-if="activeTab === 'first'">
        <view v-if="firstList.length === 0" class="py-10 text-center text-[26rpx] text-[#6B7280]">
          暂无第一志愿学生
        </view>
        <view v-for="item in firstList" :key="item._id" class="ios-card mb-4" style="padding: 0;">
          <view class="ios-cell">
            <view class="flex-1">
              <view class="text-[28rpx] text-[#111827] font-700">
                {{ item.data?.name || '未设置名字' }}
                <text class="ml-2 text-[24rpx] text-[#6B7280] font-500">
                  {{ item.data?.gender || '' }}
                </text>
              </view>
              <view class="mt-1 text-[24rpx] text-[#6B7280]">
                {{ item.data?.classNum || '未设置班级' }} · {{ item.data?.grade || '未设置年级' }}
              </view>
            </view>
          </view>
          <view class="ios-divider" style="margin-left: 28rpx;" />
          <view class="flex gap-3 px-4 pb-4 pt-3">
            <button class="ios-btn ios-btn--secondary flex-1" style="padding: 18rpx 18rpx; font-size: 28rpx;" @click="viewDetail(item.data)">
              查看
            </button>
            <button
              class="ios-btn flex-1"
              :class="item.isChose ? 'ios-btn--primary' : (item.finalTeacher && item.finalTeacher !== item.teacherId ? 'ios-btn--secondary' : 'ios-btn--secondary')"
              :style="item.isChose ? { backgroundColor: IOS_BLUE } : {}"
              style="padding: 18rpx 18rpx; font-size: 28rpx;"
              :disabled="item.finalTeacher.length > 0 && item.finalTeacher !== item.teacherId"
              @click="toggleSelect(item)"
            >
              {{ item.finalTeacher === item.teacherId ? '已选' : (item.finalTeacher.length > 0 && item.finalTeacher !== item.teacherId) ? '被选走' : '选择' }}
            </button>
          </view>
        </view>
      </template>

      <!-- 第二志愿列表 -->
      <template v-if="activeTab === 'second'">
        <view v-if="secondList.length === 0" class="py-10 text-center text-[26rpx] text-[#6B7280]">
          暂无第二志愿学生
        </view>
        <view v-for="item in secondList" :key="item.std_id" class="ios-card mb-4" style="padding: 0;">
          <view class="ios-cell">
            <view class="flex-1">
              <view class="text-[28rpx] text-[#111827] font-700">
                {{ item.data?.name || '未设置名字' }}
                <text class="ml-2 text-[24rpx] text-[#6B7280] font-500">
                  {{ item.data?.gender || '' }}
                </text>
              </view>
              <view class="mt-1 text-[24rpx] text-[#6B7280]">
                {{ item.data?.classNum || '未设置班级' }} · {{ item.data?.grade || '未设置年级' }}
              </view>
            </view>
          </view>
          <view class="ios-divider" style="margin-left: 28rpx;" />
          <view class="flex gap-3 px-4 pb-4 pt-3">
            <button class="ios-btn ios-btn--secondary flex-1" style="padding: 18rpx 18rpx; font-size: 28rpx;" @click="viewDetail(item.data)">
              查看
            </button>
            <button
              class="ios-btn flex-1"
              :class="item.isChose ? 'ios-btn--primary' : (item.finalTeacher && item.finalTeacher !== item.teacherId ? 'ios-btn--secondary' : 'ios-btn--secondary')"
              :style="item.isChose ? { backgroundColor: IOS_BLUE } : {}"
              style="padding: 18rpx 18rpx; font-size: 28rpx;"
              :disabled="item.finalTeacher.length > 0 && item.finalTeacher !== item.teacherId"
              @click="toggleSelect(item)"
            >
              {{ item.finalTeacher === item.teacherId ? '已选' : (item.finalTeacher.length > 0 && item.finalTeacher !== item.teacherId) ? '被选走' : '选择' }}
            </button>
          </view>
        </view>
      </template>

      <!-- 第三志愿列表 -->
      <template v-if="activeTab === 'third'">
        <view v-if="thirdList.length === 0" class="py-10 text-center text-[26rpx] text-[#6B7280]">
          暂无第三志愿学生
        </view>
        <view v-for="item in thirdList" :key="item.std_id" class="ios-card mb-4" style="padding: 0;">
          <view class="ios-cell">
            <view class="flex-1">
              <view class="text-[28rpx] text-[#111827] font-700">
                {{ item.data?.name || '未设置名字' }}
                <text class="ml-2 text-[24rpx] text-[#6B7280] font-500">
                  {{ item.data?.gender || '' }}
                </text>
              </view>
              <view class="mt-1 text-[24rpx] text-[#6B7280]">
                {{ item.data?.classNum || '未设置班级' }} · {{ item.data?.grade || '未设置年级' }}
              </view>
            </view>
          </view>
          <view class="ios-divider" style="margin-left: 28rpx;" />
          <view class="flex gap-3 px-4 pb-4 pt-3">
            <button class="ios-btn ios-btn--secondary flex-1" style="padding: 18rpx 18rpx; font-size: 28rpx;" @click="viewDetail(item.data)">
              查看
            </button>
            <button
              class="ios-btn flex-1"
              :class="item.isChose ? 'ios-btn--primary' : (item.finalTeacher && item.finalTeacher !== item.teacherId ? 'ios-btn--secondary' : 'ios-btn--secondary')"
              :style="item.isChose ? { backgroundColor: IOS_BLUE } : {}"
              style="padding: 18rpx 18rpx; font-size: 28rpx;"
              :disabled="item.finalTeacher.length > 0 && item.finalTeacher !== item.teacherId"
              @click="toggleSelect(item)"
            >
              {{ item.finalTeacher === item.teacherId ? '已选' : (item.finalTeacher.length > 0 && item.finalTeacher !== item.teacherId) ? '被选走' : '选择' }}
            </button>
          </view>
        </view>
      </template>
    </scroll-view>

    <!-- 老师信息表单弹层 -->
    <view
      v-if="currentTeacher"
      class="form-modal fixed inset-0 z-999 flex items-center justify-center bg-black bg-opacity-50"
      @click="hideTeacherForm"
    >
      <view class="form-container h-full w-full" @click.stop="hideTeacherForm">
        <image
          class="teacher-avatar h-full w-full object-contain" :src="`/assets/teachers/${currentTeacher}.png`"
          mode="aspectFit"
        />
      </view>
    </view>

    <!-- 弹出的卡片 -->
    <view
      class="submit-card fixed left-0 right-0 z-1000 rounded-t-6 bg-white px-8 py-6 shadow-md transition-all duration-300"
      :class="showSubmitCard ? 'bottom-0' : 'bottom--100%'" @touchmove.prevent="preventTouchMove"
    >
      <view class="card-header mb-8 flex items-center justify-between">
        <text class="student-list-text flex-1 text-left text-xl font-bold">
          已选学生详情
        </text>
        <button class="close-btn m-0 h-15 w-15 bg-transparent p-0 text-2xl text-gray-500 leading-15" @click="closeCard">
          ×
        </button>
      </view>
      <view class="ios-summary-grid">
        <view class="ios-summary-item">
          <view class="ios-summary-label">
            第一志愿
          </view>
          <view class="ios-summary-value">
            {{ firstChoseStudentList.length }}
          </view>
        </view>
        <view class="ios-summary-item">
          <view class="ios-summary-label">
            第二志愿
          </view>
          <view class="ios-summary-value">
            {{ secondChoseStudentList.length }}
          </view>
        </view>
        <view class="ios-summary-item">
          <view class="ios-summary-label">
            第三志愿
          </view>
          <view class="ios-summary-value">
            {{ thirdChoseStudentList.length }}
          </view>
        </view>
      </view>
    </view>

    <!-- 遮罩层 -->
    <view v-if="showSubmitCard" class="mask fixed inset-0 z-999 bg-black bg-opacity-50" @click="toggleSubmitCard" />

    <view class="footer">
      <!-- 已选导师信息栏 -->
      <view class="selected-mentors-bar fixed bottom-20 left-0 right-0 z-50 px-5">
        <view class="ios-card ios-selected-card">
          <view class="ios-selected-title-row">
            <view class="text-[24rpx] text-[#6B7280]">
              总计 已选学生
            </view>
            <view class="text-[32rpx] text-[#111827] font-700">
              {{ selectedNum }} 名
            </view>
          </view>
          <view class="ios-selected-breakdown">
            <text>第一志愿 {{ firstChoseStudentList.length }}</text>
            <text>第二志愿 {{ secondChoseStudentList.length }}</text>
            <text>第三志愿 {{ thirdChoseStudentList.length }}</text>
          </view>
          <!-- <button class="ios-btn ios-btn--secondary mt-3 w-full" style="padding: 14rpx 18rpx; font-size: 26rpx;" @click="toggleSubmitCard">
            {{ showSubmitCard ? '收起详情' : '展开详情' }}
          </button> -->
        </view>
      </view>
      <!-- 底部固定导航栏 -->
      <view class="ios-bottom-nav fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-3 py-4">
        <button
          v-for="item in navItems"
          :key="item.name"
          class="ios-btn ios-bottom-nav-btn"
          :class="tabbar === item.name ? 'ios-btn--primary' : 'ios-btn--secondary'"
          :style="tabbar === item.name ? { backgroundColor: IOS_BLUE } : {}"
          @click="() => { tabbar = item.name; handleTabChange(item.name) }"
        >
          {{ item.label }}
        </button>
      </view>
      <!-- <view class="bottom-nav fixed bottom-0 left-0 right-0 z-100 flex border-t border-gray-200 bg-white p-3">
        <button
          class="nav-btn flex-1" :class="isProgressPage ? 'bg-gray-100 text-gray-500' : 'bg-blue-500 text-white'"
          @click="navigateToMyChoices"
        >
          我的学生
        </button>
        <button
          class="nav-btn ml-2 flex-1"
          :class="isProgressPage ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'"
        >
          查看选择情况
        </button>
      </view> -->
    </view>
  </view>
</template>

<style scoped>
.ios-selected-card {
  padding: 18rpx 22rpx;
}
.ios-selected-title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.ios-selected-breakdown {
  margin-top: 8rpx;
  display: flex;
  gap: 60rpx;
  font-size: 23rpx;
  color: #6b7280;
}
.ios-bottom-nav {
  display: flex;
  gap: 8rpx;
}
.ios-bottom-nav-btn {
  flex: 1;
  width: auto;
  min-width: 0;
  padding: 16rpx 10rpx;
  font-size: 24rpx;
}
.ios-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
}
.ios-summary-item {
  border-radius: 16rpx;
  background: rgba(17, 24, 39, 0.04);
  padding: 14rpx 12rpx;
  text-align: center;
}
.ios-summary-label {
  font-size: 22rpx;
  color: #6b7280;
}
.ios-summary-value {
  margin-top: 4rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #111827;
}
</style>
