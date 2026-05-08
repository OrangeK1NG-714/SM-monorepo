<!-- 路由配置保持不变 -->
<route lang="json5">
{
layout: 'default',
  style: {
    navigationBarTitleText: '首页',
  },
}
</route>

<script lang="ts" setup>
// 脚本部分保持不变
import { ref } from 'vue'
import { isStudentInActivity } from '@/api/stdInfo'
import { isTeacherInActivity } from '@/api/teaInfo'
import { getActivityList, getUserDetail } from '@/api/useraction'
import { useUserStore } from '@/store/user'

defineOptions({
  name: 'Home',
})

const IOS_BLUE = '#0A84FF'

const useStore = useUserStore()
console.log(useStore.userInfo)

const nowDate = ref(new Date())
// console.log(nowDate)

const role = ref()
const name = ref()
const activeTab = ref('ongoing')
const ongoingList = ref<Array<any>>([])
const endedList = ref<Array<any>>([])
// console.log(ongoingList.value)
// console.log(endedList.value)

const selectedActivity = ref<any | null>(null)

function formatDateRange(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const sText = `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, '0')}-${String(s.getDate()).padStart(2, '0')}`
  const eText = `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, '0')}-${String(e.getDate()).padStart(2, '0')}`
  return `${sText} ~ ${eText}`
}

// 分类活动函数
function classifyActivities(activities: Array<any>) {
  const now = nowDate.value

  activities.forEach((activity) => {
    const startDate = new Date(activity.startDate)
    const endDate = new Date(activity.endDate)

    if (now >= startDate && now <= endDate) {
      // 进行中的活动
      ongoingList.value.push({
        id: activity._id,
        name: activity.name,
        description: activity.description,
        startDate: activity.startDate,
        endDate: activity.endDate,
      })
    }
    else {
      // 已结束的活动
      endedList.value.push({
        id: activity._id,
        name: activity.name,
        description: activity.description,
        startDate: activity.startDate,
        endDate: activity.endDate,
      })
    }
  })
}

function switchTab(tab: string) {
  activeTab.value = tab
}

const showDetailModal = ref(false)
const detailDescription = ref('')
function viewDetail(item: any) {
  showDetailModal.value = true
  selectedActivity.value = item
  detailDescription.value = item.description
}

function myStudent(id: string) {
  useStore.setActivityId(id)
  uni.navigateTo({
    url: '/pages/myStudent/index',
  })
}

function myVolunteer(id: string) {
  useStore.setActivityId(id)
  uni.navigateTo({
    url: '/pages/myAmbition/index',
  })
}

function openMyVolunteer() {
  uni.navigateTo({
    url: '/pages/myAmbition/index',
  })
}

function openMyStudent() {
  uni.navigateTo({
    url: '/pages/myStudent/index',
  })
}

async function enterSystem(id: string) {
  uni.showToast({ title: '进入中…', icon: 'none' })
  console.log(id)
  console.log(useStore.userInfo.username)
  if (useStore.userInfo.role === 'student') {
    const res = await isStudentInActivity(id, useStore.userInfo.username)
    console.log(res)
    useStore.setActivityId(id)
    if (res.code === 200) {
      uni.navigateTo({
        url: '/pages/s_choose/index',
      })
    }
    else {
      uni.showToast({ title: '您不在此活动中！(有疑问请联系管理员)', icon: 'none' })
    }
  }
  else if (useStore.userInfo.role === 'teacher') {
    const res = await isTeacherInActivity(id, useStore.userInfo.username)
    console.log(res)
    useStore.setActivityId(id)
    if (res.code === 200) {
      uni.navigateTo({
        url: '/pages/t_choose/index',
      })
    }
    else {
      uni.showToast({ title: '您不在此活动中！(有疑问请联系管理员)', icon: 'none' })
    }
  }
}

// 安全区域处理保持不变
let safeAreaInsets
let systemInfo

// #ifdef MP-WEIXIN
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
systemInfo = uni.getSystemInfoSync()
safeAreaInsets = systemInfo.safeAreaInsets
// #endif

onLoad(async () => {
  const res: any = await getActivityList()
  console.log(res)

  if (useStore.userInfo?.role === 'student') {
    // 先检查用户是否在每个活动中
    const promises = res.map(async (item) => {
      return await isStudentInActivity(item._id, useStore.userInfo?.username)
    })
    const asd = await Promise.all(promises)
    console.log(asd)

    // 过滤出用户参与的活动
    const userActivities = res.filter((item, index) => {
      return asd[index].code === 200
    })
    console.log('用户参与的活动:', userActivities)

    // 再根据时间分类活动
    classifyActivities(userActivities as any)
    console.log('进行中的活动:', ongoingList.value)
    console.log('已结束的活动:', endedList.value)
  }
  else {
    // 先检查用户是否在每个活动中
    const promises = res.map(async (item) => {
      return await isTeacherInActivity(item._id, useStore.userInfo?.username)
    })
    const asd = await Promise.all(promises)
    console.log(asd)

    // 过滤出用户参与的活动
    const userActivities = res.filter((item, index) => {
      return asd[index].code === 200
    })
    console.log('用户参与的活动:', userActivities)

    // 再根据时间分类活动
    classifyActivities(userActivities as any)
    console.log('进行中的活动:', ongoingList.value)
    console.log('已结束的活动:', endedList.value)
  }

  // 从服务器查询用户信息
  const userDetail: any = await getUserDetail(useStore.userInfo?.username, useStore.userInfo?.role)
  console.log(userDetail)
  // 新增赋值逻辑
  role.value = useStore.userInfo?.role
  if (role.value === 'student') {
    name.value = userDetail.data.data.name
  }
  else if (role.value === 'teacher') {
    name.value = userDetail.data.name
  }
})
</script>

<template>
  <view class="ios-page" :style="{ paddingTop: `${safeAreaInsets?.top || 0}px` }">
    <view class="px-5 pt-6">
      <template v-if="role === 'student'">
        <view class="ios-title">
          你好，{{ name }}
        </view>
        <view class="ios-subtitle mt-2">
          请选择活动后进入系统，开始选择导师。
        </view>
      </template>
      <template v-else-if="role === 'teacher'">
        <view class="ios-title">
          你好，{{ name }}
        </view>
        <view class="ios-subtitle mt-2">
          请选择活动后进入系统，开始选择学生。
        </view>
      </template>
      <template v-else>
        <view class="ios-title">
          信息未录入
        </view>
        <view class="ios-subtitle mt-2" style="color:#FF3B30;">
          请联系管理员完善信息
        </view>
      </template>

      <!-- Segmented Control -->
      <view class="ios-seg mt-6">
        <view
          class="ios-seg__item"
          :class="{ 'ios-seg__item--active': activeTab === 'ongoing' }"
          :style="activeTab === 'ongoing' ? { color: IOS_BLUE } : {}"
          @tap="switchTab('ongoing')"
        >
          进行中
        </view>
        <view
          class="ios-seg__item"
          :class="{ 'ios-seg__item--active': activeTab === 'ended' }"
          :style="activeTab === 'ended' ? { color: IOS_BLUE } : {}"
          @tap="switchTab('ended')"
        >
          已结束
        </view>
      </view>

      <view v-if="role === 'student' || role === 'teacher'" class="ios-quick-nav mt-4">
        <button
          v-if="role === 'student'"
          class="ios-btn ios-btn--secondary ios-quick-nav-btn"
          @tap="selectedActivity ? myVolunteer(selectedActivity.id) : openMyVolunteer()"
        >
          我的志愿
        </button>
        <button
          v-if="role === 'teacher'"
          class="ios-btn ios-btn--secondary ios-quick-nav-btn"
          @tap="selectedActivity ? myStudent(selectedActivity.id) : openMyStudent()"
        >
          我的学生
        </button>
      </view>
    </view>

    <!-- Activities -->
    <view class="px-5 pb-8 pt-5">
      <template v-if="activeTab === 'ongoing'">
        <view v-if="ongoingList.length === 0" class="ios-empty">
          暂无进行中的活动
        </view>
        <view v-for="item in ongoingList" :key="item.id" class="ios-card mb-4">
          <view class="ios-card__top">
            <view class="ios-card__title">
              {{ item.name }}
            </view>
            <view class="ios-badge" :style="{ backgroundColor: 'rgba(10, 132, 255, 0.12)', color: IOS_BLUE }">
              进行中
            </view>
          </view>
          <view class="ios-card__meta mt-2">
            {{ formatDateRange(item.startDate, item.endDate) }}
          </view>
          <view class="ios-card__desc mt-3">
            {{ item.description }}
          </view>
          <view class="ios-card__actions mt-4">
            <button class="ios-btn ios-btn--secondary" @tap="viewDetail(item)">
              详情
            </button>
            <button class="ios-btn ios-btn--primary" :style="{ backgroundColor: IOS_BLUE }" @tap="enterSystem(item.id)">
              进入系统
            </button>
          </view>
        </view>
      </template>

      <template v-else>
        <view v-if="endedList.length === 0" class="ios-empty">
          暂无已结束的活动
        </view>
        <view v-for="item in endedList" :key="item.id" class="ios-card ios-card--disabled mb-4">
          <view class="ios-card__top">
            <view class="ios-card__title">
              {{ item.name }}
            </view>
            <view class="ios-badge ios-badge--gray">
              已结束
            </view>
          </view>
          <view class="ios-card__meta mt-2">
            {{ formatDateRange(item.startDate, item.endDate) }}
          </view>
          <view class="ios-card__desc mt-3">
            {{ item.description }}
          </view>
          <view class="ios-card__actions mt-4">
            <button class="ios-btn ios-btn--secondary" disabled>
              详情
            </button>
            <button class="ios-btn ios-btn--primary" disabled>
              进入系统
            </button>
          </view>
        </view>
      </template>
    </view>
  </view>

  <!-- 详情弹窗 -->

  <wd-popup v-model="showDetailModal" custom-style="border-radius:40rpx;" position="bottom">
    <view class="ios-sheet">
      <view class="ios-sheet__handle" />
      <view class="ios-sheet__header">
        <view class="ios-sheet__title">
          {{ selectedActivity?.name || '活动详情' }}
        </view>
        <view v-if="selectedActivity" class="ios-sheet__meta">
          {{ formatDateRange(selectedActivity.startDate, selectedActivity.endDate) }}
        </view>
      </view>
      <scroll-view scroll-y class="ios-sheet__body">
        <view class="ios-sheet__text">
          {{ detailDescription }}
        </view>
      </scroll-view>
      <view class="ios-sheet__footer">
        <button
          v-if="role === 'student' && selectedActivity"
          class="ios-btn ios-btn--secondary"
          @tap="myVolunteer(selectedActivity.id)"
        >
          我的志愿
        </button>
        <button
          v-if="role === 'teacher' && selectedActivity"
          class="ios-btn ios-btn--secondary"
          @tap="myStudent(selectedActivity.id)"
        >
          我的学生
        </button>
        <button
          v-if="selectedActivity"
          class="ios-btn ios-btn--primary"
          :style="{ backgroundColor: IOS_BLUE }"
          @tap="enterSystem(selectedActivity.id)"
        >
          进入系统
        </button>
        <button class="ios-btn ios-btn--tertiary" @tap="showDetailModal = false">
          关闭
        </button>
      </view>
    </view>
  </wd-popup>
</template>

<style lang="css" scoped>
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
.ios-seg {
  background: rgba(17, 24, 39, 0.06);
  border-radius: 28rpx;
  padding: 8rpx;
  display: flex;
  gap: 8rpx;
}
.ios-seg__item {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  border-radius: 22rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: #6b7280;
}
.ios-seg__item--active {
  background: #ffffff;
  box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.08);
  color: #111827;
}
.ios-empty {
  padding: 40rpx 0;
  text-align: center;
  color: #6b7280;
  font-size: 26rpx;
}
.ios-card {
  background: #ffffff;
  border-radius: 32rpx;
  box-shadow: 0 10rpx 26rpx rgba(0, 0, 0, 0.06);
  padding: 26rpx;
}
.ios-card--disabled {
  opacity: 0.65;
}
.ios-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}
.ios-card__title {
  font-size: 32rpx;
  font-weight: 700;
  color: #111827;
  flex: 1;
  min-width: 0;
}
.ios-card__meta {
  font-size: 24rpx;
  color: #6b7280;
}
.ios-card__desc {
  font-size: 26rpx;
  color: #374151;
  line-height: 1.6;
  line-clamp: 2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.ios-badge {
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 600;
  white-space: nowrap;
}
.ios-badge--gray {
  background: rgba(17, 24, 39, 0.08);
  color: #374151;
}
.ios-card__actions {
  display: flex;
  gap: 16rpx;
}
.ios-btn {
  flex: 1;
  border-radius: 24rpx;
  padding: 18rpx 18rpx;
  font-size: 28rpx;
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
.ios-btn--tertiary {
  background: transparent;
  color: #6b7280;
}
.ios-btn:active {
  transform: scale(0.99);
  opacity: 0.92;
}
.ios-sheet {
  background: #ffffff;
  border-top-left-radius: 40rpx;
  border-top-right-radius: 40rpx;
  padding: 14rpx 18rpx 24rpx;
}
.ios-sheet__handle {
  width: 72rpx;
  height: 10rpx;
  border-radius: 999rpx;
  background: rgba(17, 24, 39, 0.12);
  margin: 8rpx auto 14rpx;
}
.ios-sheet__header {
  padding: 6rpx 10rpx 10rpx;
}
.ios-sheet__title {
  font-size: 32rpx;
  font-weight: 700;
  color: #111827;
}
.ios-sheet__meta {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #6b7280;
}
.ios-sheet__body {
  max-height: 60vh;
  padding: 10rpx 10rpx 0;
}
.ios-sheet__text {
  font-size: 26rpx;
  color: #374151;
  line-height: 1.7;
  padding-bottom: 10rpx;
}
.ios-sheet__footer {
  padding: 18rpx 10rpx 0;
  display: flex;
  gap: 14rpx;
}
.ios-quick-nav {
  display: flex;
  gap: 10rpx;
}
.ios-quick-nav-btn {
  width: 100%;
  padding: 16rpx 14rpx;
  font-size: 24rpx;
}
</style>
