<template>
  <el-upload
    class="upload-demo"
    drag
    action=""
    :auto-upload="false"
    :limit="1"
    accept=".fbx"
    :on-remove="handleRemove"
    :before-upload="beforeUpload"
    :on-change="handleFileChange"
    :file-list="fileList"
  >
    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
    <div class="el-upload__text">拖动.fbx文件到此处 <em>点击上传</em></div>
    <template #tip>
      <div class="el-upload__tip">只支持fbx文件格式，文件大小不能超过50M。</div>
    </template>
  </el-upload>
</template>
<script setup>
import { defineEmits, defineProps, computed, ref } from "vue";
import { UploadFilled } from "@element-plus/icons-vue";
const fileList = ref([]); // 定义 fileList

// 定义 emit 事件
const emit = defineEmits(["qlcmodelchange"]);
// //定义props
// const props = defineProps({
//   modelFile: String, // 接收外部传入的文件路径
// });

// 文件上传前的校验
const beforeUpload = (file) => {
  const isFBX = file.name.endsWith(".fbx");
  const isLt50MB = file.size / 1024 / 1024 < 50;

  if (!isFBX) {
    console.error("文件类型不符合要求：", file.name);
    ElMessage.error("只能上传 .fbx 文件！");
    return false;
  }
  if (!isLt50MB) {
    console.error("文件大小超过限制：", file.size);
    ElMessage.error("文件大小不能超过 50MB！");
    return false;
  }
  console.log("文件校验通过：", file.name);
  return true;
};

// 文件选择后的回调
const handleFileChange = (modelFile) => {
  fileList.value = [modelFile]; // 更新 fileList
  emit("qlcmodelchange", modelFile.raw); // 触发自定义事件
  console.log("文件选择：", modelFile.raw);
};
// 删除文件
const handleRemove = (file) => {
  fileList.value = []; // 清空 fileList
  emit("qlcmodelchange", null); // 触发自定义事件，传递 null 表示删除文件
  console.log("删除文件：", file, fileList.value);  
}
</script>
