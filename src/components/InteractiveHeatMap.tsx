import { useEffect, useRef, useState } from 'react';
import './InteractiveHeatMap.css';

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
const POINT_RADIUS = 30;
const TAP_THRESHOLD = 10; // Порог для определения тапа
const MAX_POINTS = 5; // Максимальное количество точек

const InteractiveHeatMap = ({
  imageUrl,
  aspectRatio = 1,
  onPointsChange,
}: InteractiveHeatMapProps) => {
  const [points, setPoints] = useState<ClickPoint[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [tempPoint, setTempPoint] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const buttonImageRef = useRef<HTMLImageElement | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Определяем, является ли устройство мобильным
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

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
      id: `${normalizedX}-${normalizedY}`,
    };
  };

  const isPointNearby = (x: number, y: number): boolean => {
    const normalizedPoint = normalizeCoordinates(x, y);
    return points.some((point) => {
      const distance = Math.sqrt(
        Math.pow(point.x - normalizedPoint.x, 2) + Math.pow(point.y - normalizedPoint.y, 2)
      );
      return distance < 5;
    });
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (dimensions.width <= 0 || dimensions.height <= 0) return;

    const { x, y } = getImageRelativeCoordinates(event.clientX, event.clientY);

    if (x < 0 || y < 0 || x > dimensions.width || y > dimensions.height) return;

    const clickedPoint = points.find((point) => {
      const denormalizedX = (point.x / MAX_COORDINATE) * dimensions.width;
      const denormalizedY = (point.y / MAX_COORDINATE) * dimensions.height;
      const distance = Math.sqrt(Math.pow(x - denormalizedX, 2) + Math.pow(y - denormalizedY, 2));
      return distance <= POINT_RADIUS;
    });

    if (clickedPoint) {
      setPoints((prev) => prev.filter((point) => point.id !== clickedPoint.id));
    } else if (!isPointNearby(x, y) && points.length < MAX_POINTS) {
      const normalizedPoint = normalizeCoordinates(x, y);
      setPoints((prev) => [...prev, normalizedPoint]);
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (dimensions.width <= 0 || dimensions.height <= 0) return;

    const touch = event.touches[0];
    const { x, y } = getImageRelativeCoordinates(touch.clientX, touch.clientY);

    touchStartRef.current = {
      x,
      y,
      time: Date.now(),
    };
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (!isMobile || !touchStartRef.current) return;

    const touch = event.touches[0];
    const { x, y } = getImageRelativeCoordinates(touch.clientX, touch.clientY);

    // Если касание за пределами изображения - игнорируем
    if (x < 0 || y < 0 || x > dimensions.width || y > dimensions.height) {
      setTempPoint(null);
      return;
    }

    // Проверяем, является ли это перетаскиванием
    const distance = Math.sqrt(
      Math.pow(x - touchStartRef.current.x, 2) + Math.pow(y - touchStartRef.current.y, 2)
    );

    if (distance > TAP_THRESHOLD) {
      setTempPoint({ x, y });
    }
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (!touchStartRef.current) return;
    if (dimensions.width <= 0 || dimensions.height <= 0) return;

    const touch = event.changedTouches[0];
    const { x: endX, y: endY } = getImageRelativeCoordinates(touch.clientX, touch.clientY);

    if (endX < 0 || endY < 0 || endX > dimensions.width || endY > dimensions.height) {
      touchStartRef.current = null;
      setTempPoint(null);
      return;
    }

    const distance = Math.sqrt(
      Math.pow(endX - touchStartRef.current.x, 2) + Math.pow(endY - touchStartRef.current.y, 2)
    );
    const duration = Date.now() - touchStartRef.current.time;

    if (distance < TAP_THRESHOLD && duration < 300) {
      const tappedPoint = points.find((point) => {
        const denormalizedX = (point.x / MAX_COORDINATE) * dimensions.width;
        const denormalizedY = (point.y / MAX_COORDINATE) * dimensions.height;
        const distance = Math.sqrt(
          Math.pow(endX - denormalizedX, 2) + Math.pow(endY - denormalizedY, 2)
        );
        return distance <= POINT_RADIUS;
      });

      if (tappedPoint) {
        setPoints((prev) => prev.filter((point) => point.id !== tappedPoint.id));
      } else if (!isPointNearby(endX, endY) && points.length < MAX_POINTS) {
        const normalizedPoint = normalizeCoordinates(endX, endY);
        setPoints((prev) => [...prev, normalizedPoint]);
      }
    } else if (tempPoint) {
      const tappedPoint = points.find((point) => {
        const denormalizedX = (point.x / MAX_COORDINATE) * dimensions.width;
        const denormalizedY = (point.y / MAX_COORDINATE) * dimensions.height;
        const distance = Math.sqrt(
          Math.pow(endX - denormalizedX, 2) + Math.pow(endY - denormalizedY, 2)
        );
        return distance <= POINT_RADIUS;
      });

      if (tappedPoint) {
        setPoints((prev) => prev.filter((point) => point.id !== tappedPoint.id));
      } else if (!isPointNearby(endX, endY) && points.length < MAX_POINTS) {
        const normalizedPoint = normalizeCoordinates(endX, endY);
        setPoints((prev) => [...prev, normalizedPoint]);
      }
    }

    touchStartRef.current = null;
    setTempPoint(null);
  };

  const drawPoints = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (dimensions.width <= 0 || dimensions.height <= 0) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    if (!buttonImageRef.current) return;

    try {
      // Рисуем постоянные точки
      points.forEach((point) => {
        const denormalizedX = (point.x / MAX_COORDINATE) * dimensions.width;
        const denormalizedY = (point.y / MAX_COORDINATE) * dimensions.height;

        if (buttonImageRef.current) {
          const buttonSize = 60;
          const offsetX = buttonSize / 2;
          const offsetY = buttonSize / 2;

          ctx.save();
          ctx.translate(denormalizedX - offsetX, denormalizedY - offsetY);
          ctx.drawImage(buttonImageRef.current, 0, 0, buttonSize, buttonSize);
          ctx.restore();
        }
      });

      // Рисуем временную точку (только для мобильных устройств)
      if (isMobile && tempPoint) {
        const buttonSize = 60;
        const offsetX = buttonSize / 2;
        const offsetY = buttonSize / 2;

        ctx.save();
        ctx.globalAlpha = 0.7; // Делаем временную точку полупрозрачной
        ctx.translate(tempPoint.x - offsetX, tempPoint.y - offsetY);
        ctx.drawImage(buttonImageRef.current, 0, 0, buttonSize, buttonSize);
        ctx.restore();
      }
    } catch (error) {
      console.error('Error drawing points:', error);
    }
  };

  useEffect(() => {
    if (isImageLoaded && dimensions.width > 0 && dimensions.height > 0) {
      drawPoints();
    }
  }, [points, dimensions, isImageLoaded, tempPoint]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const options = { passive: false };

    const touchStartHandler = (e: TouchEvent) =>
      handleTouchStart(e as unknown as React.TouchEvent<HTMLDivElement>);
    const touchMoveHandler = (e: TouchEvent) =>
      handleTouchMove(e as unknown as React.TouchEvent<HTMLDivElement>);
    const touchEndHandler = (e: TouchEvent) =>
      handleTouchEnd(e as unknown as React.TouchEvent<HTMLDivElement>);

    container.addEventListener('touchstart', touchStartHandler, options);
    container.addEventListener('touchmove', touchMoveHandler, options);
    container.addEventListener('touchend', touchEndHandler, options);

    return () => {
      container.removeEventListener('touchstart', touchStartHandler);
      container.removeEventListener('touchmove', touchMoveHandler);
      container.removeEventListener('touchend', touchEndHandler);
    };
  }, [isMobile, dimensions, points, tempPoint]);

  // Добавляем новый useEffect для синхронизации точек с родительским компонентом
  useEffect(() => {
    onPointsChange(points);
  }, [points, onPointsChange]);

  return (
    <div className="container" ref={containerRef} onClick={!isMobile ? handleClick : undefined}>
      <div className="image-container">
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Интерактивная карта"
          className="image"
          style={{
            width: dimensions.width > 0 ? dimensions.width : 'auto',
            height: dimensions.height > 0 ? dimensions.height : 'auto',
          }}
          onLoad={handleImageLoad}
        />
        <canvas
          ref={canvasRef}
          className="canvas"
          style={{
            width: dimensions.width > 0 ? dimensions.width : 0,
            height: dimensions.height > 0 ? dimensions.height : 0,
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
};

export default InteractiveHeatMap;
