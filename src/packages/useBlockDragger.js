export function useBlockDragger(focusData) {
  // 记录容器内选中元素的位置
  let dragState = {
    startX: 0,
    startY: 0,
    startPosition: [], // 选中的所有元素当前top和left位置信息
  };

  // 鼠标按住选中组件在容器内移动时，更新选中组件的位置信息
  const mousemove = (e) => {
    const { clientX: moveX, clientY: moveY } = e;

    // 最终位置 = 移动的位置 - 开始的位置
    // 计算横向位置
    const durX = moveX - dragState.startX;
    // 计算纵向位置
    const durY = moveY - dragState.startY;

    // 更新位置信息
    focusData.value.focus.forEach((block, idx) => {
      block.top = dragState.startPosition[idx].top + durY;
      block.left = dragState.startPosition[idx].left + durX;
    });
  };

  // 在容器内按下鼠标选中组件时，记录当前组件的位置信息，并绑定事件
  const mousedown = (e) => {
    // 在容器内鼠标按下时，记录选中组件的位置
    dragState = {
      startX: e.clientX,
      startY: e.clientY,
      startPosition: focusData.value.focus.map(({ top, left }) => ({
        top,
        left,
      })),
    };

    // 给容器绑定鼠标移动和松开事件
    document.addEventListener("mousemove", mousemove);
    document.addEventListener("mouseup", mouseup);
  };

  // 鼠标松开时解绑事件，释放内存
  const mouseup = (e) => {
    document.removeEventListener("mousemove", mousemove);
    document.removeEventListener("mouseup", mouseup);
  };

  return {
    mousedown,
  };
}
