---
title: Irish Visa Decisions IRL
emoji: ⚡
colorFrom: yellow
colorTo: green
sdk: streamlit
sdk_version: 1.57.0
app_file: main.py
pinned: true
short_description: 'Ireland Visa Decision Tracker for students and travelers. '
license: mit
thumbnail: >-
  https://cdn-uploads.huggingface.co/production/uploads/66d92a9c97cc9bc51e1bb687/RQO79zaP3icsXDFkg7qLZ.png
---

Check out the configuration reference at https://huggingface.co/docs/hub/spaces-config-reference

# Visa Application Status Checker

A Streamlit app that lets applicants instantly check the status of their Irish visa application processed by the **New Delhi Embassy**.

Data is sourced live from [ireland.ie](https://www.ireland.ie/en/india/newdelhi/services/visas/processing-times-and-decisions/) and refreshes every hour.

---

## Features

- Auto-fetches the latest visa decisions ODS file from ireland.ie
- Search by application number in any format: `63690452`, `IRL63690452`, or `irl63690452`
- Colour-coded results — green for approved, red for refused
- Shows nearest processed application numbers if yours isn't found yet
- Manual ODS/Excel file upload as a fallback
- Displays total decisions, approvals, and refusals at a glance
- Full dataset available as a CSV download

## How to Use

1. Enter your 8-digit application number (with or without the `IRL` prefix)
2. Click **Search**
3. If your number isn't found, the app shows the nearest processed numbers above and below yours

## Run Locally

```bash
git clone https://github.com/shayshankr/QA_Testing_visa_application.git
cd QA_Testing_visa_application
pip install -r requirements.txt
streamlit run main.py
```

## Requirements

- Python 3.10+
- See `requirements.txt` for all dependencies

## File Structure

```
├── main.py            # Streamlit app entry point
├── loading_file.py    # Fetches data from ireland.ie or accepts file upload
├── dataframe.py       # Parses and cleans the ODS/Excel data
├── search.py          # Input validation and search logic
└── requirements.txt   # Python dependencies
```

## Data Source

All visa decision data is published by the Irish Embassy, New Delhi:
[https://www.ireland.ie/en/india/newdelhi/services/visas/processing-times-and-decisions/](https://www.ireland.ie/en/india/newdelhi/services/visas/processing-times-and-decisions/)

Data covers decisions made from **1 January 2026** onwards and is updated weekly by the embassy.

---

*Used by 4,000+ applicants. Built to help the Irish visa community in India.*
