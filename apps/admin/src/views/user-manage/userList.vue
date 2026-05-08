<template>
  <div>
    <el-card>
      <el-page-header content="用户列表" icon="" title="用户管理" />
      <div style="display: flex;">
        <div style="margin: 20px 20px 0 20px;">
          <span style="margin-right: 10px;">用户名</span>
          <el-input style="width: 240px" v-model="searchForm.username" placeholder="请输入用户名" clearable />
        </div>
        <div style="margin: 20px 20px 0 20px;">
          <span style="margin-right: 10px;">用户角色</span>
          <el-select v-model="searchForm.role" placeholder="请选择角色" style="width: 240px" clearable>
            <el-option label="管理员" value="admin" />
            <el-option label="老师" value="teacher" />
            <el-option label="学生" value="student" />
          </el-select>
        </div>
        <div style="margin: 20px 20px 0 20px;">
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button type="default" @click="handleReset">重置</el-button>
          <el-button type="warning" @click="handleResetAllPassword">一键重置所有选择的用户密码</el-button>
        </div>
      </div>

      <el-table :data="paginatedData" style="width: 100%" @select="handleSelect" @select-all="handleSelectAll"
        :row-key="row => row._id" ref="tableRef">
        <el-table-column type="selection" width="55" />

        <el-table-column prop="username" label="用户名" width="180" />

        <el-table-column label="角色">
          <template #default="scope">
            <el-tag v-if="scope.row.role === 'admin'" type="danger">管理员</el-tag>
            <el-tag v-else-if="scope.row.role === 'teacher'" type="warning">老师</el-tag>
            <el-tag v-else type="success">学生</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-popconfirm title="你确定要删除吗" confirm-button-text="确定" cancel-button-text="取消"
              @confirm="handleDelete(scope.row)">
              <template #reference>
                <el-button size="small" type="danger"> 删除 </el-button>
              </template>
            </el-popconfirm>
            <el-button size="small" @click="handleResetPassword(scope.row)">
              重置密码
            </el-button>
            <el-button v-if="scope.row.role === 'teacher'" size="small" type="primary" @click="handleUpdateIntroduction(scope.row)">
              修改老师简历
            </el-button>
            <el-button v-if="scope.row.role === 'teacher'" size="small" type="primary" @click="handleViewIntroduction(scope.row)">
              查看老师简历
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="tableData.length"
        :page-sizes="[5, 10, 20, 50]" :page-size="pageSize" :current-page="currentPage" @size-change="handleSizeChange"
        @current-change="handlePageChange" class="pagination-wrapper" />
    </el-card>

    <el-dialog v-model="dialogVisible" title="编辑用户" width="500">
      <el-form ref="userFormRef" style="max-width: 600px" :model="userForm" :rules="userFormRules" label-width="auto"
        class="demo-ruleForm" status-icon>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="userForm.password" type="password" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" placeholder="Select" style="width: 100%">
            <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="个人简介" prop="introduction">
          <el-input v-model="userForm.introduction" type="textarea" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleEditConfirm()">
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 老师简历上传对话框 -->
    <el-dialog v-model="introductionDialogVisible" title="修改老师简历" width="600px">
      <div class="introduction-container">
        <el-form ref="introductionFormRef" :model="introductionForm" label-width="auto" class="demo-ruleForm">
          <el-form-item label="当前简历">
              <div v-if="introductionForm.resumePath" class="current-resume">
                <img :src="introductionForm.resumePath" alt="老师简历" style="max-width: 100%; max-height: 300px; object-fit: contain;">
                <div class="file-name">{{ introductionForm.resumeName }}</div>
              </div>
              <div v-else class="no-resume">暂无简历图片</div>
            </el-form-item>
          <el-form-item label="上传新简历">
            <el-upload
              class="upload-demo"
              drag
              :action="''"
              :auto-upload="false"
              :on-change="handleFileChange"
              :before-upload="beforeUpload"
              accept=".jpg,.jpeg,.png,.gif,.pdf"
              :show-file-list="true"
              :file-list="fileList"
            >
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">点击或拖拽文件到此处上传</div>
              <template #tip>
                <div class="el-upload__tip">
                  请上传JPG、JPEG、PNG、GIF格式的图片文件，大小不超过5MB
                </div>
              </template>
            </el-upload>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="introductionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleUpdateIntroductionConfirm">确认修改</el-button>
        </div>
      </template>
    </el-dialog>

      <!-- 查看老师简历对话框 -->
  <el-dialog
    v-model="viewIntroductionDialogVisible"
    title="查看老师简历"
    width="80%"
    @close="handleViewIntroductionDialogClose"
  >
    <div class="resume-view-container">
      <div v-if="viewIntroductionForm.resumePath" class="resume-image">
        <img :src="viewIntroductionForm.resumePath" alt="老师简历" style="max-width: 100%; max-height: 70vh; object-fit: contain;">
      </div>
      <div v-else class="no-resume">
        暂无简历数据
      </div>
    </div>
  </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, nextTick } from "vue";
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import axios from "axios";

const currentPage = ref(1);
const pageSize = ref(10);
const tableRef = ref(); // 添加表格引用

// 分页相关函数
const handlePageChange = (val) => {
  currentPage.value = val;
};

const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1; // 重置到第一页
};

// 计算当前页显示的数据
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return tableData.value.slice(start, end);
});

const searchForm = reactive({
  username: "",
  role: ""
});

const dialogVisible = ref(false);
const userFormRef = ref();
let userForm = reactive({
  username: "",
  password: "",
  role: 2, //1是管理员，2是编辑
  introduction: "",
});

// 老师简历相关变量
const introductionDialogVisible = ref(false);
const introductionFormRef = ref();
let introductionForm = reactive({
  teacherId: "",
  resumeName: "",
  resumePath: "",
  uploadedFile: null
});
const fileList = ref([]);
const userFormRules = reactive({
  username: [{ required: true, message: "请输入名字", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
  role: [{ required: true, message: "请选择权限", trigger: "blur" }],
  introduction: [{ required: true, message: "请输入介绍", trigger: "blur" }],
});
const options = [
  {
    label: "管理员",
    value: 1,
  },
  {
    label: "编辑",
    value: 2,
  },
];

const tableData = ref([]);
const selectedUsers = ref([]);

onMounted(async () => {
  await getTableData();
});

const getTableData = async () => {
  const res = await axios.get("/api/admin/getUserList");
  console.log(res.data);
  tableData.value = res.data;
  return res.data;
};

// 处理单个选择
const handleSelect = (selection, row) => {
  if (selection.includes(row)) {
    // 添加选中
    if (!selectedUsers.value.some(user => user._id === row._id)) {
      selectedUsers.value.push(row);
    }
  } else {
    // 取消选中
    selectedUsers.value = selectedUsers.value.filter(user => user._id !== row._id);
  }
};

// 处理全选
const handleSelectAll = (selection) => {
  if (selection.length > 0) {
    // 全选当前页
    const currentPageIds = paginatedData.value.map(item => item._id);

    // 添加当前页选中项到selectedUsers（去重）
    paginatedData.value.forEach(row => {
      if (!selectedUsers.value.some(user => user._id === row._id)) {
        selectedUsers.value.push(row);
      }
    });

    // 确保所有数据都被选中（全选所有页）
    selectedUsers.value = [...new Set([...selectedUsers.value, ...tableData.value])];
  } else {
    // 取消全选 - 只取消当前页的选中
    const currentPageIds = paginatedData.value.map(item => item._id);
    selectedUsers.value = selectedUsers.value.filter(user => !currentPageIds.includes(user._id));
  }

  console.log('当前选中用户:', selectedUsers.value.length);
};

// 确保每次分页变化时更新表格的选中状态
watch([currentPage, pageSize], async () => {
  nextTick(() => {
    paginatedData.value.forEach(row => {
      if (selectedUsers.value.some(user => user._id === row._id)) {
        tableRef.value.toggleRowSelection(row, true);
      } else {
        tableRef.value.toggleRowSelection(row, false);
      }
    });
  });
});

//编辑回调
const handleEdit = async (data) => {
  console.log(data);
  
  // const res = await axios.get(`/adminapi/user/list/${data._id}`);
  // Object.assign(userForm, res.data.data[0]);
  // console.log(userForm);
  // dialogVisible.value = true;
};

//编辑确认回调
const handleEditConfirm = () => {
  userFormRef.value.validate(async (valid) => {
    if (valid) {
      //更新后端
      await axios.put(`/adminapi/user/list/${userForm._id}`, userForm);
      //dialog隐藏
      dialogVisible.value = false;
      //获取table数据
      getTableData();
    }
  });
};

const handleDelete = async (data) => {
  console.log(data);
  await axios.delete(`/adminapi/user/list/${data._id}`);
  getTableData();
};

//重置密码
const handleResetPassword = async (data) => {
  ElMessageBox.confirm('确认重置密码吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    const res = await axios.post(`/api/admin/resetPassword`, {
      username: data.username,
      password: "123456",
    });
    if (res.data.code === 200) {
      selectedUsers.value = [];
      ElMessage.success('密码一键重置成功');
    }
    selectedUsers.value = [];
    getTableData();
  }).catch(() => {
    console.log('取消重置密码');
  });
};

//表单事件
//搜索事件
const handleSearch = async () => {
  const res = await axios.get("/api/admin/getUserInfo", {
    params: searchForm,
  });
  console.log(res.data);
  tableData.value = res.data;
  selectedUsers.value = []; // 搜索时清空已选
};

//重置事件
const handleReset = () => {
  searchForm.username = "";
  searchForm.role = "";
  selectedUsers.value = []; // 重置时清空已选
  getTableData();
};

//一键重置所有用户密码
const handleResetAllPassword = async () => {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请先选择要重置密码的用户');
    return;
  }

  ElMessageBox.confirm(`确认重置${selectedUsers.value.length}个用户的密码吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    const selectedUserName = selectedUsers.value.map(user => user.username);
    console.log(selectedUserName);

    const res = await axios.post(`/api/admin/resetSelectedPassword`, {
      selectedUsers: selectedUserName,
      password: "123456",
    });
    console.log(res);

    if (res.data.code === 200) {
      ElMessage.success(`${selectedUserName.length}个用户密码重置成功`);
      selectedUsers.value = [];
      searchForm.username = "";
      searchForm.role = "";
    }
    getTableData();
  }).catch(() => {
    console.log('取消重置密码');
  });
};

// 修改老师简历
const handleUpdateIntroduction = async (data) => {
  console.log(data);
  // 打开专门的简历上传弹窗
  introductionDialogVisible.value = true;
  
  // 加载老师简历和用户ID
  introductionForm.teacherId = data.username;
  // 重置上传相关字段
  introductionForm.resumeName = "";
  introductionForm.resumePath = "";
  introductionForm.uploadedFile = null;
  fileList.value = [];
};

// 文件选择变化处理
const handleFileChange = (uploadFile, uploadFiles) => {
  console.log('文件选择变化:', uploadFile);
  
  // 清除之前的文件列表，只保留当前文件
  fileList.value = [];
  
  // 创建blob URL用于预览
  const blobUrl = URL.createObjectURL(uploadFile.raw);
  fileList.value.push({
    name: uploadFile.name,
    url: blobUrl
  });
  
  // 保存上传文件信息
  introductionForm.uploadedFile = uploadFile;
  introductionForm.resumeName = uploadFile.name;
  introductionForm.resumePath = blobUrl; // 使用blob URL进行预览
  
  ElMessage.success('文件已选择，可以点击确认修改上传');
};

// 移除文件处理
const handleRemoveFile = (uploadFile, uploadFiles) => {
  // 释放blob URL以避免内存泄漏
  if (introductionForm.resumePath && introductionForm.resumePath.startsWith('blob:')) {
    URL.revokeObjectURL(introductionForm.resumePath);
  }
  // 清除相关数据
  introductionForm.uploadedFile = null;
  introductionForm.resumeName = '';
  introductionForm.resumePath = '';
  fileList.value = [];
};

// 修改简历对话框关闭时的处理函数
const handleIntroductionDialogClose = () => {
  // 释放blob URL以避免内存泄漏
  if (introductionForm.resumePath && introductionForm.resumePath.startsWith('blob:')) {
    URL.revokeObjectURL(introductionForm.resumePath);
  }
  
  // 清除相关数据
  introductionForm.teacherId = '';
  introductionForm.uploadedFile = null;
  introductionForm.resumeName = '';
  introductionForm.resumePath = '';
  fileList.value = [];
};

// 上传前验证
const beforeUpload = (file) => {
  const isImage = /\.(jpg|jpeg|png|gif)$/.test(file.name.toLowerCase());
  const isLt5M = file.size / 1024 / 1024 < 5;
  
  if (!isImage) {
    ElMessage.error('请上传图片格式的文件');
    return false;
  }
  if (!isLt5M) {
    ElMessage.error('文件大小不能超过5MB');
    return false;
  }
  
  return true;
};

// 确认修改老师简历
const handleUpdateIntroductionConfirm = async () => {
  // 检查是否已上传文件
  if (!introductionForm.uploadedFile) {
    ElMessage.warning('请先上传简历图片');
    return;
  }
    
  try {
    // 创建FormData对象来上传文件
    const formData = new FormData();
    // 添加文件内容
    formData.append('file', introductionForm.uploadedFile.raw);
    // 添加其他表单字段
    formData.append('teacherId', introductionForm.teacherId);
    formData.append('resumeName', introductionForm.resumeName);
    formData.append('resumePath', introductionForm.resumePath);
    // 调用后端API上传文件，不需要设置Content-Type，axios会自动设置为multipart/form-data
    const res = await axios.post(`/api/teacher/uploadTeacherResume`, formData);
    
    if (res.data && res.data.code === 200) {
      // 创建blob URL用于显示
      const blob = new Blob([introductionForm.uploadedFile.raw], {
        type: introductionForm.uploadedFile.raw.type
      });
      const blobUrl = URL.createObjectURL(blob);
      
      // 设置resumePath为blob URL，用于前端显示
      introductionForm.resumePath = blobUrl;
      
      ElMessage.success('老师简历上传成功');
      
      // 在关闭对话框前记得清理blob URL避免内存泄漏
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
        introductionDialogVisible.value = false;
      }, 100);
      
      getTableData(); // 重新获取表格数据
    } else {
      ElMessage.error('上传失败：' + (res.data?.message || '服务器错误'));
    }
  } catch (error) {
    ElMessage.error('上传失败，请重试');
    console.error('上传错误：', error);
  }
};

// 查看老师简历对话框相关
const viewIntroductionDialogVisible = ref(false);
const viewIntroductionForm = reactive({
  resumePath: '',
  resumeName: ''
});

const handleViewIntroduction = async (data) => {
  try {
    // 获取老师简历信息
    const res = await axios.get("/api/teacher/getTeacherResume", {
      params: {
        teacherId: data.username
      },
      responseType: 'blob' // 设置响应类型为blob
    });
    
    console.log('获取简历响应:', res);
    console.log(res.data);
    // 检查响应是否为blob数据
    if (res.data && res.data instanceof Blob) {
      // 创建blob URL用于显示图片
      const blobUrl = URL.createObjectURL(res.data);
      
      // 设置表单数据
      viewIntroductionForm.resumePath = blobUrl;
      viewIntroductionForm.resumeName = data.username + '_resume';
      
      // 显示对话框
      viewIntroductionDialogVisible.value = true;
    } else {
      ElMessage.error('获取简历失败：返回数据格式错误');
    }
  } catch (error) {
    ElMessage.error('获取简历失败，请重试');
    console.error('获取简历错误：', error);
  }
};

// 关闭查看简历对话框时释放资源
const handleViewIntroductionDialogClose = () => {
  // 释放blob URL以避免内存泄漏
  if (viewIntroductionForm.resumePath && viewIntroductionForm.resumePath.startsWith('blob:')) {
    URL.revokeObjectURL(viewIntroductionForm.resumePath);
    viewIntroductionForm.resumePath = '';
  }
};
</script>

<style lang="scss" scoped>
.el-table {
  margin-top: 50px;
}

.introduction-container {
  padding: 20px 0;
}

.current-resume {
  margin: 10px 0 20px 0;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  text-align: center;
}

.no-resume {
  margin: 10px 0 20px 0;
  padding: 20px;
  text-align: center;
  color: #909399;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
}

.upload-demo {
  margin-top: 10px;
}
</style>