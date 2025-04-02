import { useEffect, useRef, useState } from 'react';
import styles from './HeatMap.module.css';

interface ClickPoint {
  x: number;
  y: number;
  id: string;
}

interface InteractiveHeatMapProps {
  imageUrl: string;
  width?: number;
  height?: number;
  onPointsChange: (points: ClickPoint[]) => void;
}

const MAX_COORDINATE = 100;
const ASPECT_RATIO = 4/3;
const TAP_THRESHOLD = 10;
const POINT_RADIUS = 30;

const InteractiveHeatMap = ({ imageUrl, width = 800, height = 600, onPointsChange }: InteractiveHeatMapProps) => {
  const [points, setPoints] = useState<ClickPoint[]>([]);
  const [dimensions, setDimensions] = useState({ width, height });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const buttonImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.clientWidth;
      const newWidth = Math.min(containerWidth, width);
      const newHeight = newWidth / ASPECT_RATIO;
      
      setDimensions({ width: newWidth, height: newHeight });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [width]);

  useEffect(() => {
    // Загружаем изображение кнопки
    const buttonImage = new Image();
    buttonImage.src = '/button-point.png';
    buttonImage.onload = () => {
      buttonImageRef.current = buttonImage;
      drawPoints(); // Перерисовываем точки после загрузки изображения
    };
  }, []);

  const normalizeCoordinates = (x: number, y: number): ClickPoint => {
    const normalizedX = Math.round((x / dimensions.width) * MAX_COORDINATE);
    const normalizedY = Math.round((y / dimensions.height) * MAX_COORDINATE);
    return {
      x: Math.min(Math.max(normalizedX, 0), MAX_COORDINATE),
      y: Math.min(Math.max(normalizedY, 0), MAX_COORDINATE),
      id: `${normalizedX}-${normalizedY}`
    };
  };

  const isPointNearby = (x: number, y: number): boolean => {
    const normalizedPoint = normalizeCoordinates(x, y);
    return points.some(point => {
      const distance = Math.sqrt(
        Math.pow(point.x - normalizedPoint.x, 2) + 
        Math.pow(point.y - normalizedPoint.y, 2)
      );
      return distance < 5;
    });
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Проверяем, не кликнули ли мы по существующей точке
    const clickedPoint = points.find(point => {
      const denormalizedX = (point.x / MAX_COORDINATE) * dimensions.width;
      const denormalizedY = (point.y / MAX_COORDINATE) * dimensions.height;
      const distance = Math.sqrt(
        Math.pow(x - denormalizedX, 2) + 
        Math.pow(y - denormalizedY, 2)
      );
      return distance <= POINT_RADIUS;
    });

    if (clickedPoint) {
      // Если кликнули по точке - удаляем её
      setPoints(prev => {
        const newPoints = prev.filter(point => point.id !== clickedPoint.id);
        onPointsChange(newPoints);
        return newPoints;
      });
    } else if (!isPointNearby(x, y)) {
      // Если кликнули не по точке и не рядом с существующей - добавляем новую
      const normalizedPoint = normalizeCoordinates(x, y);
      setPoints(prev => {
        const newPoints = [...prev, normalizedPoint];
        onPointsChange(newPoints);
        return newPoints;
      });
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    const touch = event.touches[0];
    const rect = event.currentTarget.getBoundingClientRect();
    touchStartRef.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    
    if (!touchStartRef.current) return;

    const touch = event.changedTouches[0];
    const rect = event.currentTarget.getBoundingClientRect();
    const endX = touch.clientX - rect.left;
    const endY = touch.clientY - rect.top;

    const distance = Math.sqrt(
      Math.pow(endX - touchStartRef.current.x, 2) + 
      Math.pow(endY - touchStartRef.current.y, 2)
    );

    if (distance < TAP_THRESHOLD) {
      // Проверяем, не тапнули ли мы по существующей точке
      const tappedPoint = points.find(point => {
        const denormalizedX = (point.x / MAX_COORDINATE) * dimensions.width;
        const denormalizedY = (point.y / MAX_COORDINATE) * dimensions.height;
        const distance = Math.sqrt(
          Math.pow(touchStartRef.current!.x - denormalizedX, 2) + 
          Math.pow(touchStartRef.current!.y - denormalizedY, 2)
        );
        return distance <= POINT_RADIUS;
      });

      if (tappedPoint) {
        // Если тапнули по точке - удаляем её
        setPoints(prev => {
          const newPoints = prev.filter(point => point.id !== tappedPoint.id);
          onPointsChange(newPoints);
          return newPoints;
        });
      } else if (!isPointNearby(touchStartRef.current.x, touchStartRef.current.y)) {
        // Если тапнули не по точке и не рядом с существующей - добавляем новую
        const normalizedPoint = normalizeCoordinates(
          touchStartRef.current.x,
          touchStartRef.current.y
        );
        setPoints(prev => {
          const newPoints = [...prev, normalizedPoint];
          onPointsChange(newPoints);
          return newPoints;
        });
      }
    }

    touchStartRef.current = null;
  };

  const drawPoints = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    points.forEach(point => {
      const denormalizedX = (point.x / MAX_COORDINATE) * dimensions.width;
      const denormalizedY = (point.y / MAX_COORDINATE) * dimensions.height;

      if (buttonImageRef.current) {
        // Рисуем фоновое изображение кнопки
        ctx.save();
        ctx.translate(denormalizedX - 30, denormalizedY - 30);
        ctx.drawImage(buttonImageRef.current, 0, 0, 60, 60);
        ctx.restore();
      }
    });
  };

  useEffect(() => {
    drawPoints();
  }, [points, dimensions]);

  return (
    <div 
      ref={containerRef}
      className={styles.container}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Interactive heat map background"
        className={styles.image}
        style={{ width: dimensions.width, height: dimensions.height }}
      />
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className={styles.canvas}
      />
    </div>
  );
};

export default InteractiveHeatMap; 