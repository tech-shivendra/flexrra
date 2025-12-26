import { useEffect, useState } from 'react';

interface Shape {
  id: number;
  type: 'circle' | 'square' | 'triangle' | 'ring';
  size: number;
  x: number;
  y: number;
  duration: number;
  delay: number;
  opacity: number;
}

const FloatingShapes = () => {
  const [shapes, setShapes] = useState<Shape[]>([]);

  useEffect(() => {
    const shapeTypes: Shape['type'][] = ['circle', 'square', 'triangle', 'ring'];
    const generatedShapes: Shape[] = [];

    for (let i = 0; i < 15; i++) {
      generatedShapes.push({
        id: i,
        type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
        size: Math.random() * 60 + 20,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 20 + 15,
        delay: Math.random() * 5,
        opacity: Math.random() * 0.15 + 0.05,
      });
    }

    setShapes(generatedShapes);
  }, []);

  const renderShape = (shape: Shape) => {
    const baseStyle = {
      left: `${shape.x}%`,
      top: `${shape.y}%`,
      width: shape.size,
      height: shape.size,
      opacity: shape.opacity,
      animationDuration: `${shape.duration}s`,
      animationDelay: `${shape.delay}s`,
    };

    switch (shape.type) {
      case 'circle':
        return (
          <div
            key={shape.id}
            className="absolute rounded-full border-2 border-white/30 animate-float"
            style={baseStyle}
          />
        );
      case 'square':
        return (
          <div
            key={shape.id}
            className="absolute border-2 border-primary/40 rotate-45 animate-float-rotate"
            style={baseStyle}
          />
        );
      case 'triangle':
        return (
          <div
            key={shape.id}
            className="absolute animate-float"
            style={{
              ...baseStyle,
              width: 0,
              height: 0,
              borderLeft: `${shape.size / 2}px solid transparent`,
              borderRight: `${shape.size / 2}px solid transparent`,
              borderBottom: `${shape.size}px solid`,
              borderBottomColor: `rgba(139, 92, 246, ${shape.opacity})`,
            }}
          />
        );
      case 'ring':
        return (
          <div
            key={shape.id}
            className="absolute rounded-full border-4 border-white/20 animate-float-scale"
            style={{
              ...baseStyle,
              background: 'transparent',
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
      {shapes.map(renderShape)}
    </div>
  );
};

export default FloatingShapes;
