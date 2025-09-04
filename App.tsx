
import React, { useEffect } from 'react';
import { GameScreen } from './types';
import { GameProvider, useNavigation, useSession, useProfile, useSettings } from './src/context/GameContext';
import { MusicType, SoundType, startMusic, stopMusic } from './src/utils/AudioEngine';

import { GameWrapper } from './src/components/core/GameWrapper';
import { HUD } from './src/components/core/HUD';
import { IntroScreen } from './src/components/core/IntroScreen';
import { OutroScreen } from './src/components/core/OutroScreen';
import { ConfirmationModal } from './src/components/core/ConfirmationModal';

import { ProfileSelectionScreen } from './src/components/screens/ProfileSelectionScreen';
import { LeaderboardScreen } from './src/components/screens/LeaderboardScreen';
import { StartScreen } from './src/components/screens/StartScreen';
import { CaseSelectionScreen } from './src/components/screens/CaseSelectionScreen';
import { FinalEnding } from './src/components/screens/FinalEnding';
import { DebugMenu } from './src/components/screens/DebugMenu';
import { LogView } from './src/components/screens/LogView';
import { DebugAnimationViewer } from './src/components/screens/DebugAnimationViewer';

import { minigameComponentMap } from './src/components/minigames';

// Helper to determine which music track to play for a given minigame
const getMusicForMinigame = (id: string): MusicType | null => {
    if (["1-1", "1-3"].includes(id)) return MusicType.AMBIENT_GALLERY;
    if (id === "1-2") return MusicType.AMBIENT_KVIR;
    if (id === "2-1") return MusicType.AMBIENT_DANCE;
    if (id === "2-3") return MusicType.AMBIENT_ZEN;
    if (id === "3-1") return MusicType.AMBIENT_STREET;
    if (["4-1", "4-2"].includes(id)) return MusicType.AMBIENT_FEMINIST_FIGHT;
    if (id === "5-1") return MusicType.AMBIENT_KITCHEN;
    if (["5-2", "6-2"].includes(id)) return MusicType.AMBIENT_TENSION;
    if (id === "6-1") return MusicType.AMBIENT_NATURE;
    if (id === "6-3") return MusicType.LOOP_VACUUM;
    return null; // For games with no bg music, like 3-2 (Pereverni Kalendar)
}

// Главный компонент приложения, который отвечает за отображение нужного экрана.
const App: React.FC = () => {
    // Получаем необходимые данные и функции из разделенных контекстов.
    const { screen, setScreen } = useNavigation();
    const { 
        currentCase, minigameIndex, winMinigame, loseMinigame,
        isSlowMo, isMinigameInverted, forcedOutro, isAbsurdEdgeBonusRound
    } = useSession();
    const { profileToDeleteId, profiles, confirmDeleteProfile, cancelDeleteProfile } = useProfile();
    const { debugMode, playSound } = useSettings();

    // Определяем текущую мини-игру и её компонент.
    const currentMinigame = currentCase?.minigames[minigameIndex];
    const MinigameComponent = currentMinigame ? minigameComponentMap[currentMinigame.id] : null;

    // Управление фоновой музыкой
    useEffect(() => {
        if (screen === GameScreen.MINIGAME_PLAY && currentMinigame) {
            const musicType = getMusicForMinigame(currentMinigame.id);
            if (musicType !== null) {
                startMusic(musicType);
            } else {
                stopMusic();
            }
        } else if (screen === GameScreen.PROFILE_SELECTION || screen === GameScreen.CASE_SELECTION || screen === GameScreen.LEADERBOARD) {
            startMusic(MusicType.MENU);
        } else {
            // Stop music on any other screen (intros, outros, etc.)
            stopMusic();
        }
    }, [screen, currentMinigame]);
    
    const profilePendingDeletion = profiles.find(p => p.id === profileToDeleteId);

    const introWarning = isAbsurdEdgeBonusRound
        ? "ГРАНЬ АБСУРДА: ПРАВИЛА ИНВЕРТИРОВАНЫ! +2000 ОЧКОВ!"
        : isMinigameInverted
        ? "СДВИГ РЕАЛЬНОСТИ: ПРАВИЛА ИНВЕРТИРОВАНЫ!"
        : undefined;

    const renderScreen = () => {
        switch (screen) {
            case GameScreen.PROFILE_SELECTION:
                return <ProfileSelectionScreen />;
            case GameScreen.LEADERBOARD:
                return <LeaderboardScreen />;
            case GameScreen.START_SCREEN:
                return <StartScreen />;
            case GameScreen.CASE_SELECTION:
                return <CaseSelectionScreen />;
            case GameScreen.MINIGAME_INTRO:
                if (currentCase && currentMinigame) {
                    return (
                        <IntroScreen
                            title={currentMinigame.name}
                            text={currentMinigame.intro}
                            warning={introWarning}
                            onContinue={() => setScreen(GameScreen.MINIGAME_PLAY)}
                        />
                    );
                }
                return null;
            case GameScreen.MINIGAME_PLAY:
                if (MinigameComponent) {
                    return (
                        <MinigameComponent 
                            onWin={winMinigame} 
                            onLose={loseMinigame} 
                            isSlowMo={isSlowMo}
                            isMinigameInverted={isMinigameInverted}
                        />
                    );
                }
                return null;
            case GameScreen.CASE_OUTRO:
                if (currentCase) {
                    return (
                        <OutroScreen
                            title="ДЕЛО ЗАВЕРШЕНО"
                            text={forcedOutro || currentCase.outro}
                            onContinue={() => setScreen(GameScreen.CASE_SELECTION)}
                        />
                    );
                }
                return null;
            case GameScreen.FINAL_ENDING:
                return <FinalEnding />;
            case GameScreen.DEBUG_MENU:
                return <DebugMenu />;
            case GameScreen.LOG_VIEW:
                return <LogView />;
            case GameScreen.DEBUG_ANIMATION_VIEWER:
                return <DebugAnimationViewer />;
            default:
                return null;
        }
    };

    return (
        <GameWrapper>
            <HUD />
            
            <div key={screen} className="screen-content-wrapper">
                {renderScreen()}
            </div>

            {debugMode && screen !== GameScreen.DEBUG_MENU && screen !== GameScreen.DEBUG_ANIMATION_VIEWER && (
                <button
                    onClick={() => setScreen(GameScreen.DEBUG_MENU)}
                    className="absolute bottom-4 right-4 pixel-button p-2 text-sm z-50 bg-purple-700 hover:bg-purple-800"
                    aria-label="Открыть меню отладки"
                >
                    АЛАДКИ
                </button>
            )}

            {profilePendingDeletion && (
                <ConfirmationModal
                    title="ПОДТВЕРДИТЕ УДАЛЕНИЕ"
                    message={
                        <>
                            <p>Вы уверены, что хотите удалить профиль</p>
                            <p className="font-bold text-yellow-400 mt-2">"{profilePendingDeletion.name}"?</p>
                            <p className="mt-4 text-base text-gray-400">Это действие нельзя будет отменить.</p>
                        </>
                    }
                    onConfirm={() => {
                        playSound(SoundType.DESTROY);
                        confirmDeleteProfile();
                    }}
                    onCancel={() => {
                        playSound(SoundType.BUTTON_CLICK);
                        cancelDeleteProfile();
                    }}
                />
            )}
        </GameWrapper>
    );
};

const AppWrapper: React.FC = () => (
    <GameProvider>
        <App />
    </GameProvider>
);

export default AppWrapper;
