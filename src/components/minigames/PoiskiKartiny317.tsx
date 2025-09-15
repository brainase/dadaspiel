
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { distractorWords } from '../../data/wordData';
import { useSettings, useNavigation } from '../../context/GameContext';
import { SoundType } from '../../utils/AudioEngine';
import { PixelArt } from '../core/PixelArt';
import { UNDERPANTS_ART_DATA } from '../../miscArt';
import { PIXEL_ART_PALETTE } from '../../../characterArt';

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

// --- Dada Animation (from old PoiskiKartiny317) ---
const DadaWinAnimation = () => {
    const words = React.useMemo(() => Array.from({ length: 40 }).map((_, i) => {
        const colorClasses = ["text-red-500", "text-blue-400", "text-green-500", "text-purple-500", "text-orange-500", "text-pink-500", "text-yellow-400"];
        return {
            id: i,
            style: {
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                fontSize: `${15 + Math.random() * 30}px`,
                animationDelay: `${Math.random() * 1}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                '--end-x': `${(Math.random() - 0.5) * 1000}px`,
                '--end-y': `${(Math.random() - 0.5) * 1000}px`,
                '--end-rot': `${(Math.random() - 0.5) * 720}deg`,
            } as React.CSSProperties,
            colorClass: colorClasses[Math.floor(Math.random() * colorClasses.length)]
        };
    }), []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
            {words.map(word => <span key={word.id} className={`dada-anim-word ${word.colorClass}`} style={word.style}>ДаДа</span>)}
        </div>
    );
};

// --- Phase 1: Find The Number ---
const FindTheNumber: React.FC<{ onFound: () => void }> = ({ onFound }) => {
    const [numbers, setNumbers] = useState<number[]>([]);
    const { playSound } = useSettings();

    const shuffleNumbers = useCallback(() => {
        playSound(SoundType.SWOOSH);
        const arr: number[] = Array.from({ length: 50 }, () => Math.floor(100 + Math.random() * 900));
        const randomIndex = Math.floor(Math.random() * arr.length);
        arr[randomIndex] = 317;
        setNumbers(arr.sort(() => Math.random() - 0.5));
    }, [playSound]);

    useEffect(() => {
        shuffleNumbers();
        const interval = setInterval(shuffleNumbers, 5000);
        return () => clearInterval(interval);
    }, [shuffleNumbers]);

    const handleClick = (num: number) => {
        if (num === 317) {
            playSound(SoundType.ITEM_PLACE_SUCCESS);
            onFound();
        } else {
            playSound(SoundType.ITEM_CATCH_BAD);
            shuffleNumbers(); // Shuffle on wrong click
        }
    };
    
    return (
        <div className="w-full h-full p-4 flex flex-wrap justify-center items-center gap-4 overflow-y-auto bg-gray-900">
            {numbers.map((num, i) => (
                <span 
                    key={i} 
                    onClick={() => handleClick(num)} 
                    onTouchStart={() => handleClick(num)}
                    className="p-2 cursor-pointer hover:bg-yellow-400 hover:text-black text-white" style={{
                    fontSize: `${16 + Math.random() * 24}px`,
                    transform: `rotate(${Math.random() * 90 - 45}deg)`,
                    fontFamily: ['Press Start 2P', 'Arial', 'Courier New'][Math.floor(Math.random()*3)],
                }}>
                    {num}
                </span>
            ))}
        </div>
    );
};

export const pisyunImages: React.ReactNode[] = [
  <svg key="1" width="80" height="100" viewBox="0 0 80 100"><path d="M35 90 C 15 90, 15 70, 35 70 L 35 30 C 35 10, 45 10, 45 30 L 45 70 C 65 70, 65 90, 45 90 Z" fill="#333" stroke="#000" strokeWidth="2" /></svg>,
  <svg key="2" width="80" height="100" viewBox="0 0 80 100"><g transform="translate(0, 5)"><path d="M40 20 C 25 20, 25 40, 40 40 L 40 80 C 25 80, 15 100, 30 100" stroke="#000" strokeWidth="2" fill="#333" /><path d="M40 80 C 55 80, 65 100, 50 100" stroke="#000" strokeWidth="2" fill="#333" /></g></svg>,
  <svg key="3" width="80" height="100" viewBox="0 0 80 100"><path d="M40,10 C15,10 15,50 40,50 M40,10 C65,10 65,50 40,50 M20,90 C10,110,40,115,40,90 M60,90 C70,110,40,115,40,90 M40,50 L40,90" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>
];

const ArtTicket: React.FC<{ pisyunImage?: React.ReactNode }> = ({ pisyunImage }) => {
    return (
        <div 
            className="w-96 h-60 p-3 relative flex flex-col items-center justify-center transform -rotate-[3deg] shadow-2xl" 
            style={{ 
                backgroundColor: '#e0ddd5', 
                border: '3px solid #2e3546',
                boxShadow: '8px 8px 0px #703529',
                color: '#283d70',
                textShadow: 'none',
                overflow: 'hidden',
            }}
        >
            <div className="absolute inset-0 z-0 opacity-20">
                 <svg width="100%" height="100%">
                    <defs>
                        <pattern id="ticket-dada-pattern" patternUnits="userSpaceOnUse" width="80" height="80" patternTransform="rotate(45)">
                            <path d="M-10,10 L10,10 M-10,20 L20,20" stroke="#c6934b" strokeWidth="1" />
                            <text x="30" y="50" fontFamily="Times New Roman" fontSize="12" fill="#c6934b" transform="rotate(-30)">ДА</text>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#ticket-dada-pattern)" />
                </svg>
            </div>
            <div className="absolute top-2 right-2 z-10 text-xs font-bold p-1 transform rotate-12 text-white" style={{ backgroundColor: '#703529' }}>ХорДА!</div>

            <h3 className="text-4xl font-bold tracking-widest z-10" style={{fontFamily: `'Courier New', Courier, monospace`}}>АНТИ-БИЛЕТ</h3>
            
            <div className="my-2 w-full flex justify-between items-center px-4 z-10">
                <span className="text-lg font-semibold transform -rotate-12" style={{color: '#2e3546'}}>Фестиваль имени Приапа</span>
                <div className="w-16 h-16">{pisyunImage}</div>
                <span className="text-lg font-bold" style={{color: '#2e3546'}}>x1</span>
            </div>
            
            <div className="text-center font-semibold text-lg z-10" style={{fontFamily: `'Times New Roman', serif`, fontStyle: 'italic'}}>Разрядить при выходе!</div>
        </div>
    );
};

export const ArtRevealWinScreen: React.FC<{ pisyunImage: React.ReactNode; onContinue: () => void }> = ({ pisyunImage, onContinue }) => {
    const { playSound } = useSettings();
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    useEffect(() => {
        playSound(SoundType.ART_REVEAL);
    }, [playSound]);

    const handlePlayVideo = () => {
        playSound(SoundType.BUTTON_CLICK);
        setVideoUrl("https://vkvideo.ru/video-126259657_456239031");
    };
    
    // Re-implementation of the flying words animation
    const DadaWordExplosion = () => {
        const words = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
            id: i,
            text: ['Да', 'Нет', '!', '?', 'Арт'][i % 5],
            style: {
                top: '50%', left: '50%',
                '--dx': `${(Math.random() - 0.5) * 100}vmin`,
                '--dy': `${(Math.random() - 0.5) * 100}vmin`,
                '--rot': `${(Math.random() - 0.5) * 1080}deg`,
                animation: `word-explosion-fly 2.5s cubic-bezier(0.2, 0.8, 0.7, 1) forwards`,
                animationDelay: `${i * 0.02}s`,
                fontSize: `${2 + Math.random() * 2}rem`,
                color: ['#e0ddd5', '#c6934b', '#703529'][i % 3]
            } as React.CSSProperties
        })), []);

        return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
                <style>{`
                    @keyframes word-explosion-fly {
                        from { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                        to { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.5) rotate(var(--rot)); opacity: 0; }
                    }
                `}</style>
                {words.map(w => <div key={w.id} className="absolute" style={w.style}>{w.text}</div>)}
            </div>
        );
    };

    return (
        <>
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center overflow-hidden z-40">
                 <div className="absolute inset-0 z-0">
                    <svg width="100%" height="100%">
                        <defs>
                            <pattern id="dada-bg-pattern" patternUnits="userSpaceOnUse" width="100" height="100" patternTransform="scale(1) rotate(25)">
                                <rect width="100" height="100" fill="#2e3546" />
                                <path d="M 10 10 L 30 80" stroke="#c6934b" strokeWidth="3" />
                                <circle cx="80" cy="20" r="10" fill="#703529" />
                                <rect x="50" y="50" width="20" height="20" fill="none" stroke="#283d70" strokeWidth="4" transform="rotate(15 60 60)" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#dada-bg-pattern)" />
                    </svg>
                </div>

                <DadaWordExplosion />
                
                <div 
                    onClick={handlePlayVideo}
                    className="z-10 animate-[fadeIn_1s_1s_forwards] opacity-0 cursor-pointer hover:scale-105 transition-transform"
                >
                     <ArtTicket pisyunImage={pisyunImage} />
                </div>
                
                <button onClick={onContinue} className="pixel-button absolute bottom-8 p-4 text-2xl z-50 bg-green-700 hover:bg-green-800 animate-[fadeIn_1s_2s_forwards] opacity-0">
                    ПРОХОДИМ
                </button>
            </div>
            {videoUrl && <VideoModal url={videoUrl} onClose={() => setVideoUrl(null)} />}
        </>
    );
};


// --- Main Minigame Component ---
export const PoiskiKartiny317: React.FC<{ onWin: () => void; onLose: () => void }> = ({ onWin, onLose }) => {
    const { playSound } = useSettings();
    const { isInstructionModalVisible } = useNavigation();
    
    type GamePhase = 'findNumber' | 'interactPainting' | 'tearPage' | 'flipping' | 'won';
    const [phase, setPhase] = useState<GamePhase>('findNumber');
    
    const [paintingWords, setPaintingWords] = useState<any[]>([]);
    const [showUnderpants, setShowUnderpants] = useState(true);
    const [showDadaAnimation, setShowDadaAnimation] = useState(false);
    const [tearState, setTearState] = useState(0);
    const [isPageFlipped, setIsPageFlipped] = useState(false);
    const [isFlipFinished, setIsFlipFinished] = useState(false);

    const replacementWords = useMemo(() => ["Перформанс", "Инсталляция", "Я не знаю!"], []);
    
    const [pisyunImage] = useState(() => pisyunImages[Math.floor(Math.random() * pisyunImages.length)]);
    const pageContent = useMemo(() => (
        <div className="w-full h-full flex items-center justify-center">
            {pisyunImage}
        </div>
    ), [pisyunImage]);

    const handleNumberFound = useCallback(() => {
        const bookRect = { left: 35, top: 25, right: 65, bottom: 80 }; 
        const padding = 10;
        const bookSafeZone = {
            left: bookRect.left - padding,
            top: bookRect.top - padding,
            right: bookRect.right + padding,
            bottom: bookRect.bottom + padding,
        };

        const generateWordPos = () => {
            let left, top, attempts = 0;
            do {
                left = 5 + Math.random() * 90;
                top = 5 + Math.random() * 90;
                attempts++;
                if (attempts > 100) { 
                    console.warn("Could not place word in a safe zone.");
                    break;
                }
            } while (
                left > bookSafeZone.left && left < bookSafeZone.right &&
                top > bookSafeZone.top && top < bookSafeZone.bottom
            );
            return { left, top };
        };
        
        let wordList: any[] = [];
        const wordsToPlace = [...distractorWords].sort(() => 0.5 - Math.random()).slice(0, 15);
        wordsToPlace.forEach((wordText, index) => {
            const { left, top } = generateWordPos();
            wordList.push({
                id: index,
                text: wordText,
                isTarget: false,
                style: { top: `${top}%`, left: `${left}%`, transform: `translate(-50%, -50%) rotate(${Math.random() * 40 - 20}deg)`, fontSize: `${12 + Math.random() * 8}px` }
            });
        });
        
        const { left: dadaLeft, top: dadaTop } = generateWordPos();
        wordList.push({ 
            id: 999, text: 'ДаДа', isTarget: true, 
            style: { top: `${dadaTop}%`, left: `${dadaLeft}%`, transform: `translate(-50%, -50%) rotate(${Math.random() * 30 - 15}deg)`, fontSize: `${20 + Math.random() * 10}px` } 
        });
    
        setPaintingWords(wordList);
        setPhase('interactPainting');
    }, []);

    const handleWordClick = useCallback((wordId: number) => {
        playSound(SoundType.GENERIC_CLICK);
        setPaintingWords(currentWords => currentWords.map(word => {
            if (word.id === wordId) {
                return { ...word, text: replacementWords[Math.floor(Math.random() * replacementWords.length)] };
            }
            return word;
        }));
    }, [playSound, replacementWords]);

    const handleDadaClick = useCallback(() => {
        playSound(SoundType.PLAYER_WIN);
        setShowDadaAnimation(true);
        const underpantsEl = document.getElementById('underpants');
        if (underpantsEl) {
            underpantsEl.style.animation = 'fly-off 1.5s ease-in forwards';
        }

        setTimeout(() => {
            setShowUnderpants(false);
            setShowDadaAnimation(false);
            setPhase('tearPage');
        }, 3000);
    }, [playSound]);

    const handleTear = useCallback(() => {
        if (tearState >= 5) return;
        
        playSound(SoundType.TEAR);
        const newTearState = tearState + 1;
        setTearState(newTearState);

        if (newTearState >= 5) {
            setTimeout(() => {
                setPhase('flipping');
                setTimeout(() => setIsPageFlipped(true), 100);
                setTimeout(() => {
                    setIsFlipFinished(true);
                }, 1600);
            }, 500);
        }
    }, [playSound, tearState]);
    
    const getTearClass = () => {
        switch(tearState) {
            case 1: return 'animate-[tear-1_0.2s_forwards]';
            case 2: return 'animate-[tear-2_0.2s_forwards]';
            case 3: return 'animate-[tear-3_0.2s_forwards]';
            case 4: return 'animate-[tear-4_0.2s_forwards]';
            case 5: return 'animate-[tear-final_0.5s_forwards]';
            default: return '';
        }
    };
    
    const handleWordInteract = (e: React.MouseEvent | React.TouchEvent, word: any) => {
        e.stopPropagation();
        if (phase !== 'interactPainting') return;
        if (word.isTarget) handleDadaClick();
        else handleWordClick(word.id);
    }

    const PaintingComponent = useMemo(() => (
        <div className="w-full h-full relative flex flex-col items-center">
            <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-amber-600 p-4 rounded-lg shadow-2xl border-4 border-yellow-700">
                <div className="w-full h-full bg-red-900 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] relative flex flex-col items-center justify-center p-4 overflow-hidden">
                    {paintingWords.map(word => (
                        <span 
                            key={word.id} 
                            className={`absolute p-1 text-white ${phase === 'interactPainting' ? 'cursor-pointer hover:text-yellow-300' : 'pointer-events-none'}`} 
                            style={word.style as React.CSSProperties} 
                            onClick={(e) => handleWordInteract(e, word)}
                            onTouchStart={(e) => handleWordInteract(e, word)}
                        >
                            {word.text}
                        </span>
                    ))}
                    
                    <div className="w-56 h-72 bg-amber-800 rounded-lg shadow-inner-lg flex items-center justify-center relative border-4 border-amber-900">
                        <div
                            onClick={phase === 'tearPage' ? handleTear : undefined}
                            onTouchStart={phase === 'tearPage' ? handleTear : undefined}
                            className={`w-48 h-64 bg-stone-200 shadow-lg transform-origin-top-left ${phase === 'tearPage' ? `cursor-pointer ${getTearClass()}`: ''}`}
                        >
                           {tearState < 5 && pageContent}
                        </div>

                        {showUnderpants && (
                           <div id="underpants" className="absolute top-1/2 left-1/2 -translate-x-1/2" style={{transformOrigin: 'bottom center'}}>
                               <PixelArt artData={UNDERPANTS_ART_DATA} palette={PIXEL_ART_PALETTE} pixelSize={6} />
                           </div>
                        )}
                    </div>
                </div>
            </div>
             {/* Caption below */}
            <div 
                    className="mt-2 px-3 py-1 bg-stone-800 border-2 border-stone-600 shadow-lg whitespace-nowrap"
                    style={{
                            fontFamily: `'Times New Roman', serif`,
                            transform: 'rotate(-1deg)',
                    }}
            >
                    <p className="text-sm text-stone-300" style={{ textShadow: '1px 1px 1px #000' }}>
                            "Картина №317: ДАДАисты срывают оковы приличия"
                    </p>
            </div>
        </div>
    ), [phase, paintingWords, showUnderpants, tearState, getTearClass, handleDadaClick, handleWordClick, handleTear, pageContent]);
    
    const handleWinContinue = () => {
        playSound(SoundType.BUTTON_CLICK);
        onWin();
    };

    return (
        <div className="w-full h-full flex flex-col relative bg-stone-400">
             <style>{`
                @keyframes tear-1 { 0% { transform: rotate(0deg) translate(0, 0); } 100% { transform: rotate(-15deg) translate(-10px, 5px); } }
                @keyframes tear-2 { 0% { transform: rotate(-15deg) translate(-10px, 5px); } 100% { transform: rotate(10deg) translate(20px, 15px); } }
                @keyframes tear-3 { 0% { transform: rotate(10deg) translate(20px, 15px); } 100% { transform: rotate(-25deg) translate(-30px, 25px); } }
                @keyframes tear-4 { 0% { transform: rotate(-25deg) translate(-30px, 25px); } 100% { transform: rotate(5deg) translate(10px, 30px); } }
                @keyframes tear-final { 
                    0% { transform: rotate(5deg) translate(10px, 30px); opacity: 1; } 
                    100% { transform: rotate(360deg) translate(400px, -500px) scale(0); opacity: 0; } 
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes dada-fly {
                    0% { transform: translate(0, 0) scale(0.5) rotate(0deg); opacity: 0; }
                    20% { opacity: 1; transform: scale(1.2); }
                    100% { transform: translate(var(--end-x), var(--end-y)) scale(0.5) rotate(var(--end-rot)); opacity: 0; }
                }
                .dada-anim-word { position: absolute; font-weight: bold; animation-name: dada-fly; animation-timing-function: ease-out; animation-fill-mode: forwards; }
                @keyframes fly-off { to { transform: translateY(-500px) translateX(300px) rotate(360deg) scale(0.2); opacity: 0; } }

                .flipping-container {
                    perspective: 1200px;
                }
                .flipping-page {
                    width: 24rem; /* w-96 */
                    height: 15rem; /* h-60 */
                    position: relative;
                    transform-style: preserve-3d;
                    transition: transform 1.5s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .flipping-page.is-flipped {
                    transform: rotateY(180deg);
                }
                .page-side {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    backface-visibility: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .page-back {
                    transform: rotateY(180deg);
                    background-color: #e0ddd5; /* Match ticket bg for smoother transition */
                }
            `}</style>

				<div className="flex-grow relative flex items-center justify-center p-8">
                    {phase === 'findNumber' && <FindTheNumber onFound={handleNumberFound} />}
                    {(phase === 'interactPainting' || phase === 'tearPage') && PaintingComponent}
                    {phase === 'flipping' && !isFlipFinished && (
                        <div className="flipping-container">
                            <div className={`flipping-page ${isPageFlipped ? 'is-flipped' : ''}`}>
                                <div className="page-side page-front">
                                    <div className="w-48 h-64 bg-stone-200 shadow-lg flex items-center justify-center">
                                            {pageContent}
                                    </div>
                                </div>
                                <div className="page-side page-back">
                                        <ArtTicket pisyunImage={pisyunImage} />
                                </div>
                            </div>
                        </div>
                    )}
                        {isFlipFinished && (
                            <ArtRevealWinScreen pisyunImage={pisyunImage} onContinue={handleWinContinue} />
                        )}
				</div>            
            {showDadaAnimation && <DadaWinAnimation />}
        </div>
    );
};
