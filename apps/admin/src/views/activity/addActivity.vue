<template>
    <div>
        <el-page-header content="添加活动" icon="" title="活动管理" />
        <el-form ref="activityFormRef" style="max-width: 600px" :model="activityForm" :rules="activityFormRules"
            label-width="auto" class="demo-ruleForm" status-icon>
            <el-form-item label="活动名称" prop="name" >
                <el-input v-model="activityForm.name" />
            </el-form-item>
            <el-form-item label="活动描述" prop="description">
                <el-input v-model="activityForm.description" />
            </el-form-item>
            <el-form-item label="活动开始-结束时间" >
                <el-date-picker v-model="tempDateRange1" type="datetimerange" start-placeholder="开始时间"
                    end-placeholder="结束时间" format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DDTHH:mm:ss"
                    @change="handleDateChange1" />
            </el-form-item>
            <el-form-item label="教师选择第一志愿开始-结束时间">
                <el-date-picker v-model="tempDateRange2" type="datetimerange" start-placeholder="开始时间"
                    end-placeholder="结束时间" format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DDTHH:mm:ss"
                    @change="handleDateChange2" />
            </el-form-item>
            <el-form-item label="教师选择第二志愿开始-结束时间">
                <el-date-picker v-model="tempDateRange3" type="datetimerange" start-placeholder="开始时间"
                    end-placeholder="结束时间" format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DDTHH:mm:ss"
                    @change="handleDateChange3" />
            </el-form-item>
            <el-form-item label="教师选择第三志愿开始-结束时间">
                <el-date-picker v-model="tempDateRange4" type="datetimerange" start-placeholder="开始时间"
                    end-placeholder="结束时间" format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DDTHH:mm:ss"
                    @change="handleDateChange4" />
            </el-form-item>
            <el-form-item label="学生填报志愿开始-结束时间">
                <el-date-picker v-model="tempDateRange5" type="datetimerange" start-placeholder="开始时间"
                    end-placeholder="结束时间" format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DDTHH:mm:ss"
                    @change="handleDateChange5" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="submitOneForm()">添加活动</el-button>
            </el-form-item>
        </el-form>

    </div>
</template>
<script setup>
import { ref, reactive, watch } from "vue";

import { useRouter } from "vue-router";
import { ElMessage } from 'element-plus';
import axios from "axios";

const router = useRouter()

// 新增临时日期范围变量
const tempDateRange1 = ref([]);
const tempDateRange2 = ref([]);
const tempDateRange3 = ref([]);
const tempDateRange4 = ref([]);
const tempDateRange5 = ref([]);

// 处理日期变化
const handleDateChange1 = (val) => {
    if (val && val.length === 2) {
        activityForm.startDate = val[0];
        activityForm.endDate = val[1];
    } else {
        activityForm.startDate = '';
        activityForm.endDate = '';
    }
};
const handleDateChange2 = (val) => {
    if (val && val.length === 2) {
        activityForm.firstChooseStartDate = val[0];
        activityForm.firstChooseEndDate = val[1];
    } else {
        activityForm.firstChooseStartDate = '';
        activityForm.firstChooseEndDate = '';
    }
    console.log(activityForm.firstChooseStartDate, activityForm.firstChooseEndDate);
};
const handleDateChange3 = (val) => {
    if (val && val.length === 2) {
        activityForm.secondChooseStartDate = val[0];
        activityForm.secondChooseEndDate = val[1];
    } else {
        activityForm.secondChooseStartDate = '';
        activityForm.secondChooseEndDate = '';
    }
    console.log(activityForm.secondChooseStartDate, activityForm.secondChooseEndDate);
};
const handleDateChange4 = (val) => {
    if (val && val.length === 2) {
        activityForm.thirdChooseStartDate = val[0];
        activityForm.thirdChooseEndDate = val[1];
    } else {
        activityForm.thirdChooseStartDate = '';
        activityForm.thirdChooseEndDate = '';
    }
    console.log(activityForm.thirdChooseStartDate, activityForm.thirdChooseEndDate);
};
const handleDateChange5 = (val) => {
    if (val && val.length === 2) {
        activityForm.stdChooseStartDate = val[0];
        activityForm.stdChooseEndDate = val[1];
    } else {
        activityForm.stdChooseStartDate = '';
        activityForm.stdChooseEndDate = '';
    }
    console.log(activityForm.stdChooseStartDate, activityForm.stdChooseEndDate);
};


const activityFormRef = ref();
const activityForm = reactive({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    firstChooseStartDate: '',
    firstChooseEndDate: '',
    secondChooseStartDate: '',
    secondChooseEndDate: '',
    thirdChooseStartDate: '',
    thirdChooseEndDate: '',
    stdChooseStartDate: '',
    stdChooseEndDate: ''
});
const userBatchForm = reactive({
    users: [],
});

const activityFormRules = reactive({
    name: [{ required: true, message: "请输入活动名称", trigger: "blur" }],
    description: [{ required: true, message: "请输入活动描述", trigger: "blur" }], 
});
// //更新单一新增
const submitOneForm = () => {
    console.log(activityForm);
    if(activityForm.startDate==='')
    return ElMessage.error('请输入活动开始时间');
    if(activityForm.firstChooseEndDate==='')
    return ElMessage.error('请输入第一志愿时间');
    if(activityForm.secondChooseEndDate==='')
    return ElMessage.error('请输入第二志愿时间');
    if(activityForm.thirdChooseEndDate==='')
    return ElMessage.error('请输入第三志愿时间');
    if(activityForm.stdChooseEndDate==='')
    return ElMessage.error('请输入学生填报志愿时间');
    activityFormRef.value.validate(async (valid) => {
        if (valid) {
            const res =  await axios.post("/api/admin/addActivity", activityForm)
            console.log(res);
            if(res.data.code === 200){
                ElMessage.success('添加成功');
                router.push("/activity/activityList");
            }else{
            console.log(123);
            
            }
        }
    })
};

</script>
<style lang="scss" scoped>
.demo-ruleForm {
    margin-top: 50px;
}
</style>
