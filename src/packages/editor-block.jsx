import { computed, defineComponent } from "vue";

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

    return () => (
      <div className="editor-block" style={blockStyles.value}>
        这是一个代码块
      </div>
    );
  },
});
