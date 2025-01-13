import { computed, defineComponent } from "vue";

export default defineComponent({
  props: {
    start: [Number, String],
    end: [Number, String],
  },
  emits: ["update:start", "update:end"],
  setup(props, ctx) {
    const start = computed({
      get() {
        return props.start;
      },
      set(newValue) {
        ctx.emit("update:start", newValue);
      },
    });

    const end = computed({
      get() {
        return props.end;
      },
      set(newValue) {
        ctx.emit("update:end", newValue);
      },
    });

    return () => (
      <div class="editor-range-input">
        <input type="text" v-model={start.value}></input>
        <span class="editor-range-input__separator">~</span>
        <input type="text" v-model={end.value}></input>
      </div>
    );
  },
});
