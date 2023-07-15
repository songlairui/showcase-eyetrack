/** x, y 的取值范围 */
export type VectorRange = {
  x: [number, number];
  y: [number, number];
};

export type CursorState = { ratioX: number; ratioY: number };

export const DEFAULT_RANGE: VectorRange = {
  x: [-1.6, 1.6],
  y: [0, -1.6],
};

export function createCursor(
  xyGetter: () => { x: number; y: number },
  range: VectorRange = DEFAULT_RANGE
) {
  return (): CursorState => {
    const ratioX = (xyGetter().x - range.x[0]) / (range.x[1] - range.x[0]);
    const ratioY = (xyGetter().y - range.y[0]) / (range.y[1] - range.y[0]);
    return {
      ratioX,
      ratioY,
    };
  };
}
