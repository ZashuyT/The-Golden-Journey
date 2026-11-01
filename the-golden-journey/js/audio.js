// ============================================================================
// THE GOLDEN JOURNEY (HÀNH TRÌNH VÀNG SON)
// WebAudio Procedural Sound Effects & Ambient Maritime Music Synthesizer
// (100% Original Procedural Audio - Zero copyrighted/third-party audio assets)
// ============================================================================

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.bgmPlaying = false;
        this.bgmTimer = null;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    playTone(freq, type = "sine", duration = 0.25, gainVal = 0.12, delay = 0) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(gainVal, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration + 0.03);
    }

    playSail() {
        // Gentle water splash + wind swoosh
        this.playTone(220, "sine", 0.18, 0.08, 0);
        this.playTone(330, "triangle", 0.22, 0.06, 0.06);
        this.playTone(440, "sine", 0.25, 0.05, 0.12);
    }

    playCoin() {
        // Crisp metallic golden chime
        this.playTone(987.77, "sine", 0.14, 0.12, 0);      // B5
        this.playTone(1318.51, "triangle", 0.32, 0.14, 0.08); // E6
    }

    playMine() {
        // Rhythmic harvest / pickaxe chime
        this.playTone(392.00, "triangle", 0.15, 0.14, 0);
        this.playTone(523.25, "triangle", 0.18, 0.14, 0.12);
        this.playTone(659.25, "sine", 0.28, 0.12, 0.24);
    }

    playRelicFanfare() {
        // Pentatonic royal Vietnamese triumph fanfare (Hò - Xự - Xang - Xê - Cống)
        const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
        notes.forEach((f, idx) => {
            this.playTone(f, "triangle", 0.45, 0.16, idx * 0.11);
            this.playTone(f * 0.5, "sine", 0.45, 0.08, idx * 0.11);
        });
    }

    playDamage() {
        // Low warning thud
        this.playTone(165, "sawtooth", 0.25, 0.15, 0);
        this.playTone(110, "sawtooth", 0.4, 0.18, 0.15);
    }

    playClick() {
        this.playTone(660, "sine", 0.08, 0.06, 0);
    }

    playTurnStart() {
        // Gentle gong/bell chime
        this.playTone(440, "sine", 0.4, 0.10, 0);
        this.playTone(659.25, "triangle", 0.5, 0.08, 0.1);
    }
}

window.SFX = new SoundEngine();
