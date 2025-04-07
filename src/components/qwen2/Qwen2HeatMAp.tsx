import React, { useEffect, useRef, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { OrthographicView } from '@deck.gl/core';

// Определяем тип данных для точек
interface Point {
  x: number;
  y: number;
}

// Пример данных
const data: Point[] = [
  { x: 0, y: 0 },
  { x: 10, y: 10 },
  { x: 20, y: 20 },
  { x: 30, y: 30 },
  { x: 40, y: 40 },
  { x: 50, y: 50 },
  { x: 100, y: 0 },
  { x: 26, y: 44 },
  { x: 47, y: 21 },
  { x: 69, y: 27 },
  { x: 52, y: 47 },
  { x: 28, y: 45 },
  { x: 59, y: 55 },
  { x: 43, y: 26 },
  { x: 68, y: 28 },
  { x: 61, y: 38 },
  { x: 47, y: 37 },
  { x: 52, y: 50 },
  { x: 22, y: 42 },
  { x: 29, y: 47 },
  { x: 68, y: 80 },
  { x: 52, y: 48 },
  { x: 53, y: 63 },
  { x: 48, y: 36 },
  { x: 60, y: 38 },
  { x: 69, y: 28 },
  { x: 42, y: 25 },
  { x: 26, y: 45 },
  { x: 26, y: 91 },
  { x: 33, y: 86 },
  { x: 42, y: 78 },
  { x: 48, y: 37 },
  { x: 52, y: 50 },
  { x: 25, y: 43 },
  { x: 33, y: 47 },
  { x: 64, y: 79 },
  { x: 75, y: 81 },
  { x: 71, y: 63 },
  { x: 70, y: 50 },
  { x: 69, y: 27 },
  { x: 41, y: 24 },
  { x: 0, y: 100 },
  { x: 100, y: 100 },
];

// Функция для нормализации координат
const normalizeCoordinates = (point: Point): Point => ({
  x: point.x / 100,
  y: point.y / 100,
});

// Размеры изображения
// const width = 800;
// const height = 600;

// Компонент тепловой карты
const HeatmapComponent: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Обновляем размеры при изменении размеров окна
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions(); // Инициализация при первом рендере

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Преобразуем нормализованные координаты в пиксельные
  const normalizedToPixel = (point: Point) => {
    return new Float32Array([point.x * dimensions.width, point.y * dimensions.height]);
  };
  console.log(dimensions);
  // Начальное состояние вида
  const viewState = {
    target: [dimensions.width / 2, dimensions.height / 2, 0] as [number, number, number],
    zoom: 0.02,
  };

  // Настройка слоя тепловой карты
  const heatmapLayer = new HeatmapLayer<Point>({
    id: 'heatmap-layer',
    data: data.map(normalizeCoordinates), // Нормализуем данные перед использованием
    getPosition: (d: Point) => normalizedToPixel(d), // Преобразуем координаты
    // getWeight: (d: Point) => d.weight,
    radiusPixels: dimensions.width / 4, // Значительно увеличиваем радиус для лучшей видимости
    intensity: 1.5, // Увеличиваем интенсивность
    threshold: 0.01, // Уменьшаем порог для лучшей видимости
    // Изменяем цветовую схему: синий -> красный -> желтый
    colorRange: [
      [0, 0, 0, 0], // Прозрачный
      [0, 0, 255, 255], // Синий
      [255, 0, 0, 255], // Красный
      [255, 255, 0, 255], // Желтый
    ],
  });

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        paddingTop: '100%', // Сохраняем соотношение сторон 1:1
        overflow: 'hidden',
      }}
    >
      {/* Фоновое изображение */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: "url('sample-image.webp')",
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}
      ></div>

      {/* Канвас DeckGL */}
      <DeckGL
        initialViewState={viewState}
        views={new OrthographicView({ controller: false })}
        layers={[heatmapLayer]}
        controller={false}
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: '0', left: '0' }}
      />
    </div>
  );
};

export default HeatmapComponent;
