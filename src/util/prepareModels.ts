// config vite.d.ts make the "@mediapipe/tasks-vision" work

// import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { PREPARED_ASSETS } from "../PREPARED";

export async function prepareMediapipeVision() {
  const visionModule = await import("@mediapipe/tasks-vision");
  const FilesetResolver =
    visionModule.FilesetResolver || visionModule.default.FilesetResolver;

  const FaceLandmarker =
    visionModule.FaceLandmarker || visionModule.default.FaceLandmarker;

  const filesetResolver = await FilesetResolver.forVisionTasks(
    // "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    PREPARED_ASSETS.visionBasePath
  );
  const faceLandmarker = await FaceLandmarker.createFromOptions(
    filesetResolver,
    {
      baseOptions: {
        // modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
        modelAssetPath: PREPARED_ASSETS.faceLandmarker,
        delegate: "GPU",
      },
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
      runningMode: "VIDEO",
      numFaces: 1,
    }
  );

  return {
    filesetResolver,
    faceLandmarker,
  };
}

export type MediapipeResource = Awaited<
  ReturnType<typeof prepareMediapipeVision>
>;
