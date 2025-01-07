import { ref, computed, defineComponent, inject, onMounted } from "vue";

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

    const blockRef = ref(null);
    // 渲染元素后，拿到元素的宽高，处理居中
    onMounted(() => {
      const { offsetWidth, offsetHeight } = blockRef.value;
      // 拖拽松手的时候需要居中
      if (props.block.alignCenter) {
        // 处理元素居中
        props.block.left = props.block.left - offsetWidth / 2;
        props.block.top = props.block.top - offsetHeight / 2;

        // 重置状态
        props.block.alignCenter = false;
      }

      // 渲染组件后给组件添加宽高，有宽高才可以计算辅助线怎么对齐
      props.block.width = offsetWidth;
      props.block.height = offsetHeight;
    });

    return () => {
      // 找到组件
      const component = config.componentMap[props.block.key];
      // 拿到要渲染的真实组件
      const RenderComponent = component.render();
      return (
        <div class="editor-block" style={blockStyles.value} ref={blockRef}>
          {/* 这里不能使用标签形式来渲染，如<RenderComponent /> */}
          {RenderComponent}
        </div>
      );
    };
  },
});
