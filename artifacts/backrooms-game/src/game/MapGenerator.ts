export function generateMap(seedStr: string, width: number, height: number): number[][] {
  // Simple seed-based random
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed += seedStr.charCodeAt(i);
  
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  // Initialize with walls (1)
  const map: number[][] = Array(height).fill(0).map(() => Array(width).fill(1));

  // Drunkard's walk maze generation
  let x = Math.floor(width / 2);
  let y = Math.floor(height / 2);
  let floorCount = 0;
  const targetFloors = Math.floor((width * height) * 0.4); // 40% open space

  map[y][x] = 0; // 0 = floor
  floorCount++;

  const dirs = [
    [0, -1], [1, 0], [0, 1], [-1, 0] // N, E, S, W
  ];

  while (floorCount < targetFloors) {
    const dir = dirs[Math.floor(random() * dirs.length)];
    const nx = x + dir[0];
    const ny = y + dir[1];

    if (nx > 1 && nx < width - 2 && ny > 1 && ny < height - 2) {
      x = nx;
      y = ny;
      if (map[y][x] === 1) {
        map[y][x] = 0;
        floorCount++;
      }
    } else {
      // jump to a random known floor to avoid getting stuck
      while(true) {
        const rx = Math.floor(random() * width);
        const ry = Math.floor(random() * height);
        if (map[ry][rx] === 0) {
          x = rx;
          y = ry;
          break;
        }
      }
    }
  }
  
  // Guarantee outer boundary is solid
  for(let i=0; i<width; i++) { map[0][i] = 1; map[height-1][i] = 1; }
  for(let j=0; j<height; j++) { map[j][0] = 1; map[j][width-1] = 1; }

  // 2 = Exit Portal (place randomly in an open spot far from center)
  let placedExit = false;
  while (!placedExit) {
    const ex = Math.floor(random() * width);
    const ey = Math.floor(random() * height);
    if (map[ey][ex] === 0 && (Math.abs(ex - width/2) > 10 || Math.abs(ey - height/2) > 10)) {
      map[ey][ex] = 2; // Exit
      placedExit = true;
    }
  }

  return map;
}
