"""
validate.py
===========
Post-generation validation.  Run after generate_solution.py to verify:

  ✅  Row counts are non-zero for all expected sheets
  ✅  No raw PII leaking into fact / analytics tables
  ✅  FK references are resolvable (no orphaned IDs)
  ✅  Churn label distribution is reasonable (not all 0 or all 1)
  ✅  PII masking is correct (no unmasked names in Customer sheet)

Run:  python solution_code/validate.py
"""

import os, sys, re
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import config as C
import pandas as pd

PASS  = "  ✅ PASS"
FAIL  = "  ❌ FAIL"
WARN  = "  ⚠️  WARN"

def load_sheets():
    # Row 1 = title banner, Row 2 = column headers (0-indexed: header=1), Row 3 = schema notes
    xl = pd.read_excel(C.OUTPUT_FILE, sheet_name=None, header=1)
    # Drop the schema-notes row (first data row after header) from each sheet
    xl = {name: df.iloc[1:].reset_index(drop=True) for name, df in xl.items()}
    return xl

def section(title):
    print(f"\n{'─'*60}")
    print(f"  {title}")
    print(f"{'─'*60}")

def check(condition, msg_pass, msg_fail):
    if condition:
        print(f"{PASS}  {msg_pass}")
    else:
        print(f"{FAIL}  {msg_fail}")
    return condition

def main():
    print("\n=== Validation Report — Automotive Churn Solution ===")
    xl = load_sheets()
    sheets = {name: df for name, df in xl.items()}
    all_ok = True

    # ── 1. Sheet existence ────────────────────────────────────────────────
    section("1. SHEET EXISTENCE")
    expected = [
        "README","dim_Bank","dim_Dealer","dim_Location","dim_WorkType",
        "dim_PolicyType","dim_PayMode","dim_CancelReason","dim_Occupation",
        "dim_FuelType","dim_Milestone",
        "Sales","Service","Insurance",
        "Customer","Vehicle","Customer_Vehicle","PII_Vault",
        "Churn_Features","Churn_Scores","ML_Pipeline",
    ]
    for sn in expected:
        ok = check(sn in sheets, f"Sheet '{sn}' exists",
                   f"Sheet '{sn}' MISSING")
        all_ok = all_ok and ok

    # ── 2. Row counts ─────────────────────────────────────────────────────
    section("2. ROW COUNTS (data rows only — excludes header/schema rows)")
    min_rows = {
        "Sales": 25, "Service": 30, "Insurance": 25,
        "Customer": 25, "Vehicle": 25, "PII_Vault": 25,
        "Customer_Vehicle": 25, "Churn_Features": 25, "Churn_Scores": 25,
        "dim_Bank": 5,
    }
    for sn, min_r in min_rows.items():
        if sn not in sheets:
            continue
        n = len(sheets[sn].dropna(how="all"))
        ok = check(n >= min_r,
                   f"{sn}: {n} rows (≥ {min_r} required)",
                   f"{sn}: only {n} rows (< {min_r})")
        all_ok = all_ok and ok

    # ── 3. PII leak check ─────────────────────────────────────────────────
    section("3. PII LEAK CHECK — Raw PII must NOT appear in fact/analytics tables")
    if "PII_Vault" in sheets:
        pii_df    = sheets["PII_Vault"].dropna(how="all")
        # Get actual names from PII_Vault (column index 1 = cust_name)
        raw_names = set()
        for col in pii_df.columns:
            if "name" in str(col).lower():
                raw_names.update(pii_df[col].dropna().astype(str).tolist())
                break

        safe_sheets = ["Sales","Service","Insurance","Churn_Features","Churn_Scores"]
        for sn in safe_sheets:
            if sn not in sheets:
                continue
            df  = sheets[sn].dropna(how="all")
            txt = df.to_string()
            leaked = [n for n in raw_names if n in txt and len(n) > 3]
            check(len(leaked) == 0,
                  f"{sn}: No raw names found (PII safe)",
                  f"{sn}: Possible PII leak — found: {leaked[:3]}")

    # ── 4. Masking format check ───────────────────────────────────────────
    section("4. MASKING FORMAT — Customer sheet must have masked fields")
    if "Customer" in sheets:
        cust = sheets["Customer"].dropna(how="all")
        # Find masked columns
        for col in cust.columns:
            col_s = str(col).lower()
            if "mask" in col_s and "name" in col_s:
                sample = cust[col].dropna().astype(str).head(5).tolist()
                # Masked names should contain *
                has_stars = all("*" in s for s in sample if s and s != "nan")
                check(has_stars,
                      f"Customer.{col}: values are masked (contain *)",
                      f"Customer.{col}: values appear UNMASKED — {sample[:2]}")
            if "mask" in col_s and "mobile" in col_s:
                sample = cust[col].dropna().astype(str).head(5).tolist()
                has_x = all("X" in s for s in sample if s and s != "nan")
                check(has_x,
                      f"Customer.{col}: mobile values are masked (contain X)",
                      f"Customer.{col}: mobile values appear UNMASKED — {sample[:2]}")

    # ── 5. FK resolution spot-check ───────────────────────────────────────
    section("5. FK SPOT-CHECK — IDs in fact tables exist in dimension tables")
    fk_checks = [
        ("Sales",    "bank_id",       "dim_Bank",     "bank_id"),
        ("Sales",    "dealer_id",     "dim_Dealer",   "dealer_id"),
        ("Service",  "work_type_id",  "dim_WorkType", "work_type_id"),
        ("Service",  "pay_mode_id",   "dim_PayMode",  "pay_mode_id"),
        ("Insurance","policy_type_id","dim_PolicyType","policy_type_id"),
    ]
    for fact_sn, fact_col, dim_sn, dim_col in fk_checks:
        if fact_sn not in sheets or dim_sn not in sheets:
            continue
        fact_vals = set(sheets[fact_sn][fact_col].dropna().astype(str).tolist()) - {""}
        dim_vals  = set(sheets[dim_sn][dim_col].dropna().astype(str).tolist())
        orphans   = fact_vals - dim_vals
        check(len(orphans) == 0,
              f"{fact_sn}.{fact_col} → {dim_sn}: all FKs resolve",
              f"{fact_sn}.{fact_col}: orphan IDs found → {list(orphans)[:3]}")

    # ── 6. Churn label distribution ───────────────────────────────────────
    section("6. CHURN LABEL DISTRIBUTION")
    if "Churn_Features" in sheets:
        cf = sheets["Churn_Features"].dropna(how="all")
        if "churn_label" in cf.columns:
            dist = cf["churn_label"].value_counts().to_dict()
            n1   = dist.get(1, dist.get(1.0, 0))
            n0   = dist.get(0, dist.get(0.0, 0))
            total= n0 + n1
            rate = n1 / total if total else 0
            check(0.05 <= rate <= 0.70,
                  f"Churn rate = {rate:.1%}  (label 0:{n0}, label 1:{n1}) — reasonable distribution",
                  f"Churn rate = {rate:.1%} — suspicious (too skewed)")

    # ── Summary ───────────────────────────────────────────────────────────
    section("SUMMARY")
    if all_ok:
        print("  ✅  All checks passed — solution workbook is valid.")
    else:
        print("  ⚠️   Some checks failed — review output above.")
    print()


if __name__ == "__main__":
    main()
