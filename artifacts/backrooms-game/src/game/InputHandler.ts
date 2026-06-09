export class InputHandler {
  keys: { [key: string]: boolean } = {};
  mouseX = 0;
  mouseY = 0;
  movementX = 0;
  movementY = 0;
  isPointerLocked = false;
  
  onAttack?: () => void;
  onEmoteDown?: () => void;
  onEmoteUp?: () => void;
  onFlashlight?: () => void;
  onChat?: () => void;

  constructor(private canvas: HTMLCanvasElement) {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    document.addEventListener("pointerlockchange", this.handlePointerLockChange);
    canvas.addEventListener("click", this.handleClick);
    document.addEventListener("mousemove", this.handleMouseMove);
  }

  requestPointerLock() {
    this.canvas.requestPointerLock();
  }

  exitPointerLock() {
    document.exitPointerLock();
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "t" || e.key === "T") {
      if (this.onChat) {
        this.onChat();
      }
      return;
    }
    
    if (e.target instanceof HTMLInputElement) return; // Don't process if typing
    
    this.keys[e.key.toLowerCase()] = true;
    
    if (e.key.toLowerCase() === "f" && this.onFlashlight) {
      this.onFlashlight();
    }
    
    if (e.key.toLowerCase() === "e" && this.onEmoteDown) {
      this.onEmoteDown();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return;
    
    this.keys[e.key.toLowerCase()] = false;
    
    if (e.key.toLowerCase() === "e" && this.onEmoteUp) {
      this.onEmoteUp();
    }
  };

  private handleClick = (e: MouseEvent) => {
    if (!this.isPointerLocked) {
      this.requestPointerLock();
      return;
    }
    if (this.onAttack) {
      this.onAttack();
    }
  };

  private handlePointerLockChange = () => {
    this.isPointerLocked = document.pointerLockElement === this.canvas;
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (this.isPointerLocked) {
      this.movementX = e.movementX;
      this.movementY = e.movementY;
    }
  };

  update() {
    // Reset movement diff after reading
  }

  dispose() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    document.removeEventListener("pointerlockchange", this.handlePointerLockChange);
    this.canvas.removeEventListener("click", this.handleClick);
    document.removeEventListener("mousemove", this.handleMouseMove);
  }
}
