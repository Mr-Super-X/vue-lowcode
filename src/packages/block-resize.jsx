import { defineComponent } from "vue";

export default defineComponent({
  props: {
    block: {
      type: Object,
      required: true,
    },
    component: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    // 读取组件是否支持修改宽高
    const { width, height } = props.component.resize || {};

    let data = {};

    // 鼠标按下事件
    const onMousedown = (e, direction) => {
      // 阻止默认事件，防止其他默认行为产生
      e.stopPropagation();
      data = {
        // 1.记录拖拽元素开始的位置
        startX: e.clientX,
        startY: e.clientY,
        // 2. 记录初始的宽高
        startWidth: props.block.width,
        startHeight: props.block.height,
        // 3. 记录初始的位置
        startLeft: props.block.left,
        startTop: props.block.top,
        // 4. 记录元素的方向
        direction,
      };

      // 绑定事件，触发拖拽行为
      document.body.addEventListener("mousemove", onMousemove);
      document.body.addEventListener("mouseup", onMouseUp);
    };

    // 鼠标移动事件
    const onMousemove = (e) => {
      let { clientX, clientY } = e;
      let {
        startX,
        startY,
        startWidth,
        startHeight,
        startLeft,
        startTop,
        direction,
      } = data;

      // 处理水平点逻辑，只能改纵向，横向不发生变化
      if (direction.horizontal === "center") {
        clientX = startX;
      }

      // 处理垂直点逻辑，只能改横向，纵向不发生变化
      if (direction.vertical === "center") {
        clientY = startY;
      }

      // 1. 计算元素的新位置
      let durX = clientX - startX;
      let durY = clientY - startY;

      // 针对反向拖拽的点，取反，拿到正确的top和left
      if (direction.vertical === "start") {
        durY = -durY;
        props.block.top = startTop - durY;
      }
      if (direction.horizontal === "start") {
        durX = -durX;
        props.block.left = startLeft - durX;
      }

      // 2. 计算元素的新宽高
      let newWidth = startWidth + durX;
      let newHeight = startHeight + durY;
      // 3. 保证元素在可编辑区域内
      // if (newX < 0) {
      //   newX = 0;
      // }
      // if (newY < 0) {
      //   newY = 0;
      // }
      // if (newWidth < 10) {
      //   newWidth = 10;
      // }

      // 拖拽时改变元素宽高
      props.block.width = newWidth;
      props.block.height = newHeight;
      // 添加标识，告诉block正在拖拽修改宽高
      props.block.resizing = true;
    };

    // 抬起鼠标释放内存
    const onMouseUp = () => {
      document.body.removeEventListener("mousemove", onMousemove);
      document.body.removeEventListener("mouseup", onMouseUp);
    };

    return () => (
      <>
        {/* 仅支持修改width */}
        {width && (
          <>
            <div
              class="editor-block-resize editor-block-resize__left"
              onMousedown={(e) =>
                onMousedown(e, { horizontal: "start", vertical: "center" })
              }
            ></div>
            <div
              class="editor-block-resize editor-block-resize__right"
              onMousedown={(e) =>
                onMousedown(e, { horizontal: "end", vertical: "center" })
              }
            ></div>
          </>
        )}

        {/* 仅支持修改height */}
        {height && (
          <>
            <div
              class="editor-block-resize editor-block-resize__top"
              onMousedown={(e) =>
                onMousedown(e, { horizontal: "center", vertical: "start" })
              }
            ></div>
            <div
              class="editor-block-resize editor-block-resize__bottom"
              onMousedown={(e) =>
                onMousedown(e, { horizontal: "center", vertical: "end" })
              }
            ></div>
          </>
        )}

        {/* 既支持修改width，也支持修改height */}
        {width && height && (
          <>
            <div
              class="editor-block-resize editor-block-resize__top-left"
              onMousedown={(e) =>
                onMousedown(e, { horizontal: "start", vertical: "start" })
              }
            ></div>
            <div
              class="editor-block-resize editor-block-resize__top-right"
              onMousedown={(e) =>
                onMousedown(e, { horizontal: "end", vertical: "start" })
              }
            ></div>
            <div
              class="editor-block-resize editor-block-resize__bottom-left"
              onMousedown={(e) =>
                onMousedown(e, { horizontal: "start", vertical: "end" })
              }
            ></div>
            <div
              class="editor-block-resize editor-block-resize__bottom-right"
              onMousedown={(e) =>
                onMousedown(e, { horizontal: "end", vertical: "end" })
              }
            ></div>
          </>
        )}
      </>
    );
  },
});
