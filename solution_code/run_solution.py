"""
run_solution.py
===============
ENTRY POINT — Run this file to regenerate the complete solution.

Usage
-----
  Step 1: Install dependencies
          pip install -r solution_code/requirements.txt

  Step 2: Generate the full workbook (Task .xlsx)
          python solution_code/run_solution.py

  Step 3: Validate the output
          python solution_code/validate.py

What this script does
---------------------
  1. Calls generate_solution.py → builds all 21 sheets in Task .xlsx
  2. Calls validate.py          → verifies data integrity, PII masking, FK checks
  3. Prints a final summary

Files produced
--------------
  Task .xlsx  (in parent directory)
    ├── README              — Instructions & schema overview
    ├── dim_Bank            — Bank / NBFC reference table
    ├── dim_Dealer          — Dealership reference table
    ├── dim_Location        — Geographic location reference
    ├── dim_WorkType        — Service work type reference
    ├── dim_PolicyType      — Insurance policy type reference
    ├── dim_PayMode         — Payment mode reference
    ├── dim_CancelReason    — Cancellation reason reference
    ├── dim_Occupation      — Customer occupation reference
    ├── dim_FuelType        — Vehicle fuel type reference (Green AI)
    ├── dim_Milestone       — Scheduled service milestone reference
    ├── Sales               — Fact: vehicle sales (normalised, no PII)
    ├── Service             — Fact: workshop visits (normalised, no PII)
    ├── Insurance           — Fact: insurance policies (normalised, no PII)
    ├── Customer            — Master: customers with MASKED PII
    ├── Vehicle             — Master: vehicle registry
    ├── Customer_Vehicle    — Bridge: many-to-many ownership
    ├── PII_Vault           — SENSITIVE: actual PII (access-controlled)
    ├── Churn_Features      — ML input: 17 engineered features + churn label
    ├── Churn_Scores        — ML output: churn probability + SHAP drivers
    └── ML_Pipeline         — Visual: 5-stage pipeline block diagram
"""

import sys, os
# Force UTF-8 output on Windows to support unicode characters in print statements
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def run():
    print("=" * 65)
    print("  AUTOMOTIVE CHURN PREDICTION — SOLUTION GENERATOR")
    print("  Relatim Technical Exercise  |  Date: 2026-05-03")
    print("=" * 65)

    # Step 1: Generate workbook
    print("\n[1/2] Generating workbook...")
    from generate_solution import main as gen_main
    gen_main()

    # Step 2: Validate
    print("\n[2/2] Validating output...")
    from validate import main as val_main
    val_main()

    print("=" * 65)
    print("  ✅  Solution complete.")
    print(f"  📂  Output: Task .xlsx (parent directory)")
    print("=" * 65)


if __name__ == "__main__":
    run()
