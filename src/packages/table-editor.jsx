import deepcopy from "deepcopy";
import { ElButton, ElTag } from "element-plus";
import { computed, defineComponent } from "vue";
import { $tableDialog } from "@/components/TableDialog";

export default defineComponent({
  props: {
    modelValue: {
      // 双向绑定的值
      type: Array,
    },
    propConfig: {
      // 当前用户在registerConfig.register注册的props配置
      type: Object,
      required: true,
    },
  },
  emits: ["update:modelValue"], // 要触发的事件
  setup(props, ctx) {
    // 自定义组件双向绑定实现
    const data = computed({
      get() {
        return props.modelValue || [];
      },
      set(newValue) {
        ctx.emit("update:modelValue", deepcopy(newValue));
      },
    });

    const handleAdd = () => {
      $tableDialog({
        title: "编辑下拉选项",
        config: props.propConfig,
        data: data.value,
        onConfirm(value) {
          data.value = value; // 点击确认时将数据更新
        },
      });
    };

    return () => (
      <div class="editor-table">
        {/* 下拉框没有任何数据，直接显示按钮即可 */}
        {(!data.value || data.value.length === 0) && (
          <ElButton onClick={handleAdd}>添加</ElButton>
        )}
        {/* 下拉框有数据，渲染数据，动态显示配置的key */}
        {(data.value || []).map((item) => (
          <ElTag onClick={handleAdd}>{item[props.propConfig.table.key]}</ElTag>
        ))}
      </div>
    );
  },
});
