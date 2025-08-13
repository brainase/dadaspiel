
import { useRef, useCallback, useEffect } from 'react';

/**
 * Кастомный хук для создания игрового цикла.
 * Он использует `requestAnimationFrame` для вызова колбэка на каждом кадре анимации.
 * Это обеспечивает плавную анимацию и обновление состояния игры.
 * @param callback - Функция, которая будет вызываться на каждом кадре. Она получает `deltaTime` - время, прошедшее с предыдущего кадра в миллисекундах. Это позволяет делать анимации и перемещения независимыми от FPS.
 * @param isRunning - Флаг, который определяет, запущен ли игровой цикл.
 */
export const useGameLoop = (callback: (deltaTime: number) => void, isRunning: boolean) => {
    // useRef используется для хранения ID запроса анимации, чтобы его можно было отменить.
    const requestRef = useRef<number | null>(null);
    // useRef для хранения времени предыдущего кадра, чтобы вычислить deltaTime.
    const previousTimeRef = useRef<number | null>(null);

    // `animate` - это функция, которая будет рекурсивно вызывать сама себя через `requestAnimationFrame`.
    const animate = useCallback((time: number) => {
        if (previousTimeRef.current !== null) {
            // Вычисляем время, прошедшее с последнего кадра.
            const deltaTime = time - previousTimeRef.current;
            // Вызываем переданный колбэк с этим временем.
            callback(deltaTime);
        }
        // Сохраняем текущее время для следующего кадра.
        previousTimeRef.current = time;
        // Запрашиваем следующий кадр анимации.
        requestRef.current = requestAnimationFrame(animate);
    }, [callback]);

    // useEffect управляет запуском и остановкой цикла.
    useEffect(() => {
        if (isRunning) {
            // Если `isRunning` true, запускаем цикл.
            requestRef.current = requestAnimationFrame(animate);
        } else {
             // Если `isRunning` false, останавливаем цикл.
             if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
                // Сбрасываем время, чтобы при следующем запуске deltaTime не был огромным.
                previousTimeRef.current = null;
            }
        }
        
        // Функция очистки, которая вызывается при размонтировании компонента.
        // Она гарантирует, что цикл будет остановлен, чтобы избежать утечек памяти.
        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [isRunning, animate]); // Зависимости хука: он перезапустится, если изменится isRunning или animate.
};
