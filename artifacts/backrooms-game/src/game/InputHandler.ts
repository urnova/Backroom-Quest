import { Keybindings, AZERTY_BINDINGS } from "../context/SettingsContext";

export class InputHandler {
  keys: { [key: string]: boolean } = {};
  mouseX = 0;
  mouseY = 0;
  movementX = 0;
  movementY = 0;
  isPointerLocked = false;
  keybindings: Keybindings;

  onAttack?: () => void;
  onEmoteDown?: () => void;
  onEmoteUp?: () => void;
  onFlashlight?: () => void;
  onChat?: () => void;
  onEscape?: () => void;

  constructor(private canvas: HTMLCanvasElement, keybindings?: Keybindings) {
    this.keybindings = keybindings ?? AZERTY_BINDINGS;
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    document.addEventListener("pointerlockchange", this.handlePointerLockChange);
    canvas.addEventListener("click", this.handleClick);
    document.addEventListener("mousemove", this.handleMouseMove);
  }

  updateKeybindings(kb: Keybindings) {
    this.keybindings = kb;
  }

  isForward(): boolean {
    return !!(this.keys[this.keybindings.forward] || this.keys["arrowup"]);
  }
  isBackward(): boolean {
    return !!(this.keys[this.keybindings.backward] || this.keys["arrowdown"]);
  }
  isStrafeLeft(): boolean {
    return !!(this.keys[this.keybindings.strafeLeft] || this.keys["arrowleft"]);
  }
  isStrafeRight(): boolean {
    return !!(this.keys[this.keybindings.strafeRight] || this.keys["arrowright"]);
  }
  isSprint(): boolean {
    return !!this.keys[this.keybindings.sprint];
  }

  requestPointerLock() {
    this.canvas.requestPointerLock();
  }

  exitPointerLock() {
    document.exitPointerLock();
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();

    if (key === "escape") {
      if (this.onEscape) this.onEscape();
      return;
    }

    if (key === this.keybindings.chat) {
      if (this.onChat) this.onChat();
      return;
    }

    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
      e.preventDefault();
    }

    this.keys[key] = true;

    if (key === this.keybindings.flashlight && this.onFlashlight) {
      this.onFlashlight();
    }

    if (key === this.keybindings.emote && this.onEmoteDown) {
      this.onEmoteDown();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    const key = e.key.toLowerCase();
    this.keys[key] = false;

    if (key === this.keybindings.emote && this.onEmoteUp) {
      this.onEmoteUp();
    }
  };

  private handleClick = (_e: MouseEvent) => {
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

  update() {}

  dispose() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    document.removeEventListener("pointerlockchange", this.handlePointerLockChange);
    this.canvas.removeEventListener("click", this.handleClick);
    document.removeEventListener("mousemove", this.handleMouseMove);
  }
}
