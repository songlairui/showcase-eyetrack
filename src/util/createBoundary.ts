// 浏览器窗口相关尺寸
// TODO 多屏幕

import { createRoot, createSignal, onMount } from "solid-js";
import { debounce } from "./debounce";

export const globalBoundary = createRoot(function createBoundary() {
  let shouldShowWarnMessage = true;
  const [boundary, originSetBoundary] = createSignal<{
    l: number;
    t_outer: number;
    t: number;
    w_outer: number;
    w: number;
    w_screen: number;
    h_outer: number;
    h: number;
    h_screen: number;
    sys_bar: number;
  }>({
    l: 0,
    t: 72,
    w: 1024,
    h: 720,
    t_outer: 0,
    w_outer: 0,
    h_outer: 0,
    w_screen: 1024,
    h_screen: 720,
    sys_bar: 26,
  });
  setTimeout(() => {
    // check was setupBoundary settled
    if (shouldShowWarnMessage) {
      console.warn("should setup <SetupBoundary />");
    }
  }, 3000);

  const setBoundary: typeof originSetBoundary = function (payload) {
    shouldShowWarnMessage = false;
    return originSetBoundary(payload);
  };

  return { boundary, setBoundary };
});

export function setupBoundary() {
  const { setBoundary } = globalBoundary;
  function updateSize() {
    const deltaH = window.outerHeight - window.innerHeight;
    const hasDevtoolY = deltaH > 100;
    setBoundary({
      l: window.screenX,
      t_outer: window.screenY,
      t: window.screenY + (hasDevtoolY ? 79 : deltaH),
      w_outer: window.outerWidth,
      h_outer: window.outerHeight,
      w: window.innerWidth,
      h: window.innerHeight,
      w_screen: window.screen.width,
      h_screen: window.screen.height,
      sys_bar: (window.screen as any)?.availTop || 0,
    });
  }
  const onResize = debounce(updateSize, 100, { leading: true });

  onMount(() => {
    updateSize();

    // 监听鼠标进入窗口
    document.documentElement.addEventListener("mouseleave", onResize);
    document.documentElement.addEventListener("mouseenter", onResize);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      document.documentElement.removeEventListener("mouseleave", onResize);
      document.documentElement.removeEventListener("mouseenter", onResize);
    };
  });
}

/** 用于更新全局 boundary */
export function SetupBoundary() {
  setupBoundary();
  return null;
}
