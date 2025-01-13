import { createApp } from "vue";
import "element-plus/theme-chalk/index.css"; // 在App组件前引用，否则会导致editor.scss中重置el元素的css不生效
import App from "./App.vue";
import router from "./router";

createApp(App).use(router).mount("#app");

// 1.先自己构造假数据，能实现根据位置渲染内容
// 2.配置组件对应的映射关系 {preview: xxx, render: xxx}
