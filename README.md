# Automotive After-Sales Customer Churn Prediction

> A **privacy-first, future-proof** ML solution that identifies High / Medium / Low risk customers in an automotive dealership's after-sales ecosystem — built around DPDP Act 2023 / GDPR compliance, Green-AI principles, and a star-schema data model.

---

## Table of Contents

- [Business Problem](#business-problem)
- [Solution Highlights](#solution-highlights)
- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [Quick Start](#quick-start)
- [Detailed Usage](#detailed-usage)
- [Results](#results)
- [Data Governance](#data-governance)
- [ML Pipeline](#ml-pipeline)
- [SQL Query Catalogue](#sql-query-catalogue)
- [Validation & Testing](#validation--testing)
- [Documentation](#documentation)
- [Tech Stack](#tech-stack)
- [Author](#author)

---

## Business Problem

A multi-brand automotive dealer is losing customers in the post-warranty / post-first-policy window. The dealership has fragmented data across **Sales, Service, and Insurance** silos and cannot identify which customers are about to churn.

**Objective:** Predict each customer's churn probability, classify them into **High / Medium / Low** risk tiers, and recommend a targeted retention action — without violating data-privacy regulations.

**Bottom line:** INR 1,05,000 of annual revenue at risk in the dummy dataset (7 high-risk customers × INR 15,000 average annual spend). Scales to crores in production.

---

## Solution Highlights

| Pillar | What I Did | Why It Matters |
|---|---|---|
| **Schema Redesign** | Rebuilt empty Customer/Vehicle sheets into a 21-sheet star schema with 10 dimensions, 3 facts, masters, bridge, PII vault, analytics output | Eliminates update anomalies, enables future expansion without breaking changes |
| **PII Isolation** | Raw PII lives only in `PII_Vault`; every other sheet uses `cust_id` token | Breach surface minimised — attacker gets only masked data |
| **Data Masking** | Names → `R**** S*****`, mobiles → `98XXXXXX10`, DOB → birth-year only | Compliant with DPDP Act 2023 data-minimisation principle |
| **Alias References** | `dim_Bank`, `dim_Dealer`, `dim_Occupation`, etc., replace raw strings with FK IDs | Referential integrity + smaller breach surface |
| **Green AI** | XGBoost + SHAP feature pruning (>0.01 threshold), no redundant retraining, model lineage tracked | Energy-efficient ML — no overkill deep-nets |
| **Reproducibility** | One-command pipeline + 30 automated validation checks + 70 test cases + BRD | Examiner can rebuild and verify every number from scratch |
| **Visual Output** | Color-coded `Churn_Results` sheet ranks all customers High → Medium → Low | Business users see the answer immediately on opening the file |

---

## Architecture

```
                  ┌─────────────────────────────────────────────────┐
                  │              Task .xlsx (21 sheets)             │
                  └─────────────────────────────────────────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                               │                               │
   ┌─────────┐                    ┌──────────┐                  ┌──────────────┐
   │  DIMS   │                    │  FACTS   │                  │   MASTERS    │
   │ (10)    │                    │ (3)      │                  │   (2 + PII)  │
   ├─────────┤                    ├──────────┤                  ├──────────────┤
   │ Bank    │◄──── financed_by ──┤  Sales   │──── cust_id ────►│ Customer     │
   │ Dealer  │◄──── dealer_id ────┤ Service  │──── vin ────────►│ Vehicle      │
   │ WorkType│◄──── work_type_id ─┤Insurance │──── cust_id ────►│Customer_Veh  │
   │ Policy  │                    └──────────┘                  │ PII_Vault 🔒 │
   │ PayMode │                                                   └──────────────┘
   │ Cancel  │                                                          │
   │ Occupat │                                                          ▼
   │ FuelType│                                            ┌─────────────────────────┐
   │ Locatio │                                            │      ANALYTICS LAYER    │
   │ Mileston│                                            ├─────────────────────────┤
   └─────────┘                                            │ Churn_Features          │
                                                          │ Churn_Scores  (XGBoost) │
                                                          │ Churn_Results (visual)  │
                                                          │ ML_Pipeline   (lineage) │
                                                          └─────────────────────────┘
```

**Tab colour legend:** Gold = dims · Blue = facts · Green = masters · Red = PII vault · Brown = bridge · Purple = analytics · Grey = docs

---

## Repository Structure

```
interview/
├── README.md                          ← you are here
├── Objective_problem.docx             ← original brief from examiner
├── Task .xlsx                         ← main deliverable (21 sheets)
├── Churn_Results_Published.xlsx       ← standalone visual output
├── BRD_and_TestCases.docx             ← Business Requirements Doc + 70 test cases
│
├── solution_code/
│   ├── config.py                      ← all master reference data
│   ├── pii_utils.py                   ← masking functions (name/mobile/email/DOB)
│   ├── excel_utils.py                 ← styling helpers (paint, merge, headers)
│   ├── generate_solution.py           ← builds the 21-sheet workbook
│   ├── validate.py                    ← 30 automated validation checks
│   ├── publish_results.py             ← creates color-coded Churn_Results sheet
│   ├── queries.py                     ← 12 SQL queries (SQLite in-memory)
│   ├── run_solution.py                ← one-command entry point
│   └── create_brd.js                  ← generates BRD_and_TestCases.docx
│
└── temp/                              ← scratch/experimental files
```

---

## Quick Start

```bash
# 1. Clone or download the project
cd interview/

# 2. Install dependencies
pip install pandas openpyxl xgboost shap scikit-learn

# 3. Build the entire workbook from scratch (one command)
python solution_code/run_solution.py

# 4. Run all 12 analytical SQL queries
python solution_code/queries.py

# 5. Open the results
#    - Task .xlsx              → full 21-sheet model
#    - Churn_Results_Published.xlsx → color-coded ranked view
```

> **Windows note:** the filename `Task .xlsx` contains a non-breaking space (U+00A0). Code uses `Task\xa0.xlsx`. If running in a fresh shell, set `PYTHONIOENCODING=utf-8` to avoid `cp1252` print errors.

---

## Detailed Usage

### Regenerate the workbook
```bash
python solution_code/generate_solution.py    # builds Task .xlsx
python solution_code/validate.py             # runs 30 checks
python solution_code/publish_results.py      # adds Churn_Results sheet
```

### Run a single SQL query
```bash
python solution_code/queries.py --query Q2   # just the High-risk list
python solution_code/queries.py --query Q5   # tier summary + revenue at risk
python solution_code/queries.py --query Q9   # geographic breakdown
```

### Regenerate the BRD
```bash
cd interview/
npm install docx                              # one-time
node solution_code/create_brd.js              # produces BRD_and_TestCases.docx
```

---

## Results

### Tier Distribution (30 dummy customers)

| Tier | Count | % | Avg Churn Probability | Avg Days Since Service | Annual Revenue at Risk |
|---|---|---|---|---|---|
| 🔴 **High** | **7** | 23.3% | 0.78 | 225 | **INR 1,05,000** |
| 🟡 Medium | 10 | 33.3% | 0.49 | 346 | INR 1,50,000 |
| 🟢 Low | 13 | 43.3% | 0.16 | 157 | INR 1,95,000 |

### Top 7 High-Risk Customers
`CUST0013` (91.15%) · `CUST0015` (89.55%) · `CUST0023` (85.73%) · `CUST0026` (73.67%) · `CUST0027` (71.34%) · `CUST0021` (71.11%) · `CUST0029` (65.76%)

All flagged for **urgent call + service reminder + policy renewal offer**.

### Top Systemic Churn Drivers (across all customers)
1. `auto_membership_flag` — cited 14× (47%)
2. `vehicle_age_years` — 12× (40%)
3. `avg_bill_amount` — 12× (40%)
4. `num_policy_renewals` — 11× (37%)

### Geographic Hot-Spot
**Noida** — 2 High + 1 Medium of 5 customers = **40% high-risk concentration**. Suggests a dealer-quality audit, not customer behaviour.

---

## Data Governance

This project follows **DPDP Act 2023** (India) and **GDPR** (EU) principles by design, not as an afterthought.

| Principle | Implementation |
|---|---|
| **Purpose Limitation** | Analytics tables use only `cust_id` token. Raw PII never enters the ML feature store. |
| **Data Minimisation** | DOB → birth-year. Address → city + PIN only. Mobile → first-2 + last-2 digits. |
| **Storage Limitation** | PII_Vault has its own retention policy (separate from facts). |
| **Pseudonymisation** | Aliases (`BNK001`, `DLR007`) replace raw strings; lookup is reversible only via dim tables. |
| **Right to Erasure** | Delete from PII_Vault only. Aggregate analytics survive on the anonymised token. |
| **Audit & Lineage** | `ML_Pipeline` sheet logs feature engineering, model version, training date, SHAP threshold. |

---

## ML Pipeline

```
Raw Sources                Feature Engineering              Modelling                 Output
───────────                ───────────────────              ─────────                 ──────
Sales      ──┐                                          ┌─► XGBoost ──► churn_probability
Service    ──┤                                          │                  │
Insurance  ──┼──► RFM scores (R, F, M)        ──┐       │                  ▼
Customer   ──┤    Service gap days              │       │              risk_tier
Vehicle    ──┘    Policy expiry days            ├──────►┤              (High/Med/Low)
                  Cancellation rate             │       │                  │
                  AMC membership flag           │       └─► K-Means ──► segment_id
                  Vehicle age years             │                          │
                  Average bill amount           │                          ▼
                  Number of policy renewals     │                     SHAP top-3
                  Number of service visits      │                     drivers per
                  Pct paid services             │                     customer
                  ───────────────────────────────┘
                  14 features after Green-AI pruning (SHAP > 0.01)
```

**Why XGBoost?** Handles mixed types natively, captures non-linear interactions (e.g., `vehicle_age × service_gap`), SHAP-compatible for explainability, lightweight (no GPU needed) — Green-AI compliant.

**Churn label:** `1` if `days_since_last_service > 365` AND `days_to_policy_expiry < 0`. Behavioural ground truth — not circular because the model uses leading indicators (RFM, AMC, cancellations) to predict *before* both conditions trigger.

---

## SQL Query Catalogue

All 12 queries operate on an in-memory SQLite copy of the workbook. Run any subset with `--query QN`.

| # | Query | Purpose |
|---|---|---|
| Q1 | All customers ranked | Full sorted list, masked names |
| Q2 | High-risk only | Urgent action list (7 customers) |
| Q3 | Medium-risk only | Watch list (10 customers) |
| Q4 | Low-risk only | Loyalty programme cohort (13 customers) |
| Q5 | Tier summary + revenue at risk | Executive dashboard |
| Q6 | Top churn drivers | Root-cause analysis |
| Q7 | Critical cohort (expired + 365d+ no service) | Win-back urgent (7 customers) |
| Q8 | Zero policy renewals | Disengaged from ecosystem |
| Q9 | By city | Dealer-network targeting |
| Q10 | By vehicle model | Model-specific campaigns |
| Q11 | Service cancellation rate | Behavioural early warning |
| Q12 | Recoverable (active policy + service gap) | Easy win-back, cheap |

---

## Validation & Testing

### Automated checks (`validate.py`)
30 assertions covering: 21 sheets present, expected row counts, no PII leak in analytics tables, mask-format regex, FK resolution, churn rate within 20–60% band, SHAP drivers populated for every customer.

```bash
python solution_code/validate.py
# Expected: 30/30 PASS
```

### Manual test cases (`BRD_and_TestCases.docx`)
**70 test cases** across 8 categories:
- TC-D (Data integrity) — 10 cases
- TC-G (Governance/PII) — 10 cases
- TC-S (Schema/FK) — 12 cases
- TC-F (Functional/ML) — 15 cases
- TC-M (Masking) — 10 cases
- TC-O (Output/UI) — 5 cases
- TC-E (Edge cases) — 8 cases
- TC-P (Performance) — 5 cases

---

## Documentation

| Artifact | Purpose |
|---|---|
| `README.md` | This file — project overview |
| `BRD_and_TestCases.docx` | A3-landscape Business Requirements Doc (13 sections, 23 functional requirements, RACI matrix, risk register) + 70 test cases |
| `Objective_problem.docx` | Original brief from examiner |
| Inline code comments | Every helper function in `solution_code/` is documented |
| `Task .xlsx → README` sheet | In-workbook quick reference |

---

## Tech Stack

- **Python 3.10+** — pandas, openpyxl, xgboost, shap, scikit-learn, sqlite3
- **Node.js 18+** — `docx` library (for BRD generation)
- **SQLite** (in-memory) — query layer
- **Excel / openpyxl** — workbook output with color coding, freeze panes, tab colors

No cloud dependencies. Runs offline on a laptop in under 30 seconds.

---

## Future Enhancements

- [ ] Containerise with Docker (`requirements.txt` + `Dockerfile`)
- [ ] Add CI pipeline (GitHub Actions → run validate.py on every push)
- [ ] Integrate with a real CRM (Salesforce / Zoho) for outreach automation
- [ ] Add drift monitoring dashboard (PSI / KL-divergence on monthly batches)
- [ ] Stratified k-fold cross-validation when real volume data arrives
- [ ] Champion–challenger A/B harness for model uplift validation

---

## Author

**Shayshank Rathore** — Data & AI Engineer

---

## License

This project was created as an interview deliverable. All sample data is synthetic and contains no real customer information.
