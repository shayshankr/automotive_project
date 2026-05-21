import streamlit as st
import pandas as pd
from loading_file import fetch_data
from search import search_application

st.set_page_config(
    page_title="Ireland Visa Decision Checker – New Delhi",
    page_icon="🇮🇪",
    layout="centered",
)

BASE_URL = "https://www.ireland.ie/en/india/newdelhi/services/visas/processing-times-and-decisions/"

st.title("Visa Application Status Checker")
st.caption("New Delhi Embassy · Data sourced from ireland.ie")

# ── How to use (original feature) ────────────────────────────────────────────
with st.expander("How to use this tool"):
    st.markdown("""
    1. Enter your 8-digit application number like `83276171` or with prefix `IRL83276171`
    2. Get instant status check.
    3. See nearest processed numbers if yours isn't found.
    4. Please share with your family and friends this application.
    5. More than 4130+ people have used this application as of April 2026. Last week usage 200 people.
    6. Contact the developer if any issues while using this application.
    7. #irelandvisaresult #ireland #AIforgood #studentinireland #irelandeducation #NCIcollege #NCI
    """)

# ── Load data ─────────────────────────────────────────────────────────────────
with st.spinner("Loading latest visa decisions…"):
    df, meta = fetch_data()

if df is None:
    st.error(f"Could not load data: {meta}")
    st.stop()

st.success(f"**{meta}**" if meta else "Data loaded.")

# ── Stats row ─────────────────────────────────────────────────────────────────
total = len(df)
decisions = df["Decision"].value_counts()
col1, col2, col3 = st.columns(3)
col1.metric("Total Decisions", total)
col2.metric("Approved", int(decisions.get("Approved", decisions.get("Granted", 0))))
col3.metric("Refused", int(decisions.get("Refused", decisions.get("Rejected", 0))))

st.divider()

# ── Search ────────────────────────────────────────────────────────────────────
st.subheader("Check your application")
st.caption("Valid formats: `63690452` · `IRL63690452` · `irl63690452` — exactly 8 digits, optional IRL prefix")

application_number = st.text_input(
    "Enter Application Number:",
    placeholder="e.g. IRL63690452 or 63690452",
    max_chars=11,  # IRL (3) + 8 digits = 11 max
)

if st.button("Search"):
    if application_number:
        search_application(application_number, df)
    else:
        st.warning("Please enter an Application Number to search.")

st.divider()

# ── Download full dataset ─────────────────────────────────────────────────────
csv = df.to_csv(index=False).encode("utf-8")
st.download_button(
    label="⬇️ Download full dataset (CSV)",
    data=csv,
    file_name="ireland_visa_decisions.csv",
    mime="text/csv",
)

# ── Error fallback (original feature) ────────────────────────────────────────
with st.expander("If any error click on me"):
    st.markdown(f"""
    1. Visit the [original website]({BASE_URL}) and download the file.
    2. Mostly the error is due to the file not being available on the server.
       Once the embassy website has the file, this application will work.
    """)

st.caption(f"Data refreshes every hour. [Source]({BASE_URL})")
