"""
config.py
=========
Central configuration — all master reference data, seeds, and constants.
Nothing is hardcoded in other modules; they import from here.

Data Governance Note
--------------------
All personally identifiable information (PII) is defined here only for the
purpose of seeding the PII_Vault.  Fact tables and analytical tables NEVER
store raw PII — they store only the tokenised cust_id.
"""

RANDOM_SEED = 42          # Reproducibility seed
N_CUSTOMERS = 30          # Unique customers
N_VEHICLES  = 30          # Unique vehicles (1:1 with sales for this dataset)
DATE_START  = "2019-01-01"
DATE_END    = "2024-12-31"

# ── Output file ───────────────────────────────────────────────────────────────
import os
BASE_DIR    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_FILE = os.path.join(BASE_DIR, "Task\xa0.xlsx")   # non-breaking space in filename

# ── Dimension: Bank / NBFC ─────────────────────────────────────────────────
DIM_BANK = [
    # (bank_id, bank_name,         bank_type,    regulated_by, is_active)
    ("BNK001", "HDFC Bank",        "Private",    "RBI",        "Y"),
    ("BNK002", "ICICI Bank",       "Private",    "RBI",        "Y"),
    ("BNK003", "State Bank of India","Public",   "RBI",        "Y"),
    ("BNK004", "Axis Bank",        "Private",    "RBI",        "Y"),
    ("BNK005", "Bajaj Finserv",    "NBFC",       "RBI",        "Y"),
    ("BNK006", "Kotak Mahindra",   "Private",    "RBI",        "Y"),
    ("BNK007", "Bank of Baroda",   "Public",     "RBI",        "Y"),
    ("BNK008", "Tata Capital",     "NBFC",       "RBI",        "Y"),
]
BANK_NAMES = {row[0]: row[1] for row in DIM_BANK}   # id → name lookup

# ── Dimension: Dealer ──────────────────────────────────────────────────────
DIM_DEALER = [
    # (dealer_id, dealer_name,          city,       state,          zone,  type)
    ("DLR001", "Sunrise Motors",       "Mumbai",   "Maharashtra",  "West", "3S"),
    ("DLR002", "Deccan AutoHub",       "Pune",     "Maharashtra",  "West", "3S"),
    ("DLR003", "Garden City Cars",     "Bangalore","Karnataka",    "South","3S"),
    ("DLR004", "Marina Auto World",    "Chennai",  "Tamil Nadu",   "South","2S"),
    ("DLR005", "Golconda Drives",      "Hyderabad","Telangana",    "South","3S"),
]

# ── Dimension: Location ────────────────────────────────────────────────────
DIM_LOCATION = [
    # (location_id,  city,       state,          zone,  tier)
    ("LOC_MUM_01", "Mumbai",   "Maharashtra",  "West", "Metro"),
    ("LOC_PUN_01", "Pune",     "Maharashtra",  "West", "Tier-1"),
    ("LOC_BLR_01", "Bangalore","Karnataka",    "South","Metro"),
    ("LOC_CHN_01", "Chennai",  "Tamil Nadu",   "South","Metro"),
    ("LOC_HYD_01", "Hyderabad","Telangana",    "South","Metro"),
]

# ── Dimension: Work Type (Service) ─────────────────────────────────────────
DIM_WORK_TYPE = [
    # (work_type_id, work_type_name,      is_billable, category,       sla_hours)
    ("WT001", "Free Service",             "N",         "Scheduled",    4),
    ("WT002", "Paid Service",             "Y",         "Scheduled",    6),
    ("WT003", "Body Repair",              "Y",         "Unscheduled",  24),
    ("WT004", "Accidental Repair",        "Y",         "Unscheduled",  48),
    ("WT005", "AMC (Annual Maintenance)", "Y",         "Contract",     8),
]
WORK_TYPE_NAMES = {row[0]: row[1] for row in DIM_WORK_TYPE}

# ── Dimension: Policy Type (Insurance) ────────────────────────────────────
DIM_POLICY_TYPE = [
    # (policy_type_id, policy_type_name, coverage_type, is_mandatory, description)
    ("PT001", "Comprehensive",  "OD + Third Party",   "N", "Covers own damage + third-party liability"),
    ("PT002", "Third Party",    "Third Party Only",   "Y", "Mandatory by law; covers third-party only"),
    ("PT003", "Zero Dep",       "OD + TP + Zero Dep", "N", "No depreciation deducted on claim"),
    ("PT004", "Standalone OD",  "Own Damage Only",    "N", "OD cover for vehicles with existing TP"),
]
POLICY_TYPE_NAMES = {row[0]: row[1] for row in DIM_POLICY_TYPE}

# ── Dimension: Payment Mode ────────────────────────────────────────────────
DIM_PAY_MODE = [
    # (pay_mode_id, pay_mode_name, is_digital, platform)
    ("PM001", "Cash",         "N", "In-Store"),
    ("PM002", "Debit/Credit Card", "Y", "POS Terminal"),
    ("PM003", "UPI",          "Y", "NPCI"),
    ("PM004", "Net Banking",  "Y", "Bank Portal"),
    ("PM005", "Cheque",       "N", "In-Store"),
]
PAY_MODE_NAMES = {row[0]: row[1] for row in DIM_PAY_MODE}

# ── Dimension: Cancel Reason ───────────────────────────────────────────────
DIM_CANCEL_REASON = [
    # (cancel_reason_id, description,             category,              is_customer_fault)
    ("CR001", "Customer Request",      "Customer-Initiated",  "Y"),
    ("CR002", "Parts Unavailable",     "Operational",         "N"),
    ("CR003", "No Show",               "Customer-Initiated",  "Y"),
    ("CR004", "Vehicle Breakdown",     "Operational",         "N"),
    ("CR005", "Appointment Conflict",  "Customer-Initiated",  "Y"),
]
CANCEL_REASON_NAMES = {row[0]: row[1] for row in DIM_CANCEL_REASON}

# ── Dimension: Occupation ──────────────────────────────────────────────────
DIM_OCCUPATION = [
    # (occ_id, occupation_name,       income_bracket, segment)
    ("OCC001", "Salaried",           "Middle",        "Employee"),
    ("OCC002", "Business Owner",     "High",          "Entrepreneur"),
    ("OCC003", "Self-Employed",      "Middle",        "Professional"),
    ("OCC004", "Government Employee","Middle",        "Employee"),
    ("OCC005", "Student",            "Low",           "Other"),
    ("OCC006", "Retired",            "Low-Middle",    "Other"),
]
OCC_NAMES = {row[0]: row[1] for row in DIM_OCCUPATION}

# ── Dimension: Fuel Type ───────────────────────────────────────────────────
DIM_FUEL_TYPE = [
    # (fuel_type_id, fuel_type_name, emission_standard, ev_flag, green_score)
    ("FT001", "Petrol",   "BS6",          "N", 3),
    ("FT002", "Diesel",   "BS6",          "N", 2),
    ("FT003", "CNG",      "Low Emission", "N", 4),
    ("FT004", "Electric", "Zero Emission","Y", 5),
    ("FT005", "Hybrid",   "Low Emission", "N", 4),
]
FUEL_TYPE_NAMES = {row[0]: row[1] for row in DIM_FUEL_TYPE}

# ── Dimension: Milestone Type (Service) ───────────────────────────────────
DIM_MILESTONE = [
    # (milestone_id, milestone_name,       interval_km, interval_months)
    ("MS001", "1st Free Service",   1000,  1),
    ("MS002", "2nd Free Service",   5000,  3),
    ("MS003", "3rd Free Service",   10000, 6),
    ("MS004", "Annual Paid Service",20000, 12),
    ("MS005", "AMC Service",        0,     1),
]
MILESTONE_NAMES = {row[0]: row[1] for row in DIM_MILESTONE}

# ── Vehicle master data ────────────────────────────────────────────────────
MODELS_VARIANTS = {
    "Swift":   (["VXI","ZXI","LXI","ZXI+"],       1197, "K12N",  "FT001", "Manual",  "Hatchback", 5),
    "Baleno":  (["Delta","Sigma","Alpha","Zeta"],   1197, "K12N",  "FT001", "AMT",     "Hatchback", 5),
    "Creta":   (["E","S","SX","SX(O)"],            1497, "G4LC",  "FT002", "Automatic","SUV",      5),
    "i20":     (["Magna","Sportz","Asta","Era"],    1197, "G4LC",  "FT001", "Manual",  "Hatchback", 5),
    "Nexon":   (["XE","XM","XZ","XZ+"],            1199, "REVT",  "FT001", "AMT",     "SUV",       5),
    "City":    (["V","VX","ZX","S"],               1498, "L15Z",  "FT001", "CVT",     "Sedan",     5),
    "Punch":   (["Pure","Adventure","Accomplished"],1199, "REVT",  "FT001", "AMT",     "SUV",       5),
    "WagonR":  (["LXI","VXI","ZXI"],               998,  "K10C",  "FT003", "Manual",  "Hatchback", 5),
    "Venue":   (["S","SX","N Line"],               1197, "G3LC",  "FT001", "Manual",  "SUV",       5),
    "Thar":    (["AX","LX","LX Hard Top"],         2184, "mHwk",  "FT002", "Manual",  "SUV",       4),
}
# model → (variants, cc, engine_prefix, fuel_type_id, transmission, body_type, seats)

BODY_TYPE_MAP   = {m: v[5] for m, v in MODELS_VARIANTS.items()}
FUEL_TYPE_ID_MAP= {m: v[3] for m, v in MODELS_VARIANTS.items()}

COLORS = [
    "Pearl White","Cerulean Blue","Fiery Red","Meteor Grey",
    "Midnight Black","Autumn Orange","Racing Red","Silky Silver",
]

# ── Raw PII (used ONLY for PII_Vault population) ───────────────────────────
# These values must NEVER appear in any fact or analytical table.
RAW_PII = [
    # (cust_name,          gender, dob,          city,       pincode,   occ_id,  email_domain)
    ("Rahul Sharma",      "M", "15-07-1985", "Mumbai",    "400001", "OCC001", "gmail.com"),
    ("Priya Patel",       "F", "22-03-1990", "Ahmedabad", "380009", "OCC002", "yahoo.com"),
    ("Amit Gupta",        "M", "08-11-1978", "Noida",     "201301", "OCC003", "gmail.com"),
    ("Sneha Reddy",       "F", "30-05-1995", "Hyderabad", "500034", "OCC001", "outlook.com"),
    ("Vikram Singh",      "M", "12-01-1980", "Jaipur",    "302001", "OCC002", "gmail.com"),
    ("Anjali Mehta",      "F", "07-09-1992", "Mumbai",    "400001", "OCC003", "gmail.com"),
    ("Rajesh Kumar",      "M", "25-04-1975", "Kolkata",   "700064", "OCC004", "yahoo.com"),
    ("Pooja Nair",        "F", "14-12-1993", "Bangalore", "560038", "OCC001", "gmail.com"),
    ("Suresh Iyer",       "M", "03-06-1968", "Chennai",   "600040", "OCC004", "gmail.com"),
    ("Deepa Bose",        "F", "18-08-1987", "Kolkata",   "700064", "OCC003", "hotmail.com"),
    ("Kiran Rao",         "M", "27-02-1983", "Hyderabad", "500034", "OCC002", "gmail.com"),
    ("Meera Joshi",       "F", "09-10-1996", "Pune",      "411001", "OCC001", "gmail.com"),
    ("Arun Pillai",       "M", "20-07-1971", "Chennai",   "600040", "OCC004", "gmail.com"),
    ("Swati Desai",       "F", "11-03-1989", "Ahmedabad", "380009", "OCC003", "yahoo.com"),
    ("Nikhil Verma",      "M", "05-12-1994", "Noida",     "201301", "OCC001", "gmail.com"),
    ("Kavitha Murugan",   "F", "29-06-1986", "Chennai",   "600040", "OCC002", "gmail.com"),
    ("Sandeep Chopra",    "M", "16-01-1977", "Jaipur",    "302001", "OCC003", "outlook.com"),
    ("Divya Krishnan",    "F", "04-09-1991", "Bangalore", "560038", "OCC001", "gmail.com"),
    ("Mohit Agarwal",     "M", "22-11-1982", "Mumbai",    "400001", "OCC002", "gmail.com"),
    ("Sunita Yadav",      "F", "13-04-1979", "Noida",     "201301", "OCC004", "yahoo.com"),
    ("Farhan Sheikh",     "M", "08-07-1990", "Mumbai",    "400001", "OCC002", "gmail.com"),
    ("Geeta Malhotra",    "F", "31-01-1984", "Jaipur",    "302001", "OCC003", "gmail.com"),
    ("Harish Pandey",     "M", "17-05-1976", "Noida",     "201301", "OCC004", "hotmail.com"),
    ("Lakshmi Srinivasan","F", "06-11-1988", "Chennai",   "600040", "OCC001", "gmail.com"),
    ("Manish Tiwari",     "M", "23-08-1981", "Mumbai",    "400001", "OCC002", "gmail.com"),
    ("Nandita Roy",       "F", "10-02-1994", "Kolkata",   "700064", "OCC003", "yahoo.com"),
    ("Om Prakash",        "M", "02-09-1965", "Jaipur",    "302001", "OCC006", "gmail.com"),
    ("Pallavi Bhatt",     "F", "19-07-1992", "Ahmedabad", "380009", "OCC001", "gmail.com"),
    ("Qasim Mirza",       "M", "14-03-1985", "Hyderabad", "500034", "OCC003", "gmail.com"),
    ("Rekha Saxena",      "F", "28-06-1973", "Noida",     "201301", "OCC004", "yahoo.com"),
]
# Derived city → state map
CITY_STATE = {
    "Mumbai":"Maharashtra","Pune":"Maharashtra","Bangalore":"Karnataka",
    "Chennai":"Tamil Nadu","Hyderabad":"Telangana","Noida":"Uttar Pradesh",
    "Kolkata":"West Bengal","Jaipur":"Rajasthan","Ahmedabad":"Gujarat",
}
CITY_STATE_CODE = {
    "Mumbai":"MH","Pune":"MH","Bangalore":"KA","Chennai":"TN",
    "Hyderabad":"TS","Noida":"UP","Kolkata":"WB","Jaipur":"RJ","Ahmedabad":"GJ",
}

SALES_POC = [
    "Aakash Verma","Bhavna Shah","Chirag Patel","Divya Menon","Esha Nair"
]
SERVICE_ADVISORS = [
    "Rohit Sharma","Sneha Kapoor","Tarun Jain","Uma Devi","Varun Pillai"
]
