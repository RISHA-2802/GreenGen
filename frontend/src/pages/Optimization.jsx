
import { useState } from "react";
import { SlidersHorizontal, Leaf, Zap, RefreshCw } from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

export default function Optimization() {
  const [country, setCountry] = useState("India");
  const [renewable, setRenewable] = useState(20);
  const [fossil, setFossil] = useState(15);
  const [efficiency, setEfficiency] = useState(10);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function runOptimization() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const params = new URLSearchParams({
        country,
        renewable_increase: String(renewable),
        fossil_decrease: String(fossil),
        efficiency_improvement: String(efficiency),
      });

      const response = await fetch(
        `${API_BASE}/optimization/run?${params.toString()}`,
        { method: "POST" }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || data.message || `Request failed (${response.status})`
        );
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "Could not connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">DECISION SUPPORT</div>
          <h1>Carbon Optimization</h1>
          <p>
            Explore energy scenarios and evaluate their potential
            sustainability impact.
          </p>
        </div>
        <div className="heading-icon">
          <SlidersHorizontal size={23} />
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><Leaf size={20} /></div>
          <div className="stat-label">Renewable energy increase</div>
          <div className="stat-value">{renewable}%</div>
          <div className="stat-note">Scenario setting</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><Zap size={20} /></div>
          <div className="stat-label">Fossil fuel reduction</div>
          <div className="stat-value">{fossil}%</div>
          <div className="stat-note">Scenario setting</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><Leaf size={20} /></div>
          <div className="stat-label">Efficiency improvement</div>
          <div className="stat-value">{efficiency}%</div>
          <div className="stat-note">Scenario setting</div>
        </div>
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Configure your scenario</h2>
            <p>Adjust the values and run the optimization model.</p>
          </div>
        </div>

        <div className="form-grid">
          <label className="field">
            <span>Country or region</span>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Enter country"
            />
          </label>

          <label className="field">
            <span>Renewable energy increase: {renewable}%</span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={renewable}
              onChange={(e) => setRenewable(Number(e.target.value))}
            />
          </label>

          <label className="field">
            <span>Fossil fuel reduction: {fossil}%</span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={fossil}
              onChange={(e) => setFossil(Number(e.target.value))}
            />
          </label>

          <label className="field">
            <span>Efficiency improvement: {efficiency}%</span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={efficiency}
              onChange={(e) => setEfficiency(Number(e.target.value))}
            />
          </label>
        </div>

        <button
          className="btn btn-primary"
          onClick={runOptimization}
          disabled={loading || !country.trim()}
        >
          {loading ? (
            <><RefreshCw size={17} /> Running...</>
          ) : (
            <><SlidersHorizontal size={17} /> Run Optimization</>
          )}
        </button>
      </section>

      {error && (
        <div className="notice notice-error">
          <strong>Optimization could not run</strong>
          <p>{error}</p>
          <p>
            Live results require the GreenGen backend to be connected.
          </p>
        </div>
      )}

      {result && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Optimization Results</h2>
              <p>Results returned by the backend.</p>
            </div>
            <span className="tag">Completed</span>
          </div>
          <pre className="result-json">
            {JSON.stringify(result, null, 2)}
          </pre>
        </section>
      )}

      {!result && !error && (
        <div className="empty-state">
          <div className="empty-icon"><Leaf size={25} /></div>
          <h3>Your results will appear here</h3>
          <p>
            Configure the scenario above and run the optimizer.
          </p>
        </div>
      )}
    </div>
  );
}
