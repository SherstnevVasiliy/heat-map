import React, { useEffect, useRef } from 'react';
import simpleheat from 'simpleheat';
import { clicks } from './data';
import './styles.css';

export default function App() {
  const heatmapRef = useRef(null);
  const data = clicks.map((item) => {
    return [item.x * 6, item.y * 6, 1.5];
  });
  useEffect(() => {
    if (heatmapRef && heatmapRef.current) {
      const heatmap = simpleheat(heatmapRef.current);
      heatmap.data(data as [number, number, number][]);
      heatmap.radius(30, 25);
      heatmap.gradient({
        0.1: 'blue',
        0.7: 'red',
        1.0: '#ecff00',
      });
      heatmap.max(2);
      heatmap.draw();
    }
  }, [data]);

  return (
    <>
      <div className="App">
        <div className="visualization">
          <canvas ref={heatmapRef} className="visualization__heatmap" width="600" height="600" />
          <img
            src="/sample-image.webp"
            alt=""
            width="600"
            height="600"
            className="visualization__map"
          />
        </div>
      </div>
      <div className="backdrop" />
    </>
  );
}
