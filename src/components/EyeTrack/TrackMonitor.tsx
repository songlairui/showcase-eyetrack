/**
 * 监视器视角查看人机位置
 */
export function TrackMonitor(props: {
  show?: boolean;
  ref?: HTMLCanvasElement | ((el: HTMLCanvasElement) => void);
}) {
  return (
    <div
      style={{
        display: props.show ? "flex" : "none",
        position: "fixed",
        bottom: "10px",
        right: "10px",
        // "pointer-events": "none", // three control draggable
        "border-radius": "6px",
        background: "lightgray",
      }}
    >
      <canvas
        ref={props.ref}
        // threejs renderer will also setSize
        style={{
          "border-radius": "6px",
          width: "360px",
          height: "240px",
        }}
      ></canvas>
    </div>
  );
}
