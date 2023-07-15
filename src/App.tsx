import {
  Show,
  createMemo,
  createResource,
  createSignal,
  lazy,
  onMount,
} from "solid-js";

import { EyeCursor, Minimap } from "./components/Minimap/Minimap";
import { TrackMonitor } from "./components/EyeTrack/TrackMonitor";

import { createCursor } from "./util/createCursor";
import { SetupBoundary } from "./util/createBoundary";
import { prepareMediapipeVision } from "./util/prepareModels";

import "./App.css";
import { Cam } from "./components/EyeTrack/Cam";
import { createControlVideo } from "./components/EyeTrack/createControlVideo";
import { Checkbox } from "./components/Checkbox";
import { Dynamic } from "solid-js/web";

// import { SetupEyeTrack } from "./components/EyeTrack";

const SetupEyeTrack = lazy(() => import("./components/EyeTrack"));

function App() {
  const [point, setPoint] = createSignal<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const cursor = createMemo(createCursor(point));

  const [visionModel] = createResource(prepareMediapipeVision);

  const [showMinimap, setShowMinimap] = createSignal(true);
  const [showCam, setShowCam] = createSignal(false);
  const [showMonitor, setShowMonitor] = createSignal(false);

  let videoRef: HTMLVideoElement | undefined;
  let canvasRef: HTMLCanvasElement | undefined;

  // 开关视频
  const {
    enable,
    isPending,
    toggleCam,
    clear: clearCam,
  } = createControlVideo(
    function (stream) {
      if (videoRef) {
        videoRef.srcObject = stream;
        videoRef.play();
      }
    },
    (err) => {
      alert(`Enable Cam Failed: ${err.message}`);
    }
  );

  onMount(() => {
    return () => {
      clearCam();
    };
  });

  return (
    <>
      <SetupBoundary />
      <Show when={showMinimap}>
        <Minimap cursor={cursor()} />
      </Show>
      <EyeCursor cursor={cursor()} />

      <h1>Mediapipe Face Landmarks</h1>
      <p>Model Status: {visionModel.state}</p>

      <button disabled={isPending()} onClick={() => toggleCam()}>
        {enable() ? "Disable Eyetrack" : "Enable Eyetrack"}
      </button>

      <div
        style={{
          display: "grid",
          gap: "12px",
          "grid-auto-flow": "column",
          padding: "12px 0px",
          "justify-content": "center",
        }}
      >
        <Checkbox value={showMinimap()} onChange={(val) => setShowMinimap(val)}>
          {"Show Minimap"}
        </Checkbox>
        <Checkbox
          disabled={!enable()}
          value={showCam()}
          onChange={(val) => setShowCam(val)}
        >
          <Dynamic component={enable() ? "u" : "s"}>{"Show Cam Video"}</Dynamic>
        </Checkbox>
        <Checkbox value={showMonitor()} onChange={(val) => setShowMonitor(val)}>
          {"Show Monitor"}
        </Checkbox>
      </div>

      {/* TODO  get stream without <video /> */}
      <Cam ref={videoRef} show={showCam()} />

      {/* 开启摄像头后展示 */}
      <TrackMonitor show={showMonitor()} ref={canvasRef}></TrackMonitor>

      <SetupEyeTrack
        enableMonitor={showMonitor()}
        visionModel={visionModel}
        getCanvasRef={() => canvasRef}
        getDetectSource={() => videoRef}
        onUpdate={(val) => {
          setPoint(val);
        }}
      ></SetupEyeTrack>
    </>
  );
}

export default App;
