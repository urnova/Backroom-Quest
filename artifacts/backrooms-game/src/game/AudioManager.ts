import { useEffect, useRef } from "react";

export class AudioManager {
  private ctx: AudioContext | null = null;
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private isInitialized = false;

  constructor() {}

  init() {
    if (this.isInitialized) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Main drone
      this.droneOsc = this.ctx.createOscillator();
      this.droneOsc.type = "sine";
      this.droneOsc.frequency.value = 55; // Low hum (A1)
      
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.value = 0; // Start muted
      
      // LFO to modulate drone volume
      this.lfo = this.ctx.createOscillator();
      this.lfo.type = "sine";
      this.lfo.frequency.value = 0.1; // Very slow variation
      
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 0.05;
      
      this.lfo.connect(lfoGain);
      lfoGain.connect(this.droneGain.gain);
      
      this.droneOsc.connect(this.droneGain);
      this.droneGain.connect(this.ctx.destination);
      
      this.droneOsc.start();
      this.lfo.start();
      
      // Setup noise
      const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = "lowpass";
      noiseFilter.frequency.value = 400; // Muffled rumble
      
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.value = 0.02; // Very quiet
      
      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = buffer;
      this.noiseNode.loop = true;
      this.noiseNode.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      
      this.noiseNode.start();
      
      this.isInitialized = true;
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  setDangerLevel(normalizedValue: number) { // 0 to 1
    if (!this.ctx || !this.droneOsc || !this.droneGain) return;
    
    // Resume context if suspended (browser policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    const targetFreq = 55 + (normalizedValue * 30); // Pitch goes up slightly
    const targetGain = 0.1 + (normalizedValue * 0.3); // Gets louder
    
    this.droneOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 1);
    this.droneGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 1);
  }

  stop() {
    if (!this.ctx) return;
    if (this.droneGain) {
      this.droneGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
    }
  }
}
