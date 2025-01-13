import { ref, computed, defineComponent, inject, onMounted } from "vue";
import EditorBlockResize from "./editor-block-resize";

export default defineComponent({
  props: {
    block: {
      // 要渲染的组件块数据
      type: Object,
      required: true,
    },
    formData: {
      // 用户传递的formData
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
      const RenderComponent = component.render({
        // 选中元素拖拽block宽高时会接收该属性，registerConfig的render方法中通过获取该属性来修改宽高
        size: props.block.resizing
          ? { width: props.block.width, height: props.block.height }
          : {},
        props: props.block.props, // 将组件的props传递过去，registerConfig的render方法中则可以使用
        // 将组件的model传递过去，registerConfig的render方法中则可以使用，但是不能直接传，
        // 原因是我们需要将用户传入的formData中的字段和model的default字段进行双向绑定，所以要格式化一下
        // model: props.block.model => {default: 'username'} => {modelValue: formData.username, 'onUpdate:modelValue': (v) => formData.username = v}
        model: Object.keys(component.model || {}).reduce((prev, modelName) => {
          // 从block.model中取出属性名，比如输入绑定字段为username
          const propName = props.block.model[modelName]; // username

          // 格式化成双向绑定标准格式
          prev[modelName] = {
            modelValue: props.formData[propName], // formData[username] 如 刘德华
            "onUpdate:modelValue": (v) => (props.formData[propName] = v),
          };

          return prev;
        }, {}),
      });

      // 读取组件是否支持修改宽高
      const { width, height } = component.resize || {};

      return (
        <div class="editor-block" style={blockStyles.value} ref={blockRef}>
          {/* 这里不能使用标签形式来渲染，如<RenderComponent /> */}
          {RenderComponent}
          {/* 判断组件是否选中，且支持修改宽高，渲染可拖拉调节宽高组件 */}
          {/* 传递block目的是为了修改当前block的宽高，传递component是为了拿到component中存放的修改条件等数据 */}
          {props.block.focus && (width || height) && (
            <EditorBlockResize
              block={props.block}
              component={component}
            ></EditorBlockResize>
          )}
        </div>
      );
    };
  },
});
