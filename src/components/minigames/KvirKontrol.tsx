import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSettings, useSession } from '../../context/GameContext';
import { SoundType } from '../../utils/AudioEngine';
import { generateRoundShapes, ALL_COLORS } from './kvir/shapes';
import { useGameLoop } from '../../hooks/useGameLoop';
import { Character } from '../../../types';
import { MinigameHUD } from '../core/MinigameHUD';
import { InstructionModal } from '../core/InstructionModal';
import { instructionData } from '../../data/instructionData';

export const KvirKontrolWinScreen: React.FC<{ onContinue: () => void }> = ({ onContinue }) => {
    const { playSound } = useSettings();
    useEffect(() => {
        playSound(SoundType.WIN_KVIR);
    }, [playSound]);

    return (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none">
            <div className="absolute inset-0 rainbow-win-bg z-10"></div>
            <style>{`
            .rainbow-win-bg { background: linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet, red); background-size: 400% 400%; animation: rainbow-win-fade 3s forwards, rainbow-win-move 4s linear infinite; }
            @keyframes rainbow-win-fade { 0% { opacity: 0; } 20% { opacity: 0.8; } 80% { opacity: 0.8; } 100% { opacity: 0; } }
            @keyframes rainbow-win-move { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
            @keyframes text-pop-in { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        `}</style>
            <h2 className="text-6xl text-white z-20" style={{animation: 'text-pop-in 1s ease-out 0.5s forwards', opacity: 0, textShadow: '4px 4px 0 #000'}}>ВЫ КВИР!</h2>
            <button onClick={onContinue} className="pixel-button absolute bottom-8 p-4 text-2xl z-50 bg-green-700 hover:bg-green-800 pointer-events-auto" style={{animation: 'text-pop-in 1s ease-out 1.5s forwards', opacity: 0}}>ПРОХОДИМ</button>
        </div>
    );
};

const colorToRgba = (color: string, alpha: number): string => {
    const colorMap: {[key: string]: string} = {
        'cyan': '0, 255, 255', 'yellow': '255, 255, 0', 'magenta': '255, 0, 255',
        'lime': '0, 255, 0', 'orange': '255, 165, 0', 'red': '255, 0, 0',
        'fuchsia': '255, 0, 255', 'teal': '0, 128, 128', 'gold': '255, 215, 0',
        'skyblue': '135, 206, 235', 'salmon': '250, 128, 114',
    };
    if (!color) return `rgba(255, 255, 255, ${alpha})`; // Safeguard against undefined color
    const rgb = colorMap[color.toLowerCase()] || '255, 255, 255';
    return `rgba(${rgb}, ${alpha})`;
};


export const KvirKontrol: React.FC<{ onWin: () => void; onLose: () => void }> = ({ onWin, onLose }) => {
    const { playSound } = useSettings();
    const { character } = useSession();
    const [round, setRound] = useState(1);
    const [shapes, setShapes] = useState<any[]>([]);
    const [timeLeft, setTimeLeft] = useState(15);
    const [interaction, setInteraction] = useState<{
        id: number;
        offset: { x: number; y: number };
        startX: number;
        startY: number;
        isDragging: boolean;
    } | null>(null);
    const [status, setStatus] = useState<'playing' | 'won'>('playing');
    const containerRef = useRef<HTMLDivElement>(null);
    const hasFinished = useRef(false);
    const [showInstructions, setShowInstructions] = useState(true);
    
    // Состояние для механики Чёрного Игрока
    const [round3Mode, setRound3Mode] = useState<'rotate' | 'color'>('rotate');
    const [modeChangeEffect, setModeChangeEffect] = useState(0);
    const ruleChangeTimeout = useRef<number | null>(null);

    const isTargetMovementActive = (character === Character.BLACK_PLAYER && round >= 2) || round >= 3;

    useEffect(() => {
        setShapes(generateRoundShapes(round));
        switch(round) {
            case 1:
                setTimeLeft(15);
                break;
            case 2:
                setTimeLeft(25);
                break;
            case 3:
                setTimeLeft(35);
                break;
            default:
                setTimeLeft(30); // Fallback
        }
    }, [round]);
    
    useEffect(() => {
        if(hasFinished.current || showInstructions) return;
        const timer = setTimeout(() => {
            setTimeLeft(t => t - 1);
        }, 1000);

        if (timeLeft <= 0) {
            if (!hasFinished.current) {
               hasFinished.current = true;
               onLose();
            }
        }
        return () => clearTimeout(timer);
    }, [timeLeft, onLose, showInstructions]);
    
    // Game loop for Round 3 target movement
    useGameLoop(useCallback((deltaTime) => {
        if (hasFinished.current || status !== 'playing') return;

        const dtSec = deltaTime / 1000;

        setShapes(prevShapes => prevShapes.map(s => {
            // Замораживаем цель, если игрок взаимодействует с соответствующей фигурой.
            if (s.isPlaced || (interaction && interaction.id === s.id)) {
                return s;
            }

            let newX = s.target.x + s.target.vx * dtSec;
            let newY = s.target.y + s.target.vy * dtSec;
            let newRot = s.target.rotation + s.target.vRot * dtSec;
            let newVX = s.target.vx;
            let newVY = s.target.vy;

            const targetArea = { top: 40, bottom: 95, left: 5, right: 95 };
            if (newX < targetArea.left || newX > targetArea.right) {
                newVX *= -1;
                newX = Math.max(targetArea.left, Math.min(targetArea.right, newX));
            }
            if (newY < targetArea.top || newY > targetArea.bottom) {
                newVY *= -1;
                newY = Math.max(targetArea.top, Math.min(targetArea.bottom, newY));
            }

            return {
                ...s,
                target: {
                    ...s.target,
                    x: newX,
                    y: newY,
                    vx: newVX,
                    vy: newVY,
                    rotation: newRot,
                }
            };
        }));
    }, [status, interaction]), isTargetMovementActive && status === 'playing' && !showInstructions);
    
    // --- Логика Чёрного Игрока ---
    const switchMode = useCallback(() => {
        setRound3Mode(prevMode => {
            const newMode = prevMode === 'rotate' ? 'color' : 'rotate';
            // Режим вращения сложнее, даем больше времени
            const duration = (newMode === 'rotate' ? 7000 : 5000) + Math.random() * 2000;
            setModeChangeEffect(k => k + 1);
            playSound(SoundType.TRANSFORM_SUCCESS);

            ruleChangeTimeout.current = window.setTimeout(switchMode, duration);
            return newMode;
        });
    }, [playSound]);

    // Запуск смены режимов для Чёрного Игрока
    useEffect(() => {
        if (ruleChangeTimeout.current) {
            clearTimeout(ruleChangeTimeout.current);
            ruleChangeTimeout.current = null;
        }

        if (round === 3 && status === 'playing' && character === Character.BLACK_PLAYER && !showInstructions) {
            const initialDuration = 7000 + Math.random() * 2000;
            setRound3Mode('rotate');
            ruleChangeTimeout.current = window.setTimeout(switchMode, initialDuration);
        }

        return () => {
            if (ruleChangeTimeout.current) {
                clearTimeout(ruleChangeTimeout.current);
            }
        };
    }, [round, status, character, switchMode, showInstructions]);

    const getPointerPosition = (e: React.MouseEvent | React.TouchEvent) => {
        if (!containerRef.current) return { x: 0, y: 0, clientX: 0, clientY: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        const pointer = 'touches' in e ? e.touches[0] : e;
        if (!pointer) return { x: 0, y: 0, clientX: 0, clientY: 0 };
        const x = ((pointer.clientX - rect.left) / rect.width) * 100;
        const y = ((pointer.clientY - rect.top) / rect.height) * 100;
        return { x, y, clientX: pointer.clientX, clientY: pointer.clientY };
    };

    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent, id: number) => {
        e.preventDefault();
        const shape = shapes.find(s => s.id === id);
        if (!shape || shape.isPlaced || hasFinished.current) return;

        const pos = getPointerPosition(e);
        setInteraction({
            id,
            offset: { x: pos.x - shape.pos.x, y: pos.y - shape.pos.y },
            startX: pos.clientX,
            startY: pos.clientY,
            isDragging: false,
        });
    };
    
    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!interaction || !containerRef.current) return;
        e.preventDefault();

        const pos = getPointerPosition(e);
        const dx = pos.clientX - interaction.startX;
        const dy = pos.clientY - interaction.startY;
        if (!interaction.isDragging && (dx * dx + dy * dy) > 25) {
            setInteraction(i => i ? { ...i, isDragging: true } : null);
        }

        setShapes(prev => prev.map(s => s.id === interaction.id ? { ...s, pos: { x: pos.x - interaction.offset.x, y: pos.y - interaction.offset.y } } : s));
    };

    const handlePointerUp = () => {
        if (!interaction) return;

        const shape = shapes.find(s => s.id === interaction.id);
        if (!shape) {
            setInteraction(null);
            return;
        }

        if (interaction.isDragging) {
            const dist = Math.sqrt(Math.pow(shape.pos.x - shape.target.x, 2) + Math.pow(shape.pos.y - shape.target.y, 2));
            
            const normalizeAngle = (angle: number) => {
                let newAngle = angle % 360;
                return newAngle < 0 ? newAngle + 360 : newAngle;
            };
            const currentRotation = normalizeAngle(shape.rotation);
            const targetRotation = normalizeAngle(shape.target.rotation);
            // In a moving target round, rotation tolerance is higher
            const rotationTolerance = isTargetMovementActive ? 15 : 5;
            const rotationDiff = Math.abs(currentRotation - targetRotation);
            let rotationMatch = rotationDiff < rotationTolerance || rotationDiff > (360 - rotationTolerance);

            // Color match is always required now, unless overridden
            let colorMatch = shape.rendererProps.color === shape.target.color;

            // Black Player Round 3 logic
            if (round === 3 && character === Character.BLACK_PLAYER) {
                if (round3Mode === 'rotate') {
                    colorMatch = true; // Ignore color check in 'rotate' mode
                } else { // 'color' mode
                    rotationMatch = true; // Ignore rotation check in 'color' mode
                }
            }


            if (dist < 12 * (shape.scale || 1) && rotationMatch && colorMatch) {
                playSound(SoundType.ITEM_PLACE_SUCCESS);
                const newShapes = shapes.map(s => s.id === shape.id ? { ...s, isPlaced: true, pos: {x: s.target.x, y: s.target.y}, rotation: s.target.rotation } : s);
                setShapes(newShapes);
                 if (newShapes.every(s => s.isPlaced)) {
                    if (round < 3) {
                        setTimeout(() => setRound(r => r + 1), 500);
                    } else if (!hasFinished.current) {
                        hasFinished.current = true;
                        setStatus('won');
                    }
                }
            }
        } else {
            playSound(SoundType.GENERIC_CLICK);
            // Click logic depends on character and round
            if (round === 3 && character === Character.BLACK_PLAYER) {
                if (round3Mode === 'rotate') {
                     setShapes(prev => prev.map(s => s.id === interaction.id ? { ...s, rotation: (s.rotation + 45) % 360 } : s));
                } else { // 'color' mode
                     setShapes(prev => prev.map(s => {
                        if (s.id === interaction.id) {
                            const currentColorIndex = ALL_COLORS.indexOf(s.rendererProps.color);
                            const nextColorIndex = (currentColorIndex + 1) % ALL_COLORS.length;
                            return { 
                                ...s, 
                                rendererProps: { ...s.rendererProps, color: ALL_COLORS[nextColorIndex] }
                            };
                        }
                        return s;
                    }));
                }
            } else {
                // Default behavior is always rotation now
                setShapes(prev => prev.map(s => s.id === interaction.id ? { ...s, rotation: (s.rotation + 45) % 360 } : s));
            }
        }
        
        setInteraction(null);
    };

    const handleWinContinue = () => {
        playSound(SoundType.BUTTON_CLICK);
        onWin();
    };
    
    const instruction = instructionData['1-2'];
    const InstructionContent = instruction.content;

    const backgroundStyle = useMemo(() => {
        if (shapes.length === 0) {
            return { background: 'linear-gradient(to bottom, #1a202c, #2d3748)' };
        }
        const gradients = shapes.map(shape => {
            const glowColor = colorToRgba(shape.target.color, 0.12);
            const radius = 18 * (shape.scale || 1);
            return `radial-gradient(circle at ${shape.target.x}% ${shape.target.y}%, ${glowColor} 0%, transparent ${radius}%)`;
        }).join(', ');

        return {
            backgroundImage: gradients,
            backgroundColor: '#1a202c', // Fallback
            transition: 'background-image 0.1s linear',
        };
    }, [shapes]);

    return (
        <div 
            ref={containerRef} 
            onMouseMove={handlePointerMove} 
            onMouseUp={handlePointerUp} 
            onMouseLeave={handlePointerUp} 
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            className="w-full h-full flex flex-col items-center p-4 relative overflow-hidden" 
            style={backgroundStyle}
        >
            {status === 'won' && <KvirKontrolWinScreen onContinue={handleWinContinue} />}
            
            {showInstructions && (
                <InstructionModal title={instruction.title} onStart={() => setShowInstructions(false)}>
                    <InstructionContent character={character} />
                </InstructionModal>
            )}

            {status === 'playing' && !showInstructions && <>
                <style>{`
                    @keyframes instruction-flash {
                        from { transform: scale(1.1); color: white; }
                        to { transform: scale(1.0); color: inherit; }
                    }
                    .instruction-flash { animation: instruction-flash 0.4s ease-out; }
                `}</style>
                <MinigameHUD>
                    <div className="w-full text-center">
                        <h3 className="text-3xl mb-2">А ВЫ КВИР? (Раунд {round}/3)</h3>
                         <p key={modeChangeEffect} className={`text-sm text-yellow-300 ${round === 3 && character === Character.BLACK_PLAYER ? 'instruction-flash' : ''}`}>
                            Время: {timeLeft} сек.
                            {character === Character.BLACK_PLAYER && round === 3 && ` | РЕЖИМ: ${round3Mode === 'rotate' ? 'ВРАЩЕНИЕ' : 'ЦВЕТ'}`}
                        </p>
                    </div>
                </MinigameHUD>
                
                <div className="w-full h-full relative z-10">
                     {shapes.map(s => (
                        <div key={`sil-${s.id}`} className="absolute" style={{ 
                            left: `${s.target.x}%`, 
                            top: `${s.target.y}%`, 
                            transform: `translate(-50%, -50%) rotate(${s.target.rotation}deg) scale(${s.scale})`,
                            transition: isTargetMovementActive ? 'all 0.05s linear' : 'none'
                        }}>
                           <svg width="60" height="60" viewBox="-5 -5 60 60">
                                <path d={s.path} fill="none" stroke={s.target.color} strokeWidth="2" strokeDasharray="5,5" />
                            </svg>
                        </div>
                    ))}
                    {shapes.map(s => {
                        const Renderer = s.renderer;
                        return (
                            <div key={s.id}
                                className="absolute"
                                style={{
                                    left: `${s.isPlaced ? s.target.x : s.pos.x}%`,
                                    top: `${s.isPlaced ? s.target.y : s.pos.y}%`,
                                    transform: `translate(-50%, -50%) rotate(${s.rotation}deg) scale(${s.scale})`,
                                    cursor: s.isPlaced ? 'default' : 'grab',
                                    transition: s.isPlaced ? 'all 0.3s ease' : 'none',
                                    zIndex: interaction?.id === s.id ? 10 : 1,
                                }}
                                onMouseDown={e => handlePointerDown(e, s.id)}
                                onTouchStart={e => handlePointerDown(e, s.id)}
                            >
                               {Renderer ? <Renderer path={s.path} {...s.rendererProps} /> : null}
                            </div>
                        );
                    })}
                </div>
            </>}
        </div>
    );
};