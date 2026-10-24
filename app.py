
import os
import pandas as pd
import streamlit as st
import plotly.express as px

# --------------------------------------------------
# GreenGen configuration
# --------------------------------------------------
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

st.set_page_config(
    page_title="GreenGen | Sustainability Intelligence",
    page_icon="🌱",
    layout="wide",
    initial_sidebar_state="expanded",
)

# --------------------------------------------------
# Styling
# --------------------------------------------------
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
[data-testid="stMetric"] {
    background: white;
    border: 1px solid #dce9df;
    border-radius: 14px;
    padding: 18px;
}
h1, h2, h3 {
    color: #174b35;
}
</style>
""", unsafe_allow_html=True)

# --------------------------------------------------
# Data loading
# --------------------------------------------------
@st.cache_data
def load_csv(filename):
    path = os.path.join(DATA_DIR, filename)

    if not os.path.isfile(path):
        return pd.DataFrame()

    try:
        return pd.read_csv(path)
    except Exception as error:
        st.warning(f"Could not read {filename}: {error}")
        return pd.DataFrame()


forecast = load_csv("greengen_india_forecast_2025.csv")
backtest = load_csv("greengen_india_rolling_backtest.csv")
summary = load_csv("greengen_india_rolling_summary.csv")
active = load_csv("greengen_india_active_learning.csv")
optimization = load_csv("greengen_india_optimization_scenario.csv")
recommendations = load_csv("greengen_india_recommendations.csv")
action_plan = load_csv("greengen_india_action_plan.csv")

# --------------------------------------------------
# Helpers
# --------------------------------------------------
def show_table(data):
    if data.empty:
        st.warning(
            "No data available. Check the CSV file in the repository's data folder."
        )
    else:
        st.dataframe(data, width="stretch", hide_index=True)


def format_number(value, digits=2):
    try:
        if pd.isna(value):
            return "Unavailable"
        return f"{float(value):,.{digits}f}"
    except (ValueError, TypeError):
        return "Unavailable"


def numeric_column(data, column):
    if data.empty or column not in data.columns:
        return pd.Series(dtype="float64")
    return pd.to_numeric(data[column], errors="coerce")


# --------------------------------------------------
# Sidebar navigation
# --------------------------------------------------
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
        "Downloads",
    ],
)

# --------------------------------------------------
# Main header and deployment marker
# --------------------------------------------------
st.success("TEST VERSION — demo-improvement")

st.title("GreenGen")
st.caption(
    "Carbon-emissions forecasting, uncertainty analysis "
    "and sustainability planning"
)
st.info(
    "Current demonstration scope: India. "
    "Confirm the source dataset's units before interpreting emissions values."
)

# --------------------------------------------------
# Forecast summary
# --------------------------------------------------
gpr_value = None

if (
    not forecast.empty
    and {"model", "predicted_co2"}.issubset(forecast.columns)
):
    gpr_rows = forecast[
        forecast["model"].astype(str).str.upper().eq("GPR")
    ]
    if not gpr_rows.empty:
        gpr_value = gpr_rows["predicted_co2"].iloc[0]

backtest_years = (
    backtest["year"].nunique()
    if not backtest.empty and "year" in backtest.columns
    else None
)

# ==================================================
# DASHBOARD
# ==================================================
if page == "Dashboard":
    st.subheader("India Sustainability Overview")

    col1, col2, col3 = st.columns(3)

    col1.metric("Forecast year", "2025")
    col2.metric("GPR forecast", format_number(gpr_value))
    col3.metric(
        "Backtest years",
        str(backtest_years) if backtest_years is not None else "Unavailable",
    )

    st.warning(
        "The 2025 value is a model prediction, not a verified observation. "
        "The physical unit of the emissions data has not yet been confirmed."
    )

    # Historical observations
    if {"year", "actual"}.issubset(backtest.columns):
        st.subheader("Historical India Backtest")

        chart_data = backtest[["year", "actual"]].copy()
        chart_data["year"] = numeric_column(chart_data, "year")
        chart_data["actual"] = numeric_column(chart_data, "actual")
        chart_data = chart_data.dropna()

        if not chart_data.empty:
            yearly_data = (
                chart_data.groupby("year", as_index=False)["actual"]
                .mean()
                .sort_values("year")
            )

            fig = px.line(
                yearly_data,
                x="year",
                y="actual",
                markers=True,
                title="Observed values by backtest year",
                template="plotly_white",
            )
            fig.update_layout(
                xaxis_title="Year",
                yaxis_title="CO₂ value (unit unverified)",
            )
            st.plotly_chart(fig, width="stretch")
        else:
            st.info("No valid historical observations are available.")

    # Model performance
    if {"model", "MAE"}.issubset(summary.columns):
        st.subheader("Model Performance")

        model_data = summary.copy()
        model_data["MAE"] = numeric_column(model_data, "MAE")
        model_data = model_data.dropna(subset=["MAE"]).sort_values("MAE")

        if not model_data.empty:
            fig = px.bar(
                model_data,
                x="model",
                y="MAE",
                text="MAE",
                title="Mean Absolute Error — lower is better",
                template="plotly_white",
            )
            fig.update_traces(texttemplate="%{text:.2f}", textposition="outside")
            fig.update_layout(yaxis_title="MAE")
            st.plotly_chart(fig, width="stretch")

    st.caption(
        "GreenGen is a research prototype. Forecasts and scenario outputs "
        "depend on the available data and assumptions."
    )

# ==================================================
# FORECAST & MODELS
# ==================================================
elif page == "Forecast & Models":
    st.subheader("Forecast and Model Comparison")

    if not forecast.empty:
        st.markdown("### India 2025 Forecasts")
        show_table(forecast)

        if {"model", "predicted_co2"}.issubset(forecast.columns):
            plot_data = forecast.copy()
            plot_data["predicted_co2"] = numeric_column(
                plot_data, "predicted_co2"
            )
            plot_data = plot_data.dropna(subset=["predicted_co2"])

            if not plot_data.empty:
                fig = px.bar(
                    plot_data,
                    x="model",
                    y="predicted_co2",
                    text="predicted_co2",
                    title="Model predictions for 2025",
                    template="plotly_white",
                )
                fig.update_traces(
                    texttemplate="%{text:.2f}",
                    textposition="outside",
                )
                fig.update_layout(
                    yaxis_title="Predicted CO₂ value (unit unverified)"
                )
                st.plotly_chart(fig, width="stretch")
    else:
        st.warning("Forecast CSV is missing.")

    st.markdown("### Rolling Backtest Model Comparison")
    show_table(summary)

    if {"model", "MAE"}.issubset(summary.columns):
        plot_data = summary.copy()
        plot_data["MAE"] = numeric_column(plot_data, "MAE")
        plot_data = plot_data.dropna(subset=["MAE"]).sort_values("MAE")

        if not plot_data.empty:
            fig = px.bar(
                plot_data,
                x="model",
                y="MAE",
                title="Model MAE — lower is better",
                template="plotly_white",
            )
            st.plotly_chart(fig, width="stretch")

    with st.expander("View individual backtest predictions"):
        show_table(backtest)

# ==================================================
# ACTIVE LEARNING
# ==================================================
elif page == "Active Learning":
    st.subheader("Uncertainty-Based Candidate Ranking")

    st.write(
        "This page displays saved candidate rankings based on model uncertainty. "
        "It does not imply that new real-world emissions labels have been collected."
    )

    if not active.empty:
        if "predictive_std" in active.columns:
            plot_data = active.copy()
            plot_data["predictive_std"] = numeric_column(
                plot_data, "predictive_std"
            )
            plot_data = plot_data.dropna(subset=["predictive_std"])

            if not plot_data.empty:
                x_col = "year" if "year" in plot_data.columns else None

                if x_col:
                    fig = px.bar(
                        plot_data,
                        x=x_col,
                        y="predictive_std",
                        title="Prediction uncertainty by year",
                        template="plotly_white",
                    )
                    st.plotly_chart(fig, width="stretch")

        show_table(active)

        st.caption(
            "Future population values may be illustrative projections. "
            "Uncertainty rankings should not be interpreted as verified future outcomes."
        )
    else:
        st.warning("Active Learning CSV is missing.")

# ==================================================
# OPTIMIZATION
# ==================================================
elif page == "Optimization":
    st.subheader("Scenario-Based Optimization")

    st.write(
        "Review the saved optimization scenario. Its reductions are illustrative "
        "assumptions, not independently verified real-world emissions savings."
    )

    if not optimization.empty:
        show_table(optimization)

        numeric_cols = optimization.select_dtypes(
            include="number"
        ).columns.tolist()

        if numeric_cols:
            st.markdown("### Numeric outputs")
            st.write(", ".join(numeric_cols))
    else:
        st.warning("Optimization CSV is missing.")

# ==================================================
# RECOMMENDATIONS
# ==================================================
elif page == "Recommendations":
    st.subheader("Sustainability Recommendations")

    st.write(
        "Review the recommendations saved by the current GreenGen data pipeline."
    )

    show_table(recommendations)

    st.caption(
        "Treat recommendations as planning suggestions unless their benefits "
        "have been independently measured."
    )

# ==================================================
# ACTION PLAN
# ==================================================
elif page == "Action Plan":
    st.subheader("Sustainable Action Plan")

    show_table(action_plan)

    st.caption(
        "The listed actions are proposals. Track implementation and verify "
        "any emissions reductions separately."
    )

# ==================================================
# DOWNLOADS
# ==================================================
elif page == "Downloads":
    st.subheader("Download GreenGen Outputs")

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
        filepath = os.path.join(DATA_DIR, filename)

        if os.path.isfile(filepath):
            try:
                with open(filepath, "rb") as file:
                    st.download_button(
                        label=f"Download {filename}",
                        data=file.read(),
                        file_name=filename,
                        mime="text/csv",
                        key=f"download_{filename}",
                    )
            except OSError as error:
                st.error(f"Could not prepare {filename}: {error}")
        else:
            st.warning(f"File not found: {filename}")

# --------------------------------------------------
# Footer
# --------------------------------------------------
st.divider()
st.caption("GreenGen • India-focused sustainability research prototype")
