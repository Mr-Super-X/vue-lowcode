<template>
  <div class="app">
    <Editor v-model="state"></Editor>
  </div>
</template>

<script setup>
import { ref, provide } from "vue";
import { registerConfig as config } from "./utils/editor-config";
import data from "./data";
import Editor from "./packages/editor";

const state = ref(data);

// 将组件config配置提供出去，其它任何组件都可以使用inject注入使用
provide("config", config);
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
