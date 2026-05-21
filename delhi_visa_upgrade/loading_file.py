import requests
import pandas as pd
import streamlit as st
from io import BytesIO
from bs4 import BeautifulSoup

BASE_URL = "https://www.ireland.ie/en/india/newdelhi/services/visas/processing-times-and-decisions/"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
    )
}


@st.cache_data(ttl=3600, max_entries=1)
def fetch_data():
    """Fetch and parse the visa decisions ODS file. Returns (df, period_label)."""
    try:
        response = requests.get(BASE_URL, headers=HEADERS, timeout=15)
        response.raise_for_status()
    except requests.RequestException as e:
        return None, str(e)

    soup = BeautifulSoup(response.content, "html.parser")
    file_url = None
    period_label = None

    for link in soup.find_all("a"):
        text = link.get_text(strip=True)
        if "Visa decisions made from" in text and "January" in text:
            file_url = link.get("href", "")
            period_label = text
            if not file_url.startswith("http"):
                file_url = requests.compat.urljoin(BASE_URL, file_url)
            break

    if not file_url:
        return None, "Could not find the visa decisions file link on the website."

    try:
        ods_response = requests.get(file_url, headers=HEADERS, timeout=30)
        ods_response.raise_for_status()
    except requests.RequestException as e:
        return None, str(e)

    try:
        raw = pd.read_excel(BytesIO(ods_response.content), engine="odf", header=None)
    except Exception as e:
        return None, f"Failed to parse ODS file: {e}"

    # Find the header row dynamically — works regardless of how many metadata rows precede it
    header_row = None
    for i, row in raw.iterrows():
        vals = [str(v).lower() for v in row.values]
        if any("application number" in v for v in vals):
            header_row = i
            break

    if header_row is None:
        return None, "Could not locate the 'Application Number' header in the file."

    df = raw.iloc[header_row + 1:].copy()
    df = df.iloc[:, 2:4].copy()  # real data lives in columns 2 & 3
    df.columns = ["Application Number", "Decision"]
    df.dropna(how="all", inplace=True)
    df = df[df["Application Number"].astype(str).str.strip().str.lower() != "application number"]
    df.reset_index(drop=True, inplace=True)
    df["Application Number"] = df["Application Number"].astype(str).str.strip()
    df["Decision"] = df["Decision"].astype(str).str.strip()

    return df, period_label


def load_data_file() -> tuple:
    """
    Present two options: auto-fetch from ireland.ie or manual file upload.
    Returns (file_bytes_or_None, filename_or_error_string).
    """
    source = st.radio(
        "Data source",
        ["Auto-fetch from ireland.ie", "Upload ODS file manually"],
        horizontal=True,
    )

    if source == "Auto-fetch from ireland.ie":
        with st.spinner("Fetching latest visa decisions from ireland.ie…"):
            df, meta = fetch_data()
        if df is None:
            st.error(f"Could not fetch data: {meta}")
            return None, None
        # Serialise to bytes so prepare_dataframe can handle a unified format
        buf = BytesIO()
        df.to_pickle(buf)
        buf.seek(0)
        return buf, meta or "ireland.ie auto-fetch"

    uploaded = st.file_uploader(
        "Upload the visa decisions ODS file",
        type=["ods", "xlsx", "xls"],
    )
    if uploaded is None:
        return None, None
    return BytesIO(uploaded.read()), uploaded.name
