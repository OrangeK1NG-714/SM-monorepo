import { ref } from "vue";

const currentPage = ref(1);
const pageSize = ref(10);
// 分页相关函数
const handlePageChange = (val) => {
  currentPage.value = val;
};

const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1; // 重置到第一页
};

export {
  currentPage,
  pageSize,
  handlePageChange,
  handleSizeChange
}