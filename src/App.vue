<template>
  <div class="app">
    <Editor v-model="state"></Editor>
  </div>
</template>

<script setup>
import { ref } from "vue";
import data from "./data";

import Editor from "./packages/editor";

const state = ref(data);
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
