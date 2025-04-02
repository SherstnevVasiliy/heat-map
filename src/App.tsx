import HeatMapContainer from './components/HeatMapContainer';
import './App.css';

function App() {
  return (
    <div className="app">
      <div className="content">
        <h1>Тепловая карта кликов</h1>
        <HeatMapContainer 
          imageUrl="sample-image.webp"
          width={600}
          height={600}
        />
      </div>
    </div>
  );
}

export default App;
