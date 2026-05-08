<template>
    <div>
        <el-card>
            <el-page-header content="已选上学生列表" icon="" title="志愿管理" />
            <div style="display: flex;">
                <div style="margin: 20px 20px 0 20px;">
                    <span style="margin-right: 10px;">学生学号</span>
                    <el-input style="width: auto" v-model="searchForm.studentId" placeholder="请输入学号" clearable />
                </div>
                <div style="margin: 20px 20px 0 20px;">
                    <span style="margin-right: 10px;">教师姓名</span>
                    <el-select v-model="searchForm.teacherId" placeholder="请选择老师" style="width: auto" clearable
                        filterable>
                        <el-option v-for="item in teacherList" :key="item._id" :label="item.name"
                            :value="item.teacherId" />
                    </el-select>
                </div>
                <div style="margin: 20px 20px 0 20px;">
                    <span style="margin-right: 10px;">活动名称</span>
                    <el-select v-model="searchForm.activityId" placeholder="请选择活动" style="width: auto" clearable
                        filterable :disabled="isSearchDisabled">
                        <el-option v-for="item in activityList" :key="item._id" :label="item.name" :value="item._id" />
                    </el-select>
                </div>
                <div style="margin: 20px 20px 0 20px;width: auto;">
                    <el-button type="primary" @click="handleSearch">搜索</el-button>
                    <el-button type="default" @click="handleReset">重置</el-button>
                    <el-button type="success" @click="handleExport">导出选中</el-button>
                </div>
            </div>

            <el-table :data="paginatedData" style="width: 100%" @select="handleSelect" @select-all="handleSelectAll"
                :row-key="row => row._id" ref="tableRef">
                <el-table-column type="selection" width="55" />

                <el-table-column prop="activityName" label="活动名称" width="auto" />
                <el-table-column prop="studentId" label="学生学号" width="auto" />
                <el-table-column prop="data.name" label="学生姓名" width="auto" />
                <el-table-column prop="data.grade" label="学生年级" width="auto" />
                <el-table-column prop="teacherId" label="教师工号" width="auto" />
                <el-table-column label="操作" width="auto">
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

                    </template>
                </el-table-column>
            </el-table>
            <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="tableData.length"
                :page-sizes="[5, 10, 20, 50]" :page-size="pageSize" :current-page="currentPage"
                @size-change="handleSizeChange" @current-change="handlePageChange" class="pagination-wrapper" />
        </el-card>

        <el-dialog v-model="dialogVisible" title="编辑用户" width="500">
            <el-form ref="userFormRef" style="max-width: 600px" :model="userForm" :rules="userFormRules"
                label-width="auto" class="demo-ruleForm" status-icon>
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
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, nextTick } from "vue";
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from "axios";
import * as XLSX from 'xlsx';
import { useRoute } from "vue-router";

const route = useRoute()
const isSearchDisabled = ref(false); // 添加禁用状态
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
    studentId: "",
    teacherId: "",
    activityId: ""
});

const dialogVisible = ref(false);
const userFormRef = ref();
let userForm = reactive({
    username: "",
    password: "",
    role: 2, //1是管理员，2是编辑
    introduction: "",
});
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
const activityList = ref([]);
const teacherList = ref([]);

onMounted(async () => {
    if (route.query.activityId) {
        console.log(123);
        searchForm.activityId = route.query.activityId;
        isSearchDisabled.value = true; // 设置禁用状态为true
        handleSearch();
    }
    else {
        await getTableData();
        await getTeacherList();
    }

});

const getTableData = async () => {
    const res = await axios.get("/api/admin/getFinalList");
    // console.log(res.data);
    tableData.value = res.data;
    const res1 = await axios.get("/api/admin/getActivityList");
    // console.log(res1.data);
    activityList.value = res1.data;
    tableData.value.map(item => {
        res1.data.map(activity => {
            if (item.activityId === activity._id) {
                item.activityName = activity.name;
            }
        })
    })
};

const getTeacherList = async () => {
    const res = await axios.get("/api/teacher/detail");
    // console.log(res.data.data, 12333);
    teacherList.value = res.data.data;
}

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

    // console.log('当前选中用户:', selectedUsers.value.length);
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
    const res = await axios.get(`/adminapi/user/list/${data._id}`);
    Object.assign(userForm, res.data.data[0]);
    // console.log(userForm);
    dialogVisible.value = true;
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
    // console.log(data);
    await axios.delete(`/adminapi/user/list/${data._id}`);
    getTableData();
};


//表单事件
//搜索事件
const handleSearch = async () => {
    const res = await axios.get("/api/admin/getFinalList", {
        params: searchForm,
    });
    tableData.value = res.data;
    const res1 = await axios.get("/api/admin/getActivityList");
    // console.log(res1.data);
    activityList.value = res1.data;
    tableData.value.map(item => {
        res1.data.map(activity => {
            if (item.activityId === activity._id) {
                item.activityName = activity.name;
            }
        })
    })
};

//重置事件
const handleReset = () => {
    if (isSearchDisabled.value) {
        searchForm.studentId = "";
        searchForm.teacherId = "";
    }
    else {
        searchForm.studentId = "";
        searchForm.teacherId = "";
        searchForm.activityId = "";
    }

    handleSearch();
};


// 导出选中数据
const handleExport = async () => {
    if (selectedUsers.value.length === 0) {
        ElMessage.warning('请选择要导出的数据');
        return;
    }

    const res = await axios.get("/api/admin/getTeacherListInActivity", {
        params: {
            activityId: selectedUsers.value[0].activityId,
        }
    });
    console.log(res.data, 7788);

    const userList = await axios.get("/api/admin/getStudentListInActivity", {
        params: {
            activityId: selectedUsers.value[0].activityId,
        }
    })
    console.log(userList.data, 112233);

    // 记录已选中的学生ID
    const selectedStudentIds = new Set(selectedUsers.value.map(item => item.studentId));

    // 找出落选的学生
    const unselectedStudents = userList.data.filter(student => !selectedStudentIds.has(student.studentId));

    // 准备导出数据 - 按照你提供的Excel格式
    const exportData = []
    
    // 添加表头
    exportData.push(['导师', '学生', '学号', '专业']);
    
    // 处理每个导师的学生
    const mergeRanges = []; // 存储合并单元格的范围
    let currentRow = 1; // 从表头后的第一行开始
    
    // 按teacherId分组处理
    const teachersWithStudents = {};
    
    // 首先构建导师-学生的映射关系
    res.data.forEach(teacher => {
        const students = selectedUsers.value.filter(item => item.teacherId === teacher.teacherId);
        if (students.length > 0) {
            teachersWithStudents[teacher.teacherId] = {
                teacher,
                students
            };
        } else {
            // 没有学生的导师也需要显示
            teachersWithStudents[teacher.teacherId] = {
                teacher,
                students: []
            };
        }
    });
    
    // 处理每个导师的数据
    for (const teacherId in teachersWithStudents) {
        const { teacher, students } = teachersWithStudents[teacherId];
        const teacherName = teacher.name;
        const teacherPhone = teacher.phone || '';
        
        if (students.length === 0) {
            // 如果没有学生，添加一行空数据
            exportData.push([teacherName, '', '', '', teacherPhone]);
            currentRow++;
        } else {
            // 有学生的情况，需要考虑合并单元格
            exportData.push([teacherName, '', '', '', '']); // 第一行保留导师名称，电话留空
            
            // 为每个学生添加一行
            students.forEach((student, index) => {
                if (index === 0) {
                    // 第一个学生的行，复用上面的行
                    exportData[currentRow][1] = student.data?.name || '';
                    exportData[currentRow][2] = student.studentId;
                    exportData[currentRow][3] = student.data?.classNum || '';
                    exportData[currentRow][4] = teacherPhone; // 第一行显示导师电话
                } else {
                    // 后续学生的行，导师名称为空
                    exportData.push(['', student.data?.name || '', student.studentId, student.data?.classNum || '', '']);
                }
            });
            
            // 如果有多个学生，需要合并导师名称单元格
            if (students.length > 1) {
                mergeRanges.push({
                    s: { r: currentRow, c: 0 }, // 起始行、列
                    e: { r: currentRow + students.length - 1, c: 0 } // 结束行、列
                });
            }
            
            currentRow += students.length;
        }
    }

    // 添加落选的学生
    if (unselectedStudents.length > 0) {
        exportData.push(['未分配导师', '', '', '', '']);
        mergeRanges.push({
            s: { r: currentRow, c: 0 }, // 起始行、列
            e: { r: currentRow + unselectedStudents.length, c: 0 } // 结束行、列
        });
        
        unselectedStudents.forEach(student => {
            exportData.push(['', student.data?.name || '', student.studentId, student.data?.major || '', '']);
        });
    }

    // 创建工作簿和工作表
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(exportData);

    // 设置合并单元格
    ws['!merges'] = mergeRanges;

    // 设置列宽（可选，根据内容调整）
    const colWidths = [
        { wch: 15 }, // 导师列
        { wch: 15 }, // 学生列
        { wch: 15 }, // 学号列
        { wch: 25 }, // 专业列
        { wch: 15 }  // 导师电话列
    ];
    ws['!cols'] = colWidths;

    // 设置单元格样式
    const wscols = ws['!cols'];
    if (!wscols) ws['!cols'] = colWidths;

    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '导师制分配表');

    // 导出Excel文件
    XLSX.writeFile(wb, '2025级导师制分配表.xlsx');

    ElMessage.success('导出成功');
};

</script>

<style lang="scss" scoped>
.el-table {
    margin-top: 50px;
}
</style>