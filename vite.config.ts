import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [solid()],
  assetsInclude: ["node_modules/@mediapipe/tasks-vision/wasm/*"],
});
