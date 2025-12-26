import { useEffect, useState, useCallback } from 'react';

export const useParallax = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrollY;
};

interface MousePosition {
  x: number;
  y: number;
}

export const useMouseParallax = (intensity: number = 1) => {
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    
    // Normalize mouse position to -1 to 1 range
    const x = ((clientX / innerWidth) - 0.5) * 2 * intensity;
    const y = ((clientY / innerHeight) - 0.5) * 2 * intensity;
    
    setMousePosition({ x, y });
  }, [intensity]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  return mousePosition;
};
