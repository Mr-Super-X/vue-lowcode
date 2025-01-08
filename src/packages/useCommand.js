import deepcopy from "deepcopy";
import { mittEvents } from "./events";
import { onUnmounted } from "vue";

export function useCommand(data, focusData) {
  const state = {
    // 撤销重做需要指针
    current: -1, // 前进后退索引
    queue: [], // 存放所有操作命令
    commands: {}, // 制作命令和执行功能的映射表 undo:() => {} 、redo:() => {}
    commandArray: [], // 存放所有命令
    destroyArray: [], // 要销毁的事件列表
  };

  // 注册命令方法
  const registry = (command) => {
    // 将命令存到数组中
    state.commandArray.push(command);
    // 制作命令和功能的映射表 规则为命令的name对应命令的执行函数
    state.commands[command.name] = (...args) => {
      const { redo, undo } = command.execute(...args);

      redo();

      // 查看命令是否需要放到队列中，不需要就拉倒
      if (!command.pushQueue) {
        return;
      }

      // 如果放置顺序为：组件1 -> 组件2 -> 组件3
      // 点击两次撤回结果为：组件1
      // 则直接截掉后面的，保留组件1即可
      if (state.queue.length > 0) {
        // 截取
        state.queue = state.queue.slice(0, state.current + 1);
      }

      // 将前进后退方法存到队列中
      state.queue.push({
        redo,
        undo,
      });

      // 索引递增
      state.current = state.current + 1;
    };
  };

  // 注册重做命令
  registry({
    name: "redo",
    keyboard: "ctrl+shift+z",
    execute() {
      return {
        redo() {
          // 没有可以重做的了
          // if (state.current === -1) return;

          // 通过索引拿到当前的下一步是谁
          const item = state.queue[state.current + 1];
          // 如果有就调用重做方法
          if (item) {
            item.redo && item.redo();
            // 每重做一次索引值对应加1
            state.current++;
          }
        },
      };
    },
  });

  // 注册撤销命令
  registry({
    name: "undo",
    keyboard: "ctrl+z",
    execute() {
      return {
        redo() {
          // 没有可以撤销的了
          if (state.current === -1) return;

          // 通过索引拿到当前是哪一步
          const item = state.queue[state.current];
          // 如果有就调用撤销方法
          if (item) {
            item.undo && item.undo();
            // 每撤回一次索引值对应减1
            state.current--;
          }
        },
      };
    },
  });

  // 注册拖拽命令
  registry({
    name: "drag",
    pushQueue: true, // 希望将操作放到队列中，可以增加该属性，标识等会操作要放到队列中
    // 初始化操作，默认就会执行，每个命令的初始化操作可以放在这
    init() {
      this.before = null;

      // 监控开始拖拽事件，记录拖拽前的状态
      const start = () => {
        this.before = deepcopy(data.value.blocks);
      };
      // 监控拖拽之后需要触发对应的指令
      const end = () => state.commands.drag();

      // 监控拖拽前和拖拽后事件
      mittEvents.on("start", start);
      mittEvents.on("end", end);

      // 解绑事件，释放内存
      return () => {
        mittEvents.off("start");
        mittEvents.off("end");
      };
    },
    execute() {
      // 拿到拖拽前后的状态
      let before = this.before;
      let after = data.value.blocks;

      return {
        redo() {
          // 存储当前状态，实现重做
          data.value = { ...data.value, blocks: after };
        },
        undo() {
          // 存储前一步状态，实现撤销
          data.value = { ...data.value, blocks: before };
        },
      };
    },
  });

  // 注册容器更新命令（导入json渲染也要支持撤销重做）
  registry({
    name: "updateContainer",
    pushQueue: true, // 希望将操作放到队列中，可以增加该属性，标识等会操作要放到队列中
    execute(newValue) {
      // 记录旧值和新值，实现撤销重做
      const state = {
        before: data.value,
        after: newValue,
      };
      return {
        redo() {
          data.value = state.after;
        },
        undo() {
          data.value = state.before;
        },
      };
    },
  });

  // 注册置顶命令（也要支持撤销重做）
  registry({
    name: "placeTop",
    pushQueue: true, // 希望将操作放到队列中，可以增加该属性，标识等会操作要放到队列中
    execute() {
      // 记录旧值和新值，实现撤销重做
      const state = {
        before: deepcopy(data.value.blocks), // 深拷贝一份，否则由于前后引用一致，不会触发响应式更新
        after: (() => {
          // 置顶就是在所有的block中找到最大的z-index + 1
          const { focus, unfocus } = focusData.value;

          // 找到z-index最大的block
          const maxZIndex = unfocus.reduce((prev, block) => {
            return Math.max(prev, block.zIndex);
          }, -Infinity);

          // 置顶当前选中的block，让它比最大的z-index还要大1
          focus.forEach((block) => (block.zIndex = maxZIndex + 1));

          // 返回最新值
          return data.value.blocks;
        })(),
      };
      return {
        redo() {
          data.value = { ...data.value, blocks: state.after };
        },
        undo() {
          data.value = { ...data.value, blocks: state.before };
        },
      };
    },
  });

  // 注册置底命令（也要支持撤销重做）
  registry({
    name: "placeBottom",
    pushQueue: true, // 希望将操作放到队列中，可以增加该属性，标识等会操作要放到队列中
    execute() {
      // 记录旧值和新值，实现撤销重做
      const state = {
        before: deepcopy(data.value.blocks), // 深拷贝一份，否则由于前后引用一致，不会触发响应式更新
        after: (() => {
          // 置底就是在所有的block中找到最小的z-index - 1
          const { focus, unfocus } = focusData.value;

          // 找到z-index最小的block，如果它是0，-1就会变成负值
          let minZIndex =
            unfocus.reduce((prev, block) => {
              return Math.min(prev, block.zIndex);
            }, Infinity) - 1;

          // 置底当前选中的block
          // 不能直接减1，出现负值可能导致block无法选中或不可见，当minZIndex < 0 时
          // 让所有的block层级都加上minZIndex，并让自己变成0
          if (minZIndex < 0) {
            const dur = Math.abs(minZIndex);
            unfocus.forEach((block) => (block.zIndex += dur));
            minZIndex = 0;
          }
          // 如果没出现负值，则让当前选中的block层级比最小的z-index减1（前面求minZIndex时已经减了，这里赋值即可）
          focus.forEach((block) => (block.zIndex = minZIndex));

          // 返回最新值
          return data.value.blocks;
        })(),
      };
      return {
        redo() {
          data.value = { ...data.value, blocks: state.after };
        },
        undo() {
          data.value = { ...data.value, blocks: state.before };
        },
      };
    },
  });

  // 键盘事件
  const keyboardEvents = (() => {
    const keyCodes = {
      89: "y",
      90: "z",
      // ...
    };
    const onKeydown = (e) => {
      const { ctrlKey, shiftKey, keyCode } = e;
      // 快捷键组合
      let keyString = [];
      // 按住ctrl键就添加ctrl前缀
      if (ctrlKey) keyString.push("ctrl");
      // 按住shift键就添加shift前缀
      if (shiftKey) keyString.push("shift");

      // 将对应的keycode追加到快捷键组合中
      keyString.push(keyCodes[keyCode]);

      // 通过+号拼接快捷键
      keyString = keyString.join("+");

      // 遍历所有命令，通过name取出对应的键盘事件并执行
      state.commandArray.forEach(({ keyboard, name }) => {
        // 没有键盘事件就拉倒
        if (!keyboard) return;

        // 匹配快捷键
        if (keyboard === keyString) {
          // 执行对应命令
          state.commands[name]();

          // 禁用浏览器的默认行为，防止在网页上按快捷键弹出一些窗口，比如ctrl+s默认是打开保存网页到本地
          e.preventDefault();
          e.stopPropagation();
        }
      });
    };

    // 初始化
    const init = () => {
      window.addEventListener("keydown", onKeydown); // 绑定键盘事件

      // 解绑事件，释放内存
      return () => {
        window.removeEventListener("keydown", onKeydown); // 解绑键盘事件
      };
    };
    return init;
  })();

  // 自执行函数，查找命令是否存在init方法，有则自动执行
  (() => {
    // 监控键盘事件
    state.commandArray.push(keyboardEvents());

    // 循环所有命令，执行init方法，并将返回值存入销毁列表中
    state.commandArray.forEach(
      // 调用完init，将返回值放到销毁列表中
      (command) => command.init && state.destroyArray.push(command.init())
    );
  })();

  // 页面卸载后销毁需要销毁的事件
  onUnmounted(() => {
    state.destroyArray.forEach((fn) => fn && fn());
  });

  // 返回内容
  return state;
}
