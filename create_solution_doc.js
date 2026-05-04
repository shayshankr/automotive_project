const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, Header, Footer, PageBreak
} = require('docx');
const fs = require('fs');

const BLUE  = "1F4E79";
const LBLUE = "D6E4F0";
const GREEN = "375623";
const LGRN  = "E2EFDA";
const PURP  = "7030A0";
const LPURP = "EAD7F7";
const RED   = "C00000";
const LRED  = "FFE0E0";
const BRWN  = "7B3F00";
const LBRWN = "FAE5D3";
const GREY  = "F2F2F2";

const thin  = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const thick = { style: BorderStyle.SINGLE, size: 4, color: "1F4E79" };
const borders = { top: thin, bottom: thin, left: thin, right: thin };

function cell(text, bgHex, fgHex = "FFFFFF", bold = true, width = 2200) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: bgHex, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text, font: "Arial", size: 18, bold, color: fgHex })]
    })]
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, font: "Arial", size: 28, bold: true, color: BLUE })]
  });
}

function h2(text, color = "333333") {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, font: "Arial", size: 22, bold: true, color })]
  });
}

function h3(text, color = "555555") {
  return new Paragraph({
    spacing: { before: 160, after: 80 },
    children: [new TextRun({ text, font: "Arial", size: 20, bold: true, color })]
  });
}

function p(text, size = 20, color = "222222") {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text, font: "Arial", size, color })]
  });
}

function bullet(text, color = "222222") {
  return new Paragraph({
    indent: { left: 360, hanging: 180 },
    spacing: { after: 60 },
    children: [new TextRun({ text: `•  ${text}`, font: "Arial", size: 18, color })]
  });
}

function divider(color = BLUE) {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color, space: 1 } },
    children: [new TextRun("")]
  });
}

function labelValue(label, value) {
  return new TableRow({
    children: [
      cell(label, BLUE, "FFFFFF", true, 2000),
      cell(value, GREY, "222222", false, 7360),
    ]
  });
}

// ── Schema tables ──────────────────────────────────────────────────────────
function schemaTable(headers, rows, headerBg) {
  const headerRow = new TableRow({
    children: headers.map(h =>
      new TableCell({
        borders, shading: { fill: headerBg, type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [new Paragraph({ children: [new TextRun({ text: h, font: "Arial", size: 16, bold: true, color: "FFFFFF" })] })]
      })
    )
  });
  const dataRows = rows.map(row =>
    new TableRow({
      children: row.map((val, i) =>
        new TableCell({
          borders, shading: { fill: i === 0 ? "EEF4FB" : "FFFFFF", type: ShadingType.CLEAR },
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [new Paragraph({ children: [new TextRun({ text: val, font: "Arial", size: 16, bold: i === 0 })] })]
        })
      )
    })
  );
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    rows: [headerRow, ...dataRows]
  });
}

// ─────────────────────────────────────────────────────────────────────────
const doc = new Document({
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 1 } },
          children: [new TextRun({ text: "Automotive After-Sales Churn Prediction — Solution Document", font: "Arial", size: 18, color: "888888" })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 1 } },
          children: [
            new TextRun({ text: "Page ", font: "Arial", size: 16, color: "888888" }),
            new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: "888888" }),
            new TextRun({ text: " | Confidential", font: "Arial", size: 16, color: "888888" }),
          ]
        })]
      })
    },
    children: [

      // ── COVER ────────────────────────────────────────────────────────
      new Paragraph({
        spacing: { before: 1440, after: 240 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "AUTOMOTIVE AFTER-SALES", font: "Arial", size: 48, bold: true, color: BLUE })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: "CHURN PREDICTION — SOLUTION DOCUMENT", font: "Arial", size: 32, bold: true, color: "444444" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 480 },
        children: [new TextRun({ text: "Submitted to Relatim  |  Deadline: 5 May 2026", font: "Arial", size: 20, italic: true, color: "888888" })]
      }),
      divider(BLUE),

      // ── SECTION 1: Objective ─────────────────────────────────────────
      h1("1. Objective"),
      p("Automobile dealerships lose approximately 40% of customers annually from their after-sales ecosystem (service, insurance). This solution designs a data-driven approach to identify at-risk customers using data from three operational domains: Sales, Service, and Insurance."),

      new Paragraph({ children: [new PageBreak()] }),

      // ── SECTION 2: Data Understanding ────────────────────────────────
      h1("2. Step 1 — Data Understanding & Simulation"),
      p("The provided dataset schema covers three domains. All three tables were populated with 30 realistic Indian automotive records spanning 2019–2024."),

      h2("2.1 Sales Table (30 rows)", BLUE),
      p("Captures the point-of-sale transaction — who bought what vehicle, when, and how it was financed."),
      schemaTable(
        ["Column", "Description", "Example Value"],
        [
          ["sales_id",          "Unique sale transaction ID",       "SL0001"],
          ["dealer_id",         "Selling dealership",               "DLR003"],
          ["vin",               "17-char Vehicle ID",               "MA3K12N7ABCDEF123"],
          ["mfd_year",          "Manufacturing year",               "2022"],
          ["registration_date", "RTO registration date",            "15-03-2022"],
          ["tax_validity",      "Road tax valid until",             "15-03-2037"],
          ["pucc_validity",     "Pollution cert expiry",            "15-03-2023"],
          ["finance_flag",      "Y if financed",                    "Y"],
          ["financed_by",       "Lending institution",              "HDFC Bank"],
          ["sale_date",         "Date of purchase",                 "01-03-2022"],
          ["cust_name",         "Customer full name",               "Rahul Sharma"],
          ["mobile_1",          "Primary contact number",           "9876543210"],
        ],
        BLUE
      ),

      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("")] }),
      h2("2.2 Service Table (76 rows — 1 to 4 visits per vehicle)", BLUE),
      p("Tracks every workshop visit — free services, paid repairs, AMC, and accidental repairs."),
      schemaTable(
        ["Column", "Description", "Example Value"],
        [
          ["smr_id",        "Service record ID",              "SMR00001"],
          ["vin / reg",     "Links to vehicle",               "MA3.../MH01AB1234"],
          ["work_type",     "Free/Paid/AMC/Accidental",       "Paid Service"],
          ["bill_amount",   "Amount charged (INR)",           "4500"],
          ["visit_date",    "Workshop visit date",            "12-09-2022"],
          ["status",        "Completed / Cancelled",          "Completed"],
          ["mileage",       "Odometer reading at visit",      "18500"],
          ["milestone_type","1st/2nd/3rd Free or Paid",       "2nd Free Service"],
          ["payment_mode",  "Cash/Card/UPI/Net Banking",      "UPI"],
        ],
        GREEN
      ),

      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("")] }),
      h2("2.3 Insurance Table (44 rows — 1 to 2 policies per vehicle)", BLUE),
      p("Tracks insurance policies — comprehensive, third-party, and standalone OD — including expiry dates and renewal history."),
      schemaTable(
        ["Column", "Description", "Example Value"],
        [
          ["ins_id",                    "Insurance record ID",          "INS00001"],
          ["policy_type",               "Comprehensive/Third Party/Zero Dep", "Comprehensive"],
          ["policy_expiry_date",        "When the policy expires",      "01-03-2023"],
          ["tp_policy_expiry_date",     "Third-party expiry (3-year)",  "01-03-2025"],
          ["previous_policy_end_date",  "Last policy end (renewals)",   "28-02-2023"],
          ["auto_membership",           "RSA roadside assist flag",     "Y"],
          ["total_premium",             "Premium paid (INR)",           "18500"],
        ],
        PURP
      ),

      new Paragraph({ children: [new PageBreak()] }),

      // ── SECTION 3: Data Modeling ──────────────────────────────────────
      h1("3. Step 2 — Data Modeling"),

      h2("3.1 Customer Table", GREEN),
      p("Deduplicated master registry of customers. One row per unique customer, identified by (cust_name + mobile_1)."),
      schemaTable(
        ["Column", "Type", "Constraint", "Notes"],
        [
          ["cust_id",              "VARCHAR(10)",  "PK",                  "e.g. CUST0001"],
          ["cust_name",            "VARCHAR(100)", "NOT NULL",            "Full name"],
          ["mobile_1",             "VARCHAR(15)",  "NOT NULL, UNIQUE",    "Primary mobile"],
          ["mobile_2",             "VARCHAR(15)",  "NULLABLE",            "Alternate contact"],
          ["email",                "VARCHAR(100)", "NULLABLE",            "Email address"],
          ["gender",               "CHAR(1)",      "M/F/O",               "M, F, or Other"],
          ["dob",                  "DATE",         "NULLABLE",            "Date of birth"],
          ["occupation",           "VARCHAR(50)",  "NULLABLE",            "Salaried / Business etc."],
          ["address",              "TEXT",         "NOT NULL",            "Full postal address"],
          ["city",                 "VARCHAR(50)",  "NOT NULL",            "City of residence"],
          ["state",                "VARCHAR(50)",  "NOT NULL",            "State"],
          ["pincode",              "CHAR(6)",      "NOT NULL",            "6-digit PIN"],
          ["preferred_dealer_id",  "VARCHAR(10)",  "FK → Dealer",         "Preferred dealership"],
          ["created_at",           "DATE",         "NOT NULL",            "Record created date"],
          ["updated_at",           "DATE",         "NOT NULL",            "Last updated date"],
        ],
        GREEN
      ),

      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("")] }),
      h2("3.2 Vehicle Table", GREEN),
      p("Deduplicated master registry of vehicles. One row per unique vehicle, identified by VIN (Vehicle Identification Number)."),
      schemaTable(
        ["Column", "Type", "Constraint", "Notes"],
        [
          ["vehicle_id",         "VARCHAR(10)",  "PK",         "e.g. VEH0001"],
          ["vin",                "VARCHAR(17)",  "NOT NULL, UNIQUE", "17-char VIN"],
          ["reg_no",             "VARCHAR(15)",  "NOT NULL",   "RTO registration number"],
          ["engine_no",          "VARCHAR(20)",  "NOT NULL",   "Engine serial number"],
          ["model",              "VARCHAR(50)",  "NOT NULL",   "e.g. Swift, Creta"],
          ["variant",            "VARCHAR(50)",  "NOT NULL",   "e.g. VXI, ZXI+"],
          ["color",              "VARCHAR(50)",  "NULLABLE",   "Exterior colour"],
          ["cc",                 "INTEGER",      "NOT NULL",   "Engine displacement"],
          ["mfd_year",           "INTEGER",      "NOT NULL",   "Manufacturing year"],
          ["registration_date",  "DATE",         "NOT NULL",   "RTO registration date"],
          ["fuel_type",          "VARCHAR(20)",  "NOT NULL",   "Petrol/Diesel/CNG/EV"],
          ["transmission",       "VARCHAR(20)",  "NOT NULL",   "Manual/Automatic/AMT/CVT"],
          ["body_type",          "VARCHAR(20)",  "NOT NULL",   "Hatchback/Sedan/SUV/MUV"],
          ["seating_capacity",   "INTEGER",      "NOT NULL",   "Number of seats"],
          ["created_at",         "DATE",         "NOT NULL",   "Record created date"],
        ],
        GREEN
      ),

      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("")] }),
      h2("3.3 Customer_Vehicle Bridge Table (Many-to-Many)", BRWN),
      p("One customer can own multiple vehicles (e.g. family owning 2 cars). One vehicle can be associated with multiple customers (e.g. resale, co-owner). This bridge table manages that relationship."),
      schemaTable(
        ["Column", "Type", "Constraint", "Notes"],
        [
          ["cv_id",             "VARCHAR(10)",  "PK",          "e.g. CV0001"],
          ["cust_id",           "VARCHAR(10)",  "FK → Customer","Customer reference"],
          ["vehicle_id",        "VARCHAR(10)",  "FK → Vehicle", "Vehicle reference"],
          ["relationship_type", "VARCHAR(20)",  "NOT NULL",    "Owner/Co-Owner/Family Member"],
          ["purchase_date",     "DATE",         "NOT NULL",    "Date of purchase"],
          ["is_primary_owner",  "CHAR(1)",      "Y/N",         "Y = Primary owner"],
          ["active_flag",       "CHAR(1)",      "Y/N",         "Y = Currently owns vehicle"],
        ],
        BRWN
      ),

      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("")] }),
      h2("3.4 Entity-Relationship Summary", BLUE),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        rows: [
          new TableRow({ children: [
            cell("Relationship", BLUE, "FFFFFF", true, 3500),
            cell("Cardinality", BLUE, "FFFFFF", true, 2000),
            cell("Join Key", BLUE, "FFFFFF", true, 3860),
          ]}),
          new TableRow({ children: [
            cell("Customer ↔ Vehicle", LBLUE, BLUE, false, 3500),
            cell("Many-to-Many", GREY, "333333", false, 2000),
            cell("Via Customer_Vehicle(cust_id, vehicle_id)", GREY, "333333", false, 3860),
          ]}),
          new TableRow({ children: [
            cell("Vehicle ↔ Sales", LGRN, GREEN, false, 3500),
            cell("One-to-Many", GREY, "333333", false, 2000),
            cell("Sales.vin = Vehicle.vin", GREY, "333333", false, 3860),
          ]}),
          new TableRow({ children: [
            cell("Vehicle ↔ Service", LGRN, GREEN, false, 3500),
            cell("One-to-Many", GREY, "333333", false, 2000),
            cell("Service.vin = Vehicle.vin", GREY, "333333", false, 3860),
          ]}),
          new TableRow({ children: [
            cell("Vehicle ↔ Insurance", LPURP, PURP, false, 3500),
            cell("One-to-Many", GREY, "333333", false, 2000),
            cell("Insurance.vin = Vehicle.vin", GREY, "333333", false, 3860),
          ]}),
          new TableRow({ children: [
            cell("Customer ↔ Sales", LBLUE, BLUE, false, 3500),
            cell("One-to-Many", GREY, "333333", false, 2000),
            cell("Sales.cust_name+mobile = Customer", GREY, "333333", false, 3860),
          ]}),
        ]
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // ── SECTION 4: ML Pipeline ────────────────────────────────────────
      h1("4. Step 3 — ML / Analytical Pipeline Design"),
      p("The goal is to predict which customers are likely to churn from after-sales services. A customer is considered 'churned' if they have not visited for service in over 12 months AND have not renewed their insurance policy."),

      h2("4.1 Churn Label Definition", RED),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        rows: [
          new TableRow({ children: [
            cell("Risk Tier", RED, "FFFFFF", true, 2000),
            cell("Criteria", RED, "FFFFFF", true, 7360),
          ]}),
          new TableRow({ children: [
            cell("HIGH (Churn=1)", LRED, RED, true, 2000),
            cell("No service visit in last 12 months AND insurance not renewed", LRED, "5B0000", false, 7360),
          ]}),
          new TableRow({ children: [
            cell("MEDIUM (At-Risk)", "FFF3CD", "7D5800", true, 2000),
            cell("Service gap > 6 months OR only 1 lifetime service visit", "FFF3CD", "7D5800", false, 7360),
          ]}),
          new TableRow({ children: [
            cell("LOW (Active)", LGRN, GREEN, true, 2000),
            cell("Service visit within last 6 months AND active insurance policy", LGRN, GREEN, false, 7360),
          ]}),
        ]
      }),

      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("")] }),
      h2("4.2 Feature Engineering", PURP),
      schemaTable(
        ["Category", "Feature", "How to Compute"],
        [
          ["Sales",      "vehicle_age_years",        "YEAR(TODAY) - mfd_year"],
          ["Sales",      "finance_flag",              "Direct from Sales.finance_flag"],
          ["Sales",      "days_to_first_service",     "MIN(service.visit_date) - sale_date"],
          ["Service",    "total_service_visits",      "COUNT(smr_id) per customer"],
          ["Service",    "days_since_last_service",   "TODAY - MAX(visit_date)"],
          ["Service",    "avg_bill_amount",           "AVG(bill_amount) excluding free services"],
          ["Service",    "pct_paid_services",         "COUNT(paid) / COUNT(all visits)"],
          ["Service",    "cancelled_visit_flag",      "1 if any status = Cancelled"],
          ["Insurance",  "days_to_policy_expiry",     "policy_expiry_date - TODAY"],
          ["Insurance",  "num_policy_renewals",       "COUNT(ins_id) - 1 per vehicle"],
          ["Insurance",  "auto_membership_flag",      "1 if auto_membership = Y"],
          ["Insurance",  "premium_trend",             "Last premium - First premium"],
          ["Derived",    "recency_score",             "Bucket days_since_last_service into 1-5"],
          ["Derived",    "frequency_score",           "Bucket total_service_visits into 1-5"],
          ["Derived",    "monetary_score",            "Bucket avg_bill_amount into 1-5"],
          ["Derived",    "rfm_total",                 "recency + frequency + monetary"],
          ["Derived",    "churn_label",               "1 if HIGH RISK criteria met, else 0"],
        ],
        PURP
      ),

      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("")] }),
      h2("4.3 Pipeline Stages", BLUE),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        rows: [
          new TableRow({ children: [
            cell("Stage", BLUE, "FFFFFF", true, 1500),
            cell("Name", BLUE, "FFFFFF", true, 2500),
            cell("Details", BLUE, "FFFFFF", true, 5360),
          ]}),
          new TableRow({ children: [
            cell("1", LBLUE, BLUE, true, 1500),
            cell("Data Ingestion", LBLUE, BLUE, false, 2500),
            cell("Load Sales, Service, Insurance from source DB. Join on VIN. Assign cust_id via deduplication.", GREY, "222222", false, 5360),
          ]}),
          new TableRow({ children: [
            cell("2", LGRN, GREEN, true, 1500),
            cell("Preprocessing", LGRN, GREEN, false, 2500),
            cell("Parse dates, fill nulls (median imputation for bill_amount), standardise work_type vocabulary, remove duplicates.", GREY, "222222", false, 5360),
          ]}),
          new TableRow({ children: [
            cell("3", LPURP, PURP, true, 1500),
            cell("Feature Engineering", LPURP, PURP, false, 2500),
            cell("Compute all 17 features listed in Section 4.2. Create churn_label column as target variable.", GREY, "222222", false, 5360),
          ]}),
          new TableRow({ children: [
            cell("4a", LBRWN, BRWN, true, 1500),
            cell("Rule-Based Baseline", LBRWN, BRWN, false, 2500),
            cell("Flag customers meeting the HIGH/MEDIUM/LOW criteria directly. Useful for immediate action without ML.", GREY, "222222", false, 5360),
          ]}),
          new TableRow({ children: [
            cell("4b", LBRWN, BRWN, true, 1500),
            cell("ML Model (Supervised)", LBRWN, BRWN, false, 2500),
            cell("Train XGBoost classifier on churn_label (0/1). Inputs: all 17 features. Split: 80/20 train/test. Metrics: AUC-ROC, Precision, Recall, F1.", GREY, "222222", false, 5360),
          ]}),
          new TableRow({ children: [
            cell("4c", LBRWN, BRWN, true, 1500),
            cell("Segmentation (K-Means)", LBRWN, BRWN, false, 2500),
            cell("Cluster customers on RFM scores into 4 segments: Champions, Loyal, At-Risk, Lost. No label needed.", GREY, "222222", false, 5360),
          ]}),
          new TableRow({ children: [
            cell("5", LRED, RED, true, 1500),
            cell("Output & Action", LRED, RED, false, 2500),
            cell("Churn probability (0-1) per customer. Risk tier (H/M/L). Top 3 SHAP feature drivers. Export to CRM for proactive calls.", GREY, "222222", false, 5360),
          ]}),
          new TableRow({ children: [
            cell("6", GREY, "333333", true, 1500),
            cell("Feedback Loop", GREY, "333333", false, 2500),
            cell("Update churn labels monthly. Retrain model quarterly. Track precision/recall over time to detect data drift.", GREY, "222222", false, 5360),
          ]}),
        ]
      }),

      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("")] }),
      h2("4.4 Source Data → Schema Mapping", BLUE),
      schemaTable(
        ["Source Column", "Source Table", "Maps To (Schema)"],
        [
          ["cust_name + mobile_1",   "Sales / Service / Insurance", "Customer.cust_id (dedup key)"],
          ["address, city, pincode", "Sales",                       "Customer.address / city / pincode"],
          ["vin",                    "Sales / Service / Insurance", "Vehicle.vin (dedup key)"],
          ["engine",                 "Service / Insurance",         "Vehicle.engine_no"],
          ["model, variant, color",  "Insurance",                   "Vehicle.model / variant / color"],
          ["mfd_year, cc",           "Insurance",                   "Vehicle.mfd_year / cc"],
          ["registration_date",      "Sales / Service / Insurance", "Vehicle.registration_date"],
          ["sale_date",              "Sales / Insurance",           "Customer_Vehicle.purchase_date"],
          ["finance_flag, financed_by","Sales",                     "Retained in Sales table (feature)"],
          ["work_type, bill_amount", "Service",                     "Feature inputs for churn model"],
          ["policy_expiry_date",     "Insurance",                   "Feature: days_to_policy_expiry"],
          ["auto_membership",        "Insurance",                   "Feature: auto_membership_flag"],
        ],
        BLUE
      ),

      new Paragraph({ children: [new PageBreak()] }),

      // ── SECTION 5: Submission Checklist ───────────────────────────────
      h1("5. Submission Checklist"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        rows: [
          new TableRow({ children: [
            cell("Item", BLUE, "FFFFFF", true, 500),
            cell("Requirement", BLUE, "FFFFFF", true, 5000),
            cell("Status", BLUE, "FFFFFF", true, 3860),
          ]}),
          new TableRow({ children: [
            cell("1", LGRN, GREEN, true, 500),
            cell("Completed dataset with dummy data", LGRN, GREEN, false, 5000),
            cell("Task.xlsx — Sales (30), Service (76), Insurance (44) rows", GREY, "222222", false, 3860),
          ]}),
          new TableRow({ children: [
            cell("2", LGRN, GREEN, true, 500),
            cell("Proposed schema for Customer and Vehicle tables", LGRN, GREEN, false, 5000),
            cell("Task.xlsx — Customer sheet (30 rows), Vehicle sheet (30 rows)", GREY, "222222", false, 3860),
          ]}),
          new TableRow({ children: [
            cell("3", LGRN, GREEN, true, 500),
            cell("Mapping of source data to schema", LGRN, GREEN, false, 5000),
            cell("Section 4.4 of this document + Customer_Vehicle sheet", GREY, "222222", false, 3860),
          ]}),
          new TableRow({ children: [
            cell("4", LGRN, GREEN, true, 500),
            cell("Visual block diagram of ML/analytics pipeline", LGRN, GREEN, false, 5000),
            cell("Task.xlsx — ML_Pipeline sheet + Section 4.3 of this document", GREY, "222222", false, 3860),
          ]}),
        ]
      }),

      new Paragraph({ spacing: { after: 300 }, children: [new TextRun("")] }),
      divider(BLUE),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
        children: [new TextRun({ text: "End of Document", font: "Arial", size: 18, italic: true, color: "888888" })]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('C:/Users/shays/Desktop/interview/Solution_Document.docx', buf);
  console.log('Solution_Document.docx created.');
});
