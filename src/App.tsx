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

import { Cam } from "./components/EyeTrack/Cam";
import { createControlVideo } from "./components/EyeTrack/createControlVideo";
import { Checkbox } from "./components/Checkbox";
import { Dynamic } from "solid-js/web";
import css from "./App.module.less";

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
  const [showMonitor, setShowMonitor] = createSignal(true);

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
      <EyeCursor cursor={cursor()} />
      <div class={css.wrapper}>
        <header>
          <div>Mediapipe Face Landmarks</div>
          <div class={css["header-actions"]}>
            <a
              class="btn"
              href="https://github.com/songlairui/showcase-eyetrack"
              target="_blank"
              title="songlairui/showcase-eyetrack"
            >
              <span class="i-custom-svg:github  icon24 inline-icon block"></span>
              <span>showcase-eyetrack</span>
            </a>
          </div>
        </header>
        <main>
          <div class={css.hero}>
            <div class={css["hero-action"]}>
              <p>FaceLandmarks: {visionModel.state}</p>

              <button
                class="btn btn-primary"
                disabled={isPending()}
                onClick={() => toggleCam()}
              >
                {enable() ? "Disable Eyetrack" : "Enable Eyetrack"}
              </button>
            </div>
            {/* css["hero-desc"] */}
            <article class={"prose prose-xl"}>
              <h3 style={{ opacity: 0.6 }}>
                <s>Responsive, precision eye tracking.(on Vision Pro)</s>
              </h3>
              <h1 style={{ opacity: 0.95 }}>
                Budget version eye tracking
                <br />
                {" 丐版眼动追踪"}
              </h1>
              <h4 style={{ opacity: 0.75 }}>
                eye tracking via web cam powered by mediapipe
              </h4>
              <p style={{ opacity: 0.3 }}>
                Worked on notebook with webcam, eg: macbook
              </p>
            </article>
          </div>

          <div style={{ height: "3em" }}></div>

          <div class={css.controls}>
            <div class={css["control-item"]}>
              {/* 暂不控制 */}
              <Show when={false}>
                <Checkbox
                  value={showMinimap()}
                  onChange={(val) => setShowMinimap(val)}
                >
                  {"Show Minimap"}
                </Checkbox>
              </Show>
              <div class={css.tip}>
                browser-viewport browser-boundary screen
              </div>
              <Show when={showMinimap()}>
                <Minimap cursor={cursor()} />
              </Show>
            </div>
            <div class={css["control-item"]}>
              {/* 暂不控制 */}
              <Show when={false}>
                <Checkbox
                  value={showMonitor()}
                  onChange={(val) => setShowMonitor(val)}
                >
                  {"Show Monitor"}
                </Checkbox>
              </Show>
              {/* 开启摄像头后展示 */}
              <div class={css.tip}>3D position about webcam & face</div>
              <TrackMonitor
                show={
                  enable()
                  // showMonitor()
                }
                ref={canvasRef}
              ></TrackMonitor>
            </div>
            <div class={css["control-item"]}>
              <Checkbox
                disabled={!enable()}
                value={showCam()}
                onChange={(val) => setShowCam(val)}
              >
                <Dynamic component={enable() ? "u" : "s"}>
                  {"Show Cam Video"}
                </Dynamic>
              </Checkbox>
              {/* TODO  get stream without <video /> */}
              <div class={css.tip}></div>
              <Cam ref={videoRef} show={showCam()} />
            </div>
          </div>
          <div style={{ height: "3em" }}></div>

          <article class={"prose prose-xl"}>
            <h3>How it works</h3>
            <pre class="whitespace-pre-wrap">
              {`\
- Based on the (`}
              <a
                href="https://threejs.org/examples/?q=cam#webgl_morphtargets_webcam"
                target="_blank"
              >
                threejs example
              </a>
              {`),
  it includes the FaceLandmarks from @mediapipe/tasks-vision
  \`outputFacialTransformationMatrixes: true\` output 3D position
  
- Add some assistive geometry
  - add mbpGeometry
  - add y*z plane
  - add eyesight ray
  - transform & tune vector between local and world
  - compute intersectPoint
`}
              <strong>
                {`\
  - transform to screen point`}
              </strong>
              {"\n\n"}
              <strong>{`Checkout the code:\n  `}</strong>
              <code>
                <a href="https://github.com/songlairui/showcase-eyetrack/blob/master/src/components/EyeTrack/index.tsx#L450">
                  [repo]/src/components/EyeTrack/index.tsx#L450 setupEyeTrack()
                </a>
              </code>
              {`
              `}
            </pre>
            <h3 style={{ "margin-bottom": "0" }}>Reference:</h3>
            <ul style={{}}>
              <li>
                <a
                  href="https://developers.google.com/mediapipe/solutions/vision/face_landmarker/web_js"
                  target="_blank"
                >
                  google mediapipe solution: vision face landmarks
                </a>
              </li>
              <li>
                <a
                  href="https://threejs.org/examples/?q=cam#webgl_morphtargets_webcam"
                  target="_blank"
                >
                  threejs example: morphtargets_webcam
                </a>
              </li>
            </ul>
          </article>
        </main>
        <footer>
          <div class="">{/* Credits */}</div>
          <div style={{ display: "flex", gap: ".6em" }}>{/*  */}</div>
        </footer>
      </div>

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
