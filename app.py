
import os
import pandas as pd
import streamlit as st
import plotly.express as px

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

st.set_page_config(
    page_title="GreenGen | Sustainability Intelligence",
    page_icon="🌱",
    layout="wide"
)

st.markdown("""
<style>
.stApp {
    background: linear-gradient(135deg, #f5faf6, #edf5ef);
}
[data-testid="stSidebar"] {
    background: #103c2c;
}
[data-testid="stSidebar"] * {
    color: white !important;
}
[data-testid="stMetric"] {
    background: white;
    border: 1px solid #dce9df;
    padding: 18px;
    border-radius: 14px;
}
h1, h2, h3 {
    color: #174b35;
}
</style>
""", unsafe_allow_html=True)


@st.cache_data
def load_csv(filename):
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        return pd.DataFrame()
    try:
        return pd.read_csv(path)
    except Exception:
        return pd.DataFrame()


forecast = load_csv("greengen_india_forecast_2025.csv")
backtest = load_csv("greengen_india_rolling_backtest.csv")
summary = load_csv("greengen_india_rolling_summary.csv")
active = load_csv("greengen_india_active_learning.csv")
optimization = load_csv("greengen_india_optimization_scenario.csv")
recommendations = load_csv("greengen_india_recommendations.csv")
action_plan = load_csv("greengen_india_action_plan.csv")


def show_table(df):
    if df.empty:
        st.warning("No data available. Check that the required CSV exists in data/.")
    else:
        st.dataframe(df, use_container_width=True, hide_index=True)


def number(value, digits=2):
    try:
        if pd.isna(value):
            return "Unavailable"
        return f"{float(value):,.{digits}f}"
    except (TypeError, ValueError):
        return "Unavailable"


st.sidebar.title("🌱 GreenGen")
st.sidebar.caption("Sustainability Intelligence")
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
st.caption("Carbon-emissions forecasting, uncertainty analysis and sustainability planning")
st.info("Current demonstration scope: India. Emissions units must be confirmed from the source dataset.")

gpr = (
    forecast[forecast["model"].astype(str).str.upper().eq("GPR")]
    if not forecast.empty and {"model", "predicted_co2"}.issubset(forecast.columns)
    else pd.DataFrame()
)
gpr_value = gpr["predicted_co2"].iloc[0] if not gpr.empty else None

if page == "Dashboard":
    st.subheader("India Sustainability Overview")

    c1, c2, c3 = st.columns(3)
    c1.metric("Forecast year", "2025")
    c2.metric("GPR forecast", number(gpr_value))
    c3.metric(
        "Backtest years",
        str(backtest["year"].nunique())
        if not backtest.empty and "year" in backtest.columns
        else "Unavailable"
    )

    st.warning(
        "The 2025 value is a model prediction, not a verified observation. "
        "Its physical unit has not yet been confirmed."
    )

    if not backtest.empty and {"year", "actual"}.issubset(backtest.columns):
        st.subheader("Historical observations")
        actual_data = backtest.dropna(subset=["year", "actual"])
        if not actual_data.empty:
            actual_by_year = actual_data.groupby("year", as_index=False)["actual"].mean()
            fig = px.line(
                actual_by_year,
                x="year",
                y="actual",
                markers=True,
                title="Observed values by backtest year"
            )
            fig.update_layout(
                template="plotly_white",
                xaxis_title="Year",
                yaxis_title="CO₂ value (unit unverified)"
            )
            st.plotly_chart(fig, use_container_width=True)

    if not summary.empty and {"model", "MAE"}.issubset(summary.columns):
        st.subheader("Model performance at a glance")
        chart_data = summary.dropna(subset=["MAE"]).sort_values("MAE")
        if not chart_data.empty:
            fig = px.bar(
                chart_data,
                x="model",
                y="MAE",
                title="Mean Absolute Error (lower is better)",
                text_auto=".2f"
            )
            fig.update_layout(template="plotly_white", xaxis_title="Model")
            st.plotly_chart(fig, use_container_width=True)

    st.caption("Research prototype • Results depend on the supplied data and assumptions.")

elif page == "Forecast & Models":
    st.subheader("Forecast and Model Comparison")

    if not forecast.empty:
        show_table(forecast)
        if {"model", "predicted_co2"}.issubset(forecast.columns):
            fig = px.bar(
                forecast,
                x="model",
                y="predicted_co2",
                title="India 2025 model predictions",
                text_auto=".2f"
            )
            fig.update_layout(
                template="plotly_white",
                yaxis_title="Predicted CO₂ value (unit unverified)"
            )
            st.plotly_chart(fig, use_container_width=True)
    else:
        st.warning("Forecast CSV is missing.")

    st.subheader("Rolling Backtest Results")
    show_table(summary)

    if not summary.empty and {"model", "MAE"}.issubset(summary.columns):
        fig = px.bar(
            summary.sort_values("MAE"),
            x="model",
            y="MAE",
            title="Model MAE comparison — lower is better",
            text_auto=".2f"
        )
        fig.update_layout(template="plotly_white")
        st.plotly_chart(fig, use_container_width=True)

    with st.expander("View individual backtest predictions"):
        show_table(backtest)

elif page == "Active Learning":
    st.subheader("Uncertainty-Based Candidate Ranking")
    st.write(
        "This section ranks candidate future observations by model uncertainty. "
        "It does not mean new real-world labels have already been collected."
    )

    if not active.empty:
        if "predictive_std" in active.columns:
            chart_data = active.copy()
            chart_data["predictive_std"] = pd.to_numeric(
                chart_data["predictive_std"], errors="coerce"
            )
            chart_data = chart_data.dropna(subset=["predictive_std"])
            if not chart_data.empty:
                x_col = "year" if "year" in chart_data.columns else chart_data.columns[0]
                fig = px.bar(
                    chart_data,
                    x=x_col,
                    y="predictive_std",
                    title="Prediction uncertainty by candidate",
                    template="plotly_white"
                )
                st.plotly_chart(fig, use_container_width=True)

        show_table(active)
        st.caption(
            "Future population values may be illustrative projections. "
            "Observed emissions labels are not available for these candidates."
        )
    else:
        st.warning("Active Learning CSV is missing.")

elif page == "Optimization":
    st.subheader("Scenario-Based Optimization")
    st.write(
        "Explore the saved scenario and its assumed emissions reduction. "
        "These results are illustrative, not verified real-world savings."
    )

    if not optimization.empty:
        show_table(optimization)

        numeric_cols = optimization.select_dtypes(include="number").columns.tolist()
        if numeric_cols:
            st.caption("Numeric values available in the saved scenario:")
            st.write(", ".join(numeric_cols))
    else:
        st.warning("Optimization CSV is missing.")

elif page == "Recommendations":
    st.subheader("Sustainability Recommendations")
    st.write("Review the recommendations generated by the current project pipeline.")
    show_table(recommendations)

    st.caption(
        "Recommendations should be treated as planning suggestions unless "
        "their benefits have been independently measured."
    )

elif page == "Action Plan":
    st.subheader("Sustainable Action Plan")
    show_table(action_plan)

    st.caption(
        "The listed actions are proposed activities; completion and emissions "
        "reductions should be verified separately."
    )

elif page == "Downloads":
    st.subheader("Download Project Results")
    files = [
        "greengen_india_rolling_summary.csv",
        "greengen_india_rolling_backtest.csv",
        "greengen_india_forecast_2025.csv",
        "greengen_india_active_learning.csv",
        "greengen_india_optimization_scenario.csv",
        "greengen_india_recommendations.csv",
        "greengen_india_action_plan.csv",
    ]

    for filename in files:
        path = os.path.join(DATA_DIR, filename)
        if os.path.exists(path):
            with open(path, "rb") as file:
                st.download_button(
                    label=f"Download {filename}",
                    data=file.read(),
                    file_name=filename,
                    mime="text/csv",
                    key=filename
                )
        else:
            st.caption(f"Not found: {filename}")

st.divider()
st.caption("GreenGen • India-focused sustainability research prototype")
