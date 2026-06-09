import { useEffect, useRef } from "react";

interface Props {
  skinColor: string;
  accentColor: string;
  width?: number;
  height?: number;
}

function lighten(hex: string, amt = 40): string {
  try {
    const h = hex.replace("#", "");
    const len = h.length === 3 ? 1 : 2;
    const r = parseInt(h.slice(0, len).padEnd(2, h[0]), 16);
    const g = parseInt(h.slice(len, len * 2).padEnd(2, h[len]), 16);
    const b = parseInt(h.slice(len * 2, len * 3).padEnd(2, h[len * 2]), 16);
    return `rgb(${Math.min(255, r + amt)},${Math.min(255, g + amt)},${Math.min(255, b + amt)})`;
  } catch { return hex; }
}

function drawHumanoid(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  bodyColor: string, headColor: string,
  angle: number
) {
  ctx.clearRect(0, 0, w, h);

  const S = Math.min(w, h) / 11;
  const cx = w / 2;
  const BASE = h * 0.85;
  const cos = Math.cos(angle);
  const xs = 0.28 + 0.72 * Math.abs(cos);
  const isFront = cos >= 0;
  const lightBody = lighten(bodyColor, 45);

  // Drop shadow
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(cx, BASE + S * 0.1, S * 2.8 * xs, S * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const blk = (color: string, bx: number, by: number, bw: number, bh: number) => {
    ctx.fillStyle = color;
    ctx.fillRect(bx - (bw * xs) / 2, by, bw * xs, bh);
  };

  // Head
  blk(headColor, cx, BASE - S * 8.8, S * 2.6, S * 2.5);

  // Eyes (front only)
  if (isFront) {
    ctx.fillStyle = "rgba(0,0,0,0.85)";
    const ew = S * 0.42 * xs;
    const eh = S * 0.38;
    const ey = BASE - S * 7.4;
    ctx.fillRect(cx - S * 0.75 * xs, ey, ew, eh);
    ctx.fillRect(cx + S * 0.33 * xs, ey, ew, eh);
  }

  // Body
  blk(bodyColor, cx, BASE - S * 6.2, S * 3.1, S * 3.9);

  // Body side-light
  if (Math.abs(cos) > 0.08) {
    const side = cos > 0 ? -1 : 1;
    const hlW = S * 0.38 * xs;
    ctx.fillStyle = lightBody;
    ctx.fillRect(
      cx + side * S * 1.55 * xs - (side < 0 ? hlW : 0),
      BASE - S * 6.2,
      hlW,
      S * 3.9
    );
  }

  // Arms
  const aw = S * 1.05 * xs;
  const ah = S * 3.1;
  const ay = BASE - S * 6.1;
  ctx.fillStyle = bodyColor;
  ctx.fillRect(cx - S * 1.55 * xs - aw, ay, aw, ah);
  ctx.fillRect(cx + S * 1.55 * xs, ay, aw, ah);

  // Legs
  const lw = S * 1.25 * xs;
  const lh = S * 3.0;
  const ly = BASE - S * 2.3;
  ctx.fillRect(cx - lw * 1.15, ly, lw, lh);
  ctx.fillRect(cx + lw * 0.15, ly, lw, lh);
}

export default function SkinPreview3D({
  skinColor,
  accentColor,
  width = 100,
  height = 130,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(Math.random() * Math.PI * 2);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = 0;
    const animate = (t: number) => {
      animRef.current = requestAnimationFrame(animate);
      if (t - lastTime < 16) return;
      lastTime = t;
      angleRef.current += 0.022;
      drawHumanoid(ctx, width, height, skinColor, accentColor, angleRef.current);
    };
    animRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animRef.current);
  }, [skinColor, accentColor, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width, height, display: "block" }}
    />
  );
}
