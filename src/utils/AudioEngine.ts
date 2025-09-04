
// src/utils/AudioEngine.ts

// Enum for sound types
export enum SoundType {
  BUTTON_CLICK,
  GENERIC_CLICK,
  ITEM_CATCH_GOOD,
  ITEM_CATCH_BAD,
  ITEM_PLACE_SUCCESS,
  TRANSFORM_SUCCESS,
  PLAYER_HIT,
  PLAYER_LOSE,
  PLAYER_WIN,
  DESTROY,
  COUGH,
  ART_REVEAL,
  PUNISHMENT_CLICK,
  WIN_SHAMPANSKOE,
  WIN_KVIR,
  WIN_TANEC,
  WIN_KOMPLIMENT,
  WIN_FEMINITIV,
  WIN_BOITSOVSKIY,
  WIN_DOBRO,
  WIN_ALADKI,
  WIN_FRUKTY,
  WIN_NEPODAVIS,
  WIN_PYLESOS,
  WIN_KALENDAR,
  LOSE_KALENDAR,
  DADA_ECSTASY,
  // New granular sounds
  SWOOSH,
  PLOP,
  KISS_SPAWN,
  PARRY,
  FLIP,
  TEAR,
  LIQUID_CATCH,
}

export enum MusicType {
    MENU,
    AMBIENT_GALLERY,
    AMBIENT_KVIR,
    AMBIENT_DANCE,
    AMBIENT_ZEN,
    AMBIENT_STREET,
    AMBIENT_FEMINIST_FIGHT,
    AMBIENT_KITCHEN,
    AMBIENT_TENSION,
    AMBIENT_NATURE,
    LOOP_VACUUM,
}

let audioContext: AudioContext | null = null;
let isMutedGlobally = false;
let musicNodes: ({ disconnect: () => void; setParameter?: (param: 'pitch' | 'volume', value: number) => void })[] = [];
let musicGain: GainNode | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (audioContext && audioContext.state !== 'closed') {
    return audioContext;
  }
  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioContext;
  } catch (e) {
    console.error("Web Audio API is not supported in this browser.");
    return null;
  }
};

export const toggleMuteState = (): boolean => {
  isMutedGlobally = !isMutedGlobally;
  const ctx = getAudioContext();
  if (ctx) {
    if (ctx.state === 'suspended') {
        ctx.resume();
    }
    if (musicGain) {
        musicGain.gain.setTargetAtTime(isMutedGlobally ? 0 : 0.08, ctx.currentTime, 0.1);
    }
  }
  return isMutedGlobally;
};

export const getMuteState = (): boolean => isMutedGlobally;

export const stopMusic = () => {
    musicNodes.forEach(node => {
        node.disconnect();
    });
    musicNodes = [];
    if (musicGain) {
        musicGain.disconnect();
        musicGain = null;
    }
};

export const updateMusicParameter = (param: 'pitch' | 'volume', value: number) => {
    musicNodes.forEach(node => {
        if (node.setParameter) {
            node.setParameter(param, value);
        }
    });
};

export const startMusic = (type: MusicType) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    stopMusic();

    musicGain = ctx.createGain();
    musicGain.gain.setValueAtTime(0, ctx.currentTime);
    musicGain.gain.linearRampToValueAtTime(isMutedGlobally ? 0 : 0.08, ctx.currentTime + 1);
    musicGain.connect(ctx.destination);
    
    const playSimpleSound = (freq: number, duration: number, volume: number, oscType: OscillatorType) => {
        if (!ctx || !musicGain) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain).connect(musicGain);
        osc.type = oscType;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    };

    switch(type) {
        case MusicType.MENU: {
            const notes = [110, 138.59, 164.81, 220, 164.81, 138.59];
            let noteIndex = 0;
            const scheduler = setInterval(() => {
                if (!musicGain) { clearInterval(scheduler); return; }
                playSimpleSound(notes[noteIndex % notes.length], 0.6, 0.8, 'triangle');
                noteIndex++;
            }, 500);
            musicNodes.push({ disconnect: () => clearInterval(scheduler) });
            break;
        }
        case MusicType.AMBIENT_GALLERY: {
            const scheduler = setInterval(() => {
                if (Math.random() < 0.2) {
                     playSimpleSound(220 + Math.random() * 220, 3, 0.4, 'sine');
                }
            }, 5000);
             musicNodes.push({ disconnect: () => clearInterval(scheduler) });
            break;
        }
        case MusicType.AMBIENT_KVIR: {
             const notes = [220.00, 261.63, 293.66, 329.63, 392.00];
             let noteIndex = 0;
             const scheduler = setInterval(() => {
                if (!musicGain) { clearInterval(scheduler); return; }
                playSimpleSound(notes[noteIndex % notes.length], 0.2, 0.7, 'square');
                noteIndex++;
             }, 200);
             musicNodes.push({ disconnect: () => clearInterval(scheduler) });
            break;
        }
        case MusicType.AMBIENT_DANCE: {
            const scheduler = setInterval(() => {
                if (!musicGain) { clearInterval(scheduler); return; }
                playSimpleSound(80, 0.1, 1, 'sine'); // kick
                setTimeout(() => playSimpleSound(4000, 0.05, 0.5, 'triangle'), 250); // hat
            }, 500);
            musicNodes.push({ disconnect: () => clearInterval(scheduler) });
            break;
        }
        case MusicType.AMBIENT_ZEN: {
            const playPad = () => playSimpleSound(110 + Math.random() * 50, 8, 0.3, 'triangle');
            playPad();
            const scheduler = setInterval(playPad, 7000);
            musicNodes.push({ disconnect: () => clearInterval(scheduler) });
            break;
        }
        case MusicType.AMBIENT_STREET:
        case MusicType.AMBIENT_NATURE: {
            const noise = ctx.createBufferSource();
            const bufferSize = ctx.sampleRate * 4;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            let data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            noise.buffer = buffer;
            noise.loop = true;
            const filter = ctx.createBiquadFilter();
            filter.type = type === MusicType.AMBIENT_STREET ? 'lowpass' : 'bandpass';
            filter.frequency.value = type === MusicType.AMBIENT_STREET ? 400 : 800;
            noise.connect(filter).connect(musicGain);
            noise.start();
            musicNodes.push(noise);
            break;
        }
        case MusicType.AMBIENT_FEMINIST_FIGHT: {
            const scheduler = setInterval(() => {
                playSimpleSound(110, 0.2, 0.8, 'sawtooth');
            }, 350);
            musicNodes.push({ disconnect: () => clearInterval(scheduler) });
            break;
        }
        case MusicType.AMBIENT_KITCHEN: {
            const hum = ctx.createOscillator();
            hum.type = 'sine'; hum.frequency.value = 60;
            hum.connect(musicGain); hum.start();
            musicNodes.push(hum);
            break;
        }
        case MusicType.AMBIENT_TENSION: {
            const drone = ctx.createOscillator(); const drone2 = ctx.createOscillator();
            drone.type = 'sawtooth'; drone2.type = 'sawtooth';
            drone.frequency.value = 82; drone2.frequency.value = 82.5;
            drone.connect(musicGain); drone2.connect(musicGain);
            drone.start(); drone2.start();
            musicNodes.push(drone, drone2);
            break;
        }
        case MusicType.LOOP_VACUUM: {
            const noise = ctx.createBufferSource();
            const bufferSize = ctx.sampleRate * 2;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            let data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            noise.buffer = buffer;
            noise.loop = true;

            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.Q.value = 5;
            filter.frequency.value = 600;

            const gainNode = ctx.createGain();
            gainNode.gain.value = 1.2;

            noise.connect(filter).connect(gainNode).connect(musicGain);
            noise.start();

            musicNodes.push({
                disconnect: () => noise.disconnect(),
                setParameter: (param, value) => {
                    if (param === 'pitch') {
                        // playbackRate is a good way to control pitch for BufferSource
                        noise.playbackRate.setTargetAtTime(value, ctx.currentTime, 0.1);
                    }
                }
            });
            break;
        }
    }
};

// Main function to play sounds
export const playSound = (type: SoundType) => {
  if (isMutedGlobally) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().catch(e => console.error("AudioContext resume failed", e));
  }

  const t = ctx.currentTime;
  let osc: OscillatorNode;
  let gain: GainNode;
  
  const play = (freq: number, duration: number, volume: number, type: OscillatorType, ramp: 'linear' | 'exponential' = 'exponential') => {
      osc = ctx.createOscillator();
      gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(volume, t);
      if (ramp === 'exponential') {
          gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      } else {
          gain.gain.linearRampToValueAtTime(0.0001, t + duration);
      }
      osc.start(t);
      osc.stop(t + duration);
  };

  const playNoise = (duration: number, volume: number, filterType: BiquadFilterType, filterFreq: number) => {
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() * 2 - 1; }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.value = filterFreq;
        gain = ctx.createGain();
        noise.connect(filter).connect(gain).connect(ctx.destination);
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        noise.start(t);
  }

  switch (type) {
    case SoundType.SWOOSH: playNoise(0.2, 0.1, 'bandpass', 1000); break;
    case SoundType.PLOP: play(200, 0.1, 0.2, 'sine'); osc.frequency.exponentialRampToValueAtTime(100, t + 0.1); break;
    case SoundType.KISS_SPAWN: play(1200, 0.05, 0.1, 'sine'); break;
    case SoundType.PARRY: play(1500, 0.1, 0.2, 'square'); setTimeout(() => playNoise(0.08, 0.1, 'highpass', 4000), 10); break;
    case SoundType.FLIP: playNoise(0.08, 0.2, 'highpass', 2000); break;
    case SoundType.TEAR: playNoise(0.3, 0.2, 'bandpass', 1500); break;
    case SoundType.LIQUID_CATCH: play(3000, 0.05, 0.05, 'triangle'); break;
    
    // ... existing sounds from here...
    case SoundType.DADA_ECSTASY:
        const localCtx = getAudioContext();
        if (!localCtx) break;

        const activeNodes: any[] = [];
        const cleanup = () => {
            activeNodes.forEach(node => {
                if (node.stop) node.stop();
                if (node.disconnect) node.disconnect();
            });
        };

        const glitchInterval = setInterval(() => {
            if (localCtx.currentTime > t + 2.8) clearInterval(glitchInterval);
            if (isMutedGlobally) return;
            const osc = localCtx.createOscillator(); const gain = localCtx.createGain();
            osc.connect(gain); gain.connect(localCtx.destination);
            osc.type = Math.random() > 0.5 ? 'square' : 'sawtooth';
            osc.frequency.setValueAtTime(1000 + Math.random() * 3000, localCtx.currentTime);
            gain.gain.setValueAtTime(0.05 + Math.random() * 0.05, localCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, localCtx.currentTime + 0.05);
            osc.start(localCtx.currentTime); osc.stop(localCtx.currentTime + 0.05);
            activeNodes.push(osc);
        }, 100);
        activeNodes.push({ stop: () => clearInterval(glitchInterval) });

        const riserTimeout = setTimeout(() => {
            if (isMutedGlobally) return;
            const t = localCtx.currentTime;
            const osc = localCtx.createOscillator(); const gain = localCtx.createGain();
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(80, t); gain.gain.setValueAtTime(0.001, t);
            osc.connect(gain); gain.connect(localCtx.destination);
            osc.frequency.exponentialRampToValueAtTime(600, t + 5); gain.gain.exponentialRampToValueAtTime(0.2, t + 5);
            osc.start(t); activeNodes.push(osc);

            const pulseTimeout = setTimeout(() => {
                if (isMutedGlobally) return;
                const lfo = localCtx.createOscillator(); const lfoGain = localCtx.createGain();
                lfo.type = 'sine'; lfo.frequency.setValueAtTime(1.5, localCtx.currentTime);
                lfoGain.gain.setValueAtTime(0.08, localCtx.currentTime);
                lfo.connect(lfoGain); lfoGain.connect(gain.gain);
                lfo.start(localCtx.currentTime); activeNodes.push(lfo);

                const explosionTimeout = setTimeout(() => {
                    if (isMutedGlobally) return;
                    osc.stop(localCtx.currentTime + 0.1); lfo.stop(localCtx.currentTime + 0.1);
                    const boomTime = localCtx.currentTime;
                    const boomOsc = localCtx.createOscillator(); const boomGain = localCtx.createGain();
                    boomOsc.connect(boomGain); boomGain.connect(localCtx.destination);
                    boomOsc.frequency.setValueAtTime(60, boomTime); boomGain.gain.setValueAtTime(0.4, boomTime);
                    boomGain.gain.exponentialRampToValueAtTime(0.0001, boomTime + 1.5);
                    boomOsc.start(boomTime); boomOsc.stop(boomTime + 1.5);
                    activeNodes.push(boomOsc);
                }, 3000);
                activeNodes.push({ stop: () => clearTimeout(explosionTimeout) });
            }, 5000);
            activeNodes.push({ stop: () => clearTimeout(pulseTimeout) });
        }, 3000);
        activeNodes.push({ stop: () => clearTimeout(riserTimeout) });
        setTimeout(cleanup, 17000);
        break;

    case SoundType.BUTTON_CLICK: play(440, 0.1, 0.1, 'triangle'); osc.frequency.exponentialRampToValueAtTime(880, t + 0.1); break;
    case SoundType.GENERIC_CLICK: play(200, 0.05, 0.1, 'square'); break;
    case SoundType.ITEM_CATCH_GOOD: play(880, 0.1, 0.1, 'sine'); break;
    case SoundType.ITEM_CATCH_BAD: play(110, 0.2, 0.15, 'sawtooth'); break;
    case SoundType.ITEM_PLACE_SUCCESS: play(523.25, 0.1, 0.1, 'sine'); setTimeout(() => play(659.25, 0.1, 0.1, 'sine'), 80); break;
    case SoundType.TRANSFORM_SUCCESS: play(300, 0.2, 0.08, 'sawtooth'); osc.frequency.exponentialRampToValueAtTime(1200, t + 0.2); break;
    case SoundType.PLAYER_HIT: play(164, 0.3, 0.2, 'square'); break;
    case SoundType.PLAYER_LOSE: play(220, 0.8, 0.2, 'sawtooth'); osc.frequency.exponentialRampToValueAtTime(55, t + 0.8); break;
    case SoundType.PLAYER_WIN: [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => { setTimeout(() => play(freq, 0.2, 0.15, 'triangle'), i * 100); }); break;
    case SoundType.DESTROY: playNoise(0.15, 0.2, 'lowpass', 10000); break;
    case SoundType.COUGH: playNoise(0.2, 0.3, 'bandpass', 600); break;
    case SoundType.ART_REVEAL: playNoise(0.2, 0.3, 'highpass', 1000); [523, 622, 783, 1046].forEach((freq, i) => setTimeout(() => play(freq, 0.4, 0.1, 'triangle'), 100 + i * 50)); break;
    case SoundType.PUNISHMENT_CLICK: play(220, 0.3, 0.2, 'sawtooth'); osc.frequency.exponentialRampToValueAtTime(180, t + 0.3); break;
    case SoundType.WIN_SHAMPANSKOE: play(150, 0.1, 0.4, 'sawtooth'); setTimeout(() => play(300, 0.1, 0.3, 'sawtooth'), 50); break;
    case SoundType.WIN_KVIR: [261, 329, 392, 523, 659, 783, 1046].forEach((freq, i) => setTimeout(() => play(freq, 0.5, 0.1, 'triangle'), 500 + i * 100)); break;
    case SoundType.WIN_TANEC: setTimeout(() => play(330, 0.3, 0.2, 'sawtooth'), 500); setTimeout(() => play(440, 0.3, 0.2, 'sawtooth'), 600); break;
    case SoundType.WIN_KOMPLIMENT: play(110, 3, 0.2, 'sawtooth'); osc.frequency.linearRampToValueAtTime(111, t+3); break;
    case SoundType.WIN_FEMINITIV: play(2000, 1.5, 0.1, 'sine'); setTimeout(() => play(2500, 1.5, 0.1, 'sine'), 100); break;
    case SoundType.WIN_BOITSOVSKIY: playNoise(1, 0.3, 'lowpass', 10000); setTimeout(() => { play(523, 1.5, 0.15, 'square'); play(659, 1.5, 0.15, 'square'); }, 500); break;
    case SoundType.WIN_DOBRO: play(440, 1, 0.2, 'triangle'); osc.frequency.exponentialRampToValueAtTime(1760, t + 1); break;
    case SoundType.WIN_ALADKI: playNoise(1, 0.1, 'highpass', 5000); break;
    case SoundType.WIN_FRUKTY: play(440, 0.15, 0.1, 'square'); setTimeout(() => play(587, 0.15, 0.1, 'square'), 200); setTimeout(() => play(783, 0.3, 0.1, 'square'), 400); break;
    case SoundType.WIN_NEPODAVIS: play(110, 0.1, 0.3, 'square'); setTimeout(() => { play(1046, 1, 0.15, 'triangle'); play(1318, 1, 0.15, 'triangle'); }, 300); break;
    case SoundType.WIN_PYLESOS: playNoise(1.5, 0.3, 'bandpass', 300); setTimeout(() => play(80, 0.1, 0.4, 'sine'), 1100); break;
    case SoundType.WIN_KALENDAR: playNoise(8, 0.1, 'highpass', 4000); break;
    case SoundType.LOSE_KALENDAR: [220, 261, 329].forEach(freq => play(freq, 1.5, 0.15, 'triangle')); setTimeout(() => playNoise(1.0, 0.08, 'highpass', 3000), 500); break;
  }
};
