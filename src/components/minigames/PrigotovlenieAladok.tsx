import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useGameLoop } from '../../hooks/useGameLoop';
import { ALADKI_RECIPES } from '../../data/recipeData';
import { useSession, useSettings } from '../../context/GameContext';
import { SoundType } from '../../utils/AudioEngine';
import { Character } from '../../../types';
import { MinigameHUD } from '../core/MinigameHUD';
import { InstructionModal } from '../core/InstructionModal';
import { instructionData } from '../../data/instructionData';

const VideoModal: React.FC<{ url: string; onClose: () => void }> = ({ url, onClose }) => {
    const getEmbedUrl = (videoUrl: string): string => {
        if (videoUrl.includes("youtube.com/watch?v=")) {
            return videoUrl.replace("watch?v=", "embed/") + "?autoplay=1&rel=0";
        }
        if (videoUrl.includes("vkvideo.ru/video-")) {
            const parts = videoUrl.split('video-')[1]?.split('_');
            if (parts && parts.length === 2) {
                const oid = `-${parts[0]}`;
                const id = parts[1];
                return `https://vk.com/video_ext.php?oid=${oid}&id=${id}&autoplay=1`;
            }
        }
        return videoUrl;
    };
    const embedUrl = getEmbedUrl(url);

    return (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center animate-[fadeIn_0.3s]" onClick={onClose}>
            <div className="relative w-11/12 max-w-4xl aspect-video bg-black pixel-border" onClick={(e) => e.stopPropagation()}>
                <iframe
                    width="100%"
                    height="100%"
                    src={embedUrl}
                    title="Video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
                <button onClick={onClose} className="absolute -top-4 -right-4 pixel-button bg-red-600 text-2xl w-12 h-12 flex items-center justify-center z-10" aria-label="Закрыть видео">X</button>
            </div>
        </div>
    );
};

export const AladkiWinScreen: React.FC<{ onContinue: () => void }> = ({ onContinue }) => {
    const { playSound } = useSettings();
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    useEffect(() => {
        playSound(SoundType.WIN_ALADKI);
    }, [playSound]);
    
    const handlePlayVideo = () => {
        playSound(SoundType.BUTTON_CLICK);
        setVideoUrl("https://vkvideo.ru/video-126259657_456239048");
    };

    const dishStyle = {
        width: '150px',
        height: '100px',
        backgroundColor: '#7a4a3a', // Plate
        borderRadius: '50% / 40%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 10px 5px #00000040',
    } as React.CSSProperties;
    const aladkaStyle = {
        width: '50px',
        height: '50px',
        backgroundColor: '#f2d8b1',
        borderRadius: '50%',
        border: '3px solid #d4a773',
        position: 'absolute' as 'absolute',
    };
     const sauceStyle = {
        position: 'absolute',
        width: '120px',
        height: '80px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,0,0,0) 0%, rgba(255,0,255,0.4) 30%, rgba(0,255,255,0.5) 70%)',
        filter: 'blur(5px)',
    } as React.CSSProperties;

    return (
        <>
            <div className="absolute inset-0 bg-gray-800 bg-opacity-90 z-30 flex flex-col items-center justify-center animate-[fadeIn_1s]">
                <h2 className="text-3xl text-yellow-300 mb-8">ДЕЛО СДЕЛАНО!</h2>
                <div 
                    style={dishStyle} 
                    className="cursor-pointer transition-transform hover:scale-110 active:scale-100"
                    onClick={handlePlayVideo}
                    title="Смотреть рецепт"
                >
                    <div style={sauceStyle}></div>
                    <div style={{ ...aladkaStyle, top: '25%', left: '15%' }}></div>
                    <div style={{ ...aladkaStyle, top: '40%', left: '45%' }}></div>
                    <div style={{ ...aladkaStyle, top: '15%', left: '35%' }}></div>
                </div>
                <p className="mt-4 text-xl">Приятного Дада-ппетита!</p>
                <button onClick={onContinue} className="pixel-button absolute bottom-8 p-4 text-2xl z-50 bg-green-700 hover:bg-green-800">
                    ПРОХОДИМ
                </button>
            </div>
            {videoUrl && <VideoModal url={videoUrl} onClose={() => setVideoUrl(null)} />}
        </>
    );
};

const KitchenBackground: React.FC = () => (
    <div className="absolute inset-0 overflow-hidden bg-[#a16207]" style={{ perspective: '800px' }}>
        <div 
            className="absolute inset-[-50%] transform-gpu"
            style={{
                backgroundImage: 'linear-gradient(45deg, #facc15 25%, transparent 25%), linear-gradient(-45deg, #facc15 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #facc15 75%), linear-gradient(-45deg, transparent 75%, #facc15 75%)',
                backgroundSize: '60px 60px',
                transform: 'rotateX(60deg) scale(1.5)',
                animation: 'scroll-bg 20s linear infinite',
            }}
        />
        <style>{`@keyframes scroll-bg { from { background-position: 0 0; } to { background-position: 0 -240px; } }`}</style>
    </div>
);

const Ingredient: React.FC<{ text: string }> = ({ text }) => {
    const textStyle = { textShadow: 'none' };
    const commonClasses = "w-16 h-16 pixel-border flex items-center justify-center text-center text-black";
    
    switch (text) {
        case 'МУКА': return <div className={`${commonClasses} bg-stone-200 flex-col p-1`}><span className="text-xs" style={textStyle}>МУКА</span><span className="text-2xl" style={textStyle}>🌾</span></div>;
        case 'ЯЙЦО': return <div className={`${commonClasses} bg-white rounded-full`}><div className="w-6 h-6 bg-yellow-400 rounded-full border-2 border-yellow-500"></div></div>;
        case 'САХАР': return <div className={`${commonClasses} bg-blue-300`}><span style={textStyle}>САХАР</span></div>;
        case 'КЕФИР': return <div className="w-10 h-20 bg-white pixel-border relative"><div className="w-full h-4 bg-blue-500"></div></div>;
        case 'СОДА': return <div className={`${commonClasses} bg-green-300 w-20 h-10`}><span style={textStyle}>СОДА</span></div>;
        case 'СОЛЬ': return <div className="w-10 h-16 bg-gray-200 pixel-border flex items-center justify-center text-2xl"><span style={textStyle}>S</span></div>;
        case 'ЭНТРОПИЯ': return <div className={`${commonClasses} bg-purple-400 text-white animate-pulse`}><span style={textStyle}>ЭНТРОПИЯ</span></div>;
        case 'АБСУРД': return <div className={`${commonClasses} bg-pink-400 text-white animate-pulse`}><span style={textStyle}>АБСУРД</span></div>;
        case 'СИМУЛЯКР': return <div className={`${commonClasses} bg-indigo-400 text-white animate-pulse`}><span style={textStyle}>СИМУЛЯКР</span></div>;
        default: return <div className={`${commonClasses} bg-red-300`}><span style={textStyle}>{text}</span></div>;
    }
};

const SizzleParticles: React.FC = () => {
    const particles = useMemo(() => Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        style: {
            left: `${Math.random() * 100}%`,
            animation: `sizzle ${0.5 + Math.random()}s ${Math.random() * 0.5}s ease-out infinite`
        } as React.CSSProperties
    })), []);

    return (
        <div className="absolute inset-0 pointer-events-none">
            <style>{`
                @keyframes sizzle {
                    from { transform: translateY(0) scale(1); opacity: 0.7; }
                    to { transform: translateY(-40px) scale(0.5); opacity: 0; }
                }
            `}</style>
            {particles.map(p => (
                <div key={p.id} className="absolute bottom-[45%] w-2 h-2 bg-white rounded-full" style={p.style}></div>
            ))}
        </div>
    );
};


// Main game component
export const PrigotovlenieAladok: React.FC<{ onWin: () => void; onLose: () => void }> = ({ onWin, onLose }) => {
    const { playSound } = useSettings();
    const { character, handleMistake } = useSession();
    const gameAreaRef = useRef<HTMLDivElement>(null);
    const hasFinished = useRef(false);
    const itemCounter = useRef(0);
    const aladkiGoal = 3;

    const settings = useMemo(() => {
        const baseSettings = { mistakesLimit: 3, fallSpeed: 18, flipGreenZone: { start: 70, end: 90 } };
        switch(character) {
            case Character.KANILA: // Easy
                return { ...baseSettings, mistakesLimit: 5, fallSpeed: 15, flipGreenZone: { start: 65, end: 95 } };
            case Character.BLACK_PLAYER: // Hard
                return { ...baseSettings, mistakesLimit: 2, fallSpeed: 22, flipGreenZone: { start: 75, end: 88 } };
            default: // Medium (Sexism)
                return baseSettings;
        }
    }, [character]);

    const [round, setRound] = useState(0);
    const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
    const [phase, setPhase] = useState<'collecting' | 'frying'>('collecting');
    
    // Collecting phase state
    const [panX, setPanX] = useState(50);
    const [items, setItems] = useState<any[]>([]);
    const [currentIngredientIndex, setCurrentIngredientIndex] = useState(0);
    const [mistakes, setMistakes] = useState(0);

    // Frying phase state
    const [aladkiMade, setAladkiMade] = useState(0);
    const [fryingState, setFryingState] = useState<'idle' | 'cooking' | 'flipped'>('idle');
    const [cookProgress, setCookProgress] = useState(0);
    const [flipResult, setFlipResult] = useState<null | 'perfect' | 'undercooked' | 'burnt'>(null);

    const [showInstructions, setShowInstructions] = useState(true);
    const [feedback, setFeedback] = useState<any[]>([]);

    const currentRecipe = ALADKI_RECIPES[round];
    
    // Reset state for new round or phase change
    useEffect(() => {
        setItems([]);
        itemCounter.current = 0;
        setMistakes(0);
        setCurrentIngredientIndex(0);
        setAladkiMade(0);
        setFryingState('idle');
        setCookProgress(0);
        setFlipResult(null);
        setPhase('collecting');
        hasFinished.current = false;
    }, [round]);

    const startNextAladka = useCallback(() => {
        setFlipResult(null);
        setCookProgress(0);
        setFryingState('cooking');
    }, []);

    // Game Loop
    useGameLoop(useCallback((deltaTime) => {
        if (hasFinished.current || status !== 'playing') return;

        // --- Collecting Phase Logic ---
        if (phase === 'collecting') {
            // --- РЕГУЛИРОВКА: Появление новых ингредиентов ---
            // Условие `Math.random() < 0.07` определяет шанс появления ингредиента в каждом кадре.
            // Чтобы предметы падали РЕЖЕ (разряженно), уменьшите это значение (например, до 0.04).
            // Чтобы предметы падали ЧАЩЕ (скученно, стеной), увеличьте это значение (например, до 0.1).
            if (Math.random() < 0.07) {
                // --- РЕГУЛИРОВКА: Соотношение правильных и неправильных ингредиентов ---
                // Условие `Math.random() < 0.5` означает, что с вероятностью 50% появится правильный ингредиент.
                // Чтобы правильные ингредиенты появлялись ЧАЩЕ, увеличьте это значение (например, до 0.7 для 70%).
                // Чтобы они появлялись РЕЖЕ (больше обманок), уменьшите его (например, до 0.3 для 30%).
                const isCorrectType = Math.random() < 0.5;
                const pool = isCorrectType ? currentRecipe.ingredients : currentRecipe.decoys;
                const text = pool[Math.floor(Math.random() * pool.length)];
                setItems(prev => [...prev, {
                    id: itemCounter.current++, text, x: 10 + Math.random() * 80, y: -5, rot: (Math.random() - 0.5) * 90
                }]);
            }

            // Move items and check for collision
            setItems(prevItems => {
                const newItems = [];
                const requiredIngredient = currentRecipe.orderedIngredients[currentIngredientIndex];
                
                for (const item of prevItems) {
                    const newY = item.y + settings.fallSpeed * (deltaTime / 1000);
                    if (newY > 105) continue; // Remove if off-screen

                    let hit = false;
                    if (newY > 85 && newY < 95 && item.x > panX - 10 && item.x < panX + 10) {
                        hit = true;
                        if (item.text === requiredIngredient) {
                            playSound(SoundType.ITEM_CATCH_GOOD);
                            setCurrentIngredientIndex(idx => idx + 1);
                             setFeedback(f => [...f, { id: Date.now(), text: `+ ${item.text}`, x: item.x, y: item.y, color: 'text-green-400' }]);
                        } else {
                            if (!handleMistake()) {
                                playSound(SoundType.ITEM_CATCH_BAD);
                                setMistakes(m => m + 1);
                                setFeedback(f => [...f, { id: Date.now(), text: 'НЕ ТО!', x: item.x, y: item.y, color: 'text-red-500' }]);
                            }
                        }
                    }
                    if (!hit) newItems.push({ ...item, y: newY });
                }
                return newItems;
            });
        }
        
        // --- Frying Phase Logic ---
        if (phase === 'frying' && fryingState === 'cooking') {
            setCookProgress(p => Math.min(100, p + 15 * (deltaTime / 1000)));
        }

        // Update feedback lifetime
        setFeedback(f => f.slice(-5));

    }, [panX, status, currentRecipe, phase, fryingState, currentIngredientIndex, playSound, settings.fallSpeed, handleMistake]), status === 'playing' && !showInstructions);

    // Check win/loss conditions
    useEffect(() => {
        if (status !== 'playing' || hasFinished.current) return;

        if (mistakes >= settings.mistakesLimit) {
            hasFinished.current = true;
            setStatus('lost');
            setTimeout(onLose, 2000);
        } else if (phase === 'collecting' && currentIngredientIndex >= currentRecipe.orderedIngredients.length) {
            setPhase('frying');
            setTimeout(startNextAladka, 1000); // Start frying after a short delay
        } else if (phase === 'frying' && aladkiMade >= aladkiGoal) {
             if (round < ALADKI_RECIPES.length - 1) {
                setTimeout(() => setRound(r => r + 1), 1000);
            } else {
                hasFinished.current = true;
                setStatus('won');
            }
        }

    }, [mistakes, phase, currentIngredientIndex, aladkiMade, round, onLose, status, currentRecipe, startNextAladka, settings.mistakesLimit, aladkiGoal]);

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (gameAreaRef.current && phase === 'collecting') {
            e.preventDefault();
            const pointer = 'touches' in e ? e.touches[0] : e;
            const rect = gameAreaRef.current.getBoundingClientRect();
            const x = ((pointer.clientX - rect.left) / rect.width) * 100;
            setPanX(x);
        }
    };
    
    const handleFlip = () => {
        if (phase !== 'frying' || fryingState !== 'cooking' || hasFinished.current) return;
        
        setFryingState('flipped');
        let result: 'perfect' | 'undercooked' | 'burnt';
        
        if (cookProgress > settings.flipGreenZone.end) {
            playSound(SoundType.PLAYER_HIT);
            result = 'burnt';
            setMistakes(m => m + 1);
        } else if (cookProgress >= settings.flipGreenZone.start) {
            playSound(SoundType.FLIP);
            result = 'perfect';
            setAladkiMade(count => count + 1);
        } else {
            playSound(SoundType.SWOOSH);
            result = 'undercooked';
        }
        setFlipResult(result);

        // Prepare for the next pancake or end the round
        setTimeout(() => {
            if (aladkiMade < aladkiGoal && !hasFinished.current) {
                 startNextAladka();
            }
        }, 1500);
    };

    const instruction = instructionData['5-1'];
    const InstructionContent = instruction.content;

    const renderCollectingPhase = () => (
        <>
            <div className="absolute inset-0">
                {items.map(item => (
                    <div key={item.id} className="absolute" style={{ left: `${item.x}%`, top: `${item.y}%`, transform: `translate(-50%, -50%) rotate(${item.rot}deg)` }}>
                        <Ingredient text={item.text} />
                    </div>
                ))}
                 {feedback.map(f => (
                    <div key={f.id} className={`absolute font-bold text-2xl ${f.color}`} style={{ left: `${f.x}%`, top: `${f.y}%`, animation: 'float-up-and-fade 1s forwards', textShadow: 'none' }}>{f.text}</div>
                ))}
                {/* Frying Pan */}
                <div className="absolute bottom-[5%] w-32 h-8 bg-gray-800 rounded-md" style={{ left: `${panX}%`, transform: 'translateX(-50%)' }}>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-4 h-12 bg-gray-600"></div>
                </div>
            </div>
        </>
    );

    const renderFryingPhase = () => {
        const panSize = 200;
        let flipMessage = '';
        if (flipResult === 'perfect') flipMessage = 'ОТЛИЧНО!';
        if (flipResult === 'burnt') flipMessage = 'СГОРЕЛО!';
        if (flipResult === 'undercooked') flipMessage = 'СЫРОЕ!';

        return (
            <div className="w-full h-full flex flex-col items-center justify-center" onClick={handleFlip}>
                 <style>{`
                    @keyframes flip-anim {
                        0% { transform: translateY(0) rotate(0); }
                        50% { transform: translateY(-80px) rotate(180deg); }
                        100% { transform: translateY(0) rotate(360deg); }
                    }
                    @keyframes rotate-indicator {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                 `}</style>
                <h3 className="text-2xl text-black font-bold mb-4" style={{textShadow: 'none'}}>Приготовлено: {aladkiMade}/{aladkiGoal}</h3>
                <div 
                    className="relative flex items-center justify-center cursor-pointer" 
                    style={{ width: `${panSize}px`, height: `${panSize}px` }}
                >
                    {/* Pan */}
                    <div className="absolute w-full h-full bg-gray-800 rounded-full"></div>
                    {/* Sizzle particles */}
                    {fryingState === 'cooking' && <SizzleParticles />}
                    {/* Progress indicator */}
                    <div 
                        className="absolute w-full h-full rounded-full"
                        style={{
                            background: `conic-gradient(
                                #fca5a5 0% ${settings.flipGreenZone.start}%, 
                                #4ade80 ${settings.flipGreenZone.start}% ${settings.flipGreenZone.end}%, 
                                #fca5a5 ${settings.flipGreenZone.end}% 100%
                            )`
                        }}
                    ></div>
                    <div className="absolute w-[90%] h-[90%] bg-gray-800 rounded-full"></div>
                    {/* Arrow */}
                    {fryingState === 'cooking' && (
                        <div 
                            className="absolute w-1/2 h-2 bg-yellow-300 origin-left"
                            style={{ 
                                top: '50%', 
                                left: '50%',
                                transform: `rotate(${cookProgress * 3.6 - 90}deg)`,
                                transition: 'transform 0.1s linear'
                            }}
                        ></div>
                    )}

                    {/* Aladka */}
                    {fryingState !== 'idle' && (
                        <div 
                            className={`w-24 h-24 bg-[#f2d8b1] rounded-full border-4 border-[#d4a773] ${fryingState === 'flipped' ? 'animate-[flip-anim_0.5s_ease-out]' : ''}`}
                            style={{ backgroundColor: flipResult === 'burnt' ? '#5c3a21' : flipResult === 'undercooked' ? '#fffbe1' : '#f2d8b1'}}
                        ></div>
                    )}
                    {flipResult && <div className="absolute text-3xl font-bold text-white" style={{textShadow: '2px 2px 0 #000'}}>{flipMessage}</div>}
                     {!flipResult && <div className="absolute text-center text-xl text-white font-bold p-2" style={{textShadow: '2px 2px 0 #000'}}>КЛИКНИ, ЧТОБЫ<br/>ПЕРЕВЕРНУТЬ!</div>}
                </div>
            </div>
        );
    };

    const requiredIngredient = phase === 'collecting' ? currentRecipe.orderedIngredients[currentIngredientIndex] : null;

    return (
        <div 
            ref={gameAreaRef} 
            onMouseMove={handlePointerMove} 
            onTouchMove={handlePointerMove} 
            onTouchStart={handlePointerMove}
            className="w-full h-full flex flex-col items-center p-4 relative overflow-hidden"
            style={{ textShadow: 'none' }} // Fix for double-font issue
        >
            <KitchenBackground />
            <div className="absolute inset-0 bg-black/10"></div>
            {status === 'won' && <AladkiWinScreen onContinue={onWin} />}
            {status === 'lost' && <div className="absolute inset-0 bg-red-900/80 z-20 flex items-center justify-center text-5xl">АЛАДКИ ПОДГОРЕЛИ!</div>}

            {showInstructions ? (
                <InstructionModal title={instruction.title} onStart={() => setShowInstructions(false)}>
                    <InstructionContent />
                </InstructionModal>
            ) : status === 'playing' && (
                <>
                    <MinigameHUD>
                        <div className="w-1/2 text-left text-black" style={{ textShadow: '1px 1px 1px #FFF' }}>
                            <h3 className="text-xl font-bold mb-1">{currentRecipe.name} (Раунд {round+1}/{ALADKI_RECIPES.length})</h3>
                           {phase === 'collecting' && <p className="text-lg animate-pulse">Следующий: {requiredIngredient || 'ГОТОВО!'}</p>}
                        </div>
                        <div className="w-1/2 text-right text-black" style={{ textShadow: '1px 1px 1px #FFF' }}>
                            Ошибки: {mistakes}/{settings.mistakesLimit}
                        </div>
                    </MinigameHUD>
                    {phase === 'collecting' ? renderCollectingPhase() : renderFryingPhase()}
                </>
            )}
        </div>
    );
};
