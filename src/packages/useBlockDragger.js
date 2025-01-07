import { reactive } from "vue";
import { mittEvents } from "./events";

export function useBlockDragger(focusData, lastSelectBlock, data) {
  // 记录容器内选中元素的位置
  let dragState = {
    startX: 0, // 鼠标相对于可视窗口的初始clientX
    startY: 0, // 鼠标相对于可视窗口的初始clientY
    startLeft: 0, // 元素的初始left值
    startTop: 0, // 元素的初始top值
    startPosition: [], // 选中的所有元素当前top和left位置信息
    lines: {
      // 辅助线
      x: [], // 存储纵向辅助线
      y: [], // 存储横向辅助线
    },
    dragging: false, // 当前是否正在拖拽
  };

  // 将辅助线变为响应式，动态更新显示
  let markLine = reactive({
    x: null,
    y: null,
  });

  // 鼠标按住选中组件在容器内移动时，更新选中组件的位置信息
  const mousemove = (e) => {
    let { clientX: moveX, clientY: moveY } = e;

    // 状态修改为正在拖拽中，并派发事件
    if (!dragState.dragging) {
      dragState.dragging = true;
      // 派发事件，记住拖拽前的位置，用于实现撤回操作
      mittEvents.emit("start");
    }

    // 拖拽组件移动时，计算当前组件最新的left和top，去辅助线里面找到对应的线进行显示
    // left = 鼠标移动后 - 鼠标移动前 + left
    // top = 鼠标移动后 - 鼠标移动前 + top
    const left = moveX - dragState.startX + dragState.startLeft;
    const top = moveY - dragState.startY + dragState.startTop;

    let y = null;
    let x = null;
    const space = 5; // 接近参照物显示辅助线的位置，默认5像素
    // 计算横线 距离参照物还有space像素时显示辅助线
    for (let i = 0; i < dragState.lines.y.length; i++) {
      const { top: t, showTop: s } = dragState.lines.y[i]; // 获取每一根线

      // 如果小于space，说明横向接触条件满足
      if (Math.abs(t - top) < space) {
        y = s; // 线要显示的位置

        // 实现快速贴边（吸附效果）
        // 容器距离顶部的距离（startY - startTop） + 目标的top = 最新的Y轴移动位置
        moveY = dragState.startY - dragState.startTop + t;

        break; // 找到一根线就跳出循环
      }
    }

    // 计算竖线 距离参照物还有space像素时显示辅助线
    for (let i = 0; i < dragState.lines.x.length; i++) {
      const { left: l, showLeft: s } = dragState.lines.x[i]; // 获取每一根线

      // 如果小于space，说明横向接触条件满足
      if (Math.abs(l - left) < space) {
        x = s; // 线要显示的位置

        // 实现快速贴边（吸附效果）
        // 容器距离左侧的距离（startX - startLeft） + 目标的left = 最新的x轴移动位置
        moveX = dragState.startX - dragState.startLeft + l;

        break; // 找到一根线就跳出循环
      }
    }

    // 将辅助线变为响应式，动态更新视图
    markLine.y = y;
    markLine.x = x;

    // 最终位置 = 移动的位置 - 开始的位置
    // 计算横向位置
    const durX = moveX - dragState.startX;
    // 计算纵向位置
    const durY = moveY - dragState.startY;

    // 没按住ctrl键时才可以拖动，解决按键冲突问题
    if (!e.ctrlKey) {
      // 更新位置信息
      focusData.value.focus.forEach((block, idx) => {
        block.top = dragState.startPosition[idx].top + durY;
        block.left = dragState.startPosition[idx].left + durX;
      });
    }
  };

  // 在容器内按下鼠标选中组件时，记录当前组件的位置信息，并绑定事件
  const mousedown = (e) => {
    // 拿到容器内最后一个点击选中的组件块的宽高，假设当前选中的组件为B
    const {
      width: BWidth,
      height: BHeight,
      left: BLeft,
      top: BTop,
    } = lastSelectBlock.value;

    // 在容器内鼠标按下时，记录选中组件的位置信息
    dragState = {
      startX: e.clientX, // 记录鼠标相对于可视窗口的clientX
      startY: e.clientY, // 记录鼠标相对于可视窗口的clientY
      startLeft: BLeft, // B组件拖拽前的左侧位置
      startTop: BTop, // B组件拖拽前的顶部位置
      dragging: false, // 鼠标按下时，设置状态为false，拖动时更新为true，用于实现撤销重做记录开关
      startPosition: focusData.value.focus.map(({ top, left }) => ({
        top,
        left,
      })),
      // 辅助线
      lines: (() => {
        // 点击选中组件时拿选中的组件块和没有选中的组件块的位置，来计算屏幕上所有应该出现线的位置
        // 假设未选中的组件元素为A，为每个A组件都生成从左到右从上到下的对应位置辅助线，拖拽B组件接近A时再动态展示辅助线
        const { unfocus } = focusData.value;

        // 计算横线和竖线的位置，分别用x和y表示，每个方向都有5中对齐方式，所以用数组存储
        const lines = {
          x: [], // 存储纵向对齐线位置
          y: [], // 存储横向对齐线位置
        };

        // 遍历所有未选中的元素作为参照物，生成辅助线
        // 同时追加容器作为参照物，实现容器内拖拽也有辅助线效果
        [
          ...unfocus,
          {
            top: 0,
            left: 0,
            width: data.value.container.width,
            height: data.value.container.height,
          },
        ].forEach((block) => {
          const {
            top: ATop,
            left: ALeft,
            width: AWidth,
            height: AHeight,
          } = block;

          // -----------------------------------横向辅助线--------------------------------------------

          // 当前组件拖拽到和A组件top值一致时，显示这根辅助线，辅助线的位置就是ATop
          // 顶对顶
          lines.y.push({ showTop: ATop, top: ATop });
          // 顶对底
          lines.y.push({ showTop: ATop, top: ATop - BHeight });
          // 中对中
          lines.y.push({
            showTop: ATop + AHeight / 2,
            top: ATop + AHeight / 2 - BHeight / 2,
          });
          // 底对顶
          lines.y.push({
            showTop: ATop + AHeight,
            top: ATop + AHeight,
          });
          // 底对底
          lines.y.push({
            showTop: ATop + AHeight,
            top: ATop + AHeight - BHeight,
          });

          // ------------------------------------纵向辅助线----------------------------------------

          // 左对左
          lines.x.push({ showLeft: ALeft, left: ALeft });
          // 左对右
          lines.x.push({ showLeft: ALeft, left: ALeft - BWidth });
          // 中对中
          lines.x.push({
            showLeft: ALeft + AWidth / 2,
            left: ALeft + AWidth / 2 - BWidth / 2,
          });
          // 右对左
          lines.x.push({
            showLeft: ALeft + AWidth,
            left: ALeft + AWidth,
          });
          // 右对右
          lines.x.push({
            showLeft: ALeft + AWidth,
            left: ALeft + AWidth - BWidth,
          });
        });

        // 返回计算结果
        return lines;
      })(),
    };

    // 给容器绑定鼠标移动和松开事件
    document.addEventListener("mousemove", mousemove);
    document.addEventListener("mouseup", mouseup);
  };

  // 鼠标松开时解绑事件，释放内存
  const mouseup = (e) => {
    document.removeEventListener("mousemove", mousemove);
    document.removeEventListener("mouseup", mouseup);

    // 鼠标松开后去除辅助线
    markLine.y = null;
    markLine.x = null;

    // 如果点击立马松开鼠标没有发生拖动，则不会触发事件（在mousemove事件中触发修改dragging的状态）
    if (dragState.dragging) {
      mittEvents.emit("end");
    }
  };

  return {
    mousedown,
    markLine,
  };
}
