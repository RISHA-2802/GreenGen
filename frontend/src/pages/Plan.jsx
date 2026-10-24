
import { useState } from "react";
import {
  ClipboardList,
  Leaf,
  FileText,
  RefreshCw,
  Download,
  CheckCircle2,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

export default function Plan() {
  const [country, setCountry] = useState("India");
  const [recommendations, setRecommendations] = useState(null);
  const [actionPlan, setActionPlan] = useState(null);
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [reportMessage, setReportMessage] = useState("");

  async function requestData(endpoint, setter, label) {
    setLoading(label);
    setError("");
    setReportMessage("");

    try {
      const params = new URLSearchParams({ country });
      const response = await fetch(
        `${API_BASE}/${endpoint}?${params.toString()}`,
        { method: "POST" }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || `${label} failed (${response.status})`
        );
      }

      setter(data);
    } catch (err) {
      setError(err.message || `Could not generate ${label}.`);
    } finally {
      setLoading("");
    }
  }

  async function generateReport() {
    setLoading("report");
    setError("");
    setReportMessage("");

    try {
      const response = await fetch(`${API_BASE}/report/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || `Report failed (${response.status})`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "GreenGen_Sustainability_Report.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setReportMessage("Report download started.");
    } catch (err) {
      setError(err.message || "Could not generate the report.");
    } finally {
      setLoading("");
    }
  }

  function renderData(data) {
    if (!data) return null;

    if (Array.isArray(data)) {
      return (
        <ul className="recommendation-list">
          {data.map((item, index) => (
            <li key={index}>
              {typeof item === "string" ? item : JSON.stringify(item)}
            </li>
          ))}
        </ul>
      );
    }

    if (typeof data === "object") {
      return (
        <pre className="result-json">
          {JSON.stringify(data, null, 2)}
        </pre>
      );
    }

    return <p>{String(data)}</p>;
  }

  const actions = Array.isArray(actionPlan)
    ? actionPlan
    : actionPlan?.actions || actionPlan?.tasks || [];

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">SUSTAINABILITY ACTIONS</div>
          <h1>Recommendations, Plan & Report</h1>
          <p>
            Generate sustainability recommendations, track actions,
            and prepare a report.
          </p>
        </div>
        <div className="heading-icon">
          <ClipboardList size={23} />
        </div>
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Report settings</h2>
            <p>Select the country or region for your analysis.</p>
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
        </div>
      </section>

      {error && (
        <div className="notice notice-error">
          <strong>Request failed</strong>
          <p>{error}</p>
        </div>
      )}

      {reportMessage && (
        <div className="notice">
          <CheckCircle2 size={18} /> {reportMessage}
        </div>
      )}

      <div className="plan-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2><Leaf size={19} /> Recommendations</h2>
              <p>Generate sustainability suggestions.</p>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={() =>
              requestData(
                "recommendations/generate",
                setRecommendations,
                "recommendations"
              )
            }
            disabled={!!loading || !country.trim()}
          >
            {loading === "recommendations"
              ? "Generating..."
              : "Generate Recommendations"}
          </button>

          <div className="plan-output">
            {recommendations
              ? renderData(recommendations)
              : <p className="muted">Recommendations will appear here.</p>}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2><ClipboardList size={19} /> Action Plan</h2>
              <p>Create and track sustainability actions.</p>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={() =>
              requestData(
                "action-plan/generate",
                setActionPlan,
                "action plan"
              )
            }
            disabled={!!loading || !country.trim()}
          >
            {loading === "action plan"
              ? "Generating..."
              : "Generate Action Plan"}
          </button>

          <div className="plan-output">
            {actionPlan ? (
              <>
                {renderData(actionPlan)}
                <div className="status-tracker">
                  <h3>Action status tracker</h3>
                  {actions.map((item, index) => (
                    <label className="status-row" key={index}>
                      <span>
                        {typeof item === "string"
                          ? item
                          : item.title || item.action || item.name ||
                            `Action ${index + 1}`}
                      </span>
                      <select
                        value={statuses[index] || "Not started"}
                        onChange={(e) =>
                          setStatuses((previous) => ({
                            ...previous,
                            [index]: e.target.value,
                          }))
                        }
                      >
                        <option>Not started</option>
                        <option>In progress</option>
                        <option>Completed</option>
                      </select>
                    </label>
                  ))}
                </div>
              </>
            ) : (
              <p className="muted">Your action plan will appear here.</p>
            )}
          </div>
        </section>
      </div>

      <section className="panel report-panel">
        <div className="report-icon"><FileText size={24} /></div>
        <div className="report-copy">
          <h2>Sustainability Report</h2>
          <p>Generate a report from the GreenGen backend.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={generateReport}
          disabled={!!loading || !country.trim()}
        >
          {loading === "report" ? (
            <><RefreshCw size={16} /> Preparing...</>
          ) : (
            <><Download size={16} /> Generate PDF Report</>
          )}
        </button>
      </section>
    </div>
  );
}
