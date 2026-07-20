import { useState } from "react";

export default function FeatureInput({ name, meta, value, onChange }) {
  const [showHelp, setShowHelp] = useState(false);
  if (!meta) return null;
  const { label, unit, help, min, max } = meta;
  const outOfRange = value !== "" && (value < min || value > max);

  return (
    <div className="feature-input">
      <div className="feature-input-head">
        <label htmlFor={name}>{label}</label>
        <button
          type="button"
          className="help-icon"
          aria-label={`What does ${label} mean?`}
          onClick={() => setShowHelp((s) => !s)}
        >
          ?
        </button>
      </div>

      {showHelp && (
        <div className="help-popover">
          {help} <span className="help-popover-range">Valid range: {formatValue(min)} – {formatValue(max)}.</span>
        </div>
      )}

      <div className="feature-input-control">
        <input
          id={name}
          type="number"
          step="any"
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          className={outOfRange ? "feature-input-invalid" : ""}
        />
        <span className="feature-input-unit">{unit}</span>
      </div>
    </div>
  );
}

function formatValue(v) {
  if (Math.abs(v) >= 100) return Math.round(v).toLocaleString();
  return Number(v.toFixed(2)).toString();
}
