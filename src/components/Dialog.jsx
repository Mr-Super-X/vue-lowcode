import { ElButton, ElDialog, ElInput } from "element-plus";
import { createVNode, defineComponent, reactive, render } from "vue";

// 创建Dialog组件
const DialogComponent = defineComponent({
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
    });

    // 暴露方法供外部使用
    ctx.expose({
      showDialog(options) {
        state.options = options; // 每次点击显示dialog都更新配置，防止调用多个dialog时内容不更新
        state.isShow = true;
      },
    });

    // 关闭弹窗
    const handleCancel = () => {
      state.isShow = false;
    };

    // 确认
    const handleConfirm = () => {
      state.isShow = false;
      // 执行确认回调函数
      props.options.onConfirm && props.options.onConfirm(state.options.content);
    };

    return () => (
      <ElDialog v-model={state.isShow} title={state.options.title}>
        {/* 配置插槽 */}
        {{
          default: () => (
            <ElInput
              v-model={state.options.content}
              type="textarea"
              rows={10}
            />
          ),
          footer: () =>
            state.options.footer && (
              <div class="editor-dialog-footer">
                <ElButton onClick={() => handleCancel()}>取消</ElButton>
                <ElButton onClick={() => handleConfirm()} type="primary">
                  确定
                </ElButton>
              </div>
            ),
        }}
      </ElDialog>
    );
  },
});

let vNode;
export function $dialog(options) {
  // 借助element-plus的dialog组件
  // 手动挂载组件 new SubComponent.$mount()

  // 如果vNode不存在则创建，否则直接调用即可，防止页面上创建n个元素
  if (!vNode) {
    // 创建挂载容器
    const el = document.createElement("div");
    el.className = "editor-dialog-container";
    // 创建虚拟节点
    vNode = createVNode(DialogComponent, { options });
    // 将虚拟节点变成真实节点进行渲染，将组件渲染到el元素中
    const rNode = render(vNode, el);
    // 将el扔到页面中
    document.body.appendChild((rNode, el));
  }

  // 从组件实例中取出已暴露出来的方法
  const { showDialog } = vNode.component.exposed;

  // 调用弹窗
  showDialog(options);
}
