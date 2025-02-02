import { ref, computed, defineComponent, inject } from "vue";
import { useMenuDragger } from "./useMenuDragger";
import { useFocus } from "./useFocus";
import { useBlockDragger } from "./useBlockDragger";
import { useCommand } from "./useCommand";
import { $dialog } from "../components/Dialog";
import { $dropdown, DropdownItem } from "@/components/Dropdown";
import { ElButton } from "element-plus";
import deepcopy from "deepcopy";

// 引入样式
import "./editor.scss";
// 引入内容块组件
import EditorBlock from "./editor-block";
// 引入右侧属性操作栏组件
import EditorOperator from "./editor-operator";

export default defineComponent({
  // 定义组件的props
  props: {
    modelValue: { type: Object },
    formData: { type: Object },
  },
  emits: ["update:modelValue"], // 要触发的事件
  setup(props, ctx) {
    // 预览的时候内容不可操作，可以点击输入内容，方便看效果
    const previewRef = ref(false);
    // 当前是否为编辑状态，通过控制它来实现发布编辑好的结果
    const editorRef = ref(true);

    // 数据源
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
    const {
      containerMousedown,
      blockMousedown,
      clearBlockFocus,
      focusData,
      lastSelectBlock,
    } = useFocus(data, previewRef, (e) => {
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
    const { commands } = useCommand(data, focusData);

    // 操作按钮
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
      {
        label: "导出",
        icon: "icon-export",
        handler() {
          $dialog({
            title: "导出json",
            content: JSON.stringify(data.value),
          });
        },
      },
      {
        label: "导入",
        icon: "icon-import",
        handler() {
          $dialog({
            title: "导入json",
            footer: true, // 显示footer
            content: "",
            onConfirm(jsonText) {
              // data.value = JSON.parse(json); // 不能直接赋值，无法撤销重做
              const json = JSON.parse(jsonText);
              // 调用命令更新数据，命令中记录了数据变化，所以能实现撤销重做
              commands.updateContainer(json);
            },
          });
        },
      },
      {
        label: "置顶",
        icon: "icon-place-top",
        handler() {
          commands.placeTop();
        },
      },
      {
        label: "置底",
        icon: "icon-place-bottom",
        handler() {
          commands.placeBottom();
        },
      },
      {
        label: "删除",
        icon: "icon-delete",
        handler() {
          commands.delete();
        },
      },
      {
        label: () => (previewRef.value ? "编辑" : "预览"),
        icon: () => (previewRef.value ? "icon-edit" : "icon-browse"),
        handler() {
          previewRef.value = !previewRef.value; // 切换编辑和预览状态
          clearBlockFocus(); // 预览点击清空选中状态
        },
      },
      {
        label: "关闭",
        icon: "icon-close",
        handler() {
          editorRef.value = false; // 关闭编辑器
          clearBlockFocus(); // 预览点击清空选中状态
        },
      },
    ];

    // 6.实现鼠标右键菜单功能
    const blockContextmenu = (e, block) => {
      // 阻止浏览器弹出默认的右键菜单
      e.preventDefault();

      // 触发dropdown菜单
      $dropdown({
        el: e.target, // 以哪个元素为准产生dropdown菜单
        renderContent: () => {
          // 渲染内容方法
          return (
            <>
              <DropdownItem
                label="删除"
                icon="icon-delete"
                onClick={() => {
                  commands.delete();
                }}
              ></DropdownItem>
              <DropdownItem
                label="置顶"
                icon="icon-place-top"
                onClick={() => {
                  commands.placeTop();
                }}
              ></DropdownItem>
              <DropdownItem
                label="置底"
                icon="icon-place-bottom"
                onClick={() => {
                  commands.placeBottom();
                }}
              ></DropdownItem>
              <DropdownItem
                label="查看"
                icon="icon-browse"
                onClick={() => {
                  $dialog({
                    title: "查看节点数据",
                    content: JSON.stringify(block),
                  });
                }}
              ></DropdownItem>
              <DropdownItem
                label="导入"
                icon="icon-import"
                onClick={() => {
                  $dialog({
                    title: "导入节点json数据",
                    content: "",
                    footer: true,
                    onConfirm(jsonText) {
                      const json = JSON.parse(jsonText);
                      // 调用节点更新命令，传入新的数据和老的block
                      commands.updateBlock(json, block);
                    },
                  });
                }}
              ></DropdownItem>
            </>
          );
        },
      });
    };

    return () =>
      !editorRef.value ? (
        <div class="editor-preview-container">
          {/* 关闭状态下仅渲染预览区 */}
          <div
            class="editor-container-canvas__content"
            style={{ ...containerStyles.value, margin: 0 }}
          >
            {/* 动态渲染所有内容块 */}
            {data.value.blocks.map((block, idx) => (
              <EditorBlock
                block={block}
                formData={props.formData}
                class="editor-block-preview"
              ></EditorBlock>
            ))}
          </div>
          <div class="editor-btn-back">
            <ElButton type="primary" onClick={() => (editorRef.value = true)}>
              返回编辑
            </ElButton>
          </div>
          {JSON.stringify(props.formData)}
        </div>
      ) : (
        /* 非关闭状态下渲染完整功能 */
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
                <div class="editor-left-item__container">
                  {component.preview()}
                </div>
              </div>
            ))}
          </div>
          {/* 负责顶部菜单栏 */}
          <div class="editor-top">
            {buttons.map((button, idx) => {
              // 动态获取icon
              const icon =
                typeof button.icon === "function" ? button.icon() : button.icon;
              // 动态获取label
              const label =
                typeof button.label === "function"
                  ? button.label()
                  : button.label;

              return (
                <div class="editor-top-button" onClick={button.handler}>
                  <i class={icon}></i>
                  <span class="editor-top-button__label">{label}</span>
                </div>
              );
            })}
          </div>
          <div class="editor-right">
            {/* 负责右侧属性菜单 */}
            <EditorOperator
              block={lastSelectBlock.value} // 传入最后一个点击的block数据
              data={data.value} // 传入全部数据
              updateContainer={commands.updateContainer} // 传入更新容器的事件
              updateBlock={commands.updateBlock} // 传入更新block的事件
            ></EditorOperator>
          </div>
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
                    class={[
                      block.focus ? "editor-block-focus" : "",
                      previewRef.value ? "editor-block-preview" : "",
                    ]}
                    onMousedown={(e) => blockMousedown(e, block, idx)}
                    onContextmenu={(e) => blockContextmenu(e, block, idx)}
                    formData={props.formData}
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
