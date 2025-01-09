import { mittEvents } from "./events";

export function useMenuDragger(containerRef, data) {
  // 当前拖拽组件是谁
  let currentComponent = null;

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
          key: currentComponent.key,
          zIndex: 1,
          alignCenter: true, // 希望松手的时候渲染元素居中
          props: {}, // props是针对所有元素的
          model: {}, // model是针对input元素的，用于双向绑定
        },
      ],
    };
    // 用完后置空当前组件
    currentComponent = null;
  };

  // 开始拖拽左侧组件时，给容器绑定各种事件
  const dragstart = (e, component) => {
    // 设置拖拽元素的位置，可以显示图片或者自身dom，50,50表示无论从哪里开始拖，始终从中间开始截取拖动图像
    e.dataTransfer.setDragImage(e.target, 50, 50);

    // 拖拽前发布start事件，用于记录拖拽前的状态，实现撤销操作
    mittEvents.emit("start");

    // dragenter 进入目标元素 添加移动标识
    // dragover 经过目标元素（必须要阻止默认行为，否则无法触发drop）
    // dragleave 离开目标元素 增加禁用标识
    // drop 松手的时候 根据拖拽组件添加该组件到目标元素
    containerRef.value.addEventListener("dragenter", dragenter);
    containerRef.value.addEventListener("dragover", dragover);
    containerRef.value.addEventListener("dragleave", dragleave);
    containerRef.value.addEventListener("drop", drop);

    // 记录当前拖拽的组件是谁
    currentComponent = component;
  };

  // 拖拽左侧组件结束后移除容器的各个事件，释放内存
  const dragend = (e) => {
    containerRef.value.removeEventListener("dragenter", dragenter);
    containerRef.value.removeEventListener("dragover", dragover);
    containerRef.value.removeEventListener("dragleave", dragleave);
    containerRef.value.removeEventListener("drop", drop);

    // 拖拽后发布end事件，用于记录拖拽后的状态，实现重做操作
    mittEvents.emit("end");
  };

  // 返回内容
  return { dragstart, dragend };
}
