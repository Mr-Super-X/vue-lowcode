import { computed, defineComponent } from "vue";

// 引入样式
import "./editor.scss";
// 引入内容块组件
import EditorBlock from "./editor-block";

export default defineComponent({
  // 定义组件的props
  props: {
    modelValue: { type: Object, required: true },
  },
  setup(props) {
    console.log(props.data);

    const data = computed({
      get() {
        return props.modelValue;
      },
    });

    // 容器的样式
    const containerStyles = computed(() => ({
      width: data.value.container.width + "px",
      height: data.value.container.height + "px",
    }));

    return () => (
      <div className="editor">
        <div className="editor-left">左侧物料栏</div>
        <div className="editor-top">菜单栏</div>
        <div className="editor-right">右侧属性区</div>
        <div className="editor-container">
          {/* 负责产生滚动条 */}
          <div className="editor-container-canvas">
            {/* 负责产生内容区 */}
            <div
              className="editor-container-canvas__content"
              style={containerStyles.value}
            >
              {data.value.blocks.map((block) => (
                <EditorBlock block={block}></EditorBlock>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  },
});
