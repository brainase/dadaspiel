
import React from 'react';
import { useNavigation, useSession, useSettings } from '../../context/GameContext';
import { GameScreen } from '../../../types';
import { SoundType } from '../../utils/AudioEngine';

// Импорт всех компонентов победных экранов
import { NaleyShampanskogoWinScreen } from '../minigames/NaleyShampanskogo';
import { KvirKontrolWinScreen } from '../minigames/KvirKontrol';
import { ArtRevealWinScreen, pisyunImages } from '../minigames/PoiskiKartiny317';
import { DadaisticheskiyKomplimentWinScreen } from '../minigames/DadaisticheskiyKompliment';
import { ProhodKKinoWinScreen } from '../minigames/ProhodKKino';
import { PereverniKalendarWinScreen } from '../minigames/PereverniKalendar';
import { SoberiFeminitivWinScreen } from '../minigames/SoberiFeminitiv';
import { BoitsovskiyKlubFeminitivovWinScreen } from '../minigames/BoitsovskiyKlubFeminitivov';
import { PoceluyDobraWinScreen } from '../minigames/PoceluyDobra';
import { AladkiWinScreen } from '../minigames/PrigotovlenieAladok';
import { FruktoviySporWinScreen } from '../minigames/FruktoviySpor';
import { NePodavisWinScreen } from '../minigames/NePodavis';
import { ZasosPylesosaWinScreen } from '../minigames/ZasosPylesosa';

import { CHARACTER_ART_MAP } from '../../../characterArt';
import { Character } from '../../../types';
import { GenericWinScreen } from '../core/GenericWinScreen';

// Карта для сопоставления ID анимаций с их компонентами
const animationMap: { [key: string]: React.FC<any> } = {
    'naley-shampanskogo': NaleyShampanskogoWinScreen,
    'kvir-kontrol': KvirKontrolWinScreen,
    // 'tanec-dveri' is now handled as a special case below
    'prohod-kino': ProhodKKinoWinScreen,
    'pereverni-kalendar': PereverniKalendarWinScreen,
    'soberi-feminitiv': SoberiFeminitivWinScreen,
    'boitsovskiy-klub': BoitsovskiyKlubFeminitivovWinScreen,
    'poceluy-dobra': PoceluyDobraWinScreen,
    'prigotovlenie-aladok': AladkiWinScreen,
    'fruktoviy-spor': FruktoviySporWinScreen,
    'ne-podavis': NePodavisWinScreen,
    'zasos-pylesosa': ZasosPylesosaWinScreen,
    'otorvi-pisyun': ArtRevealWinScreen, // Updated to use the correct win screen
};

// Компоненты, требующие дополнительных пропсов
const specialComponents: { [key: string]: React.FC<any> } = {
    'dada-kompliment': DadaisticheskiyKomplimentWinScreen,
    'soberi-feminitiv': SoberiFeminitivWinScreen,
    'zasos-pylesosa': ZasosPylesosaWinScreen,
}


export const DebugAnimationViewer: React.FC = () => {
    const { animationToView, setAnimationToView, setScreen } = useNavigation();
    const { character } = useSession();
    const { playSound } = useSettings();

    // Функция для возврата в меню отладки
    const handleBack = () => {
        playSound(SoundType.BUTTON_CLICK);
        setAnimationToView(null);
        setScreen(GameScreen.DEBUG_MENU);
    };
    
    if (!animationToView) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <p>Анимация не выбрана.</p>
                <button onClick={handleBack} className="pixel-button p-2 mt-4">Назад</button>
            </div>
        )
    }

    // Разбираем ID на базовую часть и вариант (например, 'dada-kompliment:shirota')
    const [baseId, variant] = animationToView.split(':');
    
    // Handle special cases first
    if (baseId === 'tanec-dveri') {
        return (
            <div className="w-full h-full relative flex items-center justify-center bg-gray-900">
                <GenericWinScreen
                    title="ПРИХОДИТЕ ЗАВТРА!"
                    text="Но не опаздывайте!"
                    buttonText="КУПИТЬ ЧАСЫ"
                    onContinue={handleBack}
                />
            </div>
        );
    }

    const Component = animationMap[baseId] || specialComponents[baseId];

    if (Component) {
         const props: any = { onContinue: handleBack };
         // Добавляем пропсы для особых случаев
        if (baseId === 'dada-kompliment') props.winState = variant as any;
        if (baseId === 'soberi-feminitiv') props.finalWord = "ЧЕЛОВЕЧИЦА";
        if (baseId === 'zasos-pylesosa') props.charArt = CHARACTER_ART_MAP[character || Character.KANILA];
        if (baseId === 'prohod-kino') props.isMuted = true; // No sound in debug viewer for this one
        if (baseId === 'otorvi-pisyun') {
            props.pisyunImage = pisyunImages[0];
        }
        
        return (
            <div className="w-full h-full relative flex items-center justify-center bg-gray-900">
                <Component {...props} />
                 {/* A general back button for animations that don't have one */}
                 {(baseId === 'pereverni-kalendar') && (
                    <button onClick={handleBack} className="pixel-button absolute bottom-8 p-4 text-2xl z-50 bg-purple-700">
                        НАЗАД
                    </button>
                 )}
            </div>
        );
    }

    // Сообщение об ошибке, если компонент не найден
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <p>Анимация "{animationToView}" не найдена.</p>
            <button onClick={handleBack} className="pixel-button p-2 mt-4">Назад</button>
        </div>
    );
};
