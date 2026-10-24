
import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { BrainCircuit, Play, TrendingUp } from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

async function apiRequest(path, params = {}, method = "GET") {
  const query = new URLSearchParams(params);
  const url = `${API_BASE}${path}${query.size ? `?${query}` : ""}`;

  let response;
  try {
    response = await fetch(url, { method });
  } catch {
    throw new Error(
      "Cannot reach the backend. Connect the deployed API before using model actions."
    );
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}

export default function Models() {
  const [country, setCountry] = useState("India");
  const [model, setModel] = useState("GPAP-AL");
  const [forecastYear, setForecastYear] = useState(2025);
  const [results, setResults] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function runAction(action) {
    setLoading(action);
    setError("");
    setMessage("");

    try {
      let data;

      if (action === "train") {
        data = await apiRequest("/models/train", { country }, "POST");
      } else if (action === "compare") {
        data = await apiRequest("/models/compare", { country });
        setResults(data);
      } else {
        data = await apiRequest("/models/predict", {
          country,
          model,
          year: forecastYear,
        });
        setPrediction(data);
      }

      if (action === "train") setResults(data);
      if (action === "compare") setResults(data);
      if (action === "predict") setPrediction(data);

      setMessage("The backend returned a response successfully.");
    } catch (err) {
      setError(err.message || "The requested action failed.");
    } finally {
      setLoading("");
    }
  }

  const modelRows = Array.isArray(results)
    ? results
    : results?.models || results?.results || results?.comparison || [];

  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">PREDICT / EVALUATE</div>
        <h1 className="page-title">ML Prediction & Comparison</h1>
        <p className="page-description">
          Train the available models, compare returned performance metrics,
          and request a forecast from the GreenGen backend.
        </p>
      </div>

      <div className="card section-card">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <BrainCircuit color="#328658" size={22} />
          <h2 className="section-title">Model Controls</h2>
        </div>
        <p className="section-description">
          Actions require a reachable backend and the corresponding API endpoints.
        </p>

        <div className="form-grid">
          <label className="form-field">
            Country
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="India"
            />
          </label>

          <label className="form-field">
            Forecast model
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="GPAP-AL">GPAP-AL</option>
              <option value="GPR">Gaussian Process Regression (GPR)</option>
              <option value="Bayesian Ridge">Bayesian Ridge</option>
              <option value="Random Forest">Random Forest</option>
              <option value="XGBoost">XGBoost</option>
              <option value="Linear Regression">Linear Regression</option>
            </select>
          </label>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 20 }}>
          <button
            className="button"
            disabled={Boolean(loading)}
            onClick={() => runAction("train")}
          >
            <Play size={15} />
            {loading === "train" ? "Training…" : "Train Models"}
          </button>

          <button
            className="button button-secondary"
            disabled={Boolean(loading)}
            onClick={() => runAction("compare")}
          >
            {loading === "compare" ? "Loading…" : "Compare Models"}
          </button>
        </div>
      </div>

      <div className="card section-card">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <TrendingUp color="#328658" size={22} />
          <h2 className="section-title">Forecast Configuration</h2>
        </div>

        <div className="form-grid" style={{ marginTop: 18 }}>
          <label className="form-field">
            Forecast year
            <input
              type="number"
              min="2025"
              max="2050"
              value={forecastYear}
              onChange={(e) => setForecastYear(Number(e.target.value))}
            />
          </label>
        </div>

        <button
          className="button"
          style={{ marginTop: 18 }}
          disabled={Boolean(loading) || !forecastYear}
          onClick={() => runAction("predict")}
        >
          {loading === "predict" ? "Generating forecast…" : "Generate Forecast"}
        </button>
      </div>

      {error && (
        <div className="notice notice-error" style={{ marginBottom: 18 }}>
          {error}
        </div>
      )}

      {message && (
        <div className="notice" style={{ marginBottom: 18 }}>
          {message}
        </div>
      )}

      {prediction && (
        <div className="card section-card">
          <h2 className="section-title">Forecast Response</h2>
          <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 12 }}>
            {JSON.stringify(prediction, null, 2)}
          </pre>
        </div>
      )}

      {results && (
        <div className="card section-card">
          <h2 className="section-title">Model Results</h2>
          <p className="section-description">
            Values below are displayed as returned by the backend.
          </p>

          {modelRows.length > 0 ? (
            <>
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      {Object.keys(modelRows[0]).map((key) => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modelRows.map((row, index) => (
                      <tr key={index}>
                        {Object.keys(modelRows[0]).map((key) => (
                          <td key={key}>{String(row[key] ?? "—")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {modelRows.some((row) => Number.isFinite(Number(row.MAE))) && (
                <div style={{ height: 280, marginTop: 24 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={modelRows}>
                      <CartesianGrid stroke="#e8f0e9" strokeDasharray="3 3" />
                      <XAxis dataKey="model" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="MAE" name="MAE" fill="#328658" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : (
            <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 12 }}>
              {JSON.stringify(results, null, 2)}
            </pre>
          )}
        </div>
      )}

      <div className="notice notice-warning">
        Forecasts are model outputs, not verified future observations. Confirm
        the source data, units, and validation results before interpreting them.
      </div>
    </div>
  );
}

