import { createMemo } from "solid-js";
import css from "./Minimap.module.css";
import { globalBoundary } from "../../util/createBoundary";
import { CursorState } from "../../util/createCursor";

export function Minimap(props: { cursor: CursorState }) {
  const { boundary } = globalBoundary;

  const screenPoint = createMemo(() => {
    return {
      left: boundary().w_screen * (props.cursor.ratioX || 0),
      top: boundary().h_screen * (props.cursor.ratioY || 0),
    };
  });

  return (
    <div
      style={{
        width: `${boundary().w_screen * 0.2}px`,
        height: `${boundary().h_screen * 0.2}px`,
        overflow: "hidden",
      }}
    >
      <div
        class={css.screen}
        style={{
          width: `${boundary().w_screen}px`,
          height: `${boundary().h_screen}px`,
        }}
      >
        <div
          class={css.sysbar}
          style={{
            height: `${boundary().sys_bar}px`,
          }}
        ></div>
        <div
          class={css.browser}
          style={{
            left: `${boundary().l}px`,
            top: `${boundary().t_outer}px`,
            width: `${boundary().w_outer}px`,
            height: `${boundary().h_outer}px`,
          }}
        >
          {JSON.stringify(boundary())}
        </div>
        <div
          class={css.viewport}
          style={{
            left: `${boundary().l}px`,
            top: `${boundary().t}px`,
            width: `${boundary().w}px`,
            height: `${boundary().h}px`,
          }}
        ></div>
        <div
          class={css["eye-track-thumb"]}
          style={{
            left: `${screenPoint().left}px`,
            top: `${screenPoint().top}px`,
          }}
        ></div>
      </div>
    </div>
  );
}

export function EyeCursor(props: { cursor: CursorState }) {
  const { boundary } = globalBoundary;
  const viewportPoint = createMemo(() => {
    return {
      left: boundary().w_screen * (props.cursor.ratioX || 0) - boundary().l,
      top: boundary().h_screen * (props.cursor.ratioY || 0) - boundary().t,
    };
  });

  return (
    <>
      <div
        class={css["eye-track"]}
        style={{
          left: `${viewportPoint().left}px`,
          top: `${viewportPoint().top}px`,
        }}
      ></div>
      {/* TODO border execeed indicator */}
      <div></div>
    </>
  );
}
