<!-- 路由配置保持不变 -->
<route lang="json5">
{
  layout: "default",
  style: {
    navigationBarTitleText: "选择页面",
  },
}
</route>

<script lang="ts" setup>
import { onLoad } from '@dcloudio/uni-app'
// import { ref } from 'vue'
import { getTeacherListInActivity, selectTeacher } from '@/api/stdInfo'
import { getMaxSelectNum, getTeacherList } from '@/api/teaInfo'
import {
  getActivityDetail,
  getChooseCount,
  getChooseCountWithActivityId,
} from '@/api/useraction'
import { useUserStore } from '@/store/user'

const store = useUserStore()

// const localhost = 'http://localhost:7001'
const localhost = 'https://richardq.tech'

const IOS_BLUE = '#0A84FF'
const SUBSCRIBE_TEMPLATE_ID = 'eLfrwx8SgoCSv3vXzAQNUhdCXr69xg5mhMio_xFHd3U'

// 数据定义
const activeTab = ref('major') // 当前激活的选项卡
const showSubmitCard = ref(false) // 是否显示提交卡片
const scrollHeight = ref(0) // 滚动区域高度
const isProgressPage = ref(true) // 是否是进度页面

// 志愿列表
const majorList = ref<any[]>([])
const publicList = ref<any[]>([])
const peopleList = ref<any[]>([])

const selectedMentors = ref<Array<any>>([]) // 已选导师列表
const priority = ref([]) // 志愿优先级
const priorityOptions = ref([
  { label: '第一志愿', value: 1 },
  { label: '第二志愿', value: 2 },
  { label: '第三志愿', value: 3 },
])

// 中本判断位
const isEight = ref<boolean>(false)
// 志愿是否重复判断
const duplicates = ref()
// 当前活动的选择时间
const currentActivityTime = ref({
  stdChooseStartDate: new Date(),
  stdChooseEndDate: new Date(),
})

const imageUrl = ref('') // 存储图片URL
const showImage = ref(false) // 控制图片显示状态
const showTeacherSheet = ref(false)
const currentTeacher = ref<any | null>(null)

// 计算滚动区域高度
function calculateScrollHeight() {
  const systemInfo = uni.getSystemInfoSync()
  // 预留底部信息栏+底部导航栏，避免最后一项被遮挡
  scrollHeight.value = systemInfo.windowHeight - 280
}

// 切换选项卡
function switchTab(tab: string) {
  activeTab.value = tab
}

// 查看导师详情
async function viewDetail(data: any) {
  currentTeacher.value = data
  showTeacherSheet.value = true
  try {
    // 使用uni.downloadFile直接下载图片文件
    const downloadResult = await uni.downloadFile({
      url: `${localhost}/api/teacher/getTeacherResume?teacherId=${data.teacherId}`,
    })

    if (downloadResult.statusCode === 200) {
      // 直接使用临时文件路径显示图片
      imageUrl.value = downloadResult.tempFilePath
      showImage.value = true
    }
    else {
      uni.showToast({ title: '未获取到导师简历', icon: 'none' })
    }
  }
  catch (error) {
    uni.showToast({ title: '获取导师简历失败', icon: 'none' })
  }
}

// 切换选择状态
function toggleSelect(teacherId: string) {
  // 首先在所有列表中查找导师
  let teacher: any = null
  let listToUpdate: any[] = []
  let index = -1

  // 检查专业导师列表
  index = majorList.value.findIndex(item => item.teacherId === teacherId)
  if (index !== -1) {
    teacher = majorList.value[index]
    listToUpdate = majorList.value
  }
  // 检查公共导师列表
  else {
    index = publicList.value.findIndex(item => item.teacherId === teacherId)
    if (index !== -1) {
      teacher = publicList.value[index]
      listToUpdate = publicList.value
    }
    // 检查校友导师列表
    else {
      index = peopleList.value.findIndex(
        item => item.teacherId === teacherId,
      )
      if (index !== -1) {
        teacher = peopleList.value[index]
        listToUpdate = peopleList.value
      }
    }
  }

  // 如果没有找到导师，直接返回
  if (index === -1 || !teacher) {
    console.warn(`未找到导师ID: ${teacherId}`)
    return
  }

  const wasSelected = teacher.selected

  // 仅在新增选择时检查数量限制
  if (!wasSelected && selectedMentors.value.length >= 3) {
    uni.showToast({
      title: '最多只能选3个导师',
      icon: 'none',
      duration: 1000,
    })
    return
  }

  // 原子化更新数据
  const updatedList = [...listToUpdate]
  updatedList[index] = {
    ...teacher,
    selected: !wasSelected,
    number: wasSelected ? teacher.number - 1 : teacher.number + 1,
  }

  // 更新对应的列表
  if (listToUpdate === majorList.value) {
    majorList.value = updatedList
  }
  else if (listToUpdate === publicList.value) {
    publicList.value = updatedList
  }
  else if (listToUpdate === peopleList.value) {
    peopleList.value = updatedList
  }

  // 更新已选列表
  if (!wasSelected) {
    selectedMentors.value = [
      ...selectedMentors.value,
      {
        studentId: store.userInfo.username,
        teacherId: teacher.teacherId,
        activityId: store.userInfo.activityId,
        name: teacher.name,
      },
    ]
  }
  else {
    selectedMentors.value = selectedMentors.value.filter(
      item => item.teacherId !== teacherId,
    )
    // 同步清除对应志愿顺序
    const priorityIndex = priority.value.findIndex(
      (_, i) => selectedMentors.value[i]?.teacherId === teacherId,
    )
    if (priorityIndex !== -1) {
      priority.value.splice(priorityIndex, 1)
    }
  }

  console.log('更新后的已选导师:', selectedMentors.value)
}

// 切换提交卡片显示状态
function toggleSubmitCard() {
  showSubmitCard.value = !showSubmitCard.value
}

// 关闭提交卡片
function closeCard() {
  showSubmitCard.value = false
}

// 改变志愿优先级
function changePriority(e: any, index: number) {
  priority.value[index] = Number(e.detail.value) + 1
  console.log(typeof e.detail.value)

  console.log(priority.value)
  // 实时检查是否有重复
  duplicates.value = priority.value.filter(
    (p, i) => p !== undefined && priority.value.indexOf(p) !== i,
  )

  if (duplicates.value.length > 0) {
    uni.showToast({
      title: '志愿顺序不能重复！',
      icon: 'none',
    })
  }
}

// 提交志愿
// 请求微信小程序订阅消息授权
async function requestSubmitSubscribeMessage() {
  // 仅在微信小程序环境请求订阅消息
  // #ifdef MP-WEIXIN
  try {
    const result = await uni.requestSubscribeMessage({
      tmplIds: [SUBSCRIBE_TEMPLATE_ID],
    })

    console.log('订阅消息授权结果:', result)
  }
  catch (error) {
    console.warn('订阅消息授权请求失败:', error)
  }
  // #endif
}

async function handleSubmit() {
  // uni.showToast({ title: '志愿提交成功', icon: 'success' })
  // showSubmitCard.value = false

  // 1.检查是否选了3个导师
  if (selectedMentors.value.length !== 3) {
    uni.showToast({ title: '提交失败!请选择3个导师后再次提交!', icon: 'none' })
    showSubmitCard.value = false
    return
  }
  // 2. 检查是否所有导师都设置了志愿
  if (
    priority.value.length !== 3
    || priority.value.some(p => p === undefined || p === null)
  ) {
    uni.showToast({
      title: '请为所有导师设置志愿顺序',
      icon: 'none',
      duration: 2000,
    })
    return
  }
  // 3.检查是否志愿重复
  if (duplicates.value.length > 0) {
    uni.showToast({
      title: '志愿顺序不能重复！',
      icon: 'none',
      duration: 2000,
    })
    return
  }
  const nowDate = new Date()
  console.log(nowDate)
  const isIn
    = nowDate >= currentActivityTime.value.stdChooseStartDate
      && nowDate <= currentActivityTime.value.stdChooseEndDate
  console.log(isIn)
  if (!isIn) {
    uni.showToast({
      title: '当前不在活动时间内',
      icon: 'none',
      duration: 2000,
    })
    return
  }
  // // currentActivityTime.value.stdChooseStartDate = formatDate(currentActivityTime.value.stdChooseStartDate)
  // // currentActivityTime.value.stdChooseEndDate = new Date(currentActivityTime.value.stdChooseEndDate)
  // // console.log(currentActivityTime.value.stdChooseStartDate)
  // // console.log(currentActivityTime.value.stdChooseEndDate)

  // console.log(123)

  // 4-1.检查是否提交过志愿
  const isSubmit = await getChooseCountWithActivityId(
    store.userInfo.activityId,
    store.userInfo.username,
  )
  if (isSubmit.length > 0) {
    uni.showToast({
      title: '您已提交过志愿',
      icon: 'none',
      duration: 2000,
    })
    return
  }
  console.log(priority.value)

  // 4-2. 先请求一次性订阅消息授权（微信小程序）
  await requestSubmitSubscribeMessage()

  // 4-3. 提交志愿
  const submitData = selectedMentors.value.map((mentor, index) => ({
    activityId: store.userInfo.activityId,
    studentId: store.userInfo.username,
    teacherId: mentor.teacherId,
    order: priority.value[index],
    isChose: false,
    createTime: new Date().toString(),
    subscribeTemplateId: SUBSCRIBE_TEMPLATE_ID,
    subscribeStatus: 'requested',
  }))
  console.log(submitData)
  // 5. 提交数据
  try {
    for (const data of submitData) {
      const response = await selectTeacher(data)
      console.log('选择成功:', response)
    }
    uni.showToast({
      title: '提交成功',
      icon: 'success',
      duration: 2000,
    })
    uni.navigateTo({ url: '/pages/myAmbition/index' })
  }
  catch (error) {
    console.error('选择失败:', error)
    uni.showToast({
      title: error.data.msg,
      icon: 'none',
      duration: 2000,
    })
  }
}

// 导航到我的志愿
function navigateToMyChoices() {
  isProgressPage.value = true
  // uni.showToast({ title: '跳转到我的志愿页面', icon: 'none' })
  uni.navigateTo({ url: '/pages/myAmbition/index' })
}

// 导航到选择页面
function navigateToProgress() {
  isProgressPage.value = false
  uni.showToast({
    title: '在此页面中',
    icon: 'none',
    duration: 1000,
  })
}

// 阻止触摸移动
function preventTouchMove() {}

onLoad(() => {
  calculateScrollHeight()
})
onLoad(async () => {
  const store = useUserStore()
  console.log(store.userInfo)
  // 中本判断
  if (store.userInfo.username[store.userInfo.username.length - 5] === '8') {
    isEight.value = true
  }

  const res: any = await getTeacherList()
  const teacherList: any = await getTeacherListInActivity(
    useUserStore().userInfo.activityId,
  )
  console.log(res.data)
  console.log(teacherList)
  // 提取teacherList中所有的teacherId
  const existingTeacherIds = teacherList.map(teacher => teacher.teacherId)
  console.log(existingTeacherIds)

  // 获取所有导师的最大选择学生数
  res.data.map(async (item) => {
    const result: any = await getMaxSelectNum(
      item.teacherId,
      useUserStore().userInfo.activityId,
    )
    // console.log(result)
    if (result.maxSelectNum) {
      item.maxSelectedNum = result.maxSelectNum
    }
    // console.log(item)

    // item.maxSelectedNum = result.data.maxSelectNum
  })
  // 过滤res.data，只保留存在于existingTeacherIds中的老师
  const filteredTeachers = res.data.filter(teacher =>
    existingTeacherIds.includes(teacher.teacherId),
  )
  console.log(filteredTeachers)

  const requests = filteredTeachers.map(async (teacher) => {
    try {
      // const response =
      const response: any = await getChooseCount(
        teacher.teacherId,
        useUserStore().userInfo.activityId,
      )
      console.log(response)
      if (response.length > 0) {
        let selectedNum = 0
        for (let i = 0; i < response.length; i++) {
          if (response[i].isChose) {
            selectedNum++
          }
        }
        console.log(selectedNum)
        console.log(teacher)
        // if (teacher.maxSelectedNum === selectedNum) {
        //   return
        // }
        teacher.selectedNum = selectedNum
      }
      return {
        ...teacher,
        number: response.length,
        selected: false,
      }
    }
    catch (error) {
      console.error(`获取老师 ${teacher.name} 的选择学生数失败:`, error)
      // 如果请求失败，默认设为 0
      return {
        ...teacher,
        number: 0,
        selected: false,
      }
    }
  })
  // 等待所有异步请求完成
  const processedTeachers = await Promise.all(requests)
  console.log('原始数据:', processedTeachers)

  // 使用filter方法过滤掉已达到最大选择数的导师数据
  // 过滤条件：保留那些maxSelectedNum和selectedNum不相等的项
  const processedTeachersAfterFilter = processedTeachers.filter((item) => {
    // 如果maxSelectedNum和selectedNum存在且相等，则过滤掉
    if (
      item.maxSelectedNum !== undefined
      && item.selectedNum !== undefined
      && item.maxSelectedNum === item.selectedNum
    ) {
      console.log(
        `过滤掉导师：${item.name || item.teacherId} (已达到最大选择数: ${item.selectedNum}/${item.maxSelectedNum})`,
      )
      return false
    }
    // 其他情况保留
    return true
  })

  console.log('过滤后的数据:', processedTeachersAfterFilter)
  // 后续可以使用filteredTeachers替代processedTeachers进行分类和显示
  // 根据teacherType分类数据
  majorList.value = []
  publicList.value = []
  peopleList.value = []

  processedTeachersAfterFilter.forEach((teacher) => {
    switch (teacher.teacherType) {
      case '0':
        majorList.value.push(teacher)
        break
      case '1':
        publicList.value.push(teacher)
        break
      case '2':
        peopleList.value.push(teacher)
        break
      default:
        console.warn(`未知的教师类型: ${teacher.teacherType}`, teacher)
    }
  })

  console.log('分类后的教师列表:', {
    majorList: majorList.value,
    publicList: publicList.value,
    peopleList: peopleList.value,
  })

  // 查询活动详情
  const res1: any = await getActivityDetail(useUserStore().userInfo.activityId)
  // console.log(res1)
  currentActivityTime.value.stdChooseEndDate = new Date(res1.stdChooseEndDate)
  currentActivityTime.value.stdChooseStartDate = new Date(
    res1.stdChooseStartDate,
  )
  console.log(currentActivityTime.value)
})
</script>

<template>
  <view class="ios-page s-choose-page">
    <view class="px-5 pt-6">
      <view class="ios-title">
        选择导师
      </view>
      <view class="ios-subtitle mt-2">
        选择 3 位导师，并设置志愿顺序后提交。
      </view>

      <view class="ios-seg mt-6">
        <view
          class="ios-seg__item"
          :class="{ 'ios-seg__item--active': activeTab === 'major' }"
          :style="activeTab === 'major' ? { color: IOS_BLUE } : {}"
          @tap="switchTab('major')"
        >
          专业
        </view>
        <view
          class="ios-seg__item"
          :class="{ 'ios-seg__item--active': activeTab === 'public' }"
          :style="activeTab === 'public' ? { color: IOS_BLUE } : {}"
          @tap="switchTab('public')"
        >
          公共
        </view>
        <view
          class="ios-seg__item"
          :class="{ 'ios-seg__item--active': activeTab === 'alumni' }"
          :style="activeTab === 'alumni' ? { color: IOS_BLUE } : {}"
          @tap="switchTab('alumni')"
        >
          校友
        </view>
      </view>
    </view>

    <scroll-view
      scroll-y
      class="s-choose-scroll px-5 pb-32 pt-5"
      :style="{ height: `${scrollHeight}px` }"
    >
      <!-- 专业导师列表 -->
      <template v-if="activeTab === 'major'">
        <view
          v-if="majorList.length === 0"
          class="py-10 text-center text-[26rpx] text-[#6B7280]"
        >
          暂无专业导师数据
        </view>
        <view
          v-for="item in majorList"
          :key="item.id"
          class="ios-card mb-4"
          style="padding: 0"
        >
          <view class="ios-cell">
            <view class="flex-1 text-[28rpx] text-[#111827] font-600">
              {{ item.name }}
            </view>
            <view
              class="text-[24rpx]"
              :class="
                item.number >= 36
                  ? 'text-[#FF3B30]'
                  : item.number >= 18
                    ? 'text-[#F59E0B]'
                    : 'text-[#0A84FF]'
              "
            >
              {{ item.number }}
            </view>
          </view>
          <view class="ios-divider" style="margin-left: 28rpx" />
          <view class="flex gap-3 px-4 pb-4 pt-3">
            <button
              class="ios-btn ios-btn--secondary flex-1"
              style="padding: 18rpx 18rpx; font-size: 28rpx"
              @tap="viewDetail(item)"
            >
              详情
            </button>
            <button
              class="ios-btn flex-1"
              :class="item.selected ? 'ios-btn--secondary' : 'ios-btn--primary'"
              :style="item.selected ? {} : { backgroundColor: IOS_BLUE }"
              style="padding: 18rpx 18rpx; font-size: 28rpx"
              @tap="toggleSelect(item.teacherId)"
            >
              {{ item.selected ? "已选" : "选择" }}
            </button>
          </view>
        </view>
      </template>

      <!-- 公共导师 -->
      <template v-else-if="activeTab === 'public'">
        <view
          v-if="publicList.length === 0"
          class="py-10 text-center text-[26rpx] text-[#6B7280]"
        >
          暂无公共导师数据
        </view>
        <view
          v-for="item in publicList"
          :key="item.id"
          class="ios-card mb-4"
          style="padding: 0"
        >
          <view class="ios-cell">
            <view class="flex-1 text-[28rpx] text-[#111827] font-600">
              {{ item.name }}
            </view>
            <view
              class="text-[24rpx]"
              :class="
                item.number >= 36
                  ? 'text-[#FF3B30]'
                  : item.number >= 18
                    ? 'text-[#F59E0B]'
                    : 'text-[#0A84FF]'
              "
            >
              {{ item.number }}
            </view>
          </view>
          <view class="ios-divider" style="margin-left: 28rpx" />
          <view class="flex gap-3 px-4 pb-4 pt-3">
            <button
              class="ios-btn ios-btn--secondary flex-1"
              style="padding: 18rpx 18rpx; font-size: 28rpx"
              @tap="viewDetail(item)"
            >
              详情
            </button>
            <button
              class="ios-btn flex-1"
              :class="item.selected ? 'ios-btn--secondary' : 'ios-btn--primary'"
              :style="item.selected ? {} : { backgroundColor: IOS_BLUE }"
              style="padding: 18rpx 18rpx; font-size: 28rpx"
              @tap="toggleSelect(item.teacherId)"
            >
              {{ item.selected ? "已选" : "选择" }}
            </button>
          </view>
        </view>
      </template>

      <!-- 校友导师 -->
      <template v-else>
        <view
          v-if="peopleList.length === 0"
          class="py-10 text-center text-[26rpx] text-[#6B7280]"
        >
          暂无校友导师数据
        </view>
        <view
          v-for="item in peopleList"
          :key="item.id"
          class="ios-card mb-4"
          style="padding: 0"
        >
          <view class="ios-cell">
            <view class="flex-1 text-[28rpx] text-[#111827] font-600">
              {{ item.name }}
            </view>
            <view
              class="text-[24rpx]"
              :class="
                item.number >= 36
                  ? 'text-[#FF3B30]'
                  : item.number >= 18
                    ? 'text-[#F59E0B]'
                    : 'text-[#0A84FF]'
              "
            >
              {{ item.number }}
            </view>
          </view>
          <view class="ios-divider" style="margin-left: 28rpx" />
          <view class="flex gap-3 px-4 pb-4 pt-3">
            <button
              class="ios-btn ios-btn--secondary flex-1"
              style="padding: 18rpx 18rpx; font-size: 28rpx"
              @tap="viewDetail(item)"
            >
              详情
            </button>
            <button
              class="ios-btn flex-1"
              :class="item.selected ? 'ios-btn--secondary' : 'ios-btn--primary'"
              :style="item.selected ? {} : { backgroundColor: IOS_BLUE }"
              style="padding: 18rpx 18rpx; font-size: 28rpx"
              @tap="toggleSelect(item.teacherId)"
            >
              {{ item.selected ? "已选" : "选择" }}
            </button>
          </view>
        </view>
      </template>
    </scroll-view>

    <!-- 已选导师信息栏 -->
    <view
      class="selected-mentors-bar fixed bottom-16 left-0 right-0 z-50 h-12 flex items-center justify-between border-t border-gray-200 bg-[#F2F2F7] px-5"
    >
      <view class="selected-mentors-bar-mentors-info flex items-center">
        <text class="text-[24rpx] text-[#6B7280]">
          已选导师：
        </text>
        <text
          v-if="selectedMentors.length > 0"
          class="ml-2 text-[26rpx] text-[#111827] font-700"
        >
          {{ selectedMentors.length }}位
        </text>
        <text v-else class="ml-2 text-[26rpx] text-[#9CA3AF]">
          暂无选择
        </text>
      </view>
      <view class="selected-mentors-bar-submit-btn-container">
        <button
          class="ios-btn ios-btn--secondary"
          style="padding: 14rpx 18rpx; font-size: 26rpx"
          @tap="toggleSubmitCard"
        >
          {{ showSubmitCard ? "收起" : "展开提交" }}
        </button>
      </view>
    </view>

    <!-- 底部固定导航栏 -->
    <view
      class="bottom-nav fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-3 py-4"
    >
      <button
        class="ios-btn nav-switch-btn mx-1 flex-1"
        :class="isProgressPage ? 'ios-btn--secondary' : 'ios-btn--primary'"
        :style="isProgressPage ? {} : { backgroundColor: IOS_BLUE }"
        @tap="navigateToMyChoices"
      >
        我的志愿
      </button>
      <button
        class="ios-btn nav-switch-btn mx-1 flex-1"
        :class="isProgressPage ? 'ios-btn--primary' : 'ios-btn--secondary'"
        :style="isProgressPage ? { backgroundColor: IOS_BLUE } : {}"
        @tap="navigateToProgress"
      >
        选择页面
      </button>
    </view>

    <!-- 提交卡片 -->
    <view
      class="submit-card fixed left-0 right-0 z-50 bg-white p-4 shadow-lg transition-all duration-300"
      :class="{ 'bottom-0': showSubmitCard, '-bottom-full': !showSubmitCard }"
      @touchmove="preventTouchMove"
    >
      <view class="ios-sheet__handle" />
      <view class="card-header mb-4 flex items-center justify-between px-1">
        <text class="text-[30rpx] text-[#111827] font-700">
          设置志愿顺序
        </text>
      </view>
      <view class="card-content">
        <view
          v-for="(item, index) in selectedMentors"
          :key="item.id"
          class="mentor-item border-b border-gray-100 py-3"
        >
          <text class="mentor-name">
            {{ item.name }}
          </text>
          <picker
            mode="selector"
            :range="priorityOptions"
            range-key="label"
            :value="priority[index] || 0"
            class="priority-picker mt-2 block border border-gray-200 rounded p-2"
            @change="(e) => changePriority(e, index)"
          >
            <view class="picker">
              {{
                priorityOptions[priority[index] - 1]?.label || "未选择志愿顺序"
              }}
            </view>
          </picker>
        </view>
      </view>
      <button
        class="ios-btn ios-btn--primary mt-6 w-full"
        :style="{ backgroundColor: IOS_BLUE }"
        @tap="handleSubmit"
      >
        确认提交
      </button>
    </view>

    <!-- 遮罩层 -->
    <view
      v-if="showSubmitCard"
      class="mask fixed bottom-0 left-0 right-0 top-0 z-40 bg-black bg-opacity-50"
      @tap="toggleSubmitCard"
    />
  </view>
  <!-- 图片显示模态框 -->
  <view
    v-if="showImage"
    class="image-modal fixed inset-0 z-60 flex flex-col items-center justify-center bg-black bg-opacity-80"
  >
    <view class="image-container max-h-[80vh] w-full">
      <image :src="imageUrl" mode="widthFix" class="max-h-[80vh] w-full" />
    </view>
    <button
      class="close-image-btn mt-6 rounded-full bg-white/20 p-3 text-white"
      @tap="showImage = false"
    >
      关闭
    </button>
  </view>

  <!-- 导师详情 sheet -->
  <wd-popup
    v-model="showTeacherSheet"
    custom-style="border-radius:40rpx;"
    position="bottom"
  >
    <view class="ios-sheet">
      <view class="ios-sheet__handle" />
      <view class="px-3 pb-2">
        <view class="text-[32rpx] text-[#111827] font-700">
          {{ currentTeacher?.name || "导师详情" }}
        </view>
        <view class="mt-2 text-[24rpx] text-[#6B7280]">
          查看简历后可返回选择。
        </view>
      </view>
      <view v-if="imageUrl" class="px-3 pb-4">
        <image
          :src="imageUrl"
          mode="widthFix"
          class="w-full"
          style="border-radius: 24rpx"
        />
      </view>
      <view class="flex flex-col gap-3 px-3 pt-2">
        <button
          v-if="currentTeacher"
          class="ios-btn"
          :class="
            currentTeacher.selected ? 'ios-btn--secondary' : 'ios-btn--primary'
          "
          :style="currentTeacher.selected ? {} : { backgroundColor: IOS_BLUE }"
          @tap="toggleSelect(currentTeacher.teacherId)"
        >
          {{ currentTeacher.selected ? "取消选择" : "选择该导师" }}
        </button>
        <button
          class="ios-btn ios-btn--secondary"
          @tap="showTeacherSheet = false"
        >
          关闭
        </button>
      </view>
    </view>
  </wd-popup>
</template>

<style scoped>
.s-choose-page {
  width: 100%;
  overflow-x: hidden;
}

.s-choose-scroll {
  width: 90%;
  overflow-x: hidden;
}

.s-choose-scroll :deep(.uni-scroll-view-content) {
  width: 100%;
  scrollbar-width: none;
}

.s-choose-scroll button {
  margin-left: 0;
  margin-right: 0;
}

.bottom-nav {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.nav-switch-btn {
  width: auto;
  min-width: 0;
  padding: 20rpx 12rpx;
  font-size: 32rpx;
}
</style>
