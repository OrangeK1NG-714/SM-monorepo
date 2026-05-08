<script lang="ts" setup>
interface Props {
  visible: boolean
  info: any
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function handleClose() {
  emit('close')
}
</script>

<template>
  <view v-if="visible" class="student-dialog fixed inset-0 z-999 flex items-center justify-center bg-black bg-opacity-50" @click="handleClose">
    <view class="dialog-content max-h-[80vh] max-w-2xl w-[90%] overflow-y-auto rounded-lg bg-white p-5" @click.stop>
      <view class="dialog-header mb-4 flex items-center justify-between">
        <text class="text-lg font-bold">
          学生详情
        </text>
        <text class="close-icon text-xl" @click="handleClose">
          ×
        </text>
      </view>
      <view class="info-form">
        <view class="form-item mb-3 flex">
          <view class="label w-1/3 text-gray-600">
            姓名：
          </view>
          <view class="value w-2/3">
            {{ info?.name || '未设置' }}
          </view>
        </view>
        <view class="form-item mb-3 flex">
          <view class="label w-1/3 text-gray-600">
            学号：
          </view>
          <view class="value w-2/3">
            {{ info?.studentId || '未设置' }}
          </view>
        </view>
        <view class="form-item mb-3 flex">
          <view class="label w-1/3 text-gray-600">
            性别：
          </view>
          <view class="value w-2/3">
            {{ info?.gender || '未设置' }}
          </view>
        </view>
        <view class="form-item mb-3 flex">
          <view class="label w-1/3 text-gray-600">
            年级：
          </view>
          <view class="value w-2/3">
            {{ info?.grade || '未设置' }}
          </view>
        </view>
        <view class="form-item mb-3 flex">
          <view class="label w-1/3 text-gray-600">
            班级：
          </view>
          <view class="value w-2/3">
            {{ info?.classNum || '未设置' }}
          </view>
        </view>
        <view class="form-item mb-3 flex">
          <view class="label w-1/3 text-gray-600">
            电话：
          </view>
          <view class="value w-2/3">
            {{ info?.phone || '未设置' }}
          </view>
        </view>
        <view class="form-item mb-3 flex">
          <view class="label w-1/3 text-gray-600">
            QQ：
          </view>
          <view class="value w-2/3">
            {{ info?.qq || '未设置' }}
          </view>
        </view>
        <view class="form-item mb-3 flex">
          <view class="label w-1/3 text-gray-600">
            微信：
          </view>
          <view class="value w-2/3">
            {{ info?.wechat || '未设置' }}
          </view>
        </view>
        <view class="form-item mb-3 flex">
          <view class="label w-1/3 text-gray-600">
            GPA：
          </view>
          <view class="value w-2/3">
            {{ info?.gpa || '未设置' }}
          </view>
        </view>
        <view class="form-item mb-3 flex">
          <view class="label w-1/3 text-gray-600">
            方向：
          </view>
          <view class="value w-2/3">
            {{ info?.direction || '未设置' }}
          </view>
        </view>
        <view class="form-item mb-3 flex">
          <view class="label w-1/3 text-gray-600">
            作品集：
          </view>
          <view class="value w-2/3">
            {{ info?.portfolio || '未设置' }}
          </view>
        </view>
        <view class="form-item mb-3 flex">
          <view class="label w-1/3 text-gray-600">
            简历：
          </view>
          <view class="value w-2/3">
            {{ info?.resume || '未设置' }}
          </view>
        </view>
      </view>
      <view class="dialog-footer mt-4 flex justify-center">
        <button class="close-btn w-full rounded bg-gray-200 py-2 text-gray-800" @click="handleClose">
          关闭
        </button>
      </view>
    </view>
  </view>
</template>

<style scoped>
.student-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
}

.dialog-content {
  max-height: 80vh;
  width: 90%;
  max-width: 400px;
  overflow-y: auto;
  border-radius: 8px;
  background-color: white;
  padding: 20px;
}

.dialog-header {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.close-icon {
  font-size: 20px;
  cursor: pointer;
}

.info-form {
  margin-bottom: 16px;
}

.form-item {
  margin-bottom: 12px;
  display: flex;
}

.label {
  width: 33.333%;
  color: #666;
}

.value {
  width: 66.667%;
}

.dialog-footer {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.close-btn {
  width: 100%;
  border-radius: 4px;
  background-color: #e5e5e5;
  padding: 8px 0;
  color: #333;
}
</style>
