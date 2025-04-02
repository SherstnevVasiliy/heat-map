import { useEffect, useRef, useState } from 'react';
import styles from './HeatMap.module.css';

interface ClickPoint {
  x: number;
  y: number;
  id: string;
}

interface InteractiveHeatMapProps {
  imageUrl: string;
  aspectRatio?: number;
  onPointsChange: (points: ClickPoint[]) => void;
}

const MAX_COORDINATE = 100;
const TAP_THRESHOLD = 10;
const POINT_RADIUS = 30;

const InteractiveHeatMap = ({ imageUrl, aspectRatio = 1, onPointsChange }: InteractiveHeatMapProps) => {
  const [points, setPoints] = useState<ClickPoint[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const buttonImageRef = useRef<HTMLImageElement | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Обработчик загрузки изображения
  const handleImageLoad = () => {
    setIsImageLoaded(true);
    updateDimensions();
  };

  const updateDimensions = () => {
    if (!containerRef.current || !imageRef.current) return;
    
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    
    // Размеры с учетом соотношения сторон и размеров контейнера
    let newWidth, newHeight;
    
    if (aspectRatio >= 1) {
      // Изображение шире, чем выше (или квадратное)
      newWidth = containerWidth;
      newHeight = containerWidth / aspectRatio;
      
      // Если высота больше контейнера, уменьшаем
      if (newHeight > containerHeight) {
        newHeight = containerHeight;
        newWidth = containerHeight * aspectRatio;
      }
    } else {
      // Изображение выше, чем шире
      newHeight = containerHeight;
      newWidth = containerHeight * aspectRatio;
      
      // Если ширина больше контейнера, уменьшаем
      if (newWidth > containerWidth) {
        newWidth = containerWidth;
        newHeight = containerWidth / aspectRatio;
      }
    }
    
    setDimensions({ width: newWidth, height: newHeight });
  };

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [aspectRatio]);

  useEffect(() => {
    // Загружаем изображение кнопки
    const buttonImage = new Image();
    buttonImage.src = '/button-point.png';
    buttonImage.onload = () => {
      buttonImageRef.current = buttonImage;
      if (isImageLoaded && dimensions.width > 0 && dimensions.height > 0) {
        drawPoints(); // Перерисовываем точки после загрузки изображения
      }
    };
  }, [isImageLoaded, dimensions]);

  // Получаем координаты относительно изображения, а не контейнера
  const getImageRelativeCoordinates = (clientX: number, clientY: number) => {
    if (!imageRef.current || !containerRef.current) return { x: 0, y: 0 };

    const containerRect = containerRef.current.getBoundingClientRect();
    const imageRect = imageRef.current.getBoundingClientRect();
    
    // Смещение изображения относительно контейнера
    const offsetX = imageRect.left - containerRect.left;
    const offsetY = imageRect.top - containerRect.top;
    
    // Координаты клика относительно левого верхнего угла изображения
    const x = clientX - containerRect.left - offsetX;
    const y = clientY - containerRect.top - offsetY;
    
    return { x, y };
  };

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
    if (dimensions.width <= 0 || dimensions.height <= 0) return;
    
    // Используем точные координаты относительно изображения
    const { x, y } = getImageRelativeCoordinates(event.clientX, event.clientY);
    
    // Если клик за пределами изображения - игнорируем
    if (x < 0 || y < 0 || x > dimensions.width || y > dimensions.height) return;
    
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
    
    if (dimensions.width <= 0 || dimensions.height <= 0) return;
    
    const touch = event.touches[0];
    const { x, y } = getImageRelativeCoordinates(touch.clientX, touch.clientY);
    
    touchStartRef.current = { x, y };
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    
    if (!touchStartRef.current) return;
    if (dimensions.width <= 0 || dimensions.height <= 0) return;

    const touch = event.changedTouches[0];
    const { x: endX, y: endY } = getImageRelativeCoordinates(touch.clientX, touch.clientY);
    
    // Если касание за пределами изображения - игнорируем
    if (endX < 0 || endY < 0 || endX > dimensions.width || endY > dimensions.height) {
      touchStartRef.current = null;
      return;
    }

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

    // Проверяем, что у нас есть действительные размеры перед рисованием
    if (dimensions.width <= 0 || dimensions.height <= 0) return;

    // Обновляем размеры canvas
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    if (!buttonImageRef.current) return;

    try {
      // Рисуем точки
      points.forEach(point => {
        const denormalizedX = (point.x / MAX_COORDINATE) * dimensions.width;
        const denormalizedY = (point.y / MAX_COORDINATE) * dimensions.height;

        if (buttonImageRef.current) {
          // Рисуем фоновое изображение кнопки по центру точки
          const buttonSize = 60; // Размер кнопки
          const offsetX = buttonSize / 2;
          const offsetY = buttonSize / 2;
          
          ctx.save();
          ctx.translate(denormalizedX - offsetX, denormalizedY - offsetY);
          ctx.drawImage(buttonImageRef.current, 0, 0, buttonSize, buttonSize);
          ctx.restore();
        }
      });
    } catch (error) {
      console.error("Error drawing points:", error);
    }
  };

  useEffect(() => {
    if (isImageLoaded && dimensions.width > 0 && dimensions.height > 0) {
      drawPoints();
    }
  }, [points, dimensions, isImageLoaded]);

  return (
    <div 
      ref={containerRef}
      className={styles.container}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={styles.imageContainer} style={{ position: 'relative' }}>
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Interactive heat map background"
          className={styles.image}
          style={{ 
            width: dimensions.width > 0 ? dimensions.width : 'auto', 
            height: dimensions.height > 0 ? dimensions.height : 'auto',
            maxWidth: '100%',
            maxHeight: '100%',
            display: 'block'
          }}
          onLoad={handleImageLoad}
        />
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: dimensions.width > 0 ? dimensions.width : 0, 
            height: dimensions.height > 0 ? dimensions.height : 0
          }}
        />
      </div>
    </div>
  );
};

export default InteractiveHeatMap; 