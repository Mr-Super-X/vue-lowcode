import { ref, computed, defineComponent, inject } from "vue";
import deepcopy from "deepcopy";

// 引入样式
import "./editor.scss";
// 引入内容块组件
import EditorBlock from "./editor-block";

export default defineComponent({
  // 定义组件的props
  props: {
    modelValue: { type: Object, required: true },
  },
  emits: ["update:modelValue"], // 要触发的事件
  setup(props, ctx) {
    const data = computed({
      get() {
        return props.modelValue;
      },
      set(newVal) {
        // 将数据进行深拷贝后派发出去
        ctx.emit("update:modelValue", deepcopy(newVal));
      },
    });

    // 容器的样式
    const containerStyles = computed(() => ({
      width: data.value.container.width + "px",
      height: data.value.container.height + "px",
    }));

    // 注入组件配置
    const config = inject("config");

    // 容器ref
    const containerRef = ref();

    // 当前拖拽组件是谁
    const currentComponent = ref(null);

    const dragenter = (e) => {
      e.dataTransfer.dropEffect = "move";
    };
    const dragover = (e) => {
      e.preventDefault();
    };
    const dragleave = (e) => {
      e.dataTransfer.dropEffect = "none";
    };
    const drop = (e) => {
      let blocks = data.value.blocks; // 拿到内部已经渲染的组件
      // 更新双向绑定的值
      data.value = {
        ...data.value,
        blocks: [
          ...blocks,
          {
            top: e.offsetY,
            left: e.offsetX,
            key: currentComponent.value.key,
            zIndex: 1,
            alignCenter: true, // 希望松手的时候渲染元素居中
          },
        ],
      };
      // 用完后置空当前组件
      currentComponent.value = null;
    };

    // 拖拽左侧组件时，给容器绑定各种事件
    const dragstart = (e, component) => {
      // dragenter 进入目标元素 添加移动标识
      // dragover 经过目标元素（必须要阻止默认行为，否则无法触发drop）
      // dragleave 离开目标元素 增加禁用标识
      // drop 松手的时候 根据拖拽组件添加该组件到目标元素
      containerRef.value.addEventListener("dragenter", dragenter);
      containerRef.value.addEventListener("dragover", dragover);
      containerRef.value.addEventListener("dragleave", dragleave);
      containerRef.value.addEventListener("drop", drop);

      // 记录当前拖拽的组件是谁
      currentComponent.value = component;
    };

    // 拖拽左侧组件结束后移除容器的各个事件，释放内存
    const dragend = (e) => {
      containerRef.value.removeEventListener("dragenter", dragenter);
      containerRef.value.removeEventListener("dragover", dragover);
      containerRef.value.removeEventListener("dragleave", dragleave);
      containerRef.value.removeEventListener("drop", drop);
    };

    return () => (
      <div className="editor">
        {/* 负责左侧预览组件 */}
        <div className="editor-left">
          {/* 根据注册列表渲染预览内容，实现h5的拖拽 */}
          {config.componentList.map((component) => (
            <div
              className="editor-left-item"
              draggable
              onDragstart={(e) => dragstart(e, component)}
              onDragend={dragend}
            >
              <span>{component.label}</span>
              <div>{component.preview()}</div>
            </div>
          ))}
        </div>
        {/* 负责顶部菜单栏 */}
        <div className="editor-top">菜单栏</div>
        <div className="editor-right">右侧属性区</div>
        <div className="editor-container">
          {/* 负责产生滚动条 */}
          <div className="editor-container-canvas">
            {/* 负责产生内容区 */}
            <div
              className="editor-container-canvas__content"
              style={containerStyles.value}
              ref={containerRef}
            >
              {/* 动态渲染所有内容块 */}
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
