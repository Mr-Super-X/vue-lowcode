import { ElDropdown, ElDropdownMenu, ElDropdownItem } from "element-plus";
import {
  computed,
  createVNode,
  defineComponent,
  inject,
  onMounted,
  onUnmounted,
  provide,
  reactive,
  ref,
  render,
} from "vue";

// 创建Dropdown组件
const DropdownComponent = defineComponent({
  props: {
    options: {
      type: Object,
      required: true,
    },
  },
  setup(props, ctx) {
    const state = reactive({
      options: props.options, // 用户传给组件的配置属性
      isShow: false,
      top: 0,
      left: 0,
    });

    // 暴露方法供外部使用
    ctx.expose({
      showDropdown(options) {
        state.options = options; // 每次点击显示dropdown都更新配置，防止调用多个dropdown时内容不更新
        state.isShow = true;

        // 找到点击的el，计算弹出位置
        const { left, top, height } = options.el.getBoundingClientRect();

        // 让dropdown在元素左侧底部弹出
        state.top = top + height;
        state.left = left;
      },
    });

    // 传递一个方法给item组件使用，这样可以在item点击后关闭父组件dropdown，provide支持跨层级传递
    provide("hide", () => (state.isShow = false));

    const classes = computed(() => [
      "editor-dropdown",
      { "is-show": state.isShow },
    ]);

    // 动态计算弹出的位置
    const styles = computed(() => ({
      top: state.top + "px",
      left: state.left + "px",
    }));

    const dropdownRef = ref(null);

    const onDocMousedown = (e) => {
      // 如果点击的不是 dropdown元素或内部元素，关闭 dropdown
      if (!dropdownRef.value.contains(e.target)) {
        state.isShow = false;
      }
    };

    // 组件加载完成后给Body绑定事件，实现点击旁边关闭dropdown
    onMounted(() => {
      // 事件传递的顺序是先捕获再冒泡，第三个参数表示捕获
      document.body.addEventListener("mousedown", onDocMousedown, true);
    });

    onUnmounted(() => {
      // 卸载事件，释放内存
      document.body.removeEventListener("mousedown", onDocMousedown);
    });

    return () => (
      <div class={classes.value} style={styles.value} ref={dropdownRef}>
        {state.options.renderContent()}
      </div>
    );
  },
});

export const DropdownItem = defineComponent({
  props: {
    label: String,
    icon: String,
  },
  setup(props) {
    const { label, icon } = props;

    // 注入父组件提供的方法
    const hide = inject("hide");

    return () => (
      <div class="editor-dropdown-item" onClick={hide}>
        <i class={icon}></i>
        <span class="editor-dropdown-item__label">{label}</span>
      </div>
    );
  },
});

let vNode;
export function $dropdown(options) {
  // 手动挂载组件 new SubComponent.$mount()

  // 如果vNode不存在则创建，否则直接调用即可，防止页面上创建n个元素
  if (!vNode) {
    // 创建挂载容器
    const el = document.createElement("div");
    el.className = "editor-dropdown-container";
    // 创建虚拟节点
    vNode = createVNode(DropdownComponent, { options });
    // 将虚拟节点变成真实节点进行渲染，将组件渲染到el元素中
    const rNode = render(vNode, el);
    // 将el扔到页面中
    document.body.appendChild((rNode, el));
  }

  // 从组件实例中取出已暴露出来的方法
  const { showDropdown } = vNode.component.exposed;

  // 调用弹窗
  showDropdown(options);
}
