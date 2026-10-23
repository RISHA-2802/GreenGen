import os
import pandas as pd
import streamlit as st
import plotly.express as px

REPORT_DIR = os.path.join(os.path.dirname(__file__), "data")

st.set_page_config(
    page_title="GreenGen | India Sustainability Intelligence",
    page_icon="🌱",
    layout="wide"
)

st.markdown("""
<style>
.stApp {
    background: linear-gradient(135deg, #f5faf6, #edf5ef);
}
[data-testid="stSidebar"] {
    background-color: #103c2c;
}
[data-testid="stSidebar"] * {
    color: white !important;
}
.metric-card {
    background: white;
    padding: 18px;
    border-radius: 14px;
    border: 1px solid #dce9df;
}
</style>
""", unsafe_allow_html=True)

def load_csv(filename):
    path = os.path.join(REPORT_DIR, filename)
    if os.path.exists(path):
        return pd.read_csv(path)
    return pd.DataFrame()

forecast = load_csv("greengen_india_forecast_2025.csv")
backtest = load_csv("greengen_india_rolling_backtest.csv")
summary = load_csv("greengen_india_rolling_summary.csv")
active = load_csv("greengen_india_active_learning.csv")
optimization = load_csv("greengen_india_optimization_scenario.csv")
recommendations = load_csv("greengen_india_recommendations.csv")
action_plan = load_csv("greengen_india_action_plan.csv")

st.sidebar.title("🌱 GreenGen")
st.sidebar.caption("India Sustainability Intelligence")
page = st.sidebar.radio(
    "Navigate",
    [
        "Dashboard",
        "Forecast & Models",
        "Active Learning",
        "Optimization",
        "Recommendations",
        "Action Plan",
        "Downloads"
    ]
)

st.title("GreenGen")
st.caption("Generative AI Platform for Carbon Footprint Optimization")
st.info("All displayed results are restricted to India.")

if page == "Dashboard":
    st.subheader("India Overview")

    gpr = forecast.loc[forecast["model"].eq("GPR")] if not forecast.empty else pd.DataFrame()
    baseline = float(gpr["predicted_co2"].iloc[0]) if not gpr.empty else None

    c1, c2, c3 = st.columns(3)
    c1.metric("Forecast year", "2025")
    c2.metric(
        "GPR forecast",
        f"{baseline:,.2f}" if baseline is not None else "Unavailable"
    )
    c3.metric(
        "Backtest years",
        str(int(backtest["year"].nunique())) if not backtest.empty else "Unavailable"
    )

    st.warning(
        "The 2025 value is a model forecast, not verified actual emissions. "
        "Confirm dataset units before interpreting its magnitude."
    )

    if not backtest.empty:
        st.subheader("Historical India Backtest")
        fig = px.line(
            backtest,
            x="year",
            y="actual",
            markers=True,
            title="Observed India CO₂ values in the backtest period"
        )
        st.plotly_chart(fig, use_container_width=True)

elif page == "Forecast & Models":
    st.subheader("2025 India Forecast")
    if not forecast.empty:
        st.dataframe(forecast, use_container_width=True)
        fig = px.bar(
            forecast,
            x="model",
            y="predicted_co2",
            title="Model forecasts for India — 2025"
        )
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.warning("Forecast CSV is missing.")

    if not summary.empty:
        st.subheader("Rolling Backtest Model Comparison")
        st.dataframe(summary, use_container_width=True)
        fig = px.bar(
            summary,
            x="model",
            y="MAE",
            title="Mean Absolute Error — lower is better"
        )
        st.plotly_chart(fig, use_container_width=True)

    if not backtest.empty:
        st.subheader("Backtest predictions")
        st.dataframe(backtest, use_container_width=True)

elif page == "Active Learning":
    st.subheader("Uncertainty-Based Candidate Ranking")
    if not active.empty:
        st.dataframe(active, use_container_width=True)
        st.caption(
            "Future population values may be illustrative projections. "
            "No new observed emissions labels have been acquired."
        )
    else:
        st.warning("Active Learning CSV is missing.")

elif page == "Optimization":
    st.subheader("Scenario-Based Optimization")
    if not optimization.empty:
        st.dataframe(optimization, use_container_width=True)
        st.warning(
            "Scenario reductions are illustrative assumptions, not measured "
            "or verified emissions savings."
        )
    else:
        st.warning("Optimization CSV is missing.")

elif page == "Recommendations":
    st.subheader("India Recommendations")
    if not recommendations.empty:
        st.dataframe(recommendations, use_container_width=True)
    else:
        st.warning("Recommendations CSV is missing.")

elif page == "Action Plan":
    st.subheader("Sustainable Action Plan")
    if not action_plan.empty:
        st.dataframe(action_plan, use_container_width=True)
    else:
        st.warning("Action plan CSV is missing.")

elif page == "Downloads":
    st.subheader("Download GreenGen outputs")
    for filename in [
        "greengen_india_rolling_summary.csv",
        "greengen_india_rolling_backtest.csv",
        "greengen_india_forecast_2025.csv",
        "greengen_india_active_learning.csv",
        "greengen_india_optimization_scenario.csv",
        "greengen_india_recommendations.csv",
        "greengen_india_action_plan.csv",
    ]:
        path = os.path.join(REPORT_DIR, filename)
        if os.path.exists(path):
            with open(path, "rb") as f:
                st.download_button(
                    label=f"Download {filename}",
                    data=f.read(),
                    file_name=filename,
                    mime="text/csv"
                )

st.divider()
st.caption("GreenGen • India-only research prototype")
