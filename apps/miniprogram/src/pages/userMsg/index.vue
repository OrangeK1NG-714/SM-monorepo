<route lang="json5" type="page">
{
  layout: "default",
  style: {
    navigationBarTitleText: "学生基本信息",
  },
}
</route>

<script lang="ts" setup>
import { getStudentMsg, writeStdInfo } from '@/api/stdInfo'
import { API_BASE_URL } from '@/config'
import { useUserStore } from '@/store/user'

// 定义表单数据类型
interface StudentForm {
  name: string
  gender: string
  studentId: string
  grade: string
  classNum: string
  major: string
  phone: string
  gpa: string
  direction: string
  resumeName: string
}

defineOptions({
  name: 'UserMsgPage',
})

const genderArray = ['男', '女']
const majorArray = ['普通', '中本']
const directionArray = [
  '前端开发',
  '后端开发',
  '测试开发',
  'UI设计',
  '产品经理',
  '游戏策划',
  '游戏开发',
  '视频剪辑',
  '视频编导',
  '其他',
]

// 使用reactive创建表单对象
const formData = ref<StudentForm>({
  name: '',
  gender: '',
  studentId: '',
  grade: '',
  classNum: '',
  major: '',
  phone: '',
  gpa: '',
  direction: '',
  resumeName: '',
})

const isEditMode = ref(false)
const showAgreement = ref(false)
const focusedField = ref<string | null>(null)
const submitting = ref(false)

onLoad(async (query) => {
  if (query?.mode === 'edit') {
    isEditMode.value = true
    uni.showLoading({ title: '加载中...' })
    try {
      const res: any = await getStudentMsg(useUserStore().userInfo.username)
      if (res?.data) {
        const d = res.data
        formData.value = {
          name: d.name || '',
          gender: d.gender || '',
          studentId: d.studentId || '',
          grade: d.grade || '',
          classNum: d.classNum || '',
          major: d.major || '',
          phone: d.phone || '',
          gpa: d.gpa || '',
          direction: d.direction || '',
          resumeName: '',
        }
      }
    }
    catch (error) {
      console.error('获取信息失败:', error)
      uni.showToast({ title: '获取信息失败', icon: 'none' })
    }
    finally {
      uni.hideLoading()
    }
  }
})

function uploadResume() {
  // 上传简历逻辑
  console.log('上传简历')
  // #ifdef MP-WEIXIN
  uni.chooseMessageFile({
    count: 1,
    type: 'file',
    extension: ['pdf'],
    success(res) {
      const tempFilePath = res.tempFiles[0].path
      const studentId = useUserStore().userInfo.username
      const fileName = res.tempFiles[0].name
      // 字段验证
      if (!studentId) {
        uni.showToast({ title: '学生ID获取失败', icon: 'error' })
        console.error('学生ID为空')
        return
      }
      if (!fileName) {
        uni.showToast({ title: '文件名获取失败', icon: 'error' })
        console.error('文件名为空')
        return
      }
      if (!tempFilePath) {
        uni.showToast({ title: '文件路径获取失败', icon: 'error' })
        console.error('文件路径为空')
        return
      }

      console.log('上传参数:', { fileName, studentId, filePath: tempFilePath })

      uni.showLoading({ title: '上传中...' })
      const accessToken = uni.getStorageSync('accessToken')
      uni.uploadFile({
        url: `${API_BASE_URL}/api/student/uploadResume`,
        filePath: tempFilePath,
        name: 'file',
        header: {
          Authorization: accessToken ? `Bearer ${accessToken}` : '',
        },
        formData: {
          fileName,
          studentId,
        },
        success(res) {
          if (res.statusCode === 200) {
            uni.showToast({ title: '上传成功', icon: 'success' })
            formData.value.resumeName = fileName
          }
          else {
            uni.showToast({ title: '上传失败，请重试', icon: 'none' })
          }
        },
        fail() {
          uni.showToast({ title: '上传失败，请检查网络', icon: 'none' })
        },
        complete() {
          uni.hideLoading()
        },
      })
    },
  })
  // #endif
  // #ifndef MP-WEIXIN
  uni.chooseFile({
    count: 1,
    type: 'file',
    extension: ['pdf'],
    success(res) {
      const tempFilePath = res.tempFilePaths[0]
      const studentId = useUserStore().userInfo.username
      const fileName = res.tempFiles[0].name || 'resume.pdf'

      if (!studentId || !tempFilePath) {
        uni.showToast({ title: '参数获取失败', icon: 'error' })
        return
      }

      uni.showLoading({ title: '上传中...' })
      const accessToken = uni.getStorageSync('accessToken')
      uni.uploadFile({
        url: `${API_BASE_URL}/api/student/uploadResume`,
        filePath: tempFilePath,
        name: 'file',
        header: {
          Authorization: accessToken ? `Bearer ${accessToken}` : '',
        },
        formData: { fileName, studentId },
        success(uploadRes) {
          if (uploadRes.statusCode === 200) {
            uni.showToast({ title: '上传成功', icon: 'success' })
            formData.value.resumeName = fileName
          }
          else {
            uni.showToast({ title: '上传失败，请重试', icon: 'none' })
          }
        },
        fail() {
          uni.showToast({ title: '上传失败，请检查网络', icon: 'none' })
        },
        complete() {
          uni.hideLoading()
        },
      })
    },
  })
  // #endif
}

function submitForm() {
  console.log(formData.value)

  // 第一层校验：点击提交按钮时必须先通过校验
  if (!validateForm()) {
    return
  }

  showAgreement.value = true
}

function validateForm(): boolean {
  const requiredFields: (keyof StudentForm)[] = [
    'name',
    'gender',
    'studentId',
    'grade',
    'classNum',
    'major',
    'phone',
    'direction',
  ]

  for (const field of requiredFields) {
    const value = (formData.value[field] || '').toString().trim()
    if (!value) {
      uni.showToast({
        title: `请填写${getFieldName(field)}`,
        icon: 'none',
      })
      return false
    }
  }

  // 学号验证
  if (!/^\d+$/.test(formData.value.studentId)) {
    uni.showToast({
      title: '学号必须为数字',
      icon: 'none',
    })
    return false
  }

  // 电话验证
  if (!/^1[3-9]\d{9}$/.test(formData.value.phone)) {
    uni.showToast({
      title: '请输入正确的手机号',
      icon: 'none',
    })
    return false
  }

  // GPA为选填，填写时才校验
  if (formData.value.gpa && !/^[0-4](?:\.\d{1,2})?$/.test(formData.value.gpa)) {
    uni.showToast({
      title: '绩点格式不正确（0.00-4.99）',
      icon: 'none',
    })
    return false
  }

  return true
}

function getFieldName(field: keyof StudentForm): string {
  const fieldNames: Record<keyof StudentForm, string> = {
    name: '姓名',
    gender: '性别',
    studentId: '学号',
    grade: '年级',
    classNum: '班级',
    major: '专业类型',
    phone: '联系电话',
    gpa: '绩点',
    direction: '意向方向',
    resumeName: '简历',
  }
  return fieldNames[field]
}

// 选择性别
function bindGenderChange(e: any) {
  formData.value.gender = genderArray[e.detail.value]
}

function bindMajorChange(e: any) {
  formData.value.major = majorArray[e.detail.value]
}

function bindClassInput(e) {
  formData.value.classNum = e.detail.value
}

function bindPhoneInput(e) {
  formData.value.phone = e.detail.value
}

function bindGPAInput(e) {
  formData.value.gpa = e.detail.value
}

function bindDirectionChange(e) {
  formData.value.direction = directionArray[e.detail.value]
}

function handleDisagree() {
  showAgreement.value = false
}

async function handleAgree() {
  if (!validateForm()) {
    showAgreement.value = false
    return
  }

  if (submitting.value) {
    return
  }

  submitting.value = true
  showAgreement.value = false
  uni.showLoading({ title: '提交中...' })

  try {
    await writeStdInfo(formData.value)
    uni.showToast({ title: isEditMode.value ? '修改成功' : '提交成功', icon: 'success' })
    if (isEditMode.value) {
      setTimeout(() => uni.navigateBack(), 1000)
    }
    else {
      uni.redirectTo({ url: '/pages/index/index' })
    }
  }
  catch (error) {
    console.error('提交失败:', error)
    uni.showToast({ title: '提交失败，请重试', icon: 'none' })
  }
  finally {
    submitting.value = false
    uni.hideLoading()
  }
}
</script>

<template>
  <view class="ios-page">
    <view class="px-5 pt-6">
      <view class="ios-title">
        {{ isEditMode ? '修改个人信息' : '学生基本信息' }}
      </view>
      <view class="ios-subtitle mt-2">
        {{ isEditMode ? '修改后点击保存即可生效。' : '请如实填写，信息将用于互选流程。' }}
      </view>
    </view>

    <view class="px-5 pb-10 pt-6">
      <view class="mb-3 px-1 text-xs text-[#6B7280]">
        基本信息
      </view>
      <view class="ios-card">
        <view
          class="ios-cell"
          :class="{ 'ios-cell--focused': focusedField === 'name' }"
        >
          <view class="ios-cell__label">
            姓名
          </view>
          <view class="ios-cell__content">
            <input
              v-model="formData.name"
              class="ios-input"
              placeholder="请输入姓名"
              @focus="focusedField = 'name'"
              @blur="focusedField = null"
            >
          </view>
        </view>
        <view class="ios-divider" style="margin-left: 28rpx" />
        <view class="ios-cell">
          <view class="ios-cell__label">
            性别
          </view>
          <view class="ios-cell__content">
            <picker
              mode="selector"
              :range="genderArray"
              @change="bindGenderChange"
            >
              <view
                class="text-[28rpx]"
                :class="formData.gender ? 'text-[#111827]' : 'text-[#9CA3AF]'"
              >
                {{ formData.gender || "请选择" }}
              </view>
            </picker>
          </view>
        </view>
        <view class="ios-divider" style="margin-left: 28rpx" />
        <view
          class="ios-cell"
          :class="{ 'ios-cell--focused': focusedField === 'studentId' }"
        >
          <view class="ios-cell__label">
            学号
          </view>
          <view class="ios-cell__content">
            <input
              v-model="formData.studentId"
              class="ios-input"
              type="number"
              placeholder="请输入学号"
              :disabled="false"
              @focus="focusedField = 'studentId'"
              @blur="focusedField = null"
            >
          </view>
        </view>
        <view class="ios-divider" style="margin-left: 28rpx" />
        <view
          class="ios-cell"
          :class="{ 'ios-cell--focused': focusedField === 'grade' }"
        >
          <view class="ios-cell__label">
            年级
          </view>
          <view class="ios-cell__content">
            <input
              v-model="formData.grade"
              class="ios-input"
              placeholder="例如 2023"
              @focus="focusedField = 'grade'"
              @blur="focusedField = null"
            >
          </view>
        </view>
        <view class="ios-divider" style="margin-left: 28rpx" />
        <view
          class="ios-cell"
          :class="{ 'ios-cell--focused': focusedField === 'classNum' }"
        >
          <view class="ios-cell__label">
            班级
          </view>
          <view class="ios-cell__content">
            <input
              v-model="formData.classNum"
              class="ios-input"
              placeholder="请输入班级"
              @focus="focusedField = 'classNum'"
              @blur="focusedField = null"
            >
          </view>
        </view>
        <view class="ios-divider" style="margin-left: 28rpx" />
        <view class="ios-cell">
          <view class="ios-cell__label">
            专业类型
          </view>
          <view class="ios-cell__content">
            <picker
              mode="selector"
              :range="majorArray"
              @change="bindMajorChange"
            >
              <view
                class="text-[28rpx]"
                :class="formData.major ? 'text-[#111827]' : 'text-[#9CA3AF]'"
              >
                {{ formData.major || "请选择" }}
              </view>
            </picker>
          </view>
        </view>
        <view class="ios-divider" style="margin-left: 28rpx" />
        <view
          class="ios-cell"
          :class="{ 'ios-cell--focused': focusedField === 'phone' }"
        >
          <view class="ios-cell__label">
            电话
          </view>
          <view class="ios-cell__content">
            <input
              v-model="formData.phone"
              class="ios-input"
              type="number"
              placeholder="请输入手机号"
              @focus="focusedField = 'phone'"
              @blur="focusedField = null"
            >
          </view>
        </view>
      </view>

      <view class="mb-3 mt-8 px-1 text-xs text-[#6B7280]">
        其他信息
      </view>
      <view class="ios-card">
        <view
          class="ios-cell"
          :class="{ 'ios-cell--focused': focusedField === 'gpa' }"
        >
          <view class="ios-cell__label">
            绩点
          </view>
          <view class="ios-cell__content">
            <input
              v-model="formData.gpa"
              class="ios-input"
              type="digit"
              placeholder="选填"
              @focus="focusedField = 'gpa'"
              @blur="focusedField = null"
            >
          </view>
        </view>
        <view class="ios-divider" style="margin-left: 28rpx" />
        <view class="ios-cell">
          <view class="ios-cell__label">
            方向
          </view>
          <view class="ios-cell__content">
            <picker
              mode="selector"
              :range="directionArray"
              @change="bindDirectionChange"
            >
              <view
                class="text-[28rpx]"
                :class="
                  formData.direction ? 'text-[#111827]' : 'text-[#9CA3AF]'
                "
              >
                {{ formData.direction || "请选择" }}
              </view>
            </picker>
          </view>
        </view>
        <view class="ios-divider" style="margin-left: 28rpx" />
        <view class="ios-cell">
          <view class="ios-cell__label">
            简历
          </view>
          <view class="ios-cell__content flex items-center justify-between">
            <view class="text-[26rpx] text-[#6B7280]">
              {{ formData.resumeName || "选填（PDF）" }}
            </view>
            <button
              class="ios-btn ios-btn--secondary"
              style="padding: 14rpx 18rpx; font-size: 26rpx"
              @tap="uploadResume"
            >
              上传
            </button>
          </view>
        </view>
      </view>

      <view class="mt-10">
        <button class="ios-btn ios-btn--primary w-full" @tap="submitForm">
          {{ isEditMode ? '保存修改' : '提交信息' }}
        </button>
      </view>
    </view>
  </view>

  <!-- 用户协议弹窗 -->
  <wd-popup
    v-model="showAgreement"
    custom-style="border-radius:40rpx;"
    position="bottom"
  >
    <view class="ios-sheet">
      <view class="ios-sheet__handle" />
      <view class="px-3 pb-2">
        <view class="text-[32rpx] text-[#111827] font-700">
          用户协议及隐私政策
        </view>
        <view class="mt-2 text-[24rpx] text-[#6B7280]">
          继续前请阅读并同意相关条款。
        </view>
      </view>
      <scroll-view scroll-y class="px-3" style="max-height: 60vh">
        <view class="text-[26rpx] text-[#374151] leading-relaxed">
          <view class="mb-3">
            为保护您的隐私和数据安全，我们郑重承诺：
          </view>
          <view class="mb-3">
            1.
            我们将会收集您填写的个人信息（包括姓名、学号、联系方式等），仅用于互选流程与管理，并在您授权范围内合理使用。
          </view>
          <view class="mb-3">
            2.
            您可以在后续页面查看或删除您的信息，在您注销账号后，我们将相应删除您的相关数据。
          </view>
          <view class="mb-3">
            3.
            我们不会收集您的地理位置、通讯录等敏感信息，也不会要求您提供微信用户名或密码。
          </view>
          <view class="mb-3">
            4. 我们承诺不会出售、转交、交易或以其他方式越权披露您的个人信息。
          </view>
          <view class="mb-2">
            你可以查看《用户协议》和《隐私政策》了解更多细节。
          </view>
        </view>
      </scroll-view>
      <view class="flex flex-col gap-3 px-3 pt-4">
        <button class="ios-btn ios-btn--primary w-full" @tap="handleAgree">
          同意并继续
        </button>
        <button class="ios-btn ios-btn--secondary w-full" @tap="handleDisagree">
          暂不同意
        </button>
      </view>
    </view>
  </wd-popup>
</template>
