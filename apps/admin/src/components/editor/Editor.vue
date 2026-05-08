<template>
  <div style="border: 1px solid #ccc">
    <Toolbar
      style="border-bottom: 1px solid #ccc"
      :editor="editorRef"
      :defaultConfig="toolbarConfig"
      :mode="mode"
    />
    <Editor
      style="height: 500px; overflow-y: hidden"
      v-model:value="valueHtml"
      :defaultConfig="editorConfig"
      :mode="mode"
      @onCreated="handleCreated"
      @onChange="handleChange"
    />
  </div>
</template>

<script setup>
import "@wangeditor/editor/dist/css/style.css"; // 引入 css

import { onBeforeUnmount, ref, shallowRef, onMounted, defineProps } from "vue";
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";

const emit = defineEmits(["event"]);

const props = defineProps({
  content: String,
});
// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef();

// 内容 HTML
const valueHtml = ref("<p>hello</p>");

// 模拟 ajax 异步获取内容
onMounted(() => {
  setTimeout(() => {
    valueHtml.value = "<p></p>";
  }, 1500);
});

const toolbarConfig = {};
const editorConfig = { placeholder: "请输入内容..." };

// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor == null) return;
  editor.destroy();
});

const handleCreated = (editor) => {
  editorRef.value = editor; // 记录 editor 实例，重要！
  console.log(editor);

  // 设置初始值
  // if (props.content) {
  //   editor.txt.html(props.content);
  // }
};

const handleChange = (editor) => {
  // console.log("change:", editor.children);
  // console.log("change:", editor.children[0].children[0].text);
  // 连接两行文字（但没有设置空格标志）
  let data = "";
  for (let i = 0; i < editor.children.length; i++) {
    data += editor.children[i].children[0].text;
  }
  //子传父
  emit("event", data);
};

const mode = "default"; // 或 'simple'
</script>

<style scoped>
/* 你可以在这里添加样式 */
</style>
