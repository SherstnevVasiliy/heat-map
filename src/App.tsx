import HeatMapContainer from './components/HeatMapContainer';
import DeckGLHeatmap from './components/DeckGLHeatmap';
import './App.css';
import QwenHeatmap from './components/qwen/QwenHeatMap';
import HeatmapComponent from './components/qwen2/Qwen2HeatMAp';

function App() {
  const clicks = [
    { x: 1, y: 1, id: 1 },
    { x: 54, y: 48, id: 2 },
    { x: 68, y: 29, id: 1 },
    { x: 45, y: 23, id: 2 },
    { x: 26, y: 44, id: 2 },
    { x: 47, y: 21, id: 2 },
    { x: 69, y: 27, id: 2 },
    { x: 52, y: 47, id: 2 },
    { x: 28, y: 45, id: 2 },
    { x: 59, y: 55, id: 3 },
    { x: 43, y: 26, id: 3 },
    { x: 68, y: 28, id: 3 },
    { x: 61, y: 38, id: 3 },
    { x: 47, y: 37, id: 3 },
    { x: 52, y: 50, id: 3 },
    { x: 22, y: 42, id: 3 },
    { x: 29, y: 47, id: 3 },
    { x: 68, y: 80, id: 3 },
    { x: 52, y: 48, id: 3 },
    { x: 53, y: 63, id: 3 },
    { x: 48, y: 36, id: 3 },
    { x: 60, y: 38, id: 3 },
    { x: 69, y: 28, id: 3 },
    { x: 42, y: 25, id: 3 },
    { x: 26, y: 45, id: 3 },
    { x: 26, y: 91, id: 3 },
    { x: 33, y: 86, id: 3 },
    { x: 42, y: 78, id: 3 },
    { x: 48, y: 37, id: 4 },
    { x: 52, y: 50, id: 4 },
    { x: 25, y: 43, id: 4 },
    { x: 33, y: 47, id: 4 },
    { x: 64, y: 79, id: 4 },
    { x: 75, y: 81, id: 4 },
    { x: 71, y: 63, id: 4 },
    { x: 70, y: 50, id: 4 },
    { x: 69, y: 27, id: 4 },
    { x: 41, y: 24, id: 4 },
    { x: 56, y: 27, id: 4 },
  ];
  return (
    <div className="app">
      <div className="content">
        {/* <h1>Тепловая карта кликов</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <HeatMapContainer imageUrl="sample-image.webp" aspectRatio={1} />
          <div>
            <h2>Тепловая карта с deck.gl</h2>
            <DeckGLHeatmap imageUrl="sample-image.webp" aspectRatio={1} />
          </div>
        </div> */}
        {/* <div>
          <QwenHeatmap />
        </div> */}
        <div style={{ width: '600px', margin: '0 auto' }}>
          <HeatmapComponent />
        </div>
      </div>
    </div>
  );
}

export default App;
