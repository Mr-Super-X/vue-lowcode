import { computed, defineComponent, inject } from "vue";

export default defineComponent({
  props: {
    block: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    // 内容块样式
    const blockStyles = computed(() => ({
      top: `${props.block.top}px`,
      left: `${props.block.left}px`,
      zIndex: `${props.block.zIndex}`,
    }));

    // 读取组件config配置
    const config = inject("config");

    return () => {
      // 找到组件
      const component = config.componentMap[props.block.key];
      // 拿到要渲染的真实组件
      const RenderComponent = component.render();
      return (
        <div className="editor-block" style={blockStyles.value}>
          {/* 这里不能使用标签形式来渲染，如<RenderComponent /> */}
          {RenderComponent}
        </div>
      );
    };
  },
});
