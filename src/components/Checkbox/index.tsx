export function Checkbox(props: {
  value?: boolean;
  disabled?: boolean;
  children?: any;
  onChange?: (val: boolean) => void;
}) {
  return (
    <label class="flex gap-2 items-center">
      <input
        type="checkbox"
        disabled={props.disabled}
        checked={props.value}
        onChange={(e) => {
          props.onChange?.(e.target.checked);
        }}
      ></input>
      <span>{props.children}</span>
    </label>
  );
}
