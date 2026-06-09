import * as THREE from "three";

export function getProceduralTexture(type: "wall" | "floor" | "ceiling", colorHex: string): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  
  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 256, 256);
  
  // Add noise
  const imgData = ctx.getImageData(0, 0, 256, 256);
  const data = imgData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 40;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
    data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);
  
  // Add some details depending on type
  if (type === "wall") {
    // vertical streaks
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    for (let i = 0; i < 10; i++) {
      ctx.fillRect(Math.random() * 256, 0, Math.random() * 5 + 1, 256);
    }
  } else if (type === "ceiling") {
    // ceiling tiles
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 256, 256);
    ctx.strokeRect(128, 0, 1, 256);
    ctx.strokeRect(0, 128, 256, 1);
  } else if (type === "floor") {
    // stains
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 256, Math.random() * 256, Math.random() * 20 + 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  return tex;
}
