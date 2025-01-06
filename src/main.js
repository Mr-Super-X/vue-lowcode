import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

import "element-plus/theme-chalk/index.css";

createApp(App).use(router).mount("#app");

// 1.先自己构造假数据，能实现根据位置渲染内容
// 2.配置组件对应的映射关系 {preview: xxx, render: xxx}
