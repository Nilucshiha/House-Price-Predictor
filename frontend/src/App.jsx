import { useEffect, useState } from "react";
import "./styles/style.css";
import { api } from "./api";
import Predict from "./pages/Predict";

export default function App() {
  const [ranges, setRanges] = useState(null);

  useEffect(() => {
    api.featureRanges().then(setRanges);
  }, []);

  return (
    <>
      <header id="app-header">
        <div className="logo">
          <span className="logo-icon">🏠</span>
          <span className="logo-text">House Price Predictor</span>
        </div>
      </header>
      <main id="main" role="main">
        <Predict ranges={ranges} />
      </main>
    </>
  );
}
