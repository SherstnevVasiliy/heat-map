import HeatMap from './components/HeatMap';
import './App.css';

function App() {
  return (
    <div className="app">
      <div className="content">
        <h1>Тепловая карта кликов</h1>
        <HeatMap 
          imageUrl="sample-image.webp"
          width={800}
          height={600}
        />
      </div>
    </div>
  );
}

export default App;
