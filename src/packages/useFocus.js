import { computed } from "vue";

export function useFocus(data, callback) {
  // 计算容器内选中和未选中的组件
  // 多选整体移动位置时需要知道具体移动哪些组件
  const focusData = computed(() => {
    const focus = [];
    const unfocus = [];
    data.value.blocks.forEach((block) =>
      (block.focus ? focus : unfocus).push(block)
    );

    return { focus, unfocus };
  });

  const clearBlockFocus = () => {
    data.value.blocks.forEach((block) => {
      block.focus = false;
    });
  };

  // 3.实现拖拽内容区多个元素
  // 点击容器内的渲染组件，添加选中状态
  // 在block上规划一个属性 focus 获取焦点后将focus属性改为true，否则就是false
  const blockMousedown = (e, block) => {
    // 组织默认行为和事件
    e.preventDefault();
    e.stopPropagation();

    // 支持按住ctrl键多选
    if (e.ctrlKey) {
      block.focus = !block.focus;
    } else {
      if (!block.focus) {
        clearBlockFocus(); // 每次选中前先清空其他元素的选中状态
        block.focus = true;
      } else {
        // 不能在这里置为false，否则会导致鼠标点选一次松开后无法再拖动组件
        // block.focus = false;
      }
    }

    // 执行回调函数
    callback && callback(e);
  };

  // 点击容器区域取消容器内渲染组件的选中状态
  const containerMousedown = (e) => {
    // 优化体验，没有按住ctrl键点击内容区时才清空组件选中状态，防止误点导致前面多选的状态都被清空
    if (!e.ctrlKey) {
      clearBlockFocus();
    }
  };

  // 返回内容
  return {
    focusData,
    blockMousedown,
    containerMousedown,
  };
}
