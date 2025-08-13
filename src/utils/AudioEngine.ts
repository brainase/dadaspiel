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
  DADA_ECSTASY,
}

export enum MusicType {
    MENU,
    TENSE_GAME,
}

let audioContext: AudioContext | null = null;
let isMutedGlobally = false;
let musicNodes: { disconnect: () => void }[] = [];
let musicGain: GainNode | null = null;

// Function to initialize or get the AudioContext. It can't be called before a user interaction.
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

// Toggle mute state
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

// Stop any currently playing music
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

// Start playing music of a certain type
export const startMusic = (type: MusicType) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    stopMusic(); // Stop previous track

    musicGain = ctx.createGain();
    musicGain.gain.setValueAtTime(0, ctx.currentTime);
    musicGain.gain.linearRampToValueAtTime(isMutedGlobally ? 0 : 0.08, ctx.currentTime + 2); // 2s fade-in
    musicGain.connect(ctx.destination);

    const playArpeggio = (notes: number[], intervalMs: number, oscType: OscillatorType, volume: number) => {
        let noteIndex = 0;
        const scheduler = setInterval(() => {
            if (!musicGain || !audioContext || audioContext.state === 'closed') {
                clearInterval(scheduler);
                return;
            }
            const osc = audioContext.createOscillator();
            const noteGain = audioContext.createGain();
            osc.connect(noteGain).connect(musicGain);
            osc.type = oscType;
            osc.frequency.value = notes[noteIndex % notes.length];
            noteGain.gain.setValueAtTime(volume, audioContext.currentTime);
            noteGain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + intervalMs / 1000 * 1.5);
            osc.start();
            osc.stop(audioContext.currentTime + intervalMs / 1000 * 1.5);
            noteIndex++;
        }, intervalMs);
        musicNodes.push({ disconnect: () => clearInterval(scheduler) });
    };

    if (type === MusicType.MENU) {
        playArpeggio([110, 138.59, 164.81, 220, 164.81, 138.59], 400, 'triangle', 1);
    } else if (type === MusicType.TENSE_GAME) {
        playArpeggio([110, 116.54, 174.61, 185, 220], 250, 'sawtooth', 0.8);
    }
};


// Main function to play sounds
export const playSound = (type: SoundType) => {
  if (isMutedGlobally) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if it's suspended (e.g., due to browser policy)
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

  switch (type) {
    case SoundType.DADA_ECSTASY:
        const localCtx = getAudioContext();
        if (!localCtx) break;

        const activeNodes: any[] = [];
        const cleanup = () => {
            activeNodes.forEach(node => {
                if (node.stop) node.stop();
                if (node.disconnect) node.disconnect();
            });
            // Don't close the shared context here
        };

        // --- Phase 1: Glitch (0s - 3s) ---
        const glitchInterval = setInterval(() => {
            if (localCtx.currentTime > t + 2.8) clearInterval(glitchInterval);
            if (isMutedGlobally) return;
            const osc = localCtx.createOscillator();
            const gain = localCtx.createGain();
            osc.connect(gain); gain.connect(localCtx.destination);
            osc.type = Math.random() > 0.5 ? 'square' : 'sawtooth';
            osc.frequency.setValueAtTime(1000 + Math.random() * 3000, localCtx.currentTime);
            gain.gain.setValueAtTime(0.05 + Math.random() * 0.05, localCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, localCtx.currentTime + 0.05);
            osc.start(localCtx.currentTime); osc.stop(localCtx.currentTime + 0.05);
            activeNodes.push(osc);
        }, 100);
        activeNodes.push({ stop: () => clearInterval(glitchInterval) });

        // --- Phase 2: Growing Sphere (3s - 8s) ---
        const riserTimeout = setTimeout(() => {
            if (isMutedGlobally) return;
            const t = localCtx.currentTime;
            const osc = localCtx.createOscillator(); const gain = localCtx.createGain();
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(80, t); gain.gain.setValueAtTime(0.001, t);
            osc.connect(gain); gain.connect(localCtx.destination);
            osc.frequency.exponentialRampToValueAtTime(600, t + 5); gain.gain.exponentialRampToValueAtTime(0.2, t + 5);
            osc.start(t); activeNodes.push(osc);

            // --- Phase 3: Pulsing (8s - 11s) ---
            const pulseTimeout = setTimeout(() => {
                if (isMutedGlobally) return;
                const lfo = localCtx.createOscillator(); const lfoGain = localCtx.createGain();
                lfo.type = 'sine'; lfo.frequency.setValueAtTime(1.5, localCtx.currentTime);
                lfoGain.gain.setValueAtTime(0.08, localCtx.currentTime);
                lfo.connect(lfoGain); lfoGain.connect(gain.gain);
                lfo.start(localCtx.currentTime); activeNodes.push(lfo);

                // --- Phase 4: Explosion (11s onwards) ---
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
                }, 3000); // 3s pulse duration
                activeNodes.push({ stop: () => clearTimeout(explosionTimeout) });
            }, 5000); // 5s growth duration
            activeNodes.push({ stop: () => clearTimeout(pulseTimeout) });
        }, 3000); // 3s glitch duration
        activeNodes.push({ stop: () => clearTimeout(riserTimeout) });
        
        // Cleanup after the full duration
        setTimeout(cleanup, 17000);
        break;

    case SoundType.BUTTON_CLICK:
      osc = ctx.createOscillator();
      gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(440, t);
      gain.gain.setValueAtTime(0.1, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      osc.type = 'triangle';
      osc.start(t);
      osc.stop(t + 0.1);
      break;

    case SoundType.GENERIC_CLICK:
      play(200, 0.05, 0.1, 'square');
      break;

    case SoundType.ITEM_CATCH_GOOD:
        play(880, 0.1, 0.1, 'sine');
        break;

    case SoundType.ITEM_CATCH_BAD:
        play(110, 0.2, 0.15, 'sawtooth');
        break;
    
    case SoundType.ITEM_PLACE_SUCCESS:
       play(523.25, 0.1, 0.1, 'sine');
       setTimeout(() => play(659.25, 0.1, 0.1, 'sine'), 80);
       break;

    case SoundType.TRANSFORM_SUCCESS:
       osc = ctx.createOscillator();
       gain = ctx.createGain();
       osc.connect(gain);
       gain.connect(ctx.destination);
       osc.type = 'sawtooth';
       gain.gain.setValueAtTime(0.08, t);
       osc.frequency.setValueAtTime(300, t);
       osc.frequency.exponentialRampToValueAtTime(1200, t + 0.2);
       gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
       osc.start(t);
       osc.stop(t + 0.2);
       break;

    case SoundType.PLAYER_HIT:
        play(164, 0.3, 0.2, 'square');
        break;

    case SoundType.PLAYER_LOSE:
       osc = ctx.createOscillator();
       gain = ctx.createGain();
       osc.connect(gain);
       gain.connect(ctx.destination);
       osc.type = 'sawtooth';
       gain.gain.setValueAtTime(0.2, t);
       osc.frequency.setValueAtTime(220, t);
       osc.frequency.exponentialRampToValueAtTime(55, t + 0.8);
       gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
       osc.start(t);
       osc.stop(t + 0.8);
       break;

    case SoundType.PLAYER_WIN:
       [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => {
         setTimeout(() => play(freq, 0.2, 0.15, 'triangle'), i * 100);
       });
       break;
    
    case SoundType.DESTROY:
        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() * 2 - 1; }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        gain = ctx.createGain();
        noise.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
        noise.start(t);
        noise.stop(t + 0.15);
        break;

    case SoundType.COUGH:
        const coughBufferSize = ctx.sampleRate * 0.2;
        const coughBuffer = ctx.createBuffer(1, coughBufferSize, ctx.sampleRate);
        const coughOutput = coughBuffer.getChannelData(0);
        for (let i = 0; i < coughBufferSize; i++) { coughOutput[i] = Math.random() * 2 - 1; }
        const coughNoise = ctx.createBufferSource();
        coughNoise.buffer = coughBuffer;
        const coughFilter = ctx.createBiquadFilter();
        coughFilter.type = 'bandpass';
        coughFilter.frequency.setValueAtTime(600, t);
        coughFilter.Q.setValueAtTime(0.5, t);
        gain = ctx.createGain();
        coughNoise.connect(coughFilter).connect(gain).connect(ctx.destination);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        coughNoise.start(t);
        coughNoise.stop(t + 0.2);
        break;

    case SoundType.ART_REVEAL:
        const crackNoise = ctx.createBufferSource();
        const crackBufferSize = ctx.sampleRate * 0.2;
        const crackBuffer = ctx.createBuffer(1, crackBufferSize, ctx.sampleRate);
        const crackOutput = crackBuffer.getChannelData(0);
        for (let i = 0; i < crackBufferSize; i++) { crackOutput[i] = Math.random() * 2 - 1; }
        crackNoise.buffer = crackBuffer;
        const crackGain = ctx.createGain();
        const crackFilter = ctx.createBiquadFilter();
        crackFilter.type = 'highpass';
        crackFilter.frequency.value = 1000;
        crackNoise.connect(crackFilter).connect(crackGain).connect(ctx.destination);
        crackGain.gain.setValueAtTime(0.3, t);
        crackGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        crackNoise.start(t);
        crackNoise.stop(t + 0.2);
        
        const harpNotes = [523.25, 622.25, 783.99, 1046.50];
        harpNotes.forEach((freq, i) => {
            setTimeout(() => play(freq, 0.4, 0.1, 'triangle'), 100 + i * 50);
        });

        const choirOsc1 = ctx.createOscillator();
        const choirOsc2 = ctx.createOscillator();
        const choirGain = ctx.createGain();
        choirOsc1.type = 'sawtooth';
        choirOsc2.type = 'sawtooth';
        choirOsc1.frequency.setValueAtTime(110, t);
        choirOsc2.frequency.setValueAtTime(111, t);
        choirOsc1.connect(choirGain);
        choirOsc2.connect(choirGain);
        choirGain.connect(ctx.destination);
        choirGain.gain.setValueAtTime(0, t + 0.5);
        choirGain.gain.linearRampToValueAtTime(0.15, t + 0.7);
        choirGain.gain.setValueAtTime(0, t + 0.75);
        choirOsc1.start(t + 0.5);
        choirOsc2.start(t + 0.5);
        choirOsc1.stop(t + 0.8);
        choirOsc2.stop(t + 0.8);
        break;

    case SoundType.PUNISHMENT_CLICK:
      osc = ctx.createOscillator();
      gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.2, t);
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
      break;

      case SoundType.WIN_SHAMPANSKOE:
        // Cork pop sound
        play(150, 0.1, 0.4, 'sawtooth');
        setTimeout(() => play(300, 0.1, 0.3, 'sawtooth'), 50);

        // Fizzing and bubbling sounds
        const fizzInterval = setInterval(() => {
            // Stop after 4 seconds
            if (ctx.currentTime > t + 4) {
                clearInterval(fizzInterval);
                return;
            }
            // Small, high-frequency pops for fizz
            const fizzOsc = ctx.createOscillator();
            const fizzGain = ctx.createGain();
            fizzOsc.connect(fizzGain).connect(ctx.destination);
            fizzOsc.type = 'triangle';
            fizzOsc.frequency.value = 2000 + Math.random() * 3000;
            fizzGain.gain.setValueAtTime(Math.random() * 0.02, ctx.currentTime);
            fizzGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
            fizzOsc.start(ctx.currentTime);
            fizzOsc.stop(ctx.currentTime + 0.1);
            
            // Louder, lower-frequency pops for bubbles
            if (Math.random() < 0.2) { // 20% chance each tick for a louder pop
                 play(400 + Math.random() * 400, 0.15, 0.08, 'sine');
            }
        }, 30);
        break;

    case SoundType.WIN_KVIR:
        const kvirNotes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        kvirNotes.forEach((freq, i) => {
            setTimeout(() => play(freq, 0.5, 0.1, 'triangle'), 500 + i * 100);
        });
        break;
        
    case SoundType.WIN_TANEC:
        setTimeout(() => play(330, 0.3, 0.2, 'sawtooth'), 500);
        setTimeout(() => play(440, 0.3, 0.2, 'sawtooth'), 600);
        setTimeout(() => play(660, 0.1, 0.15, 'sine'), 2500);
        break;

    case SoundType.WIN_KOMPLIMENT:
        osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        gain = ctx.createGain();
        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc2.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, t);
        osc2.frequency.setValueAtTime(111, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.2, t + 1);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 3);
        osc.start(t);
        osc2.start(t);
        osc.stop(t + 3);
        osc2.stop(t + 3);
        break;

    case SoundType.WIN_FEMINITIV:
        for(let i=0; i<10; i++){
            setTimeout(() => {
                const noise = ctx.createBufferSource();
                const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
                const output = buffer.getChannelData(0);
                for (let j = 0; j < buffer.length; j++) output[j] = Math.random() * 2 - 1;
                noise.buffer = buffer;
                
                const bandpass = ctx.createBiquadFilter();
                bandpass.type = 'bandpass';
                bandpass.frequency.setValueAtTime(100, t + i*0.1);
                bandpass.frequency.exponentialRampToValueAtTime(4000, t + i*0.1 + 0.2);

                const noiseGain = ctx.createGain();
                noiseGain.gain.setValueAtTime(0.1, t + i*0.1);
                noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + i*0.1 + 0.2);
                
                noise.connect(bandpass).connect(noiseGain).connect(ctx.destination);
                noise.start(t + i*0.1);
            }, i * 100);
        }
        setTimeout(() => play(2000, 1.5, 0.1, 'sine'), 1500);
        setTimeout(() => play(2500, 1.5, 0.1, 'sine'), 1600);
        break;
        
    case SoundType.WIN_BOITSOVSKIY:
        const crashNoise2 = ctx.createBufferSource();
        const crashBufferSize2 = ctx.sampleRate * 1;
        const crashBuffer2 = ctx.createBuffer(1, crashBufferSize2, ctx.sampleRate);
        const crashOutput2 = crashBuffer2.getChannelData(0);
        for (let i = 0; i < crashBufferSize2; i++) { crashOutput2[i] = Math.random() * 2 - 1; }
        crashNoise2.buffer = crashBuffer2;
        const crashGain2 = ctx.createGain();
        crashNoise2.connect(crashGain2).connect(ctx.destination);
        crashGain2.gain.setValueAtTime(0.3, t);
        crashGain2.gain.exponentialRampToValueAtTime(0.0001, t + 1);
        crashNoise2.start(t);
        setTimeout(() => play(523, 1.5, 0.15, 'square'), 500);
        setTimeout(() => play(659, 1.5, 0.15, 'square'), 500);
        setTimeout(() => play(783, 1.5, 0.15, 'square'), 500);
        break;

    case SoundType.WIN_DOBRO:
        osc = ctx.createOscillator();
        gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0.2, t);
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.exponentialRampToValueAtTime(1760, t + 1);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1);
        osc.start(t);
        osc.stop(t + 1);
        setTimeout(() => play(2000, 0.2, 0.1, 'sine'), 800);
        setTimeout(() => play(2500, 0.2, 0.1, 'sine'), 900);
        break;

    case SoundType.WIN_ALADKI:
        const sizzleNoise = ctx.createBufferSource();
        const sizzleBufferSize = ctx.sampleRate * 1;
        const sizzleBuffer = ctx.createBuffer(1, sizzleBufferSize, ctx.sampleRate);
        const sizzleOutput = sizzleBuffer.getChannelData(0);
        for (let i = 0; i < sizzleBufferSize; i++) { sizzleOutput[i] = Math.random() * 2 - 1; }
        sizzleNoise.buffer = sizzleBuffer;
        const sizzleFilter = ctx.createBiquadFilter();
        sizzleFilter.type = 'highpass';
        sizzleFilter.frequency.value = 5000;
        const sizzleGain = ctx.createGain();
        sizzleNoise.connect(sizzleFilter).connect(sizzleGain).connect(ctx.destination);
        sizzleGain.gain.setValueAtTime(0.1, t);
        sizzleGain.gain.exponentialRampToValueAtTime(0.0001, t + 1);
        sizzleNoise.start(t);
        
        osc = ctx.createOscillator();
        gain = ctx.createGain();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 10;
        lfoGain.gain.value = 100;
        lfo.connect(lfoGain).connect(osc.frequency);
        osc.connect(gain).connect(ctx.destination);
        osc.frequency.value = 440;
        gain.gain.setValueAtTime(0, t+1);
        gain.gain.linearRampToValueAtTime(0.15, t+1.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);
        osc.start(t+1);
        lfo.start(t+1);
        osc.stop(t+2.5);
        lfo.stop(t+2.5);
        break;

    case SoundType.WIN_FRUKTY:
        play(440, 0.15, 0.1, 'square');
        setTimeout(() => play(587, 0.15, 0.1, 'square'), 200);
        setTimeout(() => play(783, 0.3, 0.1, 'square'), 400);
        break;

    case SoundType.WIN_NEPODAVIS:
        play(110, 0.1, 0.3, 'square');
        setTimeout(() => play(1046, 1, 0.15, 'triangle'), 300);
        setTimeout(() => play(1318, 1, 0.15, 'triangle'), 400);
        break;
        
    case SoundType.WIN_PYLESOS:
        const vacNoise = ctx.createBufferSource();
        const vacBufferSize = ctx.sampleRate * 2;
        const vacBuffer = ctx.createBuffer(1, vacBufferSize, ctx.sampleRate);
        const vacOutput = vacBuffer.getChannelData(0);
        for (let i = 0; i < vacBufferSize; i++) { vacOutput[i] = Math.random() * 2 - 1; }
        vacNoise.buffer = vacBuffer;
        vacNoise.loop = true;
        
        const vacFilter = ctx.createBiquadFilter();
        vacFilter.type = 'bandpass';
        vacFilter.Q.value = 5;
        vacFilter.frequency.setValueAtTime(300, t + 0.5);
        vacFilter.frequency.exponentialRampToValueAtTime(1200, t + 1.5);

        const vacGain = ctx.createGain();
        vacGain.gain.setValueAtTime(0, t + 0.5);
        vacGain.gain.linearRampToValueAtTime(0.3, t + 1);
        
        vacNoise.connect(vacFilter).connect(vacGain).connect(ctx.destination);
        vacNoise.start(t + 0.5);
        
        setTimeout(() => {
            vacGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
            vacNoise.stop(ctx.currentTime + 0.1);
        }, 1500);
        
        setTimeout(() => play(80, 0.1, 0.4, 'sine'), 1600);
        break;

    case SoundType.WIN_KALENDAR:
        const crackleInterval = setInterval(() => {
            if (ctx.currentTime > t + 8) {
                clearInterval(crackleInterval);
                return;
            }
            const crackleNoise = ctx.createBufferSource();
            const crackleBufferSize = ctx.sampleRate * 0.05;
            const crackleBuffer = ctx.createBuffer(1, crackleBufferSize, ctx.sampleRate);
            const crackleOutput = crackleBuffer.getChannelData(0);
            for (let i = 0; i < crackleBufferSize; i++) { crackleOutput[i] = Math.random() * 2 - 1; }
            crackleNoise.buffer = crackleBuffer;
            
            const crackleFilter = ctx.createBiquadFilter();
            crackleFilter.type = 'highpass';
            crackleFilter.frequency.value = 4000 + Math.random() * 2000;

            const crackleGain = ctx.createGain();
            crackleGain.gain.setValueAtTime(0.1 + Math.random() * 0.1, ctx.currentTime);
            crackleGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);

            crackleNoise.connect(crackleFilter).connect(crackleGain).connect(ctx.destination);
            crackleNoise.start(ctx.currentTime);
        }, 150);
        break;
  }
};