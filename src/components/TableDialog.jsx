import deepcopy from "deepcopy";
import {
  ElButton,
  ElDialog,
  ElInput,
  ElTable,
  ElTableColumn,
} from "element-plus";
import { defineComponent, createVNode, render, reactive } from "vue";

const TableDialogComponent = defineComponent({
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
      editData: [], // 编辑的数据
    });

    // 暴露方法供外部使用
    ctx.expose({
      showTableDialog(options) {
        state.options = options; // 每次点击显示dialog都更新配置，防止调用多个dialog时内容不更新
        state.isShow = true;
        state.editData = deepcopy(options.data); // 拷贝用户绑定的数据，防止操作时出现引用问题
      },
    });

    // 添加一项
    const handleAddItem = () => {
      state.editData.push({});
    };

    // 重置
    const handleReset = () => {};

    // 删除某一项
    const handleDeleteItem = (idx) => {
      state.editData.splice(idx, 1);
    };

    // 弹窗点击取消
    const handleCancel = () => {
      state.isShow = false;
    };

    // 弹窗点击确定
    const handleConfirm = () => {
      // 执行确认回调函数
      state.options.onConfirm && state.options.onConfirm(state.editData);
      // 关闭弹窗
      state.isShow = false;
    };

    return () => (
      <ElDialog
        v-model={state.isShow}
        title={state.options.title || state.options.config.label}
      >
        {/* 传入插槽 */}
        {{
          default: () => (
            <div class="editor-table-dialog__inner">
              <div class="editor-table-dialog__inner-btns">
                <ElButton onClick={handleAddItem}>添加</ElButton>
                <ElButton onClick={handleReset}>重置</ElButton>
              </div>
              <ElTable
                class="editor-table-dialog__inner-table"
                data={state.editData}
              >
                <ElTableColumn
                  label="序号"
                  width="55"
                  type="index"
                ></ElTableColumn>
                {state.options.config.table.options.map((item, idx) => (
                  <ElTableColumn label={item.label}>
                    {/* 传入插槽 */}
                    {{
                      default: ({ row }) => (
                        // 接收row，并将每一项对应的field绑定给input
                        <ElInput v-model={row[item.field]}></ElInput>
                      ),
                    }}
                  </ElTableColumn>
                ))}
                <ElTableColumn label="操作" width="90">
                  {{
                    default: ({ row, $index }) => (
                      <ElButton
                        type="danger"
                        onClick={() => handleDeleteItem($index)}
                      >
                        删除
                      </ElButton>
                    ),
                  }}
                </ElTableColumn>
              </ElTable>
            </div>
          ),
          footer: () => (
            <>
              <ElButton onClick={handleCancel}>取消</ElButton>
              <ElButton onClick={handleConfirm} type="primary">
                确定
              </ElButton>
            </>
          ),
        }}
      </ElDialog>
    );
  },
});

let vNode;
export const $tableDialog = (options) => {
  // 借助element-plus的dialog组件
  // 手动挂载组件 new SubComponent.$mount()

  // 如果vNode不存在则创建，否则直接调用即可，防止页面上创建n个元素
  if (!vNode) {
    // 创建挂载容器
    const el = document.createElement("div");
    el.className = "editor-table-dialog-container";
    // 创建虚拟节点
    vNode = createVNode(TableDialogComponent, { options });
    // 将虚拟节点变成真实节点进行渲染，将组件渲染到el元素中
    const rNode = render(vNode, el);
    // 将el扔到页面中
    document.body.appendChild((rNode, el));
  }

  // 从组件实例中取出已暴露出来的方法
  const { showTableDialog } = vNode.component.exposed;

  // 调用弹窗
  showTableDialog(options);
};
