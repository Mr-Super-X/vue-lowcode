import { ref, computed, defineComponent, inject } from "vue";
import { useMenuDragger } from "./useMenuDragger";
import { useFocus } from "./useFocus";
import { useBlockDragger } from "./useBlockDragger";
import { useCommand } from "./useCommand";
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

    // 1.菜单拖拽功能
    const { dragstart, dragend } = useMenuDragger(containerRef, data);

    // 2.实现内容区组件获取焦点，选中后可能立即拖拽，回调函数会在鼠标按下时调用
    const { containerMousedown, blockMousedown, focusData, lastSelectBlock } =
      useFocus(data, (e) => {
        // 获取焦点后进行拖拽
        mousedown(e);
      });

    // 3.实现拖拽内容区组件功能
    const { mousedown, markLine } = useBlockDragger(
      focusData,
      lastSelectBlock,
      data
    );

    // 4.实现撤销重做等命令功能
    const { commands } = useCommand(data);

    const buttons = [
      {
        label: "撤销",
        icon: "icon-back",
        handler() {
          commands.undo();
        },
      },
      {
        label: "重做",
        icon: "icon-forward",
        handler() {
          commands.redo();
        },
      },
    ];

    return () => (
      <div class="editor">
        {/* 负责左侧预览组件 */}
        <div class="editor-left">
          {/* 根据注册列表渲染预览内容，实现h5的拖拽 */}
          {config.componentList.map((component) => (
            <div
              class="editor-left-item"
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
        <div class="editor-top">
          {buttons.map((button, idx) => {
            return (
              <div class="editor-top-button" onClick={button.handler}>
                <i class={button.icon}></i>
                <span class="editor-top-button__label">{button.label}</span>
              </div>
            );
          })}
        </div>
        <div class="editor-right">右侧属性区</div>
        <div class="editor-container">
          {/* 负责产生滚动条 */}
          <div class="editor-container-canvas">
            {/* 负责产生内容区 */}
            <div
              class="editor-container-canvas__content"
              style={containerStyles.value}
              ref={containerRef}
              onMousedown={containerMousedown}
            >
              {/* 动态渲染所有内容块 */}
              {data.value.blocks.map((block, idx) => (
                <EditorBlock
                  block={block}
                  class={block.focus ? "editor-block-focus" : ""}
                  onMousedown={(e) => blockMousedown(e, block, idx)}
                ></EditorBlock>
              ))}

              {/* 动态显示横向辅助线 */}
              {markLine.y !== null && (
                <div
                  class="editor-container__line-y"
                  style={{ top: markLine.y + "px" }}
                ></div>
              )}
              {/* 动态显示纵向辅助线 */}
              {markLine.x !== null && (
                <div
                  class="editor-container__line-x"
                  style={{ left: markLine.x + "px" }}
                ></div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
});
