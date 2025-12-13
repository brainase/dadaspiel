/**
 * Файл: FruktoviySpor.tsx
 * 
 * Описание:
 * Этот файл содержит реализацию мини-игры 6-1 "Фруктовый Спор".
 * Ключевая особенность этого компонента - его трёхуровневая логика, которая
 * предоставляет уникальный геймплей для каждого из трёх игровых персонажей:
 * 
 * 1.  Чёрный Игрок -> "СТАНОВЛЕНИЕ": Мрачная нарративная игра на выживание.
 *     Цель - не дать шкале [ЦЕЛОСТНОСТЬ] опустеть до истечения таймера.
 *     Механики: абсурдные правила, визуальная и звуковая деградация.
 * 
 * 2.  Канила Дозловский -> "ФРУКТОВЫЙ ГЛЮК": Хаотичная аркада.
 *     Цель - заполнить шкалу [СИЛА АРГУМЕНТА].
 *     Механики: мерцающие правила, бонус "Ў", случайные инверсии логики.
 * 
 * 3.  Сексизм Эванович -> "ЭСТЕТИЧЕСКИЙ ЭТЮД": Аркада, основанная на визуальном восприятии.
 *     Цель - заполнить шкалу [СИЛА АРГУМЕНТА].
 *     Механики: правила, основанные на эстетике (цвета, формы), постоянно меняющийся визуальный стиль.
 * 
 * Главный компонент `FruktoviySpor` действует как маршрутизатор, отображая
 * нужную версию игры в зависимости от активного персонажа.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useSession, useSettings, useNavigation } from '../../context/GameContext';
import { SoundType } from '../../utils/AudioEngine';
import { Character } from '../../../types';
import { MinigameHUD } from '../core/MinigameHUD';
import { PixelArt } from '../core/PixelArt';
import { ORDINARY_PLAYER_ART_DATA, BLACK_PLAYER_ART_DATA, PIXEL_ART_PALETTE } from '../../../characterArt';

// --- ОБЩИЕ КОМПОНЕНТЫ И ДАННЫЕ (SHARED COMPONENTS & DATA) ---

const VideoModal: React.FC<{ url: string; onClose: () => void }> = ({ url, onClose }) => {
    const getEmbedUrl = (videoUrl: string): string => {
        // Добавляем параметры для автовоспроизведения и скрытия похожих видео для YouTube.
        if (videoUrl.includes("youtube.com/watch?v=")) {
            return videoUrl.replace("watch?v=", "embed/") + "?autoplay=1&rel=0";
        }
        // Обрабатываем ссылки на VK Видео.
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


/**
 * Компонент "Корзина".
 * @param visualStyle - Строка, определяющая текущий визуальный стиль ('sepia', 'saturated', 'inverted'). Используется в игре за Сексизма.
 */
const Basket: React.FC<{ visualStyle: string }> = ({ visualStyle }) => {
    // Базовые CSS-классы для корзины.
    let styleClasses = "w-32 h-20 relative filter drop-shadow-lg transition-all duration-500";
    // Добавляем классы фильтров в зависимости от выбранного стиля.
    if (visualStyle === 'sepia') styleClasses += " sepia";
    if (visualStyle === 'saturated') styleClasses += " saturate-[2]";
    if (visualStyle === 'inverted') styleClasses += " invert";

    return (
        <div className={styleClasses}>
            {/* Верхний обод корзины */}
            <div className="absolute top-0 left-0 w-full h-4 bg-[#a16207] rounded-full"></div>
            {/* Основное тело корзины с плетёной текстурой */}
            <div className="absolute top-2 left-0 w-full h-16 bg-[#854d0e] rounded-b-2xl overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,_#a16207,_#a16207_5px,_#854d0e_5px,_#854d0e_10px)] opacity-50"></div>
            </div>
        </div>
    );
};

// --- СЕКЦИЯ ЧЁРНОГО ИГРОКА: "СТАНОВЛЕНИЕ" (BLACK PLAYER'S SECTION: "BECOMING") ---

/**
 * Экран победы для Чёрного Игрока.
 * Отображается после успешного выживания в мини-игре "Становление".
 */
export const BlackPlayerBecomingWinScreen: React.FC<{ onContinue: () => void, onPlayVideo: () => void }> = ({ onContinue, onPlayVideo }) => {
    return (
        <div className="absolute inset-0 bg-black z-40 flex flex-col items-center justify-center text-center animate-[fadeIn_2s_ease-in]">
            <style>{`
                /* Анимация пульсации визора Чёрного Игрока */
                @keyframes visor-pulse {
                    0%, 100% { filter: drop-shadow(0 0 5px #ff0000) brightness(1); }
                    50% { filter: drop-shadow(0 0 15px #ff0000) brightness(1.5); }
                }
                .visor-pulse { animation: visor-pulse 2s ease-in-out infinite; }
                /* Анимация появления */
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
            <div 
                className="visor-pulse cursor-pointer transition-transform hover:scale-105"
                onClick={onPlayVideo}
                title="Смотреть исток"
            >
                 <PixelArt artData={BLACK_PLAYER_ART_DATA} palette={PIXEL_ART_PALETTE} pixelSize={8} />
            </div>
            <h2 className="text-2xl mt-8 text-gray-400">ЦЕЛОСТНОСТЬ ПОТЕРЯНА.</h2>
            <p className="text-3xl text-white mt-2">ЛИЧНОСТЬ НАЙДЕНА.</p>
            {/* Кнопка появляется с задержкой для драматического эффекта */}
            <div className="absolute bottom-8 w-full flex justify-center opacity-0 animate-[fadeIn_1s_2s_forwards]">
                <button onClick={onContinue} className="pixel-button p-4 text-2xl z-50 bg-red-800 hover:bg-red-700">
                    ПРОЙДОХИМ
                </button>
            </div>
        </div>
    );
};

/**
 * Компонент шкалы "Целостности".
 * @param integrity - Текущее значение целостности (от 0 до 100).
 */
const IntegrityBar: React.FC<{ integrity: number }> = ({ integrity }) => {
    const fillPercent = integrity;
    // Цвет шкалы меняется в зависимости от уровня целостности.
    const barColor = integrity > 60 ? 'bg-green-600' : integrity > 30 ? 'bg-yellow-500' : 'bg-red-700';

    return (
        <div className="w-full h-8 bg-black pixel-border relative overflow-hidden">
            {/* Заполняющаяся часть шкалы */}
            <div 
                className={`absolute top-0 left-0 h-full ${barColor} transition-all duration-300 ease-out`}
                style={{ width: `${fillPercent}%` }}
            ></div>
            <div className="absolute inset-0 text-center font-bold text-white text-xl">[ЦЕЛОСТНОСТЬ]</div>
        </div>
    );
};

/**
 * Основной компонент мини-игры "Становление" для Чёрного Игрока.
 * Это игра на выживание, где цель - продержаться до конца таймера.
 */
const BlackPlayerGame: React.FC<{ onWin: () => void; onLose: () => void; }> = ({ onWin, onLose }) => {
    // --- Состояние и ссылки (State & Refs) ---
    const { playSound } = useSettings();
		const { isInstructionModalVisible } = useNavigation();
    const gameAreaRef = useRef<HTMLDivElement>(null); // Ссылка на игровую область для получения размеров.
    const hasFinished = useRef(false); // Флаг, чтобы избежать многократного вызова onWin/onLose.
    const itemCounter = useRef(0); // Счетчик для уникальных ID падающих предметов.
    const ruleChangeTimeout = useRef<number | null>(null); // ID таймера для смены правил.

    const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing'); // Статус игры.
    const [integrity, setIntegrity] = useState(100); // Шкала целостности (здоровья).
    const [timeLeft, setTimeLeft] = useState(60); // Таймер выживания.
    const [items, setItems] = useState<any[]>([]); // Массив падающих предметов.
    const [currentRule, setCurrentRule] = useState<any>(null); // Текущее правило от "Хорды".
    const [basketX, setBasketX] = useState(50); // Позиция игрока по оси X в процентах.
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<any[]>([]); // Состояние для всплывающих индикаторов (+5, -20 и т.д.).

    // --- Данные игры (Game Data) ---
    // Падающие объекты - абстрактные концепции.
    const CONCEPTS = useMemo(() => [
        { char: '❤️', props: { symmetrical: true, isLogic: false, name: 'ЛЮБОВЬ' } },
        { char: '🧠', props: { symmetrical: false, isLogic: true, name: 'ЛОГИКА' } },
        { char: '💰', props: { symmetrical: true, isLogic: true, name: 'БОГАТСТВО' } },
        { char: '🎭', props: { symmetrical: false, isLogic: false, name: 'ЛИЧНОСТЬ' } },
        { char: '⚖️', props: { symmetrical: true, isLogic: true, name: 'СПРАВЕДЛИВОСТЬ' } },
        { char: '👁️', props: { symmetrical: true, isLogic: true, name: 'ГЛАЗ' } },
        { char: 'Ў', props: { symmetrical: false, isLogic: false, name: 'Ў' } },
        { char: '∞', props: { symmetrical: true, isLogic: false, name: 'БЕСКОНЕЧНОСТЬ' } },
    ], []);

    // Абсурдные правила, которые получает игрок.
    const RULES = useMemo(() => [
        { text: "ЛОВИ: СИММЕТРИЧНОЕ", type: 'catch', check: (item: any) => item.props.symmetrical },
        { text: "ИЗБЕГАЙ: ЛОГИКУ", type: 'avoid', check: (item: any) => item.props.isLogic },
        { text: "ПРИМИ: НЕИЗБЕЖНОСТЬ", type: 'catch', check: () => true }, // Ловить всё подряд.
        { text: "ЛОВИ: АСИММЕТРИЧНОЕ", type: 'catch', check: (item: any) => !item.props.symmetrical },
        { text: "ИЗБЕГАЙ: ВСЁ", type: 'avoid', check: () => true }, // Избегать всего.
    ], []);

    // --- Логика игры (Game Logic) ---

    // Функция для генерации нового правила каждые 5-8 секунд.
    const generateNewRule = useCallback(() => {
        setCurrentRule(RULES[Math.floor(Math.random() * RULES.length)]);
        if (ruleChangeTimeout.current) clearTimeout(ruleChangeTimeout.current);
        ruleChangeTimeout.current = window.setTimeout(generateNewRule, 5000 + Math.random() * 3000);
    }, [RULES]);

    // Запускаем смену правил, когда игра начинается.
    useEffect(() => {
        if (!isInstructionModalVisible) { generateNewRule(); }
        return () => { if (ruleChangeTimeout.current) clearTimeout(ruleChangeTimeout.current); };
    }, [generateNewRule, isInstructionModalVisible]);

    // Обработка поимки предмета.
    const handleCatch = useCallback((item: any) => {
        if(!currentRule) return;

        const { type, check } = currentRule;
        const isTarget = check(item); // Проверяем, соответствует ли предмет правилу.
        // Определяем, было ли действие игрока (поимка) правильным.
        const isCorrectAction = (type === 'catch' && isTarget) || (type === 'avoid' && !isTarget);

        if (isCorrectAction) {
            playSound(SoundType.ITEM_CATCH_GOOD);
            // Восстановление целостности за правильную ПОИМКУ
            if (type === 'catch') {
                setIntegrity(i => Math.min(100, i + 5));
                setFeedback(f => [...f, { id: Date.now(), text: '+5', x: item.x, y: item.y, color: 'text-green-400', life: 1 }]);
            }
        } else {
            // Если ошибка, отнимаем целостность.
            playSound(SoundType.ITEM_CATCH_BAD);
            setIntegrity(i => {
                const newIntegrity = Math.max(0, i - 20);
                if (newIntegrity <= 0 && !hasFinished.current) {
                    hasFinished.current = true;
                    setStatus('lost');
                    setTimeout(onLose, 2000); // Проигрыш.
                }
                return newIntegrity;
            });
            // Визуальная обратная связь о потере
            setFeedback(f => [...f, { id: Date.now(), text: '-20', x: item.x, y: item.y, color: 'text-red-500', life: 1 }]);
        }
    }, [currentRule, playSound, onLose]);
    
    // Основной игровой цикл.
    useGameLoop(useCallback((deltaTime) => {
        if (hasFinished.current || status !== 'playing') return;
        const dtSec = deltaTime / 1000;
        
        // Обновляем таймер. Если время вышло, игрок победил (выжил).
        setTimeLeft(t => {
            const newTime = t - dtSec;
            if (newTime <= 0 && !hasFinished.current) {
                hasFinished.current = true;
                setStatus('won');
            }
            return newTime;
        });

        // Появление новых предметов.
        if (Math.random() < 0.06) {
            const x = 5 + Math.random() * 90;
            // Проверяем, чтобы предметы не появлялись слишком близко друг к другу.
            const isTooClose = items.some(item => item.y < 15 && Math.abs(item.x - x) < 10);
            if (!isTooClose) {
                const concept = CONCEPTS[Math.floor(Math.random() * CONCEPTS.length)];
                setItems(prev => [...prev, {
                    id: itemCounter.current++, x, y: -5, ...concept
                }]);
            }
        }
        
        // Движение предметов и проверка столкновений/промахов.
        setItems(prevItems => {
            const remainingItems: any[] = [];
            const basketRect = { left: basketX - 5, right: basketX + 5, top: 85, bottom: 95 }; // Зона поимки.
            for (const item of prevItems) {
                const newY = item.y + 25 * dtSec; // Скорость падения.
                // Если предмет попал в зону поимки.
                if (newY >= basketRect.top && newY <= basketRect.bottom && item.x >= basketRect.left && item.x <= basketRect.right) {
                    handleCatch(item);
                } else if (newY < 105) {
                    // Если предмет еще на экране, оставляем его.
                    remainingItems.push({ ...item, y: newY });
                } else { 
                    // Если предмет улетел за экран (промах).
                    // Штрафуем, если нужно было поймать этот предмет.
                    // Исключаем правило "ПРИМИ: НЕИЗБЕЖНОСТЬ", так как физически невозможно поймать всё.
                    if (currentRule && currentRule.type === 'catch' && currentRule.check(item) && currentRule.text !== "ПРИМИ: НЕИЗБЕЖНОСТЬ") {
                        playSound(SoundType.SWOOSH);
                        setIntegrity(i => Math.max(0, i - 10)); // Меньший штраф за промах.
                        // Визуальная обратная связь о промахе
                        setFeedback(f => [...f, { id: Date.now(), text: 'ПРОМАХ: -10', x: item.x, y: 70, color: 'text-orange-500', life: 1.5 }]);
                    }
                }
            }
            return remainingItems;
        });
        
        // Обновление жизни для всплывающих текстов обратной связи
        setFeedback(f => f.map(fb => ({ ...fb, y: fb.y - 5 * dtSec, life: fb.life - dtSec })).filter(fb => fb.life > 0));

    }, [status, basketX, handleCatch, CONCEPTS, currentRule, playSound, onLose]), status === 'playing' && !isInstructionModalVisible);

    // Управление игроком.
    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (gameAreaRef.current && status === 'playing') {
            e.preventDefault();
            const rect = gameAreaRef.current.getBoundingClientRect();
            const pointer = 'touches' in e ? e.touches[0] : e;
            if (!pointer) return;
            const x = Math.max(8, Math.min(92, ((pointer.clientX - rect.left) / rect.width) * 100));
            setBasketX(x);
        }
    };

    const handlePlayVideo = () => {
        playSound(SoundType.BUTTON_CLICK);
        setVideoUrl("https://www.youtube.com/watch?v=29p14n_qeN0");
    };
    
    // --- Рендеринг (Rendering) ---

    // Стиль "деградации" фона и персонажа по мере потери целостности.
    const degradationStyle: React.CSSProperties = {
        filter: `grayscale(${1 - integrity / 100}) blur(${ (1 - integrity / 100) * 4}px)`,
        opacity: 0.5 + integrity / 200,
    };
    
    // Рендеринг экранов победы/поражения.
    if (status === 'won') return <BlackPlayerBecomingWinScreen onContinue={onWin} onPlayVideo={handlePlayVideo} />;
    if (status === 'lost') return <div className="absolute inset-0 bg-black/90 z-20 flex items-center justify-center text-5xl text-red-700">СЛОМЛЕН.</div>;
    
    return (
        <div 
            ref={gameAreaRef} 
            className="w-full h-full bg-gradient-to-b from-gray-700 to-gray-900 flex flex-col items-center p-4 relative overflow-hidden select-none cursor-none"
            onMouseMove={handlePointerMove} onTouchMove={handlePointerMove} onTouchStart={handlePointerMove}
        >
            {videoUrl && <VideoModal url={videoUrl} onClose={() => setVideoUrl(null)} />}
            {/* Анимация глитча фона при низкой целостности */}
            <style>
                {`@keyframes background-glitch {
                    0% { background-position: 0 0; }
                    25% { background-position: ${Math.random()*20-10}px ${Math.random()*20-10}px; }
                    50% { background-position: 0 0; }
                    100% { background-position: ${Math.random()*20-10}px ${Math.random()*20-10}px; }
                }`}
            </style>
            <div className="absolute inset-0 bg-gradient-to-b from-gray-700 to-gray-900 transition-all duration-500" style={{...degradationStyle, animation: integrity < 50 ? 'background-glitch 0.2s infinite' : 'none'}}></div>

            {/* Показываем инструкции или саму игру */}
						<>
								<MinigameHUD>
										<div className="w-full">
												<div className="flex justify-between items-center mb-2">
														<div className="bg-black/50 p-1 rounded">
																<h3 className="text-2xl text-red-500 animate-pulse">{currentRule?.text || 'ГОТОВЬСЯ...'}</h3>
														</div>
														<div className="bg-black/50 p-1 rounded">
																<span className="text-xl text-white">ВРЕМЯ: {Math.ceil(timeLeft)}</span>
														</div>
												</div>
												<IntegrityBar integrity={integrity} />
										</div>
								</MinigameHUD>
								
								<div className="w-full flex-grow relative">
										{/* Падающие концепции */}
										{items.map(item => (
												<div key={item.id} className="absolute text-5xl" style={{ left: `${item.x}%`, top: `${item.y}%`, transform: `translate(-50%, -50%)` }}>
														{item.char}
												</div>
										))}
										{/* Всплывающий текст обратной связи (+5 / -20) */}
										{feedback.map(f => (
												<div 
														key={f.id} 
														className={`absolute font-bold text-3xl pointer-events-none ${f.color}`}
														style={{
																left: `${f.x}%`,
																top: `${f.y}%`,
																opacity: f.life,
																transform: 'translate(-50%, -50%)',
																textShadow: '2px 2px 0 #000'
														}}
												>
														{f.text}
												</div>
										))}

										{/* "Обычный Игрок", управляемый пользователем */}
										<div className="absolute bottom-2 pointer-events-none" style={{ 
												left: `${basketX}%`, 
												transform: 'translateX(-50%)', 
												...degradationStyle, 
												// `transition` только на фильтры, чтобы движение было мгновенным и отзывчивым
												transition: 'filter 0.5s, opacity 0.5s' 
										}}>
												 <PixelArt artData={ORDINARY_PLAYER_ART_DATA} palette={PIXEL_ART_PALETTE} pixelSize={4} />
										</div>
								</div>
						</>
        </div>
    );
};


// --- СЕКЦИЯ КАНИЛЫ И СЕКСИЗМА: МОДИФИЦИРОВАННЫЙ ФРУКТОВЫЙ СПОР ---

// Данные о "фруктах" и их свойствах.
const FRUIT_PARAMS = {
    // text, color, shape, colorFamily, shapeForm
    '🍎': { color: '#FF6347', shape: 'circle', colorFamily: 'warm', shapeForm: 'round'},
    '🍌': { color: '#FFD700', shape: 'oval', colorFamily: 'warm', shapeForm: 'angular'},
    '🍇': { color: '#800080', shape: 'circle', colorFamily: 'cold', shapeForm: 'round'},
    '🍊': { color: '#FFA500', shape: 'circle', colorFamily: 'warm', shapeForm: 'round'},
    '🍓': { color: '#FFC0CB', shape: 'oval', colorFamily: 'warm', shapeForm: 'angular'},
    '🥝': { color: '#808000', shape: 'circle', colorFamily: 'cold', shapeForm: 'round'},
    '🍍': { color: '#DAA520', shape: 'oval', colorFamily: 'warm', shapeForm: 'angular'},
    '🍑': { color: '#FFDAB9', shape: 'circle', colorFamily: 'warm', shapeForm: 'round'}, // Исправлено с angular на round
    '🍆': { color: '#4B0082', shape: 'oval', colorFamily: 'cold', shapeForm: 'angular'},
    '🍅': { color: '#FF6347', shape: 'circle', colorFamily: 'warm', shapeForm: 'round'},
    '💎': { color: '#00FFFF', shape: 'oval', colorFamily: 'cold', shapeForm: 'angular'},
};
const ALL_FRUITS = Object.keys(FRUIT_PARAMS);

/**
 * Компонент "Фрукт".
 * @param visualStyle - Стиль, используемый в игре за Сексизма.
 */
const Fruit: React.FC<{ char: string; visualStyle: string }> = ({ char, visualStyle }) => {
    let styleClasses = "text-5xl transition-all duration-500";
     if (visualStyle === 'sepia') styleClasses += " sepia";
    if (visualStyle === 'saturated') styleClasses += " saturate-[2]";
    if (visualStyle === 'inverted') styleClasses += " invert";

    return <span className={styleClasses}>{char}</span>;
}

/**
 * Шкала "Силы Аргумента".
 */
const ArgumentStrengthBar: React.FC<{ strength: number, title: string }> = ({ strength, title }) => {
    const fillPercent = strength;
    return (
        <div className="w-full h-8 bg-red-800 pixel-border relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full bg-green-600 transition-all duration-300 ease-out" style={{ width: `${fillPercent}%` }}></div>
            <div className="absolute inset-0 text-center font-bold text-white text-xl">{title}</div>
        </div>
    );
};

/**
 * Экран победы для Канилы и Сексизма.
 */
export const FruktoviySporWinScreen: React.FC<{ onContinue: () => void, character: Character | null, onPlayVideo: () => void }> = ({ onContinue, character, onPlayVideo }) => {
    const { playSound } = useSettings();

    // Экран победы для Канилы
    if (character === Character.KANILA) {
        useEffect(() => { playSound(SoundType.WIN_FRUKTY); }, [playSound]);
        // Создаем массив символов для анимации "взрыва"
        const symbols = useMemo(() => Array.from({ length: 30 }).map((_, i) => ({
            id: i,
            char: ['Ў', '🍎', '🍌', '💎'][i % 4],
            style: {
                top: '50%', left: '50%',
                '--dx': `${(Math.random() - 0.5) * 100}vmin`,
                '--dy': `${(Math.random() - 0.5) * 100}vmin`,
                '--rot': `${(Math.random() - 0.5) * 1080}deg`,
                animation: `kanila-win-fly 2s cubic-bezier(0.2, 0.8, 0.7, 1) forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
                fontSize: `${2 + Math.random() * 3}rem`,
            } as React.CSSProperties
        })), []);

        return (
            <div className="absolute inset-0 bg-black/80 z-40 flex flex-col items-center justify-center overflow-hidden animate-[fadeIn_0.5s]">
                <style>{`
                    /* Анимация глитча для текста */
                    @keyframes glitch-effect { 0%{text-shadow:2px 2px #0ff,-2px -2px #f0f}25%{transform:translate(-2px,2px)}50%{text-shadow:-2px 2px #0ff,2px -2px #f0f}75%{transform:translate(2px,-2px)}100%{text-shadow:2px -2px #0ff,-2px 2px #f0f;transform:translate(0,0)} }
                    .glitch-text { animation: glitch-effect 0.15s infinite; }
                    /* Анимация разлетающихся символов */
                    @keyframes kanila-win-fly {
                        from { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                        to { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.5) rotate(var(--rot)); opacity: 0; }
                    }
                    /* Анимация радужного фона для кнопки */
                    @keyframes rainbow-button-bg { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
                    .rainbow-button {
                        background: linear-gradient(124deg, #ff2400, #e8b71d, #1de840, #1ddde8, #2b1de8, #dd00f3);
                        background-size: 1200% 1200%;
                        animation: rainbow-button-bg 10s ease infinite;
                    }
                `}</style>
                {symbols.map(s => <div key={s.id} className="absolute" style={s.style}>{s.char}</div>)}
                <h2 className="text-4xl text-yellow-300 mb-8 glitch-text z-10">СПОР ВЫИГРАН!</h2>
                <div className="flex gap-4 z-10">
                    <button onClick={onPlayVideo} className="pixel-button p-4 text-2xl rainbow-button">Ў-ВИДЕО</button>
                    <button onClick={onContinue} className="pixel-button p-4 text-2xl z-50 bg-green-700 hover:bg-green-800">ПРОХОДИМ</button>
                </div>
            </div>
        );
    }
    
    // Экран победы для Сексизма
    if (character === Character.SEXISM) {
        const [animationPhase, setAnimationPhase] = useState<'start' | 'splattering' | 'signing' | 'reveal'>('start');

        const splatters = useMemo(() => {
            const fruitColors = ['#FF6347', '#FFD700', '#800080', '#FFA500', '#DAA520', '#4B0082'];
            return Array.from({ length: 12 }).map((_, i) => ({
                id: i,
                color: fruitColors[i % fruitColors.length],
                style: {
                    '--start-x': `${(Math.random() - 0.5) * 150}vw`,
                    '--start-y': `${(Math.random() - 0.5) * 150}vh`,
                    '--end-x': `${15 + Math.random() * 70}%`,
                    '--end-y': `${15 + Math.random() * 70}%`,
                    '--size': `${20 + Math.random() * 15}%`,
                    '--rotation': `${Math.random() * 360}deg`,
                    animation: `splatter-fly-in 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards`,
                    animationDelay: `${0.5 + i * 0.2}s`,
                } as React.CSSProperties
            }));
        }, []);

        useEffect(() => {
            playSound(SoundType.WIN_FRUKTY);
            const toSplat = setTimeout(() => {
                setAnimationPhase('splattering');
                splatters.forEach((_, i) => {
                    setTimeout(() => playSound(SoundType.PLOP), 500 + i * 200 + 450);
                });
            }, 500);
            const toSign = setTimeout(() => {
                setAnimationPhase('signing');
                playSound(SoundType.SWOOSH);
            }, 500 + (splatters.length * 200) + 500);
            const toReveal = setTimeout(() => {
                setAnimationPhase('reveal');
                playSound(SoundType.ITEM_PLACE_SUCCESS);
            }, 500 + (splatters.length * 200) + 500 + 1500);

            return () => { clearTimeout(toSplat); clearTimeout(toSign); clearTimeout(toReveal); };
        }, [playSound, splatters]);

        return (
            <div className="absolute inset-0 bg-stone-900/90 z-40 flex flex-col items-center justify-center animate-[fadeIn_0.5s] overflow-hidden">
                <style>{`
                    .art-frame {
                        width: 32rem; height: 20rem; background-color: #fdf6e4; padding: 1rem;
                        border: 16px solid #b8860b;
                        box-shadow: inset 0 0 0 8px #8b4513, 0 10px 30px #000;
                        position: relative; transform: scale(0.8); opacity: 0;
                        animation: frame-appear 1s ease-out forwards;
                    }
                    @keyframes frame-appear { to { transform: scale(1); opacity: 1; } }
                    .splatter {
                        position: absolute; border-radius: 50%; filter: blur(2px);
                        opacity: 0; transform: translate(var(--start-x), var(--start-y)) scale(0);
                    }
                    @keyframes splatter-fly-in {
                        50% { opacity: 0.8; }
                        100% { opacity: 0.8; transform: translate(var(--end-x), var(--end-y)) scale(1) rotate(var(--rotation)); }
                    }
                    .signature {
                        position: absolute; bottom: 2rem; right: 2rem; color: #2e2418;
                        font-family: 'cursive'; font-size: 1.5rem; overflow: hidden;
                        white-space: nowrap; width: 0; border-right: 2px solid #2e2418;
                        animation: typing 1.5s steps(15, end) forwards, blink-caret .75s step-end infinite;
                        animation-delay: 0s, 1.5s;
                    }
                    @keyframes typing { from { width: 0 } to { width: 10em; } }
                    @keyframes blink-caret { from, to { border-color: transparent } 50% { border-color: #2e2418; } }
                    @keyframes reveal-fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                `}</style>
                <div className="art-frame">
                    {(animationPhase === 'splattering' || animationPhase === 'signing' || animationPhase === 'reveal') &&
                        splatters.map(s => <div key={s.id} className="splatter" style={{ ...s.style, backgroundColor: s.color, width: s.style['--size'], height: s.style['--size'] }}></div>)
                    }
                    {(animationPhase === 'signing' || animationPhase === 'reveal') &&
                         <div className="signature">S. Evanovich</div>
                    }
                </div>
                {animationPhase === 'reveal' && (
                    <div className="text-center absolute bottom-0 w-full p-8 flex flex-col items-center" style={{ animation: 'reveal-fade-in 1s ease-out forwards' }}>
                        <div className="flex gap-4">
                            <div onClick={onPlayVideo} className="bg-stone-700 p-2 border-2 border-stone-900 cursor-pointer hover:bg-stone-600 transition-colors">
                                <h4 className="text-white text-lg">ЭКСПОНАТ 6-1</h4>
                                <p className="text-stone-300 text-sm">ВИДЕО-АРТ</p>
                            </div>
                            <button onClick={onContinue} className="pixel-button p-4 text-2xl z-50 bg-green-700 hover:bg-green-800 self-end">ПРОХОДИМ</button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Запасной экран победы (не должен вызываться)
    return (
        <div className="absolute inset-0 bg-black/80 z-40 flex flex-col items-center justify-center animate-[fadeIn_0.5s]">
            <h2 className={`text-3xl text-yellow-300 mb-8`}>СПОР ВЫИГРАН!</h2>
            <button onClick={onContinue} className="pixel-button mt-8 p-4 text-2xl z-50 bg-green-700 hover:bg-green-800">ПРОХОДИМ</button>
        </div>
    );
};

/**
 * Основной компонент игры для Канилы и Сексизма.
 * Цель - заполнить шкалу "Силы Аргумента".
 */
const ModifiedFruitArgument: React.FC<{ onWin: () => void; onLose: () => void; character: Character | null }> = ({ onWin, onLose, character }) => {
    // --- Состояние и ссылки (State & Refs) ---
    const { playSound } = useSettings();
		const { isInstructionModalVisible } = useNavigation();
    const { handleMistake } = useSession();
    const gameAreaRef = useRef<HTMLDivElement>(null);
    const hasFinished = useRef(false);
    const itemCounter = useRef(0);
    const ruleChangeTimeout = useRef<number | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    const isKanila = character === Character.KANILA;
    const isSexism = character === Character.SEXISM;

    // Настройки сложности в зависимости от персонажа.
    const settings = useMemo(() => {
        if (isKanila) return { strengthToWin: 80, strengthLoss: 30, fallSpeed: 22, ruleChangeTime: 8000, survivalTime: 40 };
        if (isSexism) return { strengthToWin: 100, strengthLoss: 34, fallSpeed: 25, ruleChangeTime: 8000, survivalTime: 45 };
        return { strengthToWin: 100, strengthLoss: 34, fallSpeed: 25, ruleChangeTime: 8000, survivalTime: 45 };
    }, [isKanila, isSexism]);

    const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
    const [strength, setStrength] = useState(50); // Шкала "Силы Аргумента".
    const [timeLeft, setTimeLeft] = useState(settings.survivalTime);
    const [items, setItems] = useState<any[]>([]);
    const [currentRule, setCurrentRule] = useState<any>(null);
    const [basketX, setBasketX] = useState(50);
    const [isLogicInverted, setIsLogicInverted] = useState(false);
    // Состояние для игры за Сексизма.
    const [visualStyle, setVisualStyle] = useState('default');
    const styleChangeTimeout = useRef<number | null>(null);

    // --- Логика игры (Game Logic) ---

    // Генерация нового правила.
    const generateNewRule = useCallback(() => {
        let property, value, text;
        if (isSexism) {
            // У Сексизма правила основаны на эстетике (цвет, форма).
            property = ['colorFamily', 'shapeForm'][Math.floor(Math.random() * 2)];
            if (property === 'colorFamily') {
                value = ['warm', 'cold'][Math.floor(Math.random() * 2)];
                text = `ВСЕ ${value === 'warm' ? 'ТЁПЛЫЕ ЦВЕТА' : 'ХОЛОДНЫЕ ЦВЕТА'}`;
            } else {
                value = ['round', 'angular'][Math.floor(Math.random() * 2)];
                text = `ВСЕ ${value === 'round' ? 'ОКРУГЛЫЕ ФОРМЫ' : 'УГЛОВАТЫЕ ФОРМЫ'}`;
            }
        } else { // У Канилы правила простые.
            property = ['color', 'shape'][Math.floor(Math.random() * 2)];
            const fruit = ALL_FRUITS[Math.floor(Math.random() * ALL_FRUITS.length)];
            value = FRUIT_PARAMS[fruit as keyof typeof FRUIT_PARAMS][property as 'color' | 'shape'];
            text = `${property === 'color' ? 'ЦВЕТА' : ''} ${fruit}`;
        }
        
        const ruleType = Math.random() > 0.5 ? 'catch' : 'avoid'; // Ловить или избегать.
        const newRule = { type: ruleType, property, value, text: `${ruleType === 'catch' ? 'ЛОВИ' : 'ИЗБЕГАЙ'}: ${text}` };
        
        // Особенность Канилы: правило может "моргнуть" и на мгновение измениться.
        if (isKanila && Math.random() < 0.3) { 
            setCurrentRule({ text: "ГЛЮК СИСТЕМЫ Ў", type:'catch', property: 'char', value:'Ў' });
            setTimeout(() => setCurrentRule(newRule), 200);
        } else {
            setCurrentRule(newRule);
        }

        if (ruleChangeTimeout.current) clearTimeout(ruleChangeTimeout.current);
        ruleChangeTimeout.current = window.setTimeout(generateNewRule, settings.ruleChangeTime);
    }, [settings.ruleChangeTime, isKanila, isSexism]);

    useEffect(() => {
        if (!isInstructionModalVisible) { generateNewRule(); }
        return () => { if (ruleChangeTimeout.current) clearTimeout(ruleChangeTimeout.current); };
    }, [generateNewRule, isInstructionModalVisible]);

    // Особенность Сексизма: смена визуального стиля игры каждые 12 секунд.
    useEffect(() => {
        if (isSexism && !isInstructionModalVisible) {
            const changeStyle = () => {
                const styles = ['default', 'sepia', 'saturated', 'inverted'];
                setVisualStyle(current => styles[(styles.indexOf(current) + 1) % styles.length]);
                if (styleChangeTimeout.current) clearTimeout(styleChangeTimeout.current);
                styleChangeTimeout.current = window.setTimeout(changeStyle, 12000);
            };
            changeStyle();
            return () => { if (styleChangeTimeout.current) clearTimeout(styleChangeTimeout.current); };
        }
    }, [isSexism, isInstructionModalVisible]);

    // Обработка поимки фрукта.
    const handleCatch = useCallback((item: any) => {
        if (!currentRule) return;

        // Особенность Канилы: поимка "Ў" даёт большой бонус.
        if (isKanila && item.char === 'Ў') {
            playSound(SoundType.TRANSFORM_SUCCESS);
            setStrength(s => Math.min(100, s + 35));
            return;
        }

        const { type, property, value } = currentRule;
        const itemValue = item.data[property];
        const isTarget = itemValue === value;
        let isCorrectAction = (type === 'catch' && isTarget) || (type === 'avoid' && !isTarget);
        
        // Особенность Канилы: случайная инверсия правильности действия.
        if (isKanila && Math.random() < 0.15) {
            isCorrectAction = !isCorrectAction;
            setIsLogicInverted(true);
            setTimeout(() => setIsLogicInverted(false), 500);
        }

        if (isCorrectAction) {
            playSound(SoundType.ITEM_CATCH_GOOD);
            setStrength(s => {
                const newStrength = Math.min(100, s + 15);
                if (newStrength >= settings.strengthToWin && !hasFinished.current) {
                    hasFinished.current = true;
                    setStatus('won'); // Победа
                }
                return newStrength;
            });
        } else {
            // Особенность Канилы: первая ошибка прощается.
            if (!handleMistake()) {
                playSound(SoundType.ITEM_CATCH_BAD);
                setStrength(s => {
                    const newStrength = Math.max(0, s - settings.strengthLoss);
                    if (newStrength <= 0 && !hasFinished.current) {
                        hasFinished.current = true;
                        setStatus('lost'); // Поражение
                        setTimeout(onLose, 1500);
                    }
                    return newStrength;
                });
            }
        }
    }, [currentRule, handleMistake, playSound, settings.strengthToWin, settings.strengthLoss, onLose, setStatus, isKanila]);
    
    // Основной игровой цикл.
    useGameLoop(useCallback((deltaTime) => {
        if (hasFinished.current || status !== 'playing') return;
        const dtSec = deltaTime / 1000;
        
        setTimeLeft(t => {
            const newTime = t - dtSec;
            if (newTime <= 0 && !hasFinished.current) {
                if (strength > 0) {
                    hasFinished.current = true;
                    setStatus('won');
                } else {
                    hasFinished.current = true;
                    setStatus('lost');
                    setTimeout(onLose, 1500);
                }
            }
            return Math.max(0, newTime);
        });

        // Появление новых фруктов.
        if (Math.random() < 0.06) {
             const x = 5 + Math.random() * 90;
            const isTooClose = items.some(item => item.y < 15 && Math.abs(item.x - x) < 10);
            if (!isTooClose) {
                const isBonus = isKanila && Math.random() < 0.05; // Шанс появления "Ў" для Канилы.
                const fruitChar = ALL_FRUITS[Math.floor(Math.random() * ALL_FRUITS.length)];
                setItems(prev => [...prev, {
                    id: itemCounter.current++, x, y: -5,
                    char: isBonus ? 'Ў' : fruitChar, data: isBonus ? {} : FRUIT_PARAMS[fruitChar as keyof typeof FRUIT_PARAMS]
                }]);
            }
        }
        
        // Движение фруктов.
        setItems(prevItems => {
            const remainingItems: any[] = [];
            const basketRect = { left: basketX - 8, right: basketX + 8, top: 88, bottom: 98 };
            for (const item of prevItems) {
                const newY = item.y + settings.fallSpeed * dtSec;
                if (newY >= basketRect.top && newY <= basketRect.bottom && item.x >= basketRect.left && item.x <= basketRect.right) {
                    handleCatch(item);
                } else if (newY < 105) { 
                    remainingItems.push({ ...item, y: newY });
                } else { // Штраф за промах, если нужно было поймать.
                     if (currentRule) {
                        const { type, property, value } = currentRule;
                        if (item.char === 'Ў') continue; // Промах по "Ў" не наказывается.

                        const itemValue = item.data[property];
                        const isTarget = itemValue === value;
                        if (type === 'catch' && isTarget) {
                            if (!handleMistake()) {
                                playSound(SoundType.SWOOSH);
                                setStrength(s => {
                                    const newStrength = Math.max(0, s - 10); // Малый штраф.
                                    if (newStrength <= 0 && !hasFinished.current) {
                                        hasFinished.current = true;
                                        setStatus('lost');
                                        setTimeout(onLose, 1500);
                                    }
                                    return newStrength;
                                });
                            }
                        }
                    }
                }
            }
            return remainingItems;
        });

    }, [status, settings, basketX, handleCatch, isKanila, currentRule, playSound, onLose, handleMistake, strength]), status === 'playing' && !isInstructionModalVisible);

    // Управление корзиной.
    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (gameAreaRef.current && status === 'playing') {
            e.preventDefault();
            const rect = gameAreaRef.current.getBoundingClientRect();
            const pointer = 'touches' in e ? e.touches[0] : e;
            if (!pointer) return;
            const x = Math.max(8, Math.min(92, ((pointer.clientX - rect.left) / rect.width) * 100));
            setBasketX(x);
        }
    };

    const handlePlayVideo = () => {
        playSound(SoundType.BUTTON_CLICK);
        setVideoUrl("https://www.youtube.com/watch?v=29p14n_qeN0");
    };
    
    // --- Рендеринг (Rendering) ---

    if (status === 'won') return <FruktoviySporWinScreen onContinue={onWin} character={character} onPlayVideo={handlePlayVideo} />;
    if (status === 'lost') return <div className="absolute inset-0 bg-red-900/80 z-20 flex items-center justify-center text-5xl">СПОР ПРОИГРАН!</div>;
    
    const gameName = isKanila ? "ФРУКТОВЫЙ ГЛЮК" : "ЭСТЕТИЧЕСКИЙ ЭТЮД";

    // Фон в зависимости от персонажа.
    const bgClass = isKanila ? "from-purple-800 to-indigo-950" : "from-amber-800 to-stone-950";

    return (
        <div 
            ref={gameAreaRef} 
            className={`w-full h-full bg-gradient-to-b ${bgClass} flex flex-col items-center p-4 relative overflow-hidden select-none cursor-none`}
            onMouseMove={handlePointerMove} onTouchMove={handlePointerMove} onTouchStart={handlePointerMove}
        >
            {videoUrl && <VideoModal url={videoUrl} onClose={() => setVideoUrl(null)} />}
            <style>{`
                @keyframes glitch-effect { 0%{text-shadow:2px 2px #0ff,-2px -2px #f0f}25%{transform:translate(-2px,2px)}50%{text-shadow:-2px 2px #0ff,2px -2px #f0f}75%{transform:translate(2px,-2px)}100%{text-shadow:2px -2px #0ff,-2px 2px #f0f;transform:translate(0,0)} }
                .glitch-text-rule { animation: glitch-effect 0.2s infinite; }
                @keyframes logic-inversion-flash {
                    0%, 100% { opacity: 0; }
                    50% { opacity: 0.7; }
                }
            `}</style>

            {isLogicInverted && (
                <div 
                    className="absolute inset-0 bg-yellow-400 z-50 flex items-center justify-center pointer-events-none" 
                    style={{ animation: `logic-inversion-flash 0.5s ease-in-out` }}
                >
                    <span className="text-5xl font-black text-black" style={{ textShadow: '2px 2px 0px #fff' }}>ИНВЕРСИЯ!</span>
                </div>
            )}

						<>
								<MinigameHUD>
										<div className="w-full">
												<div className="flex justify-between items-center mb-2">
														<h3 className={`text-xl text-yellow-300 ${isKanila ? 'glitch-text-rule' : 'animate-pulse'}`}>{currentRule?.text}</h3>
														<span className="text-xl text-white">ВЫЖИТЬ: {Math.ceil(timeLeft)}</span>
												</div>
												<ArgumentStrengthBar strength={strength} title="СИЛА АРГУМЕНТА" />
										</div>
								</MinigameHUD>

								<div className="w-full flex-grow relative">
										{/* Падающие фрукты и "Ў" */}
										{items.map(item => (
												<div key={item.id} className="absolute" style={{ left: `${item.x}%`, top: `${item.y}%`, transform: `translate(-50%, -50%)` }}>
														{item.char === 'Ў' ? <span className="text-5xl font-bold text-yellow-300">Ў</span> : <Fruit char={item.char} visualStyle={visualStyle} />}
												</div>
										))}
										{/* Корзина */}
										<div className="absolute bottom-2 pointer-events-none" style={{ left: `${basketX}%`, transform: 'translateX(-50%)' }}>
												<Basket visualStyle={visualStyle} />
										</div>
								</div>
						</>
        </div>
    );
};


// --- ГЛАВНЫЙ КОМПОНЕНТ-ОБЁРТКА (MAIN WRAPPER COMPONENT) ---

/**
 * Этот компонент-обёртка выбирает, какую версию "Фруктового Спора"
 * запустить, в зависимости от выбранного персонажа.
 */
export const FruktoviySpor: React.FC<{ onWin: () => void; onLose: () => void; }> = ({ onWin, onLose }) => {
    const { character } = useSession();

    switch (character) {
        case Character.BLACK_PLAYER:
            // Для Чёрного Игрока - нарративная игра на выживание "Становление".
            return <BlackPlayerGame onWin={onWin} onLose={onLose} />;
        case Character.KANILA:
        case Character.SEXISM:
        default:
            // Для Канилы и Сексизма - модифицированный "Фруктовый Спор" со своими особенностями.
            return <ModifiedFruitArgument onWin={onWin} onLose={onLose} character={character} />;
    }
};