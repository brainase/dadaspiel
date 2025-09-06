import React, { useState } from 'react';
import { useNavigation, useSession, useSettings } from '../../context/GameContext';
import { GameScreen } from '../../../types';
import { SoundType } from '../../utils/AudioEngine';

// Импорт всех компонентов победных экранов
import { NaleyShampanskogoWinScreen } from '../minigames/NaleyShampanskogo';
import { KvirKontrolWinScreen } from '../minigames/KvirKontrol';
import { ArtRevealWinScreen, pisyunImages } from '../minigames/PoiskiKartiny317';
import { TanecUZakrytyhDvereyWinScreen } from '../minigames/TanecUZakrytyhDverey';
import { DadaisticheskiyKomplimentWinScreen } from '../minigames/DadaisticheskiyKompliment';
import { ProhodKKinoWinScreen } from '../minigames/ProhodKKino';
import { PereverniKalendarWinScreen } from '../minigames/PereverniKalendar';
import { SoberiFeminitivWinScreen } from '../minigames/SoberiFeminitiv';
import { BoitsovskiyKlubFeminitivovWinScreen } from '../minigames/BoitsovskiyKlubFeminitivov';
import { PoceluyDobraWinScreen } from '../minigames/PoceluyDobra';
import { AladkiWinScreen } from '../minigames/PrigotovlenieAladok';
import { FruktoviySporWinScreen, BlackPlayerBecomingWinScreen } from '../minigames/FruktoviySpor';
import { NePodavisWinScreen } from '../minigames/NePodavis';
import { ZasosPylesosaWinScreen } from '../minigames/ZasosPylesosa';

import { CHARACTER_ART_MAP } from '../../../characterArt';
import { Character } from '../../../types';
import { GenericWinScreen } from '../core/GenericWinScreen';

// Helper component for video modal, copied from minigames
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

// Wrapper component to select the correct win screen for "Fruktoviy Spor"
const FruktoviySporWinScreenDebugWrapper: React.FC<{ onContinue: () => void; onPlayVideo: () => void; character: Character | null }> = ({ onContinue, onPlayVideo, character }) => {
    if (character === Character.BLACK_PLAYER) {
        return <BlackPlayerBecomingWinScreen onContinue={onContinue} onPlayVideo={onPlayVideo} />;
    }
    return <FruktoviySporWinScreen onContinue={onContinue} onPlayVideo={onPlayVideo} character={character} />;
};


// Карта для сопоставления ID анимаций с их компонентами
const animationMap: { [key: string]: React.FC<any> } = {
    'naley-shampanskogo': NaleyShampanskogoWinScreen,
    'kvir-kontrol': KvirKontrolWinScreen,
    'tanec-dveri': TanecUZakrytyhDvereyWinScreen,
    'prohod-kino': ProhodKKinoWinScreen,
    'pereverni-kalendar': PereverniKalendarWinScreen,
    'soberi-feminitiv': SoberiFeminitivWinScreen,
    'boitsovskiy-klub': BoitsovskiyKlubFeminitivovWinScreen,
    'poceluy-dobra': PoceluyDobraWinScreen,
    'prigotovlenie-aladok': AladkiWinScreen,
    'fruktoviy-spor': FruktoviySporWinScreenDebugWrapper,
    'ne-podavis': NePodavisWinScreen,
    'zasos-pylesosa': ZasosPylesosaWinScreen,
    'otorvi-pisyun': ArtRevealWinScreen, // Updated to use the correct win screen
};

// Компоненты, требующие дополнительных пропсов
const specialComponents: { [key: string]: React.FC<any> } = {
    'dada-kompliment': DadaisticheskiyKomplimentWinScreen,
};

const videoUrlMap: { [key: string]: string } = {
    'naley-shampanskogo': "https://www.youtube.com/watch?v=l0k6Grdu8OQ",
    'kvir-kontrol': "https://www.youtube.com/watch?v=l0k6Grdu8OQ",
    'otorvi-pisyun': "https://vkvideo.ru/video-126259657_456239031",
    'tanec-dveri': "https://www.youtube.com/watch?v=ZyOkyXVPBt4",
    // 'prohod-kino' has its own video player logic inside the win screen
    'pereverni-kalendar': "https://www.youtube.com/watch?v=a2ZFM5Ss0M0",
    'soberi-feminitiv': "https://www.youtube.com/watch?v=5eb9SoV-crA",
    'prigotovlenie-aladok': "https://vkvideo.ru/video-126259657_456239048",
    'poceluy-dobra': "https://www.youtube.com/watch?v=VTaSn3mymIw",
    'ne-podavis': "https://www.youtube.com/watch?v=29p14n_qeN0",
    'fruktoviy-spor': "https://www.youtube.com/watch?v=29p14n_qeN0",
};


export const DebugAnimationViewer: React.FC = () => {
    const { animationToView, setAnimationToView, setScreen } = useNavigation();
    const { character } = useSession();
    const { playSound } = useSettings();
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

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
    
    const Component = animationMap[baseId] || specialComponents[baseId];

    if (Component) {
         const props: any = { onContinue: handleBack };
         // Добавляем пропсы для особых случаев
        if (baseId === 'dada-kompliment') props.winState = variant as any;
        if (baseId === 'soberi-feminitiv') props.finalWord = "ЧЕЛОВЕЧИЦА";
        if (baseId === 'zasos-pylesosa') props.charArt = CHARACTER_ART_MAP[character || Character.KANILA];
        if (baseId === 'otorvi-pisyun') {
            props.pisyunImage = pisyunImages[0];
        }
        if (baseId === 'fruktoviy-spor') {
            props.character = character;
        }

        // Handle video playback
        const videoLink = videoUrlMap[baseId];
        if (videoLink) {
            props.onPlayVideo = () => {
                playSound(SoundType.BUTTON_CLICK);
                setVideoUrl(videoLink);
            };
        }
        // Special case for ProhodKKino which has its own player logic
        if (baseId === 'prohod-kino') {
            props.isMuted = true;
        }
        
        return (
            <div className="w-full h-full relative flex items-center justify-center bg-gray-900">
                <Component {...props} />
                {videoUrl && <VideoModal url={videoUrl} onClose={() => setVideoUrl(null)} />}
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
