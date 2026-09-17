/**
 * Minimal canvas sparkline. The caller owns the canvas, its size, and any
 * device-pixel-ratio transform; this just paints a filled line series in
 * logical (CSS) pixel coordinates.
 */
type SparklineStyle = {
  fill: string;
  stroke: string;
};

function drawSparkline(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  values: readonly number[],
  style: SparklineStyle,
) {
  ctx.clearRect(0, 0, width, height);

  if (values.length < 2) {
    return;
  }

  let max = 0;

  for (const value of values) {
    if (value > max) {
      max = value;
    }
  }

  const range = max * 1.1 || 1;
  const stepX = width / (values.length - 1);
  const toY = (value: number) => height - (value / range) * height;

  ctx.beginPath();
  ctx.moveTo(0, toY(values[0]!));

  for (let index = 1; index < values.length; index += 1) {
    ctx.lineTo(index * stepX, toY(values[index]!));
  }

  ctx.lineWidth = 1;
  ctx.strokeStyle = style.stroke;
  ctx.stroke();

  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fillStyle = style.fill;
  ctx.fill();
}

export { drawSparkline };
export type { SparklineStyle };
