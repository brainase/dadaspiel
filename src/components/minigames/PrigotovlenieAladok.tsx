import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useGameLoop } from '../../hooks/useGameLoop';
import { ALADKI_RECIPES } from '../../data/recipeData';
import { useSession, useSettings } from '../../context/GameContext';
import { SoundType } from '../../utils/AudioEngine';
import { Character } from '../../../types';
import { MinigameHUD } from '../core/MinigameHUD';
import { InstructionModal } from '../core/InstructionModal';
import { instructionData } from '../../data/instructionData';

export const AladkiWinScreen: React.FC<{ onContinue: () => void }> = ({ onContinue }) => {
    const { playSound } = useSettings();
    useEffect(() => {
        playSound(SoundType.WIN_ALADKI);
    }, [playSound]);

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
        <div className="absolute inset-0 bg-gray-800 bg-opacity-90 z-30 flex flex-col items-center justify-center animate-[fadeIn_1s]">
            <h2 className="text-3xl text-yellow-300 mb-8">ДЕЛО СДЕЛАНО!</h2>
            <div style={dishStyle}>
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
    );
};

// Main game component
export const PrigotovlenieAladok: React.FC<{ onWin: () => void; onLose: () => void }> = ({ onWin, onLose }) => {
    const { playSound } = useSettings();
    const { character } = useSession();
    const gameAreaRef = useRef<HTMLDivElement>(null);
    const hasFinished = useRef(false);
    const itemCounter = useRef(0);

    const settings = useMemo(() => {
        const baseSettings = { mistakesLimit: 3, fallSpeed: 18 };
        switch(character) {
            case Character.KANILA: // Easy
                return { mistakesLimit: 5, fallSpeed: 15 };
            case Character.BLACK_PLAYER: // Hard
                return { mistakesLimit: 2, fallSpeed: 22 };
            default: // Medium (Sexism)
                return baseSettings;
        }
    }, [character]);

    const [round, setRound] = useState(0);
    const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
    const [panX, setPanX] = useState(50);
    const [items, setItems] = useState<any[]>([]);
    const [collected, setCollected] = useState<{ [key: string]: number }>({});
    const [mistakes, setMistakes] = useState(0);
    const [isAdvancing, setIsAdvancing] = useState(false);
    const [showInstructions, setShowInstructions] = useState(true);
    const [feedback, setFeedback] = useState<any[]>([]);

    const currentRecipe = ALADKI_RECIPES[round];

    // Reset state for new round
    useEffect(() => {
        setCollected({});
        setMistakes(0);
        setItems([]);
        itemCounter.current = 0;
        setIsAdvancing(false);
    }, [round]);

    useGameLoop(useCallback((deltaTime) => {
        if (hasFinished.current || status !== 'playing' || isAdvancing) return;

        // Spawn new ingredients
        if (Math.random() < 0.1) {
            const isTarget = Math.random() > 0.35;
            const ingredientPool = isTarget ? currentRecipe.ingredients : currentRecipe.decoys;
            const text = ingredientPool[Math.floor(Math.random() * ingredientPool.length)];
            setItems(prev => [...prev, {
                id: itemCounter.current++,
                text,
                isTarget: currentRecipe.ingredients.includes(text),
                x: 10 + Math.random() * 80,
                y: -5,
                rot: (Math.random() - 0.5) * 90
            }]);
        }

        // Move items and check for collision
        setItems(prevItems => {
            const newItems = [];
            for (const item of prevItems) {
                const newY = item.y + settings.fallSpeed * (deltaTime / 1000);
                if (newY > 105) continue; // Remove if off-screen

                let hit = false;
                if (newY > 85 && newY < 95 && item.x > panX - 10 && item.x < panX + 10) {
                    hit = true;
                    const newCount = (collected[item.text] || 0) + 1;
                    const recipeAmount = currentRecipe.recipe[item.text] || 0;

                    if (item.isTarget && newCount <= recipeAmount) {
                        playSound(SoundType.ITEM_CATCH_GOOD);
                        setCollected(c => ({ ...c, [item.text]: newCount }));
                        setFeedback(f => [...f, { id: Date.now(), text: `+1 ${item.text}`, x: item.x, y: item.y, color: 'text-green-400' }]);
                    } else {
                        playSound(SoundType.ITEM_CATCH_BAD);
                        setMistakes(m => m + 1);
                        setFeedback(f => [...f, { id: Date.now(), text: 'ОШИБКА!', x: item.x, y: item.y, color: 'text-red-500' }]);
                    }
                }
                if (!hit) newItems.push({ ...item, y: newY });
            }
            return newItems;
        });

        // Update feedback lifetime
        setFeedback(f => f.slice(-5)); // Keep only last 5 feedbacks
    }, [panX, status, currentRecipe, collected, isAdvancing, playSound, settings.fallSpeed]), status === 'playing' && !showInstructions);

    // Check win/loss conditions
    useEffect(() => {
        if (status !== 'playing' || isAdvancing) return;

        if (mistakes >= settings.mistakesLimit) {
            if (hasFinished.current) return;
            hasFinished.current = true;
            setStatus('lost');
            setTimeout(onLose, 2000);
        } else {
            const recipeComplete = Object.entries(currentRecipe.recipe).every(([ing, amount]) => (collected[ing] || 0) >= (amount as number));
            if (recipeComplete) {
                setIsAdvancing(true);
                setTimeout(() => {
                    if (round < ALADKI_RECIPES.length - 1) {
                        setRound(r => r + 1);
                    } else {
                        if (hasFinished.current) return;
                        hasFinished.current = true;
                        setStatus('won');
                    }
                }, 1000);
            }
        }
    }, [collected, mistakes, round, onLose, onWin, status, currentRecipe, isAdvancing, settings]);

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (gameAreaRef.current) {
            e.preventDefault();
            const pointer = 'touches' in e ? e.touches[0] : e;
            const rect = gameAreaRef.current.getBoundingClientRect();
            const x = ((pointer.clientX - rect.left) / rect.width) * 100;
            setPanX(x);
        }
    };
    
    const instruction = instructionData['5-1'];
    const InstructionContent = instruction.content;

    return (
        <div 
            ref={gameAreaRef} 
            onMouseMove={handlePointerMove} 
            onTouchMove={handlePointerMove} 
            onTouchStart={handlePointerMove}
            className="w-full h-full bg-gradient-to-b from-amber-200 to-orange-400 flex flex-col items-center p-4 relative overflow-hidden cursor-none"
        >
            {status === 'won' && <AladkiWinScreen onContinue={onWin} />}
            {status === 'lost' && <div className="absolute inset-0 bg-red-900/80 z-20 flex items-center justify-center text-5xl">АЛАДКИ ПОДГОРЕЛИ!</div>}

            {showInstructions ? (
                <InstructionModal title={instruction.title} onStart={() => setShowInstructions(false)}>
                    <InstructionContent />
                </InstructionModal>
            ) : status === 'playing' && (
                <>
                    <MinigameHUD>
                        <div className="w-1/2 text-left text-black">
                            <h3 className="text-xl font-bold mb-1">{currentRecipe.name} (Раунд {round+1}/{ALADKI_RECIPES.length})</h3>
                            <ul className="text-base">
                                {Object.entries(currentRecipe.recipe).map(([ing, amount]) => (
                                    <li key={ing} className={(collected[ing] || 0) >= (amount as number) ? 'line-through text-gray-700' : ''}>
                                        {ing}: {(collected[ing] || 0)}/{amount as number}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="w-1/2 text-right text-black">
                            Ошибки: {mistakes}/{settings.mistakesLimit}
                        </div>
                    </MinigameHUD>
                    <div className="absolute inset-0">
                        {items.map(item => (
                            <div key={item.id} className="absolute p-2 bg-white pixel-border text-black" style={{ left: `${item.x}%`, top: `${item.y}%`, transform: `translate(-50%, -50%) rotate(${item.rot}deg)` }}>
                                {item.text}
                            </div>
                        ))}
                        {feedback.map(f => (
                            <div key={f.id} className={`absolute font-bold text-2xl ${f.color}`} style={{ left: `${f.x}%`, top: `${f.y}%`, animation: 'float-up-and-fade 1s forwards' }}>{f.text}</div>
                        ))}
                        {/* Frying Pan */}
                        <div className="absolute bottom-[5%] w-32 h-8 bg-gray-800 rounded-md" style={{ left: `${panX}%`, transform: 'translateX(-50%)' }}>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-4 h-12 bg-gray-600"></div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
