// 列表区，可以显示所有的物料
// map，key对应组件的映射关系

import Range from "@/components/Range";
import { ElButton, ElInput, ElOption, ElSelect } from "element-plus";

function createEditorConfig() {
  const componentList = [];
  const componentMap = {};

  return {
    componentList,
    componentMap,
    register(component) {
      componentList.push(component);
      componentMap[component.key] = component;
    },
  };
}

// 导出配置
export const registerConfig = createEditorConfig();

// 生成input输入框
const createInputProp = (label) => ({
  type: "input",
  label,
});

// 生成颜色选择器
const createColorProp = (label) => ({
  type: "color",
  label,
});

// 生成下拉菜单
const createSelectProp = (label, options) => ({
  type: "select",
  label,
  options,
});

// 生成下拉选项表
const createTableProp = (label, table) => ({
  type: "table",
  label,
  table,
});

// 注册物料
registerConfig.register({
  key: "text",
  label: "文本",
  props: {
    text: createInputProp("文本内容"),
    color: createColorProp("文本颜色"),
    size: createSelectProp("字体大小", [
      { label: "14px", value: 14 },
      { label: "16px", value: 16 },
      { label: "18px", value: 18 },
      { label: "20px", value: 20 },
      { label: "22px", value: 22 },
      { label: "24px", value: 24 },
      { label: "26px", value: 26 },
      { label: "28px", value: 28 },
      { label: "30px", value: 30 },
      { label: "32px", value: 32 },
      { label: "34px", value: 34 },
      { label: "36px", value: 36 },
    ]),
  },
  preview() {
    return "预览文本";
  },
  render({ props }) {
    return (
      <span style={{ color: props.color, fontSize: props.size + "px" }}>
        {props.text || "渲染文本"}
      </span>
    );
  },
});

registerConfig.register({
  key: "button",
  label: "按钮",
  resize: {
    width: true, // 表示可以更改按钮的宽度
    height: true, // 表示可以更改按钮的高度
  },
  props: {
    text: createInputProp("按钮内容"),
    type: createSelectProp("按钮类型", [
      { label: "默认", value: "default" },
      { label: "主要", value: "primary" },
      { label: "成功", value: "success" },
      { label: "信息", value: "info" },
      { label: "警告", value: "warning" },
      { label: "危险", value: "danger" },
    ]),
    size: createSelectProp("按钮尺寸", [
      { label: "默认", value: "default" },
      { label: "large", value: "large" },
      { label: "small", value: "small" },
    ]),
  },
  preview() {
    return <ElButton>预览按钮</ElButton>;
  },
  render({ props, size }) {
    return (
      <ElButton
        style={{ height: size.height + "px", width: size.width + "px" }}
        type={props.type}
        size={props.size}
      >
        {props.text || "渲染按钮"}
      </ElButton>
    );
  },
});

registerConfig.register({
  key: "input",
  label: "输入框",
  resize: {
    width: true, // 表示可以更改输入框的宽度
  },
  // model可能有多个字段
  // model: {
  //   start: "开始字段",
  //   end: "结束字段",
  // };
  model: {
    // 输入框双向绑定的字段
    default: "绑定字段", // 默认绑定到default属性上
  },
  preview() {
    return <ElInput placeholder="预览输入框"></ElInput>;
  },
  render({ props, model, size }) {
    return (
      <ElInput
        style={{ width: size.width + "px" }}
        {...model.default}
        placeholder={props.text || "渲染输入框"}
      ></ElInput>
    );
  },
});

registerConfig.register({
  key: "range",
  label: "范围选择器",
  // model可能有多个字段
  // model: {
  //   start: "开始字段",
  //   end: "结束字段",
  // };
  model: {
    // 输入框双向绑定的字段
    start: "开始范围字段",
    end: "结束范围字段",
  },
  preview() {
    return <Range></Range>;
  },
  render({ props, model }) {
    return (
      <Range
        {...{
          start: model.start.modelValue,
          "onUpdate:start": model.start["onUpdate:modelValue"], // @update:start
          end: model.end.modelValue,
          "onUpdate:end": model.end["onUpdate:modelValue"], // @update:end
        }}
      ></Range>
    );
  },
});

registerConfig.register({
  key: "select",
  label: "下拉选择器",
  props: {
    options: createTableProp("下拉选项", {
      options: [
        {
          label: "显示值（label）",
          field: "label",
        },
        {
          label: "绑定值（value）",
          field: "value",
        },
      ],
      key: "label", // 显示给用户的值配置字段支持，默认label，你也可以配成value
    }), // 选项列表
  },
  model: {
    // 双向绑定字段
    default: "绑定字段",
  },
  preview() {
    return <ElSelect placeholder="预览下拉框"></ElSelect>;
  },
  render({ props, model }) {
    return (
      <ElSelect {...model.default} placeholder="渲染下拉框">
        {(props.options || []).map((opt, idx) => (
          <ElOption label={opt.label} value={opt.value} key={idx}></ElOption>
        ))}
      </ElSelect>
    );
  },
});
