<template>
  <div class="app">
    <Editor v-model="state" :formData="formData"></Editor>
  </div>
</template>

<script setup>
import { ref, provide } from "vue";
import { registerConfig as config } from "./utils/editor-config";
import data from "./data";
import Editor from "./packages/editor";

// 编辑器渲染的数据
const state = ref(data);

const formData = ref({
  username: "刘德华",
  password: "123",
  start: 0,
  end: 100,
});

// 将组件config配置提供出去，其它任何组件都可以使用inject注入使用
provide("config", config);

// 临时修复错误：https://blog.csdn.net/fqi_an_/article/details/138874471
// ResizeObserver loop completed with undelivered notifications.
//    at handleError (webpack-internal:///./node_modules/webpack-dev-server/client/overlay.js:308:58)
//        at eval (webpack-internal:///./node_modules/webpack-dev-server/client/overlay.js:327:7)
const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
};

const _ResizeObserver = window.ResizeObserver;
window.ResizeObserver = class ResizeObserver extends _ResizeObserver {
  constructor(callback) {
    callback = debounce(callback, 200);
    super(callback);
  }
};
</script>

<style>
.app {
  position: fixed;
  top: 20px;
  left: 20px;
  right: 20px;
  bottom: 20px;
}
</style>
