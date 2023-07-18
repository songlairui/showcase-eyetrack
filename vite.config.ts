import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import { viteStaticCopy } from "vite-plugin-static-copy";
import unocss from "unocss/vite";

export default defineConfig({
  plugins: [
    unocss(),
    solid(),
    // prepare wasm related files
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/@mediapipe/tasks-vision/wasm/*.{js,wasm}",
          dest: "wasm/vision",
        },
        {
          src: "node_modules/three/examples/jsm/libs/basis/*.{js,wasm}",
          dest: "wasm/three",
        },
      ],
    }),
    // prepare another files
    // - https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
    // - threejs face flb
  ],
});
