import pandas as pd
import streamlit as st
from io import BytesIO


def _parse_ods_or_excel(buf: BytesIO) -> pd.DataFrame | None:
    """Parse a raw ODS/XLSX buffer and return a cleaned two-column DataFrame."""
    for engine in ("odf", "openpyxl", "xlrd"):
        try:
            buf.seek(0)
            raw = pd.read_excel(buf, engine=engine, header=None)
            break
        except Exception:
            continue
    else:
        st.error("Could not parse the uploaded file. Please upload a valid ODS or Excel file.")
        return None

    # Locate the header row dynamically
    header_row = None
    for i, row in raw.iterrows():
        vals = [str(v).lower() for v in row.values]
        if any("application number" in v for v in vals):
            header_row = i
            break

    if header_row is None:
        st.error("Could not locate the 'Application Number' column header in the file.")
        return None

    df = raw.iloc[header_row + 1:].copy()
    df = df.iloc[:, 2:4].copy()
    df.columns = ["Application Number", "Decision"]
    df.dropna(how="all", inplace=True)
    df = df[df["Application Number"].astype(str).str.strip().str.lower() != "application number"]
    df.reset_index(drop=True, inplace=True)
    df["Application Number"] = df["Application Number"].astype(str).str.strip()
    df["Decision"] = df["Decision"].astype(str).str.strip()
    return df


def prepare_dataframe(data_file: BytesIO) -> pd.DataFrame | None:
    """
    Accept the buffer returned by load_data_file() and return a clean DataFrame.

    Supports two cases:
    - Already-pickled DataFrame (auto-fetch path): detected by trying pd.read_pickle first.
    - Raw ODS/Excel bytes (manual upload path): parsed with _parse_ods_or_excel.
    """
    if data_file is None:
        return None

    # Auto-fetch path: load_data_file serialised the clean DataFrame as pickle
    try:
        data_file.seek(0)
        df = pd.read_pickle(data_file)
        if isinstance(df, pd.DataFrame) and "Application Number" in df.columns:
            return df
    except Exception:
        pass

    # Manual upload path: raw ODS/Excel file
    data_file.seek(0)
    return _parse_ods_or_excel(data_file)
