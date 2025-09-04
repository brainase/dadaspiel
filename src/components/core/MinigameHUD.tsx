import React from 'react';

/**
 * A standardized HUD container for mini-games.
 * It positions itself at the top of the screen, with padding to avoid overlapping the main game HUD.
 * It provides a consistent look and feel for in-game UI elements like timers, scores, and instructions.
 */
export const MinigameHUD: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="absolute top-0 left-0 right-0 z-20 pt-10 px-4 pb-4 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
            <div className="w-full flex justify-between items-start text-white pointer-events-auto text-xl">
                {children}
            </div>
        </div>
    );
};
