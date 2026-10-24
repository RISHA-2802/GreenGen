
import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  BrainCircuit,
  SlidersHorizontal,
  MessageSquareText,
  ClipboardList,
  Leaf,
} from "lucide-react";
import Dashboard from "./pages/Dashboard.jsx";
import Models from "./pages/Models.jsx";
import Optimization from "./pages/Optimization.jsx";
import Assistant from "./pages/Assistant.jsx";
import Plan from "./pages/Plan.jsx";
import "./index.css";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/models", label: "ML Prediction & Comparison", icon: BrainCircuit },
  { to: "/optimization", label: "Optimization", icon: SlidersHorizontal },
  { to: "/assistant", label: "RAG & AI Assistant", icon: MessageSquareText },
  { to: "/plan", label: "Recommendations, Plan & Report", icon: ClipboardList },
];

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon"><Leaf size={23} /></span>
          <div>
            <div className="brand-name">GreenGen</div>
            <div className="brand-subtitle">Sustainability Intelligence</div>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav className="nav-links">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="footer-leaf"><Leaf size={18} /></div>
          <div>
            <div className="footer-title">Build a greener future</div>
            <div className="footer-text">Data-driven sustainability</div>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <div className="topbar-eyebrow">SUSTAINABILITY PLATFORM</div>
            <div className="topbar-title">GreenGen Workspace</div>
          </div>
          <div className="environment-pill">
            <span className="status-dot" />
            India research demo
          </div>
        </header>

        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/models" element={<Models />} />
            <Route path="/optimization" element={<Optimization />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        <footer className="main-footer">
          GreenGen · Sustainability analytics and decision support
        </footer>
      </main>
    </div>
  );
}
