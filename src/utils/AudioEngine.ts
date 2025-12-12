
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
  // Shooter Sounds
  SHOOT, // Generic fallback
  SHOOT_SPOON,
  SHOOT_FORK,
  SHOOT_KNIFE,
  SHOOT_LADLE,
  FOOTSTEP,
  HEAL_317,
  PICKUP_WEAPON,
  PICKUP_FOOD,
  PICKUP_BAD,
  ENEMY_DAMAGE,
  // Specific Deaths
  ENEMY_DEATH, // Fallback
  DEATH_DRANIK,
  DEATH_KOLDUN,
  DEATH_VISITOR,
  DEATH_BOSS,
  
  POWERUP,
  BOSS_ROAR,
  SPLAT,
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
    DOOM_FPS,
    // Seasonal Music
    SEASONAL_NEW_YEAR,
    SEASONAL_APRIL_FOOLS,
    SEASONAL_HALLOWEEN,
    SEASONAL_DADA_BIRTHDAY,
    SEASONAL_SEPTEMBER_3,
    SEASONAL_GONDOLIER,
    SEASONAL_GLITCH,
    SEASONAL_POTATO,
    EXTERNAL_MP3_FOLDER, 
}

const CUSTOM_PLAYLIST = [
    'xdm1.mp3',
    'xdm2.mp3',
		'xdm3.mp3',
		'xdm4.mp3',
		'xdm5.mp3',
		'xdm6.mp3',
		'xdm7.mp3',
		'xdm8.mp3',
		'xdm9.mp3',
		'xdm10.mp3',
		'xdm11.mp3',
		'xdm12.mp3',
    'xdm13.mp3'
];

let audioContext: AudioContext | null = null;
let isMutedGlobally = false;
let musicNodes: ({ disconnect: () => void; setParameter?: (param: 'pitch' | 'volume', value: number) => void })[] = [];
let musicGain: GainNode | null = null;
let activeHtmlAudio: HTMLAudioElement | null = null; // Для управления внешними MP3

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
  // Также управляем громкостью HTML Audio элемента, если он есть
  if (activeHtmlAudio) {
      activeHtmlAudio.volume = isMutedGlobally ? 0 : 0.3;
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
    // Останавливаем MP3, если играет
    if (activeHtmlAudio) {
        activeHtmlAudio.pause();
        activeHtmlAudio.src = "";
        activeHtmlAudio = null;
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
    // Resume context if suspended (Browser Autoplay Policy)
    if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {
            // Context will be resumed on next user interaction in playSound
        });
    }

    stopMusic();

    // Setup Gain Node for Web Audio
    musicGain = ctx.createGain();
    musicGain.gain.setValueAtTime(0, ctx.currentTime);
    musicGain.gain.linearRampToValueAtTime(isMutedGlobally ? 0 : 0.08, ctx.currentTime + 1);
    musicGain.connect(ctx.destination);
    
    // Helper for Oscillator based music
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
        case MusicType.EXTERNAL_MP3_FOLDER: {
            if (CUSTOM_PLAYLIST.length === 0) {
                console.warn("AudioEngine: Custom playlist is empty. Add files to public/music/ and update CUSTOM_PLAYLIST in AudioEngine.ts");
                return;
            }
            
            // Выбираем случайный трек
            const randomTrack = CUSTOM_PLAYLIST[Math.floor(Math.random() * CUSTOM_PLAYLIST.length)];
            const audioPath = `public/music/${randomTrack}`;
            
            console.log(`AudioEngine: Attempting to play ${audioPath}`);
            const audio = new Audio(audioPath);
            audio.loop = true;
            audio.volume = isMutedGlobally ? 0 : 0.1; // Громкость для MP3 (отдельно от gainNode)
            
            // Пытаемся воспроизвести
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("AudioEngine: Autoplay prevented or file not found.", error);
                    if (error.name === 'NotSupportedError') {
                        console.error(`AudioEngine: Failed to load ${audioPath}. Ensure the file exists in 'public/music/'`);
                    }
                });
            }
            
            activeHtmlAudio = audio;
            
            // Добавляем в musicNodes "заглушку", чтобы stopMusic знал, что мы "играем"
            // (хотя реальная остановка происходит через activeHtmlAudio)
            musicNodes.push({
                disconnect: () => {
                    // Логика остановки уже в stopMusic(), но для порядка:
                    if (activeHtmlAudio === audio) {
                        audio.pause();
                        activeHtmlAudio = null;
                    }
                }
            });
            break;
        }
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
        case MusicType.SEASONAL_NEW_YEAR: {
            // Sad Jingle Bells
            const notes = [329, 329, 329, 329, 329, 329, 329, 392, 261, 293, 329]; // E E E...
            const durations = [0.2, 0.2, 0.4, 0.2, 0.2, 0.4, 0.2, 0.2, 0.2, 0.1, 0.8];
            let idx = 0;
            const playNote = () => {
                if (!musicGain) return;
                playSimpleSound(notes[idx], durations[idx], 0.5, 'sine');
                const nextDelay = durations[idx] * 1000;
                idx = (idx + 1) % notes.length;
                const timeout = setTimeout(playNote, nextDelay);
                musicNodes.push({ disconnect: () => clearTimeout(timeout) });
            };
            playNote();
            break;
        }
        case MusicType.SEASONAL_APRIL_FOOLS: {
            // Erratic Circus
            const scheduler = setInterval(() => {
                if (!musicGain) { clearInterval(scheduler); return; }
                const freq = Math.random() > 0.5 ? 200 + Math.random() * 100 : 800 + Math.random() * 200;
                playSimpleSound(freq, 0.1, 0.5, 'sawtooth');
            }, 150);
            musicNodes.push({ disconnect: () => clearInterval(scheduler) });
            break;
        }
        case MusicType.SEASONAL_HALLOWEEN: {
            // Spooky Arpeggio (Halloween Theme style 5/4)
            const notes = [329.63, 415.30, 329.63, 415.30, 329.63, 415.30, 329.63, 392.00]; // E, Ab, E, Ab...
            let idx = 0;
            const scheduler = setInterval(() => {
                if (!musicGain) { clearInterval(scheduler); return; }
                playSimpleSound(notes[idx % notes.length] / 2, 0.3, 0.6, 'sawtooth'); // Lower octave
                idx++;
            }, 300);
            musicNodes.push({ disconnect: () => clearInterval(scheduler) });
            break;
        }
        case MusicType.SEASONAL_DADA_BIRTHDAY: {
            // Happy Birthday chaotic
            const notes = [261, 261, 293, 261, 349, 329];
            let idx = 0;
            const scheduler = setInterval(() => {
                if (!musicGain) { clearInterval(scheduler); return; }
                // Randomly change pitch slightly to sound "drunk"
                const detune = 1 + (Math.random() - 0.5) * 0.1;
                playSimpleSound(notes[idx % notes.length] * detune, 0.4, 0.5, 'triangle');
                idx++;
            }, 600);
            musicNodes.push({ disconnect: () => clearInterval(scheduler) });
            break;
        }
        case MusicType.SEASONAL_SEPTEMBER_3: {
            // "Ya kalendar..." (Minor key: C min)
            // G, G, F, Eb, D, C
            // Bb, Bb, Ab, G, F, Eb
            const notes = [
                392, 392, 349, 311, 293, 261, 0, // G G F Eb D C (pause)
                466, 466, 415, 392, 349, 311, 0  // Bb Bb Ab G F Eb (pause)
            ];
            let idx = 0;
            const scheduler = setInterval(() => {
                if (!musicGain) { clearInterval(scheduler); return; }
                const freq = notes[idx % notes.length];
                if (freq > 0) playSimpleSound(freq, 0.3, 0.6, 'square');
                idx++;
            }, 400);
            musicNodes.push({ disconnect: () => clearInterval(scheduler) });
            break;
        }
        case MusicType.SEASONAL_GONDOLIER: {
            // "O Sole Mio" (G, F, E, D...)
            const notes = [392, 349, 329, 293, 261, 293, 329, 293];
            let idx = 0;
            const scheduler = setInterval(() => {
                if (!musicGain) { clearInterval(scheduler); return; }
                // Tremolo effect simulation by playing repeated short notes
                playSimpleSound(notes[Math.floor(idx / 4) % notes.length], 0.15, 0.5, 'sine');
                idx++;
            }, 150);
            musicNodes.push({ disconnect: () => clearInterval(scheduler) });
            break;
        }
        case MusicType.SEASONAL_GLITCH: {
            const scheduler = setInterval(() => {
                if (!musicGain) { clearInterval(scheduler); return; }
                if (Math.random() < 0.3) return; // Breaks
                const oscType: OscillatorType = Math.random() > 0.5 ? 'sawtooth' : 'square';
                playSimpleSound(100 + Math.random() * 1000, 0.05 + Math.random() * 0.2, 0.4, oscType);
            }, 100);
            musicNodes.push({ disconnect: () => clearInterval(scheduler) });
            break;
        }
        case MusicType.SEASONAL_POTATO: {
            // Heavy Soviet/Industrial March
            // Low bass: C, G, C, G
            const notes = [65, 98, 65, 98];
            let idx = 0;
            const scheduler = setInterval(() => {
                if (!musicGain) { clearInterval(scheduler); return; }
                playSimpleSound(notes[idx % notes.length], 0.4, 0.8, 'square');
                // High hat march
                if (idx % 2 === 0) playSimpleSound(800, 0.05, 0.2, 'sawtooth');
                idx++;
            }, 500);
            musicNodes.push({ disconnect: () => clearInterval(scheduler) });
            break;
        }
        // ... Existing Ambient Tracks ...
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
        case MusicType.DOOM_FPS: {
            // Industrial/Metal generative
            // Heavy distorted bass drone
            const bassOsc = ctx.createOscillator();
            bassOsc.type = 'sawtooth';
            bassOsc.frequency.value = 55; // A1
            const distortion = ctx.createWaveShaper();
            function makeDistortionCurve(amount: number) {
                const k = typeof amount === 'number' ? amount : 50;
                const n_samples = 44100;
                const curve = new Float32Array(n_samples);
                const deg = Math.PI / 180;
                for (let i = 0; i < n_samples; ++i ) {
                    const x = i * 2 / n_samples - 1;
                    curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
                }
                return curve;
            }
            distortion.curve = makeDistortionCurve(400);
            distortion.oversample = '4x';
            
            const bassGain = ctx.createGain();
            bassGain.gain.value = 0.4;
            bassOsc.connect(distortion).connect(bassGain).connect(musicGain);
            bassOsc.start();
            musicNodes.push(bassOsc);

            // Rhythmic drums/percussion logic
            let beat = 0;
            const scheduler = setInterval(() => {
                if (!musicGain) { clearInterval(scheduler); return; }
                const t = ctx.currentTime;
                
                // Kick (Fast tempo)
                if (beat % 4 === 0) {
                    const osc = ctx.createOscillator();
                    const g = ctx.createGain();
                    osc.connect(g).connect(musicGain);
                    osc.frequency.setValueAtTime(150, t);
                    osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.5);
                    g.gain.setValueAtTime(1, t);
                    g.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
                    osc.start(t);
                    osc.stop(t + 0.5);
                }
                // Snare/Clap
                if (beat % 4 === 2) {
                    const noise = ctx.createBufferSource();
                    const b = ctx.createBuffer(1, 44100 * 0.2, 44100);
                    const d = b.getChannelData(0);
                    for(let i=0; i<b.length; i++) d[i] = Math.random() * 2 - 1;
                    noise.buffer = b;
                    const g = ctx.createGain();
                    noise.connect(g).connect(musicGain);
                    g.gain.setValueAtTime(0.5, t);
                    g.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
                    noise.start(t);
                }
                // Random metal riffs
                if (Math.random() < 0.3) {
                    const osc = ctx.createOscillator();
                    osc.type = 'square';
                    const freq = [110, 116, 123, 130][Math.floor(Math.random() * 4)]; // Chromatic low notes
                    osc.frequency.value = freq;
                    const g = ctx.createGain();
                    osc.connect(distortion).connect(g).connect(musicGain);
                    g.gain.setValueAtTime(0.3, t);
                    g.gain.linearRampToValueAtTime(0, t + 0.1);
                    osc.start(t);
                    osc.stop(t + 0.1);
                }

                beat++;
            }, 125); // 120 BPM * 4 steps
            musicNodes.push({ disconnect: () => clearInterval(scheduler) });
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
    case SoundType.SHOOT_SPOON: play(300, 0.1, 0.3, 'sine'); osc.frequency.exponentialRampToValueAtTime(100, t + 0.1); break; // Bloop
    case SoundType.SHOOT_FORK: play(1500, 0.05, 0.2, 'triangle'); break; // Ting
    case SoundType.SHOOT_KNIFE: play(800, 0.1, 0.1, 'sawtooth'); osc.frequency.linearRampToValueAtTime(1200, t + 0.1); break; // Swish
    case SoundType.SHOOT_LADLE: play(100, 0.4, 0.4, 'square'); osc.frequency.exponentialRampToValueAtTime(50, t + 0.4); break; // Gong
    
    case SoundType.FOOTSTEP: playNoise(0.05, 0.15, 'lowpass', 600); break; // Step
    case SoundType.HEAL_317: 
        [440, 554, 659, 880].forEach((freq, i) => setTimeout(() => play(freq, 1.0, 0.1, 'sine'), i * 100)); // Major chord
        break;
    
    case SoundType.PICKUP_WEAPON: play(440, 0.1, 0.2, 'square'); setTimeout(() => play(880, 0.2, 0.2, 'square'), 50); break;
    case SoundType.PICKUP_FOOD: play(300, 0.1, 0.3, 'sine'); setTimeout(() => play(400, 0.1, 0.3, 'sine'), 100); break;
    case SoundType.PICKUP_BAD: play(200, 0.3, 0.2, 'sawtooth'); osc.frequency.linearRampToValueAtTime(150, t + 0.3); break;
    case SoundType.ENEMY_DAMAGE: playNoise(0.1, 0.2, 'lowpass', 800); break;
    
    // Entity Deaths
    case SoundType.DEATH_DRANIK:
        playNoise(0.1, 0.2, 'lowpass', 300); // Thud
        play(120, 0.15, 0.25, 'sawtooth'); // Squish
        break;
    case SoundType.DEATH_KOLDUN:
        play(1200, 0.3, 0.2, 'square');
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.3); // Zap down
        break;
    case SoundType.DEATH_VISITOR:
        play(600, 0.3, 0.25, 'triangle');
        osc.frequency.linearRampToValueAtTime(300, t + 0.3); // "Oh no" slide
        break;
    case SoundType.DEATH_BOSS:
        playNoise(1.5, 0.5, 'lowpass', 150); // Rumble
        play(60, 1.5, 0.4, 'sawtooth'); // Deep drone
        osc.frequency.linearRampToValueAtTime(20, t + 1.5);
        break;
    case SoundType.ENEMY_DEATH: play(50, 0.3, 0.4, 'sawtooth'); playNoise(0.2, 0.2, 'lowpass', 500); break;

    case SoundType.SWOOSH: playNoise(0.2, 0.1, 'bandpass', 1000); break;
    case SoundType.PLOP: play(200, 0.1, 0.2, 'sine'); osc.frequency.exponentialRampToValueAtTime(100, t + 0.1); break;
    case SoundType.KISS_SPAWN: play(1200, 0.05, 0.1, 'sine'); break;
    case SoundType.PARRY: play(1500, 0.1, 0.2, 'square'); setTimeout(() => playNoise(0.08, 0.1, 'highpass', 4000), 10); break;
    case SoundType.FLIP: playNoise(0.08, 0.2, 'highpass', 2000); break;
    case SoundType.TEAR: playNoise(0.3, 0.2, 'bandpass', 1500); break;
    case SoundType.LIQUID_CATCH: play(3000, 0.05, 0.05, 'triangle'); break;
    case SoundType.SHOOT: playNoise(0.15, 0.3, 'lowpass', 2000); play(100, 0.1, 0.5, 'square'); break; // Generic shoot
    case SoundType.POWERUP: play(440, 0.1, 0.1, 'square'); setTimeout(() => play(880, 0.2, 0.1, 'square'), 100); break;
    case SoundType.BOSS_ROAR: playNoise(1.5, 0.5, 'lowpass', 200); play(50, 1.5, 0.5, 'sawtooth'); break;
    case SoundType.SPLAT: playNoise(0.1, 0.2, 'lowpass', 600); break;
    
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
