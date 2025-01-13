import deepcopy from "deepcopy";
import {
  ElButton,
  ElColorPicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect,
} from "element-plus";
import { defineComponent, inject, reactive, watch } from "vue";
import TableEditor from "./table-editor";

export default defineComponent({
  props: {
    block: {
      // 用户最后选中的block
      type: Object,
    },
    data: {
      // 当前所有的数据
      type: Object,
    },
    updateContainer: {
      // 更新容器属性的方法
      type: Function,
    },
    updateBlock: {
      // 更新组件block的方法
      type: Function,
    },
  },
  setup(props, ctx) {
    // 注入组件的配置信息
    const config = inject("config");

    const state = reactive({
      editData: {},
    });

    const handleReset = () => {
      // 如果block不存在，说明当前要绑定容器的属性，反之绑定block的属性
      if (!props.block) {
        state.editData = deepcopy(props.data.container);
      } else {
        state.editData = deepcopy(props.block);
      }
    };

    const handleApply = () => {
      if (!props.block) {
        // 更新组件容器的属性配置
        props.updateContainer({ ...props.data, container: state.editData }); // 保留原数据，更新container
      } else {
        // 更新组件的属性配置
        props.updateBlock(state.editData, props.block); // 传入更新的数据和老的数据
      }
    };

    // 监控block是否存在，如果block不存在，说明当前要绑定容器的属性，反之绑定block的属性
    watch(() => props.block, handleReset, {
      immediate: true,
    });

    return () => {
      const content = [];

      // 若没有选中的block，则渲染容器属性控制面板，若选中block，则渲染block属性控制面板
      if (!props.block) {
        content.push(
          <>
            <ElFormItem label="容器宽度">
              <ElInputNumber v-model={state.editData.width} />
            </ElFormItem>
            <ElFormItem label="容器高度">
              <ElInputNumber v-model={state.editData.height} />
            </ElFormItem>
          </>
        );
      } else {
        // 通过组件枚举拿到组件各项属性
        const component = config.componentMap[props.block.key];
        if (component && component.props) {
          // 取出 {text: xxx, color: xxx, size: xxx, ......} 进行渲染
          content.push(
            Object.entries(component.props).map(([propName, propConfig]) => {
              return (
                <ElFormItem label={propConfig.label}>
                  {/* 动态渲染一个对象，通过object[propConfig.type]()来调用具体方法如input来渲染input */}
                  {{
                    input: () => (
                      <ElInput
                        v-model={state.editData.props[propName]}
                      ></ElInput>
                    ),
                    color: () => (
                      <ElColorPicker
                        v-model={state.editData.props[propName]}
                      ></ElColorPicker>
                    ),
                    select: () => (
                      <ElSelect v-model={state.editData.props[propName]}>
                        {propConfig.options.map((opt) => (
                          <ElOption
                            label={opt.label}
                            value={opt.value}
                          ></ElOption>
                        ))}
                      </ElSelect>
                    ),
                    table: () => (
                      <TableEditor
                        v-model={state.editData.props[propName]}
                        propConfig={propConfig}
                      ></TableEditor>
                    ),
                  }[propConfig.type]()}
                </ElFormItem>
              );
            })
          );
        }

        // 若该组件有model属性（针对input组件）
        if (component && component.model) {
          content.push(
            Object.entries(component.model).map(([modelName, label]) => {
              return (
                <ElFormItem label={label}>
                  {/* model => {default: 'username'} */}
                  <ElInput v-model={state.editData.model[modelName]}></ElInput>
                </ElFormItem>
              );
            })
          );
        }
      }

      return (
        <ElForm label-position="top" class="editor-right-form">
          {content}
          <ElFormItem>
            <ElButton type="primary" onClick={() => handleApply()}>
              应用
            </ElButton>
            <ElButton type="default" onClick={handleReset}>
              重置
            </ElButton>
          </ElFormItem>
        </ElForm>
      );
    };
  },
});
