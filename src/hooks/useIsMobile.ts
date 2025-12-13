
import { useState, useEffect } from 'react';

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Проверяем поддержку Touch событий или наличие точек касания.
      // Это более надежно для определения смартфонов/планшетов, чем просто ширина экрана.
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(hasTouch);
    };

    checkMobile();
    
    // На всякий случай слушаем ресайз, если пользователь переключает эмуляцию в DevTools
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};
