import re
import pandas as pd
import streamlit as st


def normalize_app_number(value: str) -> str:
    """Strip optional IRL/irl prefix and whitespace so all formats match."""
    return value.strip().upper().removeprefix("IRL")


def validate_input(raw: str) -> tuple[bool, str, str]:
    """
    Validate the user's raw input string.
    Returns (is_valid, error_message, normalized_8digit_number).
    Accepts: 12345678 | IRL12345678 | irl12345678
    """
    raw = raw.strip()
    if not raw:
        return False, "", ""

    upper = raw.upper()

    if not re.match(r'^[A-Za-z0-9]+$', raw):
        return False, "❌ No spaces or special characters allowed. Use format: `IRL12345678` or `12345678`", ""

    if upper.startswith("IRL"):
        numeric_part = raw[3:]
        if not numeric_part.isdigit():
            return False, "❌ After `IRL` only digits are allowed. Example: `IRL63690452`", ""
    else:
        if not raw.isdigit():
            letters_found = "".join(sorted(set(c for c in upper if c.isalpha())))
            if upper[-1].isalpha():
                return False, f"❌ Letters must come at the **start** as `IRL` prefix only. Found `{letters_found}` at end.", ""
            return False, f"❌ Only the prefix `IRL` is allowed. Found unexpected letters: `{letters_found}`. Use `IRL12345678` or `12345678`", ""
        numeric_part = raw

    if len(numeric_part) < 8:
        return False, f"❌ Too short ({len(numeric_part)} digits). Must be exactly **8 digits**. Example: `IRL63690452`", ""
    if len(numeric_part) > 8:
        return False, f"❌ Too long ({len(numeric_part)} digits). Must be exactly **8 digits**. Example: `IRL63690452`", ""

    return True, "", numeric_part


def _decision_badge(decision_val: str) -> str:
    """Return an HTML-coloured decision string."""
    d = decision_val.lower()
    if "approv" in d or "grant" in d:
        return f'<span style="color:#1e7e34;font-weight:600">{decision_val}</span>'
    if "refus" in d or "reject" in d:
        return f'<span style="color:#c0392b;font-weight:600">{decision_val}</span>'
    return decision_val


def _html_nearest_table(dataframe: pd.DataFrame) -> str:
    """Render the nearest-numbers DataFrame as a coloured HTML table."""
    rows = ""
    for _, row in dataframe.iterrows():
        rows += (
            f"<tr>"
            f"<td style='padding:6px'>{row['Nearest Application']}</td>"
            f"<td style='padding:6px;text-align:right'>{row['Application Number']}</td>"
            f"<td style='padding:6px'>{_decision_badge(str(row['Decision']))}</td>"
            f"<td style='padding:6px;text-align:right'>{row['Difference']}</td>"
            f"</tr>"
        )
    return (
        "<table style='width:100%;border-collapse:collapse;font-size:14px'>"
        "<thead><tr style='border-bottom:2px solid #ddd'>"
        "<th style='text-align:left;padding:6px'>Nearest Application</th>"
        "<th style='text-align:right;padding:6px'>Application Number</th>"
        "<th style='text-align:left;padding:6px'>Decision</th>"
        "<th style='text-align:right;padding:6px'>Difference</th>"
        "</tr></thead>"
        f"<tbody>{rows}</tbody></table>"
    )


def _do_search(application_number: str, df: pd.DataFrame):
    """Validate input, search the DataFrame, and render the result."""
    is_valid, error_msg, normalized = validate_input(application_number)

    if not is_valid:
        if error_msg:
            st.error(error_msg)
        return

    df_normalized = df["Application Number"].apply(normalize_app_number)
    result = df[df_normalized == normalized]

    if not result.empty:
        decision = result.iloc[0]["Decision"]
        app_num = result.iloc[0]["Application Number"]
        d = decision.lower()
        if "approv" in d or "grant" in d:
            st.success(f"**Application {app_num} — Decision: {decision}** ✅")
        elif "refus" in d or "reject" in d:
            st.error(f"**Application {app_num} — Decision: {decision}** ❌")
        else:
            st.info(f"**Application {app_num} — Decision: {decision}**")
        return

    st.warning(f"No record found for Application Number: {normalized}.")

    try:
        query_int = int(normalized)
        nums = (
            df["Application Number"]
            .apply(lambda x: int(normalize_app_number(x)) if normalize_app_number(x).isdigit() else None)
            .dropna()
            .astype(int)
        )

        below = nums[nums < query_int]
        above = nums[nums > query_int]

        nearest_rows = []
        if not below.empty:
            n = below.max()
            row = df[nums == n].iloc[0]
            nearest_rows.append({
                "Nearest Application": "Before",
                "Application Number": str(row["Application Number"]),
                "Decision": row["Decision"],
                "Difference": query_int - n,
            })
        if not above.empty:
            n = above.min()
            row = df[nums == n].iloc[0]
            nearest_rows.append({
                "Nearest Application": "After",
                "Application Number": str(row["Application Number"]),
                "Decision": row["Decision"],
                "Difference": n - query_int,
            })

        if nearest_rows:
            st.subheader("Nearest Application Numbers")
            st.markdown(_html_nearest_table(pd.DataFrame(nearest_rows)), unsafe_allow_html=True)
        else:
            st.info("No nearest application numbers found.")

    except ValueError:
        st.error("Invalid Application Number format. Please enter a numeric value.")


def search_application(df: pd.DataFrame):
    """Render the search UI and handle a query against the given DataFrame."""
    st.caption(
        "Valid formats: `63690452` · `IRL63690452` · `irl63690452` — exactly 8 digits, optional IRL prefix"
    )

    application_number = st.text_input(
        "Enter Application Number:",
        placeholder="e.g. IRL63690452 or 63690452",
        max_chars=11,  # IRL (3) + 8 digits = 11 max
    )

    if st.button("Search"):
        if application_number:
            _do_search(application_number, df)
        else:
            st.warning("Please enter an Application Number to search.")
