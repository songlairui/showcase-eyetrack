import { createSignal, useTransition } from "solid-js";

export function createControlVideo(
  onStreamLoaded?: (stream: MediaStream) => void,
  onCamFail?: (err: Error) => void
) {
  const [enable, setEnable] = createSignal(false);
  const [videoStream, setVideoStream] = createSignal<MediaStream>();
  const [isPending, start] = useTransition();

  function toggleCam() {
    if (isPending()) {
      return;
    }
    const nextState = !enable();
    start(async () => {
      if (nextState) {
        // 打开摄像头
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          setVideoStream(stream);
          onStreamLoaded?.(stream);
        } catch (error: any) {
          if (onCamFail) {
            onCamFail?.(error);
          } else {
            console.error("onCamFail", error);
          }
        }
      } else {
        // 关闭摄像头
        videoStream()
          ?.getTracks()
          .forEach((track) => {
            track.stop();
          });
        setVideoStream(undefined);
      }

      setEnable(nextState);
    });
  }

  function clear() {
    if (enable()) {
      // 关闭摄像头
      videoStream()
        ?.getTracks()
        .forEach((track) => {
          track.stop();
        });
      setVideoStream(undefined);
      setEnable(false);
    }
  }

  return {
    enable,
    isPending,
    onCamFail,
    toggleCam,
    videoStream,
    clear,
  };
}
