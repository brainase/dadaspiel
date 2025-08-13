import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useGameLoop } from '../../hooks/useGameLoop';
import { ALADKI_RECIPES } from '../../data/recipeData';
import { useSession, useSettings } from '../../context/GameContext';
import { SoundType } from '../../utils/AudioEngine';
import { Character } from '../../../types';

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
                 <div style={{ ...aladkaStyle, top: '20px', left: '30px', zIndex: 1 }}></div>
                 <div style={{ ...aladkaStyle, top: '35px', left: '70px', zIndex: 2, transform: 'scale(0.9)' }}></div>
                 <div style={{ ...aladkaStyle, top: '15px', left: '55px', zIndex: 0, transform: 'scale(1.1)' }}></div>
                 <div style={sauceStyle}></div>
            </div>

            <p className="mt-8 text-2xl">"Аладки с соусом из Ничто"</p>
             <button onClick={onContinue} className="pixel-button absolute bottom-8 p-4 text-2xl z-50 bg-green-700 hover:bg-green-800">
                ПРОХОДИМ
            </button>
        </div>
    );
};

export const PrigotovlenieAladok: React.FC<{ onWin: () => void; onLose: () => void; }> = ({ onWin, onLose }) => {
    const { playSound } = useSettings();
    const { handleMistake, character } = useSession();
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
    const [status, setStatus] = useState<'playing'|'won'|'lost'>('playing');
    const [panX, setPanX] = useState(50);
    const [items, setItems] = useState<any[]>([]);
    const [collected, setCollected] = useState<{[key: string]: number}>({});
    const [mistakes, setMistakes] = useState(0);
    const [isAdvancing, setIsAdvancing] = useState(false);

    const currentRecipeData = ALADKI_RECIPES[round];
    
    // Setup round
    useEffect(() => {
        if(status !== 'playing' || round >= ALADKI_RECIPES.length) return;
        setCollected({});
        setMistakes(0);
        setItems([]);
        itemCounter.current = 0;
        setIsAdvancing(false);
    }, [round, status]);
    
    useGameLoop(useCallback((deltaTime) => {
        if (hasFinished.current || status !== 'playing') return;
        
        // Spawn new items
        if (Math.random() < 0.04) {
            const pool = [...currentRecipeData.ingredients, ...currentRecipeData.decoys];
            const text = pool[Math.floor(Math.random() * pool.length)];
            const isGood = currentRecipeData.ingredients.includes(text);
            
            setItems(prev => [...prev, {
                id: itemCounter.current++,
                text,
                isGood,
                x: 10 + Math.random() * 80,
                y: -5,
                vx: (Math.random() - 0.5) * 6,
                rot: Math.random() * 90 - 45
            }]);
        }
        
        // Move items and check for collisions
        setItems(prevItems => {
            const newItems = [];
            for (const item of prevItems) {
                const newY = item.y + settings.fallSpeed * (deltaTime / 1000);
                let newVx = item.vx;
                let newX = item.x + newVx * (deltaTime / 1000);

                if (newX < 5 || newX > 95) {
                    newVx *= -1;
                    newX = Math.max(5, Math.min(95, newX));
                }

                if (newY > 105) continue; // Despawn

                let hit = false;
                if (newY > 85 && newY < 95 && item.x > panX - 12 && item.x < panX + 12) {
                   hit = true;
                   
                   const currentCount = collected[item.text] || 0;
                   const neededCount = currentRecipeData.recipe[item.text] || 0;

                   if (item.isGood && currentCount < neededCount) {
                       playSound(SoundType.ITEM_CATCH_GOOD);
                       setCollected(c => ({...c, [item.text]: (c[item.text] || 0) + 1}));
                   } else {
                        // If mistake was not forgiven by an ability, apply penalty
                        if (!handleMistake()) {
                           playSound(SoundType.ITEM_CATCH_BAD);
                           setMistakes(m => m + 1);
                        }
                   }
                }
                
                if (!hit) {
                    newItems.push({ ...item, y: newY, x: newX, vx: newVx });
                }
            }
            return newItems;
        });

    }, [panX, collected, status, currentRecipeData, playSound, handleMistake, settings.fallSpeed]), status === 'playing');

    // Win/Lose logic
    useEffect(() => {
        if(status !== 'playing' || isAdvancing) return;

        if (mistakes >= settings.mistakesLimit) {
            if (hasFinished.current) return;
            hasFinished.current = true;
            setStatus('lost');
            setTimeout(onLose, 2000);
            return;
        }

        const recipeComplete = Object.entries(currentRecipeData.recipe).every(
            ([name, count]) => (collected[name] || 0) >= count
        );

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

    }, [collected, mistakes, round, onWin, onLose, status, currentRecipeData, isAdvancing, settings]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (gameAreaRef.current) {
            const rect = gameAreaRef.current.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            setPanX(x);
        }
    };

    const renderRecipe = () => (
        <div className="flex flex-col text-left">
            {Object.entries(currentRecipeData.recipe).map(([name, count]) => {
                const currentCount = collected[name] || 0;
                const isDone = currentCount >= count;
                return (
                    <div key={name} className={`transition-colors ${isDone ? 'text-green-400 line-through' : 'text-white'}`}>
                       {name}: {currentCount}/{count}
                    </div>
                );
            })}
        </div>
    );

    const handleWinContinue = () => {
        playSound(SoundType.BUTTON_CLICK);
        onWin();
    };

    return (
        <div ref={gameAreaRef} onMouseMove={handleMouseMove} className="w-full h-full bg-gradient-to-b from-amber-800 to-stone-900 flex flex-col items-center p-4 relative overflow-hidden cursor-none">
            {status === 'won' && <AladkiWinScreen onContinue={handleWinContinue} />}
            {status === 'lost' && (
                <div className="absolute inset-0 bg-red-900/80 z-20 flex items-center justify-center text-5xl">
                    РЕЦЕПТ ИСПОРЧЕН!
                </div>
            )}
            {/* HUD */}
            <div className="w-full flex justify-between items-start text-lg z-10 mt-16">
                <div>
                    <h3 className="text-xl text-yellow-300 mb-2">Раунд {round + 1}: {currentRecipeData.name}</h3>
                    {renderRecipe()}
                </div>
                <div className="text-red-500">
                    Ошибки: {'X '.repeat(mistakes)} / {'X '.repeat(settings.mistakesLimit)}
                </div>
            </div>

            {/* Game Area */}
            <div className="absolute inset-0 top-32">
                 {items.map(item => (
                    <div key={item.id} className="absolute text-lg text-white" style={{ left: `${item.x}%`, top: `${item.y}%`, transform: `translate(-50%, -50%) rotate(${item.rot}deg)`, textShadow: '2px 2px #000' }}>
                        {item.text}
                    </div>
                 ))}
                 <div className="absolute bottom-[5%] left-0 w-full flex justify-center" style={{ transform: `translateX(${panX - 50}%)`}}>
                    <div className="w-48 h-12 bg-gray-700 pixel-border border-t-0 rounded-b-lg flex items-center justify-center text-4xl" style={{boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.5)'}}>
                        🍳
                    </div>
                 </div>
            </div>
        </div>
    );
};