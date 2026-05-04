"""
queries.py
==========
Loads all sheets from Task .xlsx into an in-memory SQLite database,
then runs 12 analytical SQL queries to find High / Medium / Low risk
customers and supporting insights.

HOW TO RUN
----------
  Step 1:  python solution_code/run_solution.py     (generates the data)
  Step 2:  python solution_code/queries.py          (runs all queries)

Or to run a single query:
  python solution_code/queries.py --query Q3

QUERIES AVAILABLE
-----------------
  Q1   All customers ranked by churn risk (High → Medium → Low)
  Q2   HIGH-RISK customers only  (immediate action required)
  Q3   MEDIUM-RISK customers only (scheduled outreach)
  Q4   LOW-RISK customers only   (loyalty maintenance)
  Q5   Summary count & revenue-at-risk by risk tier
  Q6   Top 5 most common churn drivers across all customers
  Q7   Customers with EXPIRED insurance AND no service in 12+ months
  Q8   Customers who never renewed insurance (1st policy only)
  Q9   Churn risk breakdown by city
  Q10  Churn risk breakdown by vehicle model
  Q11  Service cancellation rate by customer (at-risk signal)
  Q12  Customers with high service gap but active insurance (recoverable)

DEPENDENCIES
------------
  pip install pandas openpyxl   (already in requirements.txt)
  sqlite3 is built into Python — no extra install needed.
"""

import os, sys, sqlite3, argparse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

import pandas as pd
import config as C

SEP   = "=" * 90
THIN  = "-" * 90

def banner(title, qid):
    print(f"\n{SEP}")
    print(f"  {qid}  |  {title}")
    print(SEP)

def load_excel_to_sqlite():
    """
    Read all analytical sheets from Task .xlsx and load them into
    an in-memory SQLite database.  Schema notes row (row 3 in Excel)
    is dropped before insertion.
    """
    conn = sqlite3.connect(":memory:")

    # Map: Excel sheet name → SQLite table name
    sheet_map = {
        "Customer":       "customer",
        "Churn_Scores":   "churn_scores",
        "Churn_Features": "churn_features",
        "Churn_Results":  "churn_results",
        "Sales":          "sales",
        "Service":        "service",
        "Insurance":      "insurance",
        "Vehicle":        "vehicle",
        "dim_Bank":       "dim_bank",
        "dim_Dealer":     "dim_dealer",
        "dim_WorkType":   "dim_work_type",
        "dim_PolicyType": "dim_policy_type",
        "dim_PayMode":    "dim_pay_mode",
        "dim_CancelReason":"dim_cancel_reason",
        "dim_Occupation": "dim_occupation",
        "dim_FuelType":   "dim_fuel_type",
        "dim_Location":   "dim_location",
        "dim_Milestone":  "dim_milestone",
    }

    print("Loading Excel sheets into SQLite...")
    for excel_name, sql_name in sheet_map.items():
        try:
            df = pd.read_excel(C.OUTPUT_FILE, sheet_name=excel_name, header=1)
            df = df.iloc[1:].reset_index(drop=True)   # drop schema-notes row
            df.columns = [str(c).strip().lower().replace(" ","_").replace("\n","_")
                          for c in df.columns]
            df.to_sql(sql_name, conn, if_exists="replace", index=False)
            print(f"  {excel_name:<22} -> {sql_name:<22} ({len(df)} rows)")
        except Exception as e:
            print(f"  SKIP {excel_name}: {e}")

    return conn


def run_query(conn, sql, title=""):
    """Execute a SQL query and return a formatted string result."""
    try:
        df = pd.read_sql_query(sql, conn)
        return df
    except Exception as e:
        print(f"  ERROR: {e}")
        return pd.DataFrame()


def print_df(df, max_rows=50):
    """Pretty-print a DataFrame."""
    if df.empty:
        print("  (no rows returned)")
        return
    pd.set_option("display.max_colwidth",    40)
    pd.set_option("display.width",          200)
    pd.set_option("display.max_rows",    max_rows)
    pd.set_option("display.float_format", "{:.4f}".format)
    print(df.to_string(index=False))
    print(f"\n  Total rows: {len(df)}")


# ═══════════════════════════════════════════════════════════════════════════════
#  QUERY DEFINITIONS
# ═══════════════════════════════════════════════════════════════════════════════

QUERIES = {

"Q1": {
"title": "ALL CUSTOMERS — Ranked by Churn Risk (High → Medium → Low)",
"description": """
  Shows every customer with their churn probability, risk tier, and top
  contributing factor.  Sorted: High-risk first, then by probability descending.
""",
"sql": """
SELECT
    CASE cs.risk_tier
        WHEN 'High'   THEN '1'
        WHEN 'Medium' THEN '2'
        ELSE               '3'
    END AS sort_order,
    cs.cust_id,
    c.name_masked,
    c.city,
    cs.risk_tier,
    ROUND(CAST(cs.churn_probability AS REAL), 4)  AS churn_probability,
    cf.days_since_last_service,
    cf.days_to_policy_expiry,
    cf.churn_label,
    cs.top_driver_1                               AS top_risk_driver,
    cs.recommended_action
FROM churn_scores   cs
JOIN customer       c   ON cs.cust_id = c.cust_id
JOIN churn_features cf  ON cs.cust_id = cf.cust_id
ORDER BY sort_order ASC,
         CAST(cs.churn_probability AS REAL) DESC;
"""
},

"Q2": {
"title": "HIGH-RISK CUSTOMERS — Immediate Action Required",
"description": """
  Customers with risk_tier = 'High'.
  These are customers who:
    - Have NOT visited for service in over 365 days  AND
    - Have an EXPIRED insurance policy (days_to_policy_expiry < 0)
  Action: Urgent outreach — phone call + service reminder + insurance renewal offer.
""",
"sql": """
SELECT
    cs.cust_id,
    c.name_masked,
    c.mobile_masked,
    c.city,
    ROUND(CAST(cs.churn_probability AS REAL), 4) AS churn_probability,
    cf.days_since_last_service,
    cf.days_to_policy_expiry                     AS days_expired_by,
    cf.total_service_visits,
    cf.avg_bill_amount,
    cs.top_driver_1,
    cs.top_driver_2,
    cs.top_driver_3,
    cs.recommended_action
FROM churn_scores   cs
JOIN customer       c   ON cs.cust_id = c.cust_id
JOIN churn_features cf  ON cs.cust_id = cf.cust_id
WHERE cs.risk_tier = 'High'
ORDER BY CAST(cs.churn_probability AS REAL) DESC;
"""
},

"Q3": {
"title": "MEDIUM-RISK CUSTOMERS — Scheduled Outreach Needed",
"description": """
  Customers with risk_tier = 'Medium'.
  These are customers showing early warning signs:
    - Service gap > 180 days  OR  policy expiring within 30 days
  Action: WhatsApp reminder / scheduled service call within 1 week.
""",
"sql": """
SELECT
    cs.cust_id,
    c.name_masked,
    c.city,
    ROUND(CAST(cs.churn_probability AS REAL), 4) AS churn_probability,
    cf.days_since_last_service,
    cf.days_to_policy_expiry,
    cf.rfm_total                                 AS engagement_score,
    cf.num_policy_renewals,
    cs.top_driver_1,
    cs.recommended_action
FROM churn_scores   cs
JOIN customer       c   ON cs.cust_id = c.cust_id
JOIN churn_features cf  ON cs.cust_id = cf.cust_id
WHERE cs.risk_tier = 'Medium'
ORDER BY CAST(cs.churn_probability AS REAL) DESC;
"""
},

"Q4": {
"title": "LOW-RISK CUSTOMERS — Loyalty Maintenance",
"description": """
  Customers with risk_tier = 'Low'.
  These are engaged customers — regular service visits and active insurance.
  Action: Monthly loyalty newsletter, reward points update, upsell AMC.
""",
"sql": """
SELECT
    cs.cust_id,
    c.name_masked,
    c.city,
    ROUND(CAST(cs.churn_probability AS REAL), 4) AS churn_probability,
    cf.total_service_visits,
    cf.days_since_last_service,
    cf.days_to_policy_expiry,
    cf.rfm_total                                 AS engagement_score,
    cf.avg_bill_amount,
    cs.recommended_action
FROM churn_scores   cs
JOIN customer       c   ON cs.cust_id = c.cust_id
JOIN churn_features cf  ON cs.cust_id = cf.cust_id
WHERE cs.risk_tier = 'Low'
ORDER BY cf.rfm_total DESC;
"""
},

"Q5": {
"title": "SUMMARY — Churn Count, Percentage & Revenue at Risk by Tier",
"description": """
  Aggregate view showing how many customers fall in each risk tier,
  what percentage that represents, and estimated annual revenue at risk.
  (Assumes average after-sales spend of INR 15,000 per customer per year.)
""",
"sql": """
SELECT
    cs.risk_tier,
    COUNT(*)                                              AS customer_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1)    AS pct_of_total,
    COUNT(*) * 15000                                      AS revenue_at_risk_inr,
    ROUND(AVG(CAST(cs.churn_probability AS REAL)), 4)     AS avg_churn_probability,
    ROUND(AVG(CAST(cf.days_since_last_service AS REAL)))  AS avg_days_since_service,
    ROUND(AVG(CAST(cf.rfm_total AS REAL)), 1)             AS avg_rfm_score
FROM churn_scores   cs
JOIN churn_features cf ON cs.cust_id = cf.cust_id
GROUP BY cs.risk_tier
ORDER BY
    CASE cs.risk_tier WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END;
"""
},

"Q6": {
"title": "TOP 5 CHURN DRIVERS — Most Frequent Across All Customers",
"description": """
  Which features are cited most often as the top risk driver?
  Helps the business understand the #1 systemic cause of churn.
""",
"sql": """
SELECT
    driver,
    COUNT(*) AS times_cited_as_top_driver,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM churn_scores), 1) AS pct_of_customers
FROM (
    SELECT top_driver_1 AS driver FROM churn_scores WHERE top_driver_1 IS NOT NULL
    UNION ALL
    SELECT top_driver_2            FROM churn_scores WHERE top_driver_2 IS NOT NULL
    UNION ALL
    SELECT top_driver_3            FROM churn_scores WHERE top_driver_3 IS NOT NULL
)
GROUP BY driver
ORDER BY times_cited_as_top_driver DESC
LIMIT 10;
"""
},

"Q7": {
"title": "CRITICAL: Expired Insurance AND No Service in 12+ Months",
"description": """
  The most at-risk cohort — insurance already expired AND service gap over a year.
  These customers have effectively left.  Win-back campaign required urgently.
""",
"sql": """
SELECT
    cf.cust_id,
    c.name_masked,
    c.city,
    cf.days_since_last_service,
    cf.days_to_policy_expiry,
    cf.total_service_visits,
    ROUND(CAST(cs.churn_probability AS REAL), 4) AS churn_probability,
    cs.recommended_action
FROM churn_features cf
JOIN customer       c  ON cf.cust_id = c.cust_id
JOIN churn_scores   cs ON cf.cust_id = cs.cust_id
WHERE CAST(cf.days_since_last_service AS REAL) > 365
  AND CAST(cf.days_to_policy_expiry   AS REAL) < 0
ORDER BY CAST(cf.days_since_last_service AS REAL) DESC;
"""
},

"Q8": {
"title": "CUSTOMERS WITH ZERO INSURANCE RENEWALS",
"description": """
  Customers who have never renewed their insurance (first policy only).
  High indicator of disengagement from the dealership ecosystem.
""",
"sql": """
SELECT
    cf.cust_id,
    c.name_masked,
    c.city,
    cf.num_policy_renewals,
    cf.days_to_policy_expiry,
    cf.days_since_last_service,
    cs.risk_tier,
    ROUND(CAST(cs.churn_probability AS REAL), 4) AS churn_probability
FROM churn_features cf
JOIN customer       c  ON cf.cust_id = c.cust_id
JOIN churn_scores   cs ON cf.cust_id = cs.cust_id
WHERE CAST(cf.num_policy_renewals AS REAL) = 0
ORDER BY CAST(cs.churn_probability AS REAL) DESC;
"""
},

"Q9": {
"title": "CHURN RISK BY CITY — Which Locations Have Highest At-Risk Count?",
"description": """
  Geographic breakdown of churn risk.  Helps dealer network prioritise
  city-level CRM campaigns.
""",
"sql": """
SELECT
    c.city,
    COUNT(*)                                             AS total_customers,
    SUM(CASE WHEN cs.risk_tier = 'High'   THEN 1 ELSE 0 END) AS high_risk,
    SUM(CASE WHEN cs.risk_tier = 'Medium' THEN 1 ELSE 0 END) AS medium_risk,
    SUM(CASE WHEN cs.risk_tier = 'Low'    THEN 1 ELSE 0 END) AS low_risk,
    ROUND(SUM(CASE WHEN cs.risk_tier = 'High' THEN 1 ELSE 0 END)
          * 100.0 / COUNT(*), 1)                         AS pct_high_risk,
    SUM(CASE WHEN cs.risk_tier != 'Low' THEN 15000 ELSE 0 END) AS revenue_at_risk_inr
FROM churn_scores cs
JOIN customer     c ON cs.cust_id = c.cust_id
GROUP BY c.city
ORDER BY high_risk DESC, medium_risk DESC;
"""
},

"Q10": {
"title": "CHURN RISK BY VEHICLE MODEL — Which Models Retain Customers Best?",
"description": """
  Some vehicle models may have better after-sales retention than others.
  Useful for model-specific service campaigns.
""",
"sql": """
SELECT
    v.model,
    COUNT(DISTINCT cs.cust_id)                                         AS customers,
    SUM(CASE WHEN cs.risk_tier = 'High'   THEN 1 ELSE 0 END)          AS high_risk,
    SUM(CASE WHEN cs.risk_tier = 'Medium' THEN 1 ELSE 0 END)          AS medium_risk,
    SUM(CASE WHEN cs.risk_tier = 'Low'    THEN 1 ELSE 0 END)          AS low_risk,
    ROUND(AVG(CAST(cs.churn_probability AS REAL)), 4)                  AS avg_churn_prob,
    ROUND(AVG(CAST(cf.days_since_last_service AS REAL)))               AS avg_days_since_service
FROM churn_scores   cs
JOIN churn_features cf ON cs.cust_id = cf.cust_id
JOIN sales          s  ON cs.cust_id = s.cust_id
JOIN vehicle        v  ON s.vin      = v.vin
GROUP BY v.model
ORDER BY high_risk DESC, avg_churn_prob DESC;
"""
},

"Q11": {
"title": "SERVICE CANCELLATION RATE — Churn Signal by Customer",
"description": """
  Customers who frequently cancel service appointments are early churn indicators.
  Shows service visit breakdown per customer joined with their risk tier.
""",
"sql": """
SELECT
    svc.cust_id,
    c.name_masked,
    c.city,
    COUNT(*)                                                           AS total_visits,
    SUM(CASE WHEN svc.status = 'Cancelled' THEN 1 ELSE 0 END)         AS cancelled,
    ROUND(SUM(CASE WHEN svc.status='Cancelled' THEN 1.0 ELSE 0 END)
          / COUNT(*) * 100, 1)                                         AS cancel_rate_pct,
    cs.risk_tier,
    ROUND(CAST(cs.churn_probability AS REAL), 4)                       AS churn_probability
FROM service      svc
JOIN customer     c   ON svc.cust_id = c.cust_id
JOIN churn_scores cs  ON svc.cust_id = cs.cust_id
GROUP BY svc.cust_id, c.name_masked, c.city, cs.risk_tier, cs.churn_probability
HAVING cancelled > 0
ORDER BY cancel_rate_pct DESC, cs.churn_probability DESC;
"""
},

"Q12": {
"title": "RECOVERABLE CUSTOMERS — High Service Gap BUT Active Insurance",
"description": """
  These customers are at-risk on the service side but still engaged with insurance.
  They are the easiest to win back — one targeted service reminder may be enough.
  Priority: Medium-to-high outreach with a discounted service offer.
""",
"sql": """
SELECT
    cf.cust_id,
    c.name_masked,
    c.city,
    cf.days_since_last_service,
    cf.days_to_policy_expiry,
    cf.num_policy_renewals,
    cf.auto_membership_flag,
    cs.risk_tier,
    ROUND(CAST(cs.churn_probability AS REAL), 4) AS churn_probability,
    'Service discount offer — policy still active, easy win-back' AS strategy
FROM churn_features cf
JOIN customer       c  ON cf.cust_id = c.cust_id
JOIN churn_scores   cs ON cf.cust_id = cs.cust_id
WHERE CAST(cf.days_since_last_service AS REAL) > 180
  AND CAST(cf.days_to_policy_expiry   AS REAL) >= 0
ORDER BY CAST(cf.days_since_last_service AS REAL) DESC;
"""
},

}  # end QUERIES dict


# ═══════════════════════════════════════════════════════════════════════════════
#  MAIN RUNNER
# ═══════════════════════════════════════════════════════════════════════════════

def main(run_only=None):
    print("\n" + SEP)
    print("  AUTOMOTIVE CHURN PREDICTION — SQL QUERY RUNNER")
    print("  Database: In-memory SQLite  |  Source: Task .xlsx")
    print(SEP)

    conn = load_excel_to_sqlite()

    queries_to_run = {run_only: QUERIES[run_only]} if run_only and run_only in QUERIES \
                     else QUERIES

    for qid, meta in queries_to_run.items():
        banner(meta["title"], qid)
        print(meta["description"].strip())
        print(THIN)
        print("SQL:")
        print(meta["sql"])
        print(THIN)
        print("RESULTS:")
        df = run_query(conn, meta["sql"])
        print_df(df)

    conn.close()
    print(f"\n{SEP}")
    print("  All queries complete.")
    print(f"  To run a single query: python solution_code/queries.py --query Q2")
    print(SEP)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Run SQL queries on the churn prediction dataset.")
    parser.add_argument("--query", type=str, default=None,
        help="Run a single query (e.g. --query Q2). Omit to run all.")
    args = parser.parse_args()
    main(run_only=args.query)
