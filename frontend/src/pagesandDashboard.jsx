
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Activity, CalendarDays, BrainCircuit, RefreshCw } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

function MetricCard({ icon: Icon, label, value, note }) {
  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <Icon size={18} color="#378458" />
        <span className="metric-label">{label}</span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-note">{note}</div>
    </div>
  );
}

function SectionHeading({ title, description }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h2 className="section-title">{title}</h2>
      {description && <p className="section-description">{description}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [overview, setOverview] = useState(null);
  const [backtest, setBacktest] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiMessage, setApiMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setApiMessage("");

      try {
        const responses = await Promise.allSettled([
          fetch(`${API_BASE}/dataset/summary`),
          fetch(`${API_BASE}/carbon/overview`),
        ]);

        if (cancelled) return;

        const [summaryResponse, overviewResponse] = responses;

        if (
          summaryResponse.status === "fulfilled" &&
          summaryResponse.value.ok
        ) {
          setSummary(await summaryResponse.value.json());
        }

        if (
          overviewResponse.status === "fulfilled" &&
          overviewResponse.value.ok
        ) {
          const data = await overviewResponse.value.json();
          setOverview(data);

          const history = data?.historical_emissions || data?.history || [];
          if (Array.isArray(history)) {
            setBacktest(
              history.map((item) => ({
                year: item.year,
                emissions: Number(item.co2 ?? item.emissions ?? item.value),
              })).filter((item) => Number.isFinite(item.emissions))
            );
          }

          const sourceModels = data?.model_performance || data?.models || [];
          if (Array.isArray(sourceModels)) setModels(sourceModels);
        }
      } catch {
        if (!cancelled) {
          setApiMessage(
            "The dashboard layout is ready, but live backend data is not connected yet."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();
    return () => { cancelled = true; };
  }, []);

  const records =
    summary?.records ?? summary?.total_records ?? summary?.row_count ?? "—";
  const countries =
    summary?.countries ?? summary?.country_count ?? "—";
  const years =
    summary?.years ?? summary?.year_count ?? "—";
  const emissions =
    overview?.total_co2 ?? overview?.total_emissions ?? overview?.co2 ?? "—";

  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">OVERVIEW / INDIA</div>
        <h1 className="page-title">India Sustainability Overview</h1>
        <p className="page-description">
          Monitor the available sustainability data, review emissions trends,
          and explore GreenGen’s predictive analytics and planning tools.
        </p>
      </div>

      {apiMessage && (
        <div className="notice notice-warning" style={{ marginBottom: 18 }}>
          {apiMessage} Set VITE_API_BASE_URL to your deployed backend URL to
          enable live data. The local address only works when the backend is
          running on the same computer.
        </div>
      )}

      <div className="card-grid">
        <MetricCard
          icon={Activity}
          label="Dataset records"
          value={loading ? "…" : records}
          note="Records reported by the data service"
        />
        <MetricCard
          icon={CalendarDays}
          label="Countries / entities"
          value={loading ? "…" : countries}
          note="Coverage reported by the data service"
        />
        <MetricCard
          icon={BrainCircuit}
          label="Available years"
          value={loading ? "…" : years}
          note="Time coverage reported by the data service"
        />
      </div>

      <div className="card-grid">
        <div className="card" style={{ gridColumn: "span 2" }}>
          <SectionHeading
            title="Historical Emissions Trend"
            description="Historical values returned by the connected carbon overview API."
          />

          {backtest.length > 0 ? (
            <div className="chart-wrap" style={{ height: 290 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={backtest}>
                  <CartesianGrid stroke="#e8f0e9" strokeDasharray="3 3" />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="emissions"
                    name="Emissions"
                    stroke="#23834d"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state">
              {loading
                ? "Loading historical data…"
                : "Historical chart will appear when the API returns historical emissions."}
            </div>
          )}
        </div>

        <div className="card">
          <SectionHeading
            title="Emissions Snapshot"
            description="Summary from the connected backend."
          />
          <div className="metric-value" style={{ fontSize: 23 }}>
            {loading ? "…" : emissions}
          </div>
          <div className="metric-note">
            Total emissions value, if provided by the API. Units depend on the source.
          </div>
          <div style={{ marginTop: 20 }}>
            <span className="tag">India demo</span>
          </div>
        </div>
      </div>

      <div className="card section-card">
        <SectionHeading
          title="Model Performance"
          description="Model comparison metrics supplied by the carbon overview service."
        />

        {models.length > 0 ? (
          <div className="chart-wrap" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={models}>
                <CartesianGrid stroke="#e8f0e9" strokeDasharray="3 3" />
                <XAxis
                  dataKey="model"
                  tick={{ fontSize: 10 }}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="MAE" name="MAE" fill="#328658" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="empty-state">
            Model comparison will appear when the API returns model performance.
          </div>
        )}
      </div>

      <div className="notice">
        <RefreshCw size={15} style={{ display: "inline", marginRight: 7 }} />
        {loading
          ? "Connecting to the GreenGen data service…"
          : "Values are displayed only when returned by the connected service. Verify units before interpreting emissions."}
      </div>
    </div>
  );
}
