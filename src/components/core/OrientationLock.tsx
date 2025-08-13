import React from 'react';

export const OrientationLock: React.FC = () => {
    return (
        <>
            <style>{`
                .orientation-lock-overlay {
                    display: none; /* Hidden by default */
                    position: absolute;
                    inset: 0;
                    background-color: rgba(0, 0, 0, 0.95);
                    color: white;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    z-index: 100;
                }

                @media (orientation: portrait) {
                    /* Only show the overlay and hide game content in portrait mode */
                    .orientation-lock-overlay {
                        display: flex;
                    }
                    #game-content-container {
                        display: none;
                    }
                }

                @keyframes rotate-anim {
                    0% { transform: rotate(0deg); }
                    50% { transform: rotate(-90deg); }
                    100% { transform: rotate(-90deg); }
                }

                .rotate-icon {
                    width: 6rem;
                    height: 6rem;
                    border: 4px solid white;
                    border-radius: 0.5rem;
                    margin-bottom: 2rem;
                    animation: rotate-anim 2s ease-in-out infinite;
                }
            `}</style>
            <div className="orientation-lock-overlay">
                <div className="rotate-icon"></div>
                <h2 className="text-3xl">Пожалуйста, поверните ваше устройство</h2>
                <p className="mt-4 text-xl text-gray-400">Эта игра создана для ландшафтного режима.</p>
            </div>
        </>
    );
};
