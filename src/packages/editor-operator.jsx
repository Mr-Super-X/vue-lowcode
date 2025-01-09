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
import { defineComponent, inject } from "vue";

export default defineComponent({
  props: {
    block: {
      // 用户最后选中的block
      type: Object,
      required: true,
    },
    data: {
      // 当前所有的数据
      type: Object,
      required: true,
    },
  },
  setup(props, ctx) {
    // 注入组件的配置信息
    const config = inject("config");

    return () => {
      const content = [];

      // 若没有选中的block，则渲染容器属性控制面板，若选中block，则渲染block属性控制面板
      if (!props.block) {
        content.push(
          <>
            <ElFormItem label="容器宽度">
              <ElInputNumber />
            </ElFormItem>
            <ElFormItem label="容器高度">
              <ElInputNumber />
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
                  {{
                    input: () => <ElInput></ElInput>,
                    color: () => <ElColorPicker></ElColorPicker>,
                    select: () => (
                      <ElSelect>
                        {propConfig.options.map((opt) => (
                          <ElOption
                            label={opt.label}
                            value={opt.value}
                          ></ElOption>
                        ))}
                      </ElSelect>
                    ),
                  }[propConfig.type]()}
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
            <ElButton type="primary">应用</ElButton>
            <ElButton type="plain">重置</ElButton>
          </ElFormItem>
        </ElForm>
      );
    };
  },
});
