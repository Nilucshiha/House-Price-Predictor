import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { formatDollars } from "../priceFormat";
import { CITY_PRESETS } from "../cityPresets";
import FeatureInput from "../components/FeatureInput";
import CityCompareModal from "../components/CityCompareModal";

const LOCATION_FIELDS = ["Latitude", "Longitude"];

const TIER_ICONS = {
  "tier-affordable": "💰",
  "tier-mid": "🏡",
  "tier-premium": "✨",
  "tier-luxury": "👑",
};

function tierIcon(tag) {
  return TIER_ICONS[tag] || "";
}

export default function Predict({ ranges }) {
  const [values, setValues] = useState(null);
  const [city, setCity] = useState("custom");
  const [showLocationDetail, setShowLocationDetail] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  useEffect(() => {
    if (!ranges) return;
    const defaults = {};
    for (const f of ranges.features) defaults[f] = ranges.ranges[f].default;
    setValues(defaults);
  }, [ranges]);

  const handleChange = (name, value) => {
    if (LOCATION_FIELDS.includes(name)) setCity("custom");
    setValues((prev) => ({ ...prev, [name]: value === "" ? "" : parseFloat(value) }));
  };

  const handleCityChange = (e) => {
    const name = e.target.value;
    setCity(name);
    if (name === "custom") return;
    const preset = CITY_PRESETS.find((c) => c.name === name);
    setValues((prev) => ({ ...prev, Latitude: preset.lat, Longitude: preset.lon }));
  };

  const resetDefaults = () => {
    if (!ranges) return;
    const defaults = {};
    for (const f of ranges.features) defaults[f] = ranges.ranges[f].default;
    setValues(defaults);
    setCity("custom");
    setResult(null);
    setError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    api.predict(values)
      .then(setResult)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const priceLabel = useMemo(() => {
    if (!result) return null;
    return {
      main: formatDollars(result.price),
      low: formatDollars(result.priceLow),
      high: formatDollars(result.priceHigh),
    };
  }, [result]);

  if (!ranges || !values) {
    return (
      <div className="page-wrap">
        <div className="glass-card"><div className="card-body">Loading model…</div></div>
      </div>
    );
  }

  const propertyFields = ranges.features.filter((f) => !LOCATION_FIELDS.includes(f));
  const typicalError = formatDollars(Math.round(ranges.metrics.mae * 100000 / 500) * 500);

  return (
    <div className="page-wrap">
      <form onSubmit={handleSubmit} noValidate className="predict-form">
        <div className="steps-grid">
          <div className="glass-card step-card">
            <div className="step-card-head">
              <span className="step-badge">1</span>
              <div>
                <h2>Where is the property?</h2>
                <p>Pick the nearest city and we'll fill in the location for you.</p>
              </div>
            </div>
            <div className="card-body">
              <div className="form-row-compact">
                <div className="city-field">
                  <label htmlFor="city">📍 Nearest city</label>
                  <select id="city" className="select-input" value={city} onChange={handleCityChange}>
                    <option value="custom">Custom location…</option>
                    {CITY_PRESETS.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setShowLocationDetail((s) => !s)}
                >
                  {showLocationDetail ? "Hide" : "Fine-tune"} exact coordinates {showLocationDetail ? "▲" : "▼"}
                </button>
              </div>

              {showLocationDetail && (
                <div className="inputs-grid location-detail">
                  {LOCATION_FIELDS.map((f) => (
                    <FeatureInput
                      key={f}
                      name={f}
                      meta={ranges.ranges[f]}
                      value={values[f]}
                      onChange={handleChange}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="glass-card step-card">
            <div className="step-card-head">
              <span className="step-badge">2</span>
              <div>
                <h2>Describe the property</h2>
              </div>
            </div>
            <div className="card-body">
              <div className="inputs-grid">
                {propertyFields.map((f) => (
                  <FeatureInput
                    key={f}
                    name={f}
                    meta={ranges.ranges[f]}
                    value={values[f]}
                    onChange={handleChange}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions-bar">
          <button type="submit" className="btn btn-primary predict-btn" disabled={loading}>
            {loading ? "Predicting…" : "🔮 Predict Price"}
          </button>
          <button type="button" className="reset-btn" onClick={resetDefaults}>↺ Reset to typical values</button>
        </div>
      </form>

      <div className="glass-card result-card">
        <div className="card-body">
          {error ? (
            <div className="price-error">{error}</div>
          ) : priceLabel ? (
            <>
              <div className="result-top">
                <div>
                  <div className="price-card-label">Estimated Price</div>
                  <div className="price-main-row">
                    <div className="price-main">{priceLabel.main}</div>
                    {result.tier && (
                      <span className={`tier-badge ${result.tier.tag}`}>{tierIcon(result.tier.tag)} {result.tier.label}</span>
                    )}
                  </div>
                </div>
                <button type="button" className="btn btn-outline compare-btn" onClick={() => setCompareOpen(true)}>
                  🏙️ Compare with other cities
                </button>
              </div>

              {result.tier && (
                <p className="tier-explainer">
                  This estimate is {result.tier.percentile >= 50 ? "higher" : "lower"} than{" "}
                  <strong>{result.tier.percentile >= 50 ? Math.round(result.tier.percentile) : Math.round(100 - result.tier.percentile)}%</strong> of homes.
                </p>
              )}

              <div className="range-visual">
                <div className="range-track">
                  <div className="range-marker" style={{ left: "50%" }}>
                    <span className="range-marker-label">{priceLabel.main}</span>
                  </div>
                </div>
                <div className="range-endpoints">
                  <span>Low estimate<br /><strong>{priceLabel.low}</strong></span>
                  <span className="range-endpoints-right">High estimate<br /><strong>{priceLabel.high}</strong></span>
                </div>
              </div>
              
            </>
          ) : (
            <div className="price-placeholder-lg">Fill in the form above and click <strong>Predict Price</strong> to see your estimate here.</div>
          )}
        </div>
      </div>

      <CityCompareModal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        values={values}
        currentCity={city}
      />
    </div>
  );
}
