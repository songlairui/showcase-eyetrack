type ElementRef<T> = T | ((el: T) => void);

export function Cam(props: {
  show?: boolean;
  ref?: ElementRef<HTMLVideoElement>;
}) {
  return (
    <div
      style={{
        // position: "fixed",
        // bottom: "260px",
        // right: "10px",
        "pointer-events": "none",
        "border-radius": "6px",
        background: "lightgray",
        display: props.show ? "flex" : "none",
      }}
    >
      <video
        ref={props.ref}
        playsinline
        style={{
          "border-radius": "6px",
          width: "320px",
          height: "240px",
        }}
      ></video>
    </div>
  );
}
