
import React, { useMemo } from 'react';
import { useSettings } from '../../context/GameContext';
import { SeasonalEvent } from '../../../types';

export const SeasonalOverlay: React.FC = () => {
    const { seasonalEvent, seasonalAnimationsEnabled, seasonalMessage } = useSettings();

    // 1. New Year (Oliver Apocalypse)
    const newYearParticles = useMemo(() => {
        if (seasonalEvent !== SeasonalEvent.NEW_YEAR) return [];
        return Array.from({ length: 30 }).map((_, i) => {
            const type = Math.random();
            let char = '🟢'; // Peas
            if (type > 0.6) char = '🟧'; // Carrot cubes
            if (type > 0.8) char = '🥚'; // Egg
            
            return {
                id: i,
                char,
                style: {
                    left: `${Math.random() * 100}%`,
                    animationDuration: `${5 + Math.random() * 10}s`,
                    animationDelay: `${Math.random() * 5}s`,
                    fontSize: `${1 + Math.random()}rem`,
                }
            };
        });
    }, [seasonalEvent]);

    // 2. Halloween (Existential Dread words)
    const halloweenWords = useMemo(() => {
        if (seasonalEvent !== SeasonalEvent.HALLOWEEN) return [];
        const words = ["ИПОТЕКА", "ДЕПРЕССИЯ", "ОТЧЁТ", "ВЗРОСЛЕНИЕ", "ЖКХ", "СМЫСЛ?", "ОЧЕРЕДЬ"];
        return Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            text: words[Math.floor(Math.random() * words.length)],
            style: {
                left: `${Math.random() * 90}%`,
                top: `${Math.random() * 90}%`,
                animationDuration: `${10 + Math.random() * 10}s`,
                animationDelay: `${Math.random() * 5}s`,
                fontSize: `${1 + Math.random() * 2}rem`,
                opacity: 0.1 + Math.random() * 0.2,
                color: '#ff4500' // Orange-red
            }
        }));
    }, [seasonalEvent]);

    // 3. Dada Birthday (Peace & Love Style) - Mockery of militarism with cuteness
    const dadaParticles = useMemo(() => {
        if (seasonalEvent !== SeasonalEvent.DADA_BIRTHDAY) return [];
        const chars = ['💖', '💕', '🪂', '☁️'];
        return Array.from({ length: 25 }).map((_, i) => ({
            id: i,
            char: chars[Math.floor(Math.random() * chars.length)],
            style: {
                left: `${Math.random() * 100}%`,
                animationDuration: `${6 + Math.random() * 6}s`,
                animationDelay: `${Math.random() * 5}s`,
                fontSize: `${1.5 + Math.random() * 2}rem`,
                opacity: 0.7,
            }
        }));
    }, [seasonalEvent]);

    // 4. Gondolier Day (Masks & Ripples)
    const gondolaParticles = useMemo(() => {
        if (seasonalEvent !== SeasonalEvent.GONDOLIER_DAY) return [];
        const chars = ['🎭', '🚣', '🌊'];
        return Array.from({ length: 20 }).map((_, i) => ({
            id: i,
            char: chars[Math.floor(Math.random() * chars.length)],
            style: {
                left: `${Math.random() * 100}%`,
                animationDuration: `${8 + Math.random() * 5}s`,
                animationDelay: `${Math.random() * 5}s`,
                fontSize: `${1.5 + Math.random() * 2}rem`,
                opacity: 0.6,
            }
        }));
    }, [seasonalEvent]);

    // 5. September 3rd (Leaves & Fire)
    const septemberParticles = useMemo(() => {
        if (seasonalEvent !== SeasonalEvent.SEPTEMBER_3) return [];
        return Array.from({ length: 35 }).map((_, i) => ({
            id: i,
            char: ['🍁', '🍂', '🔥'][Math.floor(Math.random() * 3)],
            style: {
                left: `${Math.random() * 100}%`,
                animationDuration: `${5 + Math.random() * 8}s`,
                animationDelay: `${Math.random() * 5}s`,
                fontSize: `${1 + Math.random() * 1.5}rem`,
                opacity: 0.8,
            }
        }));
    }, [seasonalEvent]);

    // 6. Glitch Day (Digital Noise)
    const glitchParticles = useMemo(() => {
        if (seasonalEvent !== SeasonalEvent.GLITCH_DAY) return [];
        return Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            char: ['0', '1', 'ERROR', 'NULL', 'NaN'][Math.floor(Math.random() * 5)],
            style: {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `glitch-float 0.2s steps(2) infinite`,
                animationDelay: `${Math.random() * 2}s`,
                fontSize: `${1 + Math.random()}rem`,
                color: '#00ff00',
                opacity: 0.6,
                fontFamily: 'monospace'
            }
        }));
    }, [seasonalEvent]);

    // 7. Potato Salvation (Potatoes & Pancakes)
    const potatoParticles = useMemo(() => {
        if (seasonalEvent !== SeasonalEvent.POTATO_SALVATION) return [];
        return Array.from({ length: 30 }).map((_, i) => ({
            id: i,
            char: ['🥔', '🥞', '🥓'][Math.floor(Math.random() * 3)],
            style: {
                left: `${Math.random() * 100}%`,
                animationDuration: `${4 + Math.random() * 6}s`,
                animationDelay: `${Math.random() * 5}s`,
                fontSize: `${1.5 + Math.random() * 2}rem`,
            }
        }));
    }, [seasonalEvent]);


    if (seasonalEvent === SeasonalEvent.NONE) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-[100] overflow-hidden">
            <style>{`
                @keyframes fall-seasonal {
                    from { transform: translateY(-10vh) rotate(0deg); }
                    to { transform: translateY(110vh) rotate(360deg); }
                }
                @keyframes float-gentle {
                    0% { transform: translateY(-10vh) translateX(0); }
                    50% { transform: translateY(50vh) translateX(20px); }
                    100% { transform: translateY(110vh) translateX(0); }
                }
                @keyframes glitch-float {
                    0% { transform: translate(0,0); opacity: 1; }
                    25% { transform: translate(5px, -5px); opacity: 0.5; }
                    50% { transform: translate(-5px, 5px); opacity: 1; }
                    75% { transform: translate(5px, 5px); opacity: 0.5; }
                    100% { transform: translate(0,0); opacity: 1; }
                }
                .seasonal-particle {
                    position: absolute;
                    top: -50px;
                    animation-name: fall-seasonal;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
                .gentle-particle {
                    position: absolute;
                    top: -50px;
                    animation-name: float-gentle;
                    animation-timing-function: ease-in-out;
                    animation-iteration-count: infinite;
                }
                @keyframes float-scary {
                    0%, 100% { transform: translate(0,0) rotate(-5deg); }
                    50% { transform: translate(20px, 20px) rotate(5deg); }
                }
                .scary-word {
                    position: absolute;
                    animation-name: float-scary;
                    animation-timing-function: ease-in-out;
                    animation-iteration-count: infinite;
                    font-family: 'Courier New', Courier, monospace;
                    font-weight: bold;
                }
                @keyframes message-pop {
                    0% { transform: translate(-50%, -100px); opacity: 0; }
                    10% { transform: translate(-50%, 20px); opacity: 1; }
                    90% { transform: translate(-50%, 20px); opacity: 1; }
                    100% { transform: translate(-50%, -100px); opacity: 0; }
                }
                .seasonal-message {
                    position: absolute;
                    top: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0,0,0,0.8);
                    color: #fff;
                    padding: 10px 20px;
                    border-radius: 0 0 10px 10px;
                    font-size: 1.5rem;
                    text-align: center;
                    border: 2px solid white;
                    border-top: none;
                    animation: message-pop 4s forwards;
                    z-index: 200;
                    max-width: 80%;
                }
            `}</style>

            {seasonalAnimationsEnabled && seasonalMessage && (
                <div className="seasonal-message">
                    {seasonalMessage}
                </div>
            )}

            {seasonalAnimationsEnabled && (
                <>
                    {/* New Year Overlay */}
                    {seasonalEvent === SeasonalEvent.NEW_YEAR && (
                        <>
                            <div className="absolute inset-0 bg-white opacity-5 mix-blend-overlay"></div>
                            {newYearParticles.map(p => (
                                <div key={p.id} className="seasonal-particle" style={p.style}>{p.char}</div>
                            ))}
                        </>
                    )}

                    {/* Halloween Overlay */}
                    {seasonalEvent === SeasonalEvent.HALLOWEEN && (
                        <>
                            <div className="absolute inset-0 bg-orange-900 opacity-20 mix-blend-multiply"></div>
                            {halloweenWords.map(w => (
                                <div key={w.id} className="scary-word" style={w.style}>{w.text}</div>
                            ))}
                        </>
                    )}

                    {/* April Fools Overlay */}
                    {seasonalEvent === SeasonalEvent.APRIL_FOOLS && (
                        <div className="absolute bottom-2 right-2 text-gray-500 font-sans text-xs opacity-50">
                            ОТЧЁТНАЯ ФОРМА №1-АПР
                        </div>
                    )}

                    {/* Dada Birthday (Peace & Love Style) */}
                    {seasonalEvent === SeasonalEvent.DADA_BIRTHDAY && (
                        <>
                             {/* No glitch, just soft pink overlay */}
                             <div className="absolute inset-0 bg-pink-500 opacity-5 mix-blend-screen pointer-events-none"></div>
                             {dadaParticles.map(p => (
                                <div key={p.id} className="gentle-particle" style={p.style}>{p.char}</div>
                            ))}
                        </>
                    )}

                    {/* Gondolier Day */}
                    {seasonalEvent === SeasonalEvent.GONDOLIER_DAY && (
                        <>
                             <div className="absolute inset-0 pointer-events-none" style={{
                                 background: 'repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(0, 0, 255, 0.05) 50px, rgba(0, 0, 255, 0.05) 100px)'
                             }}></div>
                             {gondolaParticles.map(p => (
                                <div key={p.id} className="gentle-particle" style={p.style}>{p.char}</div>
                            ))}
                        </>
                    )}

                    {/* September 3rd (Rowan Bonfires) */}
                    {seasonalEvent === SeasonalEvent.SEPTEMBER_3 && (
                        <>
                             <div className="absolute inset-0 bg-orange-900 opacity-10 mix-blend-screen pointer-events-none"></div>
                             {septemberParticles.map(p => (
                                <div key={p.id} className="seasonal-particle" style={p.style}>{p.char}</div>
                            ))}
                        </>
                    )}

                    {/* Glitch Day (Digital Noise) */}
                    {seasonalEvent === SeasonalEvent.GLITCH_DAY && (
                        <>
                             <div className="absolute inset-0 bg-black opacity-10 mix-blend-exclusion pointer-events-none"></div>
                             {glitchParticles.map(p => (
                                <div key={p.id} className="absolute" style={p.style}>{p.char}</div>
                            ))}
                        </>
                    )}

                    {/* Potato Salvation (Falling Potatoes) */}
                    {seasonalEvent === SeasonalEvent.POTATO_SALVATION && (
                        <>
                             <div className="absolute inset-0 bg-yellow-900 opacity-10 mix-blend-multiply pointer-events-none"></div>
                             {potatoParticles.map(p => (
                                <div key={p.id} className="seasonal-particle" style={p.style}>{p.char}</div>
                            ))}
                        </>
                    )}
                </>
            )}
        </div>
    );
};
