<route lang="json5">
{
  style: {
    navigationBarTitleText: "我的学生",
  },
}
</route>

<script lang="ts" setup>
import { getSelectState } from '@/api/teaInfo'
import { useUserStore } from '@/store/user'

const IOS_BLUE = '#0A84FF'
const tabbar = ref('myStudent')
const userStore = useUserStore()
const scrollHeight = ref(0)
const studentList = ref<Array<any>>([])
const currentStudent = ref<any>(null)
const dialogVisible = ref(false)
const navItems = [
  { name: 'index', label: '首页' },
  { name: 'myStudent', label: '我的学生' },
  { name: 't_choose', label: '选择情况' },
]
// 根据 order 返回颜色和标签
function getOrderStyle(order: number) {
  const styles: Record<
    number,
    { bg: string, text: string, label: string, borderColor: string }
  > = {
    1: {
      bg: 'linear-gradient(135deg, #FFD700 0%, #FFC700 100%)',
      text: '#8B6914',
      label: '第一志愿',
      borderColor: '#FFD700',
    },
    2: {
      bg: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)',
      text: '#5A5A5A',
      label: '第二志愿',
      borderColor: '#C0C0C0',
    },
    3: {
      bg: 'linear-gradient(135deg, #CD7F32 0%, #B87333 100%)',
      text: '#6B4423',
      label: '第三志愿',
      borderColor: '#CD7F32',
    },
  }
  return styles[order] || styles[1]
}
function calculateScrollHeight() {
  const systemInfo = uni.getSystemInfoSync()
  const query = uni.createSelectorQuery()
  query.select('.header').boundingClientRect()
  query.select('.footer').boundingClientRect()
  query.exec((res) => {
    const headerHeight = res[0]?.height || 0
    const footerHeight = res[1]?.top || 0
    scrollHeight.value
      = systemInfo.windowHeight - headerHeight - footerHeight - 80
  })
}
function viewDetail(item: any) {
  if (item.data) {
    dialogVisible.value = true
    currentStudent.value = item.data
  }
}
function handleTabChange(e: any) {
  if (e !== 'myStudent') {
    uni.navigateTo({
      url: `/pages/${e}/index`,
    })
  }
}
function handleCloseDialog() {
  dialogVisible.value = false
}
onLoad(async () => {
  const res: any = await getSelectState({
    teacherId: userStore.userInfo.username,
    activityId: userStore.userInfo.activityId,
  })
  // 按 order 排序：1111, 2222, 3333
  studentList.value = res.sort(
    (a: any, b: any) => (a.order || 999) - (b.order || 999),
  )
})
</script>

<template>
  <view class="ios-page">
    <view class="px-5 pt-6">
      <view class="ios-title">
        我的学生
      </view>
      <view class="ios-subtitle mt-2">
        查看当前活动中已确定的学生列表。
      </view>
    </view>
    <!-- 使用学生信息弹窗组件 -->
    <StudentDialog
      :visible="dialogVisible"
      :info="currentStudent"
      @close="handleCloseDialog"
    />
    <scroll-view
      scroll-y
      class="w-90% px-5 pb-18 pt-5"
      :style="{ height: `680px` }"
    >
      <view
        v-if="studentList.length === 0"
        class="py-10 text-center text-[26rpx] text-[#6B7280]"
      >
        暂无学生
      </view>
      <view v-for="item in studentList" :key="item._id" class="relative mb-4">
        <!-- 左侧颜色条 -->
        <view
          class="absolute bottom-0 left-0 top-0 w-1 rounded-l-lg"
          :style="{ background: getOrderStyle(item.order).borderColor }"
        />
        <!-- 卡片 -->
        <view class="ios-card ml-3" style="padding: 0">
          <!-- 右上角 order badge -->
          <view
            class="absolute right-3 top-3 rounded-full px-3 py-1 text-[22rpx] font-600"
            :style="{
              background: getOrderStyle(item.order).bg,
              color: getOrderStyle(item.order).text,
            }"
          >
            {{ getOrderStyle(item.order).label }}
          </view>
          <view class="ios-cell pt-5">
            <view class="flex-1 pr-24">
              <view class="text-[28rpx] text-[#111827] font-700">
                {{ item.data?.name || "未设置名字" }}
              </view>
              <view class="mt-1 text-[24rpx] text-[#6B7280]">
                {{ item.data?.classNum || "未设置班级" }} ·
                {{ item.data?.grade || "未设置年级" }}
              </view>
              <view class="mt-1 text-[24rpx] text-[#6B7280]">
                {{ item.data?.direction || "未设置方向" }}
              </view>
            </view>
            <button
              class="ios-btn ios-btn--secondary"
              style="padding: 14rpx 18rpx; font-size: 26rpx"
              @click="viewDetail(item)"
            >
              详情
            </button>
          </view>
        </view>
      </view>
    </scroll-view>
    <!-- 底部固定导航栏 -->
    <view
      class="ios-bottom-nav fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-3 py-4"
    >
      <button
        v-for="item in navItems"
        :key="item.name"
        class="ios-btn ios-bottom-nav-btn"
        :class="
          tabbar === item.name ? 'ios-btn--primary' : 'ios-btn--secondary'
        "
        :style="tabbar === item.name ? { backgroundColor: IOS_BLUE } : {}"
        @click="
          () => {
            tabbar = item.name;
            handleTabChange(item.name);
          }
        "
      >
        {{ item.label }}
      </button>
    </view>
  </view>
</template>

<style scoped>
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
</style>
