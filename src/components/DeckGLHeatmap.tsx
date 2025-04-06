import React, { useCallback, useState, useEffect, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { MapViewState } from '@deck.gl/core';

// Импортируем defaultPoints из HeatMap
const defaultPoints = [
  { x: 10, y: 10, id: 'point-1' },
  { x: 54, y: 48, id: 'point-2' },
  { x: 68, y: 29, id: 'point-3' },
  { x: 45, y: 23, id: 'point-4' },
  { x: 26, y: 44, id: 'point-5' },
  { x: 47, y: 21, id: 'point-6' },
  { x: 69, y: 27, id: 'point-7' },
  { x: 52, y: 47, id: 'point-8' },
  { x: 28, y: 45, id: 'point-9' },
  { x: 59, y: 55, id: 'point-10' },
  { x: 43, y: 26, id: 'point-11' },
  { x: 68, y: 28, id: 'point-12' },
  { x: 61, y: 38, id: 'point-13' },
  { x: 47, y: 37, id: 'point-14' },
  { x: 52, y: 50, id: 'point-15' },
  { x: 22, y: 42, id: 'point-16' },
  { x: 29, y: 47, id: 'point-17' },
  { x: 68, y: 80, id: 'point-18' },
  { x: 52, y: 48, id: 'point-19' },
  { x: 53, y: 63, id: 'point-20' },
  { x: 48, y: 36, id: 'point-21' },
  { x: 60, y: 38, id: 'point-22' },
  { x: 69, y: 28, id: 'point-23' },
  { x: 42, y: 25, id: 'point-24' },
  { x: 26, y: 45, id: 'point-25' },
  { x: 26, y: 91, id: 'point-26' },
  { x: 33, y: 86, id: 'point-27' },
  { x: 42, y: 78, id: 'point-28' },
  { x: 96, y: 91, id: 'point-29' },
  { x: 59, y: 38, id: 'point-30' },
  { x: 48, y: 37, id: 'point-31' },
  { x: 52, y: 50, id: 'point-32' },
  { x: 25, y: 43, id: 'point-33' },
  { x: 33, y: 47, id: 'point-34' },
  { x: 64, y: 79, id: 'point-35' },
  { x: 75, y: 81, id: 'point-36' },
  { x: 71, y: 63, id: 'point-37' },
  { x: 70, y: 50, id: 'point-38' },
  { x: 69, y: 27, id: 'point-39' },
  { x: 41, y: 24, id: 'point-40' },
  { x: 56, y: 27, id: 'point-41' },
];

interface Point {
  position: [number, number];
  weight: number;
}

interface DeckGLHeatmapProps {
  imageUrl: string;
  aspectRatio: number;
  points?: Point[];
}

// Определяем границы для преобразования координат
const BOUNDS = {
  minLng: -180,
  maxLng: 180,
  minLat: -90,
  maxLat: 90,
};

// Настраиваем начальное состояние для правильного отображения относительных координат
const INITIAL_VIEW_STATE: MapViewState = {
  longitude: 0,
  latitude: 0,
  zoom: 0,
  pitch: 0,
  bearing: 0,
};

// Функция для преобразования относительных координат (0-100) в координаты deck.gl
const transformCoordinates = (x: number, y: number): [number, number] => {
  // Преобразуем x из диапазона 0-100 в диапазон долготы -180 до 180
  const lng = BOUNDS.minLng + (x / 100) * (BOUNDS.maxLng - BOUNDS.minLng);

  // Преобразуем y из диапазона 0-100 в диапазон широты 90 до -90 (инвертируем ось Y)
  const lat = BOUNDS.maxLat - (y / 100) * (BOUNDS.maxLat - BOUNDS.minLat);

  return [lng, lat];
};

// Преобразуем defaultPoints в формат для deck.gl
const transformedDefaultPoints: Point[] = defaultPoints.map((point) => ({
  position: transformCoordinates(point.x, point.y),
  weight: 1,
}));

const DeckGLHeatmap: React.FC<DeckGLHeatmapProps> = ({
  imageUrl,
  points = transformedDefaultPoints,
}) => {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Обновляем размеры при изменении размера контейнера
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Используем any для обхода проблем с типами
  const handleViewStateChange = useCallback((params: any) => {
    setViewState(params.viewState);
  }, []);

  const layers = [
    new HeatmapLayer({
      id: 'heatmap-layer',
      data: points,
      getPosition: (d: Point) => d.position,
      getWeight: (d: Point) => d.weight,
      radiusPixels: 100, // Значительно увеличиваем радиус для лучшей видимости
      intensity: 2, // Увеличиваем интенсивность
      threshold: 0.01, // Уменьшаем порог для лучшей видимости
      // Изменяем цветовую схему: синий -> красный -> желтый
      colorRange: [
        [0, 0, 0, 0], // Прозрачный
        [0, 0, 255, 255], // Синий
        [255, 0, 0, 255], // Красный
        [255, 255, 0, 255], // Желтый
      ],
    }),
  ];

  return (
    <div className="deckgl-container" ref={containerRef}>
      <div className="deckgl-image-container">
        <img
          src={imageUrl}
          alt="Base map"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>
      <DeckGL
        initialViewState={viewState}
        controller={true}
        layers={layers}
        onViewStateChange={handleViewStateChange}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        width={dimensions.width}
        height={dimensions.height}
      />
    </div>
  );
};

export default DeckGLHeatmap;
