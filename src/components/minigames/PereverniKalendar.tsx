
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { PixelArt } from '../core/PixelArt';
import { ROWANBERRY_ART_DATA } from '../../miscArt';
import { PIXEL_ART_PALETTE } from '../../../characterArt';
import { useSettings } from '../../context/GameContext';
import { SoundType } from '../../utils/AudioEngine';


// Компонент для анимации "горящих костров рябин".
const GoryaschieKostry: React.FC = () => {
    const items = React.useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        style: {
            left: `${Math.random() * 95}%`,
            animationDuration: `${3 + Math.random() * 4}s`,
            animationDelay: `${Math.random() * 4}s`,
            fontSize: `${30 + Math.random() * 40}px`,
            textShadow: '0 0 8px #ff7700, 0 0 15px #ff0000',
        } as React.CSSProperties
    })), []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
            <style>{`
                @keyframes float-up {
                    from { transform: translateY(100%) rotate(0deg); opacity: 1; }
                    to { transform: translateY(-200%) rotate(360deg); opacity: 0; }
                }
                .floating-item { 
                    position: absolute; 
                    bottom: -60px; 
                    animation-name: float-up; 
                    animation-timing-function: linear; 
                    animation-fill-mode: forwards; 
                    color: #ffdd00;
                }
            `}</style>
            {items.map(item => ( <div key={item.id} className="floating-item" style={item.style}>🔥</div> ))}
        </div>
    );
};

// Компонент для осколков календаря
const ShatterPiece: React.FC<{ text: string }> = ({ text }) => {
    const style: React.CSSProperties = {
        position: 'absolute',
        top: `${30 + Math.random() * 40}%`,
        left: `${40 + Math.random() * 20}%`,
        '--dx': `${(Math.random() - 0.5) * 500}px`,
        '--dy': `${(Math.random() - 0.5) * 500}px`,
        '--rot': `${(Math.random() - 0.5) * 720}deg`,
        animation: 'shatter-fly 2.5s ease-out forwards',
        zIndex: 10,
        textShadow: '0 0 4px #fff, 0 0 2px #fff'
    } as React.CSSProperties;
    return <div className="text-6xl text-white" style={style}>{text}</div>;
};

export const PereverniKalendarWinScreen: React.FC<{ onContinue?: () => void }> = ({ onContinue }) => {
    const { playSound } = useSettings();
    useEffect(() => {
        playSound(SoundType.WIN_KALENDAR);
    }, [playSound]);

    const backgroundBerries = useMemo(() => Array.from({ length: 25 }).map((_, i) => ({
        id: i,
        style: {
            position: 'absolute',
            top: `${Math.random() * 90}%`,
            left: `${Math.random() * 90}%`,
            transform: `scale(${0.9 + Math.random() * 0.7}) rotate(${(Math.random() - 0.5) * 50}deg)`,
            opacity: 0.2 + Math.random() * 0.4,
            animation: `fadeIn ${2 + Math.random() * 3}s ease-out forwards, jiggle-berry ${4 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`
        } as React.CSSProperties
    })), []);
    
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black relative overflow-hidden">
             {backgroundBerries.map(berry => (
                <div key={berry.id} style={berry.style}>
                    <PixelArt artData={ROWANBERRY_ART_DATA} palette={PIXEL_ART_PALETTE} pixelSize={4} />
                </div>
            ))}
            <GoryaschieKostry />
            <div className={`absolute inset-0 flex flex-col items-center justify-center text-white z-30 animate-[fadeIn_3s_ease-out]`}>
                <h2 className="text-8xl font-bold text-red-600">3</h2>
                <p className="text-4xl">СЕНТЯБРЯ</p>
            </div>
            {onContinue && (
                 <button onClick={onContinue} className="pixel-button absolute bottom-8 p-4 text-2xl z-50 bg-green-700 hover:bg-green-800 animate-[fadeIn_1s_3s_forwards] opacity-0">
                    ПРОДОЛЖИТЬ
                </button>
            )}
        </div>
    );
};


export const PereverniKalendar: React.FC<{ onWin: () => void; onLose: () => void }> = ({ onWin, onLose }) => {
    const { isMuted, playSound } = useSettings();
    // --- Состояние ---
    const [dragState, setDragState] = useState({ isDragging: false, progress: 0 });
    const [isShattered, setIsShattered] = useState(false);
    const [hasWon, setHasWon] = useState(false);
    const hasFinished = useRef(false);
    
    // --- Аудио ---
    const audioContextRef = useRef<AudioContext | null>(null);
    const fireGainRef = useRef<GainNode | null>(null);
    const glitchGainRef = useRef<GainNode | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // --- Функция для создания и управления звуком ---
    const setupAudio = useCallback(() => {
        if (audioContextRef.current) return;
        try {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = context;

            // Звук огня
            const fireNoise = context.createBufferSource();
            const bufferSize = 2 * context.sampleRate;
            const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
            fireNoise.buffer = noiseBuffer; fireNoise.loop = true;
            const fireFilter = context.createBiquadFilter();
            fireFilter.type = 'lowpass'; fireFilter.frequency.value = 800;
            const fireGain = context.createGain();
            fireGain.gain.setValueAtTime(isMuted ? 0 : 0.05, context.currentTime); // Тихий огонь
            fireGainRef.current = fireGain;
            fireNoise.connect(fireFilter).connect(fireGain).connect(context.destination);
            fireNoise.start();

            // Звук глитча
            const glitchOsc = context.createOscillator();
            glitchOsc.type = 'sawtooth';
            glitchOsc.frequency.setValueAtTime(1200, context.currentTime);
            const glitchGain = context.createGain();
            glitchGain.gain.setValueAtTime(0, context.currentTime); // Начинается тихо
            glitchGainRef.current = glitchGain;
            glitchOsc.connect(glitchGain).connect(context.destination);
            glitchOsc.start();
        } catch (e) { console.error("Could not init audio", e); }
    }, [isMuted]);

    // --- Обработчики мыши и касаний ---
    const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (isShattered || hasFinished.current) return;
        e.preventDefault();
        playSound(SoundType.GENERIC_CLICK);
        setupAudio(); // Запускаем звук при первом клике
        setDragState({ isDragging: true, progress: 0 });
    }, [isShattered, hasFinished.current, setupAudio, playSound]);
    
    const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (!dragState.isDragging || !containerRef.current) return;
        e.preventDefault();
        
        const pointer = 'touches' in e ? e.touches[0] : e;
        const rect = containerRef.current.getBoundingClientRect();
        // Прогресс зависит от того, как далеко вправо утащили курсор
        const progress = Math.min(1, Math.max(0, (pointer.clientX - rect.left) / (rect.width * 0.7)));
        setDragState(d => ({ ...d, progress }));

        // Обновляем громкость глитча
        if (glitchGainRef.current && audioContextRef.current) {
            const targetGain = isMuted ? 0 : progress * 0.1;
            glitchGainRef.current.gain.setTargetAtTime(targetGain, audioContextRef.current.currentTime, 0.01);
        }

    }, [dragState.isDragging, isMuted]);

    const handlePointerUp = useCallback(() => {
        if (!dragState.isDragging) return;
        
        if (dragState.progress >= 1) { // Если утащили до конца
            setDragState(d => ({ ...d, isDragging: false }));
            
            if (hasFinished.current) return;
            hasFinished.current = true;
            
            // Запускаем звук разбития
            if (audioContextRef.current && !isMuted) {
                const shatterGain = audioContextRef.current.createGain();
                const shatterNoise = audioContextRef.current.createBufferSource();
                const bufferSize = audioContextRef.current.sampleRate * 0.5;
                const buffer = audioContextRef.current.createBuffer(1, bufferSize, audioContextRef.current.sampleRate);
                const output = buffer.getChannelData(0);
                for(let i=0; i<bufferSize; i++) output[i] = Math.random() * 2 - 1;
                shatterNoise.buffer = buffer;
                shatterGain.gain.setValueAtTime(0.5, audioContextRef.current.currentTime);
                shatterGain.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.5);
                shatterNoise.connect(shatterGain).connect(audioContextRef.current.destination);
                shatterNoise.start();
                setTimeout(()=>shatterNoise.stop(), 500);
            }
            
            setIsShattered(true);
            setTimeout(() => {
                setHasWon(true);
                if (glitchGainRef.current && audioContextRef.current) {
                    glitchGainRef.current.gain.setTargetAtTime(0, audioContextRef.current.currentTime, 0.1);
                }
                if (fireGainRef.current && audioContextRef.current) {
                    const targetGain = isMuted ? 0 : 0.15;
                    fireGainRef.current.gain.setTargetAtTime(targetGain, audioContextRef.current.currentTime, 2);
                }
            }, 2000);

        } else {
            // Возвращаем страницу на место
            setDragState({ isDragging: false, progress: 0 });
            if (glitchGainRef.current && audioContextRef.current) {
                glitchGainRef.current.gain.setTargetAtTime(0, audioContextRef.current.currentTime, 0.1);
            }
        }
    }, [dragState, isMuted]);
    
    // Mute/unmute logic
    useEffect(() => {
        const fireGain = fireGainRef.current;
        const glitchGain = glitchGainRef.current;
        const audioCtx = audioContextRef.current;
        if (audioCtx) {
            if(fireGain) {
                const targetGain = isMuted ? 0 : (hasWon ? 0.15 : 0.05);
                fireGain.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.1);
            }
            if(glitchGain) {
                 const targetGain = isMuted ? 0 : (dragState.isDragging ? dragState.progress * 0.1 : 0);
                 glitchGain.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.1);
            }
        }
    }, [isMuted, hasWon, dragState]);

    // Очистка аудио при размонтировании
    useEffect(() => {
        return () => {
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
              audioContextRef.current.close().catch(console.error);
            }
        };
    }, []);

    const handleWinContinue = () => {
        playSound(SoundType.BUTTON_CLICK);
        onWin();
    };

    const pageProgress = isShattered ? 1 : dragState.progress;
    const glitchStyle: React.CSSProperties = { filter: `blur(${pageProgress * 3}px) contrast(${1 + pageProgress * 0.5}) hue-rotate(-${pageProgress * 25}deg)` };
    const pageStyle: React.CSSProperties = {
        transform: `perspective(1000px) rotateY(-${pageProgress * 110}deg)`,
        transformOrigin: 'left center',
        transition: !dragState.isDragging ? 'transform 0.5s ease-in-out' : 'none',
        boxShadow: `${pageProgress * 20}px 0px 30px rgba(0,0,0,0.5)`,
    };
    
    return (
        <div 
            ref={containerRef} 
            onMouseDown={handlePointerDown} 
            onMouseMove={handlePointerMove} 
            onMouseUp={handlePointerUp} 
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            className="w-full h-full flex flex-col items-center justify-center bg-gray-800 cursor-grab active:cursor-grabbing relative" 
            style={hasWon ? undefined : glitchStyle}
        >
            <style>{`
                @keyframes shatter-fly {
                    from { opacity: 1; transform: translate(0,0) rotate(0) scale(1); }
                    to { opacity: 0; transform: translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(0.5); }
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes jiggle-berry {
                    0%, 100% { transform: translateY(-1px) rotate(-1deg); }
                    50% { transform: translateY(1px) rotate(1deg); }
                }
            `}</style>

            {hasWon && <PereverniKalendarWinScreen onContinue={handleWinContinue} />}
            
            {/* Сама страница календаря, исчезает, когда ее "разбили" */}
            {!isShattered && (
                <div className="relative w-80 h-96 z-10" style={{ perspective: '2000px' }}>
                    <div className="absolute w-full h-full bg-gray-400"></div> {/* Основа календаря */}
                    <div className="absolute inset-0 bg-gray-200 text-black flex flex-col items-center justify-center p-4" style={pageStyle}>
                        <h2 className="text-6xl font-bold">2</h2>
                        <p className="text-2xl">СЕНТЯБРЯ</p>
                    </div>
                </div>
            )}
            
            {/* Осколки, появляются, когда страница разбита */}
            {isShattered && !hasWon && (
                 <>
                    <ShatterPiece text="2" />
                    <ShatterPiece text="СЕН" />
                    <ShatterPiece text="ТЯ" />
                    <ShatterPiece text="БРЯ" />
                </>
            )}

            {/* Подсказка, исчезает после победы */}
            {!hasWon && (
                <p className="absolute bottom-8 text-xl text-yellow-300 z-10">Схвати и оторви прошлое.</p>
            )}
        </div>
    );
};
