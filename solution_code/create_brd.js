/**
 * create_brd.js
 * =============
 * Generates BRD_and_TestCases.docx — a full Business Requirements Document
 * and test case suite for the Automotive After-Sales Churn Prediction project.
 *
 * Run: node solution_code/create_brd.js
 * Output: BRD_and_TestCases.docx  (in parent directory)
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, Header, Footer, PageBreak, TabStopType,
  TabStopPosition
} = require('docx');
const fs = require('fs');

// ── Colour palette ──────────────────────────────────────────────────────────
const C = {
  NAVY:   "1F4E79",  lNAVY:  "D6E4F0",
  GREEN:  "375623",  lGREEN: "E2EFDA",
  RED:    "C00000",  lRED:   "FFE0E0",
  AMBER:  "C55A11",  lAMBER: "FCE4D6",
  PURPLE: "7030A0",  lPURPLE:"EAD7F7",
  GREY:   "404040",  lGREY:  "F2F2F2",
  DGREY:  "595959",
  WHITE:  "FFFFFF",
  BLACK:  "000000",
};

// ── Border presets ──────────────────────────────────────────────────────────
const thin  = { style: BorderStyle.SINGLE, size: 1,  color: "CCCCCC" };
const thick = { style: BorderStyle.SINGLE, size: 4,  color: "1F4E79" };
const bAll  = { top: thin, bottom: thin, left: thin, right: thin };
const bNone = { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } };

// ── Core helpers ────────────────────────────────────────────────────────────
const F = (text, { bold=false, size=20, color=C.BLACK, italic=false, font="Arial" } = {}) =>
  new TextRun({ text, bold, size, color, italic, font });

const P_plain = (children, { spacing={ after: 80 }, align=AlignmentType.LEFT } = {}) =>
  new Paragraph({ alignment: align, spacing, children: Array.isArray(children) ? children : [children] });

const P_center = (children, opts={}) =>
  P_plain(children, { ...opts, align: AlignmentType.CENTER });

const bullet = (text, color=C.BLACK, size=18) =>
  new Paragraph({
    indent: { left: 360, hanging: 180 },
    spacing: { after: 60 },
    children: [ F(`•  ${text}`, { size, color }) ]
  });

const sub_bullet = (text, color=C.DGREY) =>
  new Paragraph({
    indent: { left: 720, hanging: 180 },
    spacing: { after: 40 },
    children: [ F(`–  ${text}`, { size: 17, color, italic: true }) ]
  });

const spacer = (before=120, after=120) =>
  new Paragraph({ spacing: { before, after }, children: [F("")] });

const divider = (color=C.NAVY) =>
  new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color, space: 1 } },
    children: [F("")]
  });

// Section heading styles
const H1 = (text, color=C.NAVY) =>
  new Paragraph({
    spacing: { before: 320, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color, space: 4 } },
    children: [ F(text, { bold: true, size: 28, color }) ]
  });

const H2 = (text, color=C.NAVY) =>
  new Paragraph({
    spacing: { before: 240, after: 100 },
    children: [ F(text, { bold: true, size: 22, color }) ]
  });

const H3 = (text, color=C.DGREY) =>
  new Paragraph({
    spacing: { before: 160, after: 80 },
    children: [ F(text, { bold: true, size: 20, color }) ]
  });

// ── Table helpers ────────────────────────────────────────────────────────────
const tcell = (text, { bg=C.WHITE, fg=C.BLACK, bold=false, size=17,
                        width=2000, align=AlignmentType.LEFT, italic=false,
                        vAlign=VerticalAlign.CENTER } = {}) =>
  new TableCell({
    borders: bAll,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: bg, type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    verticalAlignment: vAlign,
    children: [ new Paragraph({
      alignment: align,
      children: [ F(text, { bold, size, color: fg, italic }) ]
    }) ]
  });

const thead = (texts, widths, bg=C.NAVY) =>
  new TableRow({
    tableHeader: true,
    children: texts.map((t, i) =>
      tcell(t, { bg, fg: C.WHITE, bold: true, size: 17, width: widths[i] })
    )
  });

const trow = (texts, widths, { bg=C.WHITE, fg=C.BLACK, altBg=C.lGREY,
                                 rowIndex=0, bold=false, size=17 } = {}) =>
  new TableRow({
    children: texts.map((t, i) =>
      tcell(t, { bg: rowIndex % 2 === 0 ? bg : altBg, fg, bold: i===0 && bold,
                  size, width: widths[i] })
    )
  });

const makeTable = (headerTexts, widths, dataRows, opts={}) => {
  const total = widths.reduce((a,b) => a+b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    rows: [
      thead(headerTexts, widths, opts.headerBg || C.NAVY),
      ...dataRows.map((row, i) => trow(row, widths, { rowIndex: i, ...opts }))
    ]
  });
};

// Priority cell with colour coding
const priCell = (priority, width=900) => {
  const map = { "High": C.lRED, "Medium": C.lAMBER, "Low": C.lGREEN };
  const fgMap = { "High": C.RED, "Medium": C.AMBER, "Low": C.GREEN };
  return tcell(priority, { bg: map[priority]||C.lGREY, fg: fgMap[priority]||C.GREY,
                             bold: true, size: 17, width, align: AlignmentType.CENTER });
};

const tcRow = (id, priority, name, objective, precon, steps, expected) =>
  new TableRow({
    children: [
      tcell(id,        { bg: C.lNAVY, fg: C.NAVY, bold: true, size: 16, width: 900 }),
      priCell(priority, 900),
      tcell(name,      { bg: C.WHITE, fg: C.BLACK, bold: true, size: 16, width: 2100 }),
      tcell(objective, { bg: C.WHITE, fg: C.DGREY, size: 16, width: 2200 }),
      tcell(precon,    { bg: C.lGREY, fg: C.GREY,  size: 15, italic: true, width: 1800 }),
      tcell(steps,     { bg: C.WHITE, fg: C.BLACK, size: 15, width: 3000 }),
      tcell(expected,  { bg: C.lGREEN, fg: C.GREEN, size: 15, width: 2500 }),
      tcell("",        { bg: C.lGREY, fg: C.BLACK, size: 15, width: 700,
                          align: AlignmentType.CENTER }),
    ]
  });

const tcHead = () =>
  new TableRow({
    tableHeader: true,
    children: [
      tcell("TC ID",    { bg: C.NAVY, fg: C.WHITE, bold: true, size: 17, width: 900  }),
      tcell("Priority", { bg: C.NAVY, fg: C.WHITE, bold: true, size: 17, width: 900  }),
      tcell("Test Name",{ bg: C.NAVY, fg: C.WHITE, bold: true, size: 17, width: 2100 }),
      tcell("Objective",{ bg: C.NAVY, fg: C.WHITE, bold: true, size: 17, width: 2200 }),
      tcell("Pre-condition",{bg:C.NAVY,fg:C.WHITE, bold:true, size:17, width:1800 }),
      tcell("Test Steps",{bg: C.NAVY, fg: C.WHITE, bold: true, size: 17, width: 3000 }),
      tcell("Expected Result",{bg:C.NAVY,fg:C.WHITE,bold:true,size:17,width:2500}),
      tcell("Pass/Fail",{bg: C.NAVY, fg: C.WHITE, bold: true, size: 17, width: 700  }),
    ]
  });

// ── Requirement row helper ──────────────────────────────────────────────────
const reqRow = (id, req, rationale, priority, owner, rowIndex=0) =>
  new TableRow({
    children: [
      tcell(id,        { bg: rowIndex%2===0?C.WHITE:C.lGREY, fg: C.NAVY, bold:true, size:17, width:900 }),
      tcell(req,       { bg: rowIndex%2===0?C.WHITE:C.lGREY, fg: C.BLACK, size:17, width:4500 }),
      tcell(rationale, { bg: rowIndex%2===0?C.WHITE:C.lGREY, fg: C.DGREY, size:16, italic:true, width:2500 }),
      priCell(priority, 900),
      tcell(owner,     { bg: rowIndex%2===0?C.WHITE:C.lGREY, fg: C.DGREY, size:16, width:1600 }),
    ]
  });

const reqHead = () =>
  new TableRow({ tableHeader: true, children: [
    tcell("Req ID",   { bg:C.NAVY, fg:C.WHITE, bold:true, size:17, width:900  }),
    tcell("Requirement Statement", { bg:C.NAVY, fg:C.WHITE, bold:true, size:17, width:4500 }),
    tcell("Business Rationale",    { bg:C.NAVY, fg:C.WHITE, bold:true, size:17, width:2500 }),
    tcell("Priority", { bg:C.NAVY, fg:C.WHITE, bold:true, size:17, width:900  }),
    tcell("Owner",    { bg:C.NAVY, fg:C.WHITE, bold:true, size:17, width:1600 }),
  ]});

const reqTable = (rows) => new Table({
  width: { size: 10400, type: WidthType.DXA },
  rows: [ reqHead(), ...rows ]
});

const nfrRow = (id, category, req, measure, priority, rowIndex=0) =>
  new TableRow({ children: [
    tcell(id,       { bg: rowIndex%2===0?C.WHITE:C.lGREY, fg:C.NAVY, bold:true, size:17, width:900 }),
    tcell(category, { bg: rowIndex%2===0?C.WHITE:C.lGREY, fg:C.PURPLE, bold:true, size:17, width:1600 }),
    tcell(req,      { bg: rowIndex%2===0?C.WHITE:C.lGREY, fg:C.BLACK, size:17, width:3800 }),
    tcell(measure,  { bg: rowIndex%2===0?C.WHITE:C.lGREY, fg:C.DGREY, size:16, italic:true, width:2800 }),
    priCell(priority, 900),
  ]});

const nfrHead = () =>
  new TableRow({ tableHeader: true, children: [
    tcell("NFR ID",   {bg:C.PURPLE,fg:C.WHITE,bold:true,size:17,width:900 }),
    tcell("Category", {bg:C.PURPLE,fg:C.WHITE,bold:true,size:17,width:1600}),
    tcell("Requirement",{bg:C.PURPLE,fg:C.WHITE,bold:true,size:17,width:3800}),
    tcell("Acceptance Measure",{bg:C.PURPLE,fg:C.WHITE,bold:true,size:17,width:2800}),
    tcell("Priority", {bg:C.PURPLE,fg:C.WHITE,bold:true,size:17,width:900 }),
  ]});

const nfrTable = (rows) => new Table({
  width: { size: 10000, type: WidthType.DXA },
  rows: [ nfrHead(), ...rows ]
});

// ── DOCUMENT BUILD ───────────────────────────────────────────────────────────
const doc = new Document({
  sections: [{
    properties: {
      page: {
        size: { width: 15840, height: 12240 },   // A3 landscape for wide tables
        margin: { top: 720, right: 720, bottom: 720, left: 720 }
      }
    },
    headers: {
      default: new Header({ children: [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.NAVY, space:1 } },
          children: [
            F("BRD & Test Cases  |  Automotive After-Sales Churn Prediction  |  Relatim  |  v1.0",
              { size: 16, color: "888888" })
          ]
        })
      ]})
    },
    footers: {
      default: new Footer({ children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.NAVY, space:1 } },
          children: [
            F("Page ", { size: 16, color: "888888" }),
            new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "888888", font:"Arial" }),
            F("  |  CONFIDENTIAL — Internal Use Only", { size: 16, color: "888888" }),
          ]
        })
      ]})
    },

    children: [

      // ══════════════════════════════════════════════════════════════════
      //  COVER PAGE
      // ══════════════════════════════════════════════════════════════════
      spacer(1440, 240),
      P_center([ F("BUSINESS REQUIREMENTS DOCUMENT", { bold:true, size:44, color:C.NAVY }) ]),
      P_center([ F("& TEST CASE SPECIFICATION", { bold:true, size:36, color:C.DGREY }) ]),
      spacer(200, 200),
      P_center([ F("Automotive After-Sales Customer Churn Prediction", { bold:true, size:28, color:C.GREY }) ]),
      spacer(80, 80),
      divider(C.NAVY),
      spacer(80, 80),
      makeTable(
        ["Field", "Details"],
        [2500, 7000],
        [
          ["Project Name",   "At-Risk Customer Identification — Automotive After-Sales Ecosystem"],
          ["Client",         "Relatim"],
          ["Document Type",  "Business Requirements Document (BRD) & Test Case Specification"],
          ["Version",        "v1.0"],
          ["Status",         "Draft — Pending Review"],
          ["Prepared By",    "Data & AI Engineering Team"],
          ["Reviewed By",    "[Pending — Kaviya Priya S, Relatim]"],
          ["Date",           "03 May 2026"],
          ["Deadline",       "05 May 2026, 11:59 PM IST"],
          ["Governed Under", "India DPDP Act 2023  |  GDPR Art.5 Principles  |  Green AI Guidelines"],
        ],
        { headerBg: C.GREY, altBg: C.lGREY }
      ),
      spacer(240, 100),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════════
      //  SECTION 1 — EXECUTIVE SUMMARY
      // ══════════════════════════════════════════════════════════════════
      H1("1.  Executive Summary"),
      P_plain([
        F("Automobile dealerships generate a significant portion of their revenue from "),
        F("after-sales services and insurance", { bold:true, color:C.NAVY }),
        F(". Despite this, dealerships lose approximately "),
        F("40% of their customers annually", { bold:true, color:C.RED }),
        F(" due to poor engagement, missed service reminders, and unrenewed insurance policies. " +
          "This document defines the full business requirements and test acceptance criteria for a " +
          "data-driven solution to identify and act on at-risk customers before they churn.")
      ], { spacing: { after: 120 } }),
      P_plain([
        F("The solution spans three business domains — "),
        F("Sales, Service, and Insurance", { bold:true }),
        F(" — and delivers a ranked churn risk score per customer with actionable CRM triggers. " +
          "All design decisions adhere to the "),
        F("India DPDP Act 2023", { bold:true, color:C.RED }),
        F(", GDPR Article 5 data minimisation principles, and "),
        F("Green AI", { bold:true, color:C.GREEN }),
        F(" responsible model governance practices.")
      ], { spacing: { after: 120 } }),
      spacer(80,80),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════════
      //  SECTION 2 — BUSINESS CONTEXT & PROBLEM STATEMENT
      // ══════════════════════════════════════════════════════════════════
      H1("2.  Business Context & Problem Statement"),
      H2("2.1  Background"),
      bullet("Dealerships earn 40–60% of gross profit from after-sales (service + insurance), not vehicle sales."),
      bullet("A churned after-sales customer = lost INR 5,000–30,000 per year in service revenue alone."),
      bullet("No current system proactively flags customers before they disengage."),
      bullet("Customer attrition is reactive — discovered only after long gaps in service visits."),
      spacer(80,80),
      H2("2.2  Problem Statement"),
      P_plain([
        F("There is no automated, data-driven mechanism to identify which customers are likely to stop using " +
          "dealership services in the next 3–6 months. The business needs a "),
        F("predictive churn model", { bold:true, color:C.NAVY }),
        F(" that ingests Sales, Service, and Insurance data, computes behavioural signals, and outputs a " +
          "risk-tiered customer list for proactive CRM engagement.")
      ], { spacing: { after: 120 } }),
      H2("2.3  Opportunity Sizing"),
      makeTable(
        ["Metric", "Estimate", "Basis"],
        [2800, 3000, 4200],
        [
          ["Annual customer base",        "~50,000 per mid-size dealer group", "Industry average"],
          ["Annual churn rate",           "~40%  (20,000 customers)",          "Problem statement"],
          ["Avg after-sales revenue/cust","INR 15,000/year",                   "Service + insurance avg"],
          ["Revenue at risk annually",    "INR 30 Crore / dealer group",       "20,000 × INR 15,000"],
          ["Target churn reduction",      "10–15%  (save 2,000–3,000 customers)", "Industry benchmark"],
          ["Revenue protected",           "INR 3–4.5 Crore / dealer group",   "Reduced churn × avg revenue"],
        ],
        { headerBg: C.NAVY, altBg: C.lNAVY }
      ),
      spacer(100,100),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════════
      //  SECTION 3 — OBJECTIVES & SUCCESS METRICS
      // ══════════════════════════════════════════════════════════════════
      H1("3.  Business Objectives & Success Metrics"),
      makeTable(
        ["#", "Objective", "KPI / Success Metric", "Target"],
        [500, 3800, 3300, 2400],
        [
          ["BO-1","Identify at-risk customers before they churn","Precision of High-risk tier","≥ 70%"],
          ["BO-2","Reduce annual after-sales churn rate","Churn rate after intervention","< 30% (down from 40%)"],
          ["BO-3","Enable proactive CRM outreach","% High-risk customers contacted within 48h","≥ 90%"],
          ["BO-4","Design future-proof, scalable data architecture","Schema supports 10x data without restructure","Architecture review sign-off"],
          ["BO-5","Protect customer PII per DPDP / GDPR","Zero PII in fact/analytics tables","100% — zero tolerance"],
          ["BO-6","Deliver explainable model output","SHAP top-3 drivers per customer","100% of scored customers"],
          ["BO-7","Promote Green AI practices","Model energy footprint vs baseline","< 5% compute overhead"],
        ],
        { headerBg: C.NAVY, altBg: C.lNAVY }
      ),
      spacer(100,100),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════════
      //  SECTION 4 — STAKEHOLDERS & RACI
      // ══════════════════════════════════════════════════════════════════
      H1("4.  Stakeholders & RACI Matrix"),
      makeTable(
        ["Stakeholder", "Role", "R", "A", "C", "I"],
        [2500, 2800, 600, 600, 600, 600],
        [
          ["Kaviya Priya S (Relatim)","Business Sponsor / Examiner","–","A","C","I"],
          ["Data Engineering Team",  "Solution Implementation",    "R","–","–","I"],
          ["CRM / Sales Team",       "End User (Dashboard)",       "–","–","C","I"],
          ["Service Centre Manager", "Domain Expert",              "–","–","C","I"],
          ["Insurance Partner",      "Data Provider",              "–","–","C","I"],
          ["IT / Security Team",     "PII Vault & RBAC Owner",     "R","A","–","I"],
          ["Compliance Officer",     "DPDP / GDPR Sign-off",       "–","A","C","I"],
        ],
        { headerBg: C.GREY, altBg: C.lGREY }
      ),
      spacer(80,80),
      P_plain([ F("R = Responsible  |  A = Accountable  |  C = Consulted  |  I = Informed",
        { size: 17, italic: true, color: C.DGREY }) ]),
      spacer(100,100),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════════
      //  SECTION 5 — SCOPE
      // ══════════════════════════════════════════════════════════════════
      H1("5.  Scope"),
      H2("5.1  In Scope", C.GREEN),
      bullet("Design and population of all dimension/reference tables (Bank, Dealer, WorkType, PolicyType, PayMode, CancelReason, Occupation, FuelType, Location, Milestone)."),
      bullet("Normalised fact tables for Sales, Service, and Insurance — no raw PII stored."),
      bullet("Customer master table with masked PII fields; Vehicle master table."),
      bullet("Customer–Vehicle bridge table supporting many-to-many ownership relationships."),
      bullet("PII Vault: isolated sensitive data store (name, mobile, email, address, DOB)."),
      bullet("Feature engineering: 17 computed signals covering Sales, Service, Insurance, and RFM dimensions."),
      bullet("Churn label definition and assignment (binary: 0/1)."),
      bullet("Churn scoring table with probability score, risk tier, SHAP top-3 drivers, and recommended action."),
      bullet("ML Pipeline visual block diagram (5-stage architecture)."),
      bullet("Python code: config, masking utils, generator, validator, and run entry point."),
      bullet("This BRD and test case document."),
      spacer(80,80),
      H2("5.2  Out of Scope", C.RED),
      bullet("Production deployment, CI/CD pipeline, or cloud infrastructure."),
      bullet("Full model training with real historical data (proof-of-concept only)."),
      bullet("Real-time data streaming or CDC (Change Data Capture) integration."),
      bullet("Mobile app or CRM system integration."),
      bullet("Financial forecasting or pricing optimisation."),
      bullet("Warranty, spare parts, or vehicle inventory management data."),
      spacer(100,100),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════════
      //  SECTION 6 — FUNCTIONAL REQUIREMENTS
      // ══════════════════════════════════════════════════════════════════
      H1("6.  Functional Business Requirements"),
      H2("6.1  Data Ingestion & Integration"),
      reqTable([
        reqRow("BR-001","The system SHALL ingest data from three source domains: Sales, Service, and Insurance.","All three domains are needed for a complete customer lifecycle view.","High","Data Eng",0),
        reqRow("BR-002","The system SHALL join Sales, Service, and Insurance records on VIN (Vehicle Identification Number) as the primary linking key.","VIN is the only reliable cross-domain key; name-based joins are unreliable.","High","Data Eng",1),
        reqRow("BR-003","The system SHALL deduplicate customers using a composite key of (mobile_1 + cust_name) and assign a unique cust_id token.","Customers can appear in multiple domains; tokenisation prevents duplication.","High","Data Eng",2),
        reqRow("BR-004","The system SHALL validate all date fields and reject records with logically invalid dates (e.g., delivery_date < sale_date).","Data quality gates prevent bad signals in feature engineering.","High","Data Eng",3),
      ]),
      spacer(80,80),
      H2("6.2  Data Normalisation (Reference / Dimension Tables)"),
      reqTable([
        reqRow("BR-005","The system SHALL replace all free-text categorical fields (financed_by, work_type, payment_mode, policy_type, cancel_reason, occupation, fuel_type) with FK references to corresponding dimension tables.","Normalisation reduces breach surface area and enables consistent analytics.","High","Data Eng",0),
        reqRow("BR-006","The system SHALL maintain dimension tables: dim_Bank, dim_Dealer, dim_Location, dim_WorkType, dim_PolicyType, dim_PayMode, dim_CancelReason, dim_Occupation, dim_FuelType, dim_Milestone.","Each table captures domain metadata needed for analytics and reporting.","High","Data Eng",1),
        reqRow("BR-007","All FK references in fact tables SHALL resolve to valid IDs in the corresponding dimension table (no orphaned foreign keys).","Orphaned FKs cause silent data loss in JOIN-based analytics.","High","Data Eng",2),
      ]),
      spacer(80,80),
      H2("6.3  Data Governance & PII Protection"),
      reqTable([
        reqRow("BR-008","The system SHALL store raw PII (cust_name, mobile_1, mobile_2, email, full address, DOB) ONLY in a dedicated PII_Vault table, isolated from all fact and analytical tables.","Implements GDPR Art.5 purpose limitation and India DPDP Act 2023 data minimisation.","High","Security",0),
        reqRow("BR-009","The Customer master table SHALL store only masked versions of PII fields: name_masked, mobile_masked, email_masked, birth_year (not full DOB).","Masked fields allow analytics without exposing identity.","High","Security",1),
        reqRow("BR-010","Name masking SHALL follow the format: first letter of each name part retained, rest replaced with * (e.g., 'Rahul Sharma' → 'R**** S*****').","Preserves initial-letter utility for CRM while removing identity.","High","Security",2),
        reqRow("BR-011","Mobile masking SHALL retain first 2 and last 2 digits; middle digits replaced with X (e.g., '9876543210' → '98XXXXXX10').","Allows call-centre partial verification without full number exposure.","High","Security",3),
        reqRow("BR-012","Email masking SHALL retain first character of local part and first character of domain; rest masked (e.g., 'rahul@gmail.com' → 'r***@g***.com').","Preserves format structure without revealing identity.","Medium","Security",4),
        reqRow("BR-013","In production, PII_Vault SHALL be stored in a separate database schema with Role-Based Access Control (RBAC). Only authorised roles (e.g., CRM_ADMIN) may access raw PII.","Defence-in-depth: even if analytical DB is breached, PII is isolated.","High","IT/Security",5),
      ]),
      spacer(80,80),
      H2("6.4  Data Modelling — Customer & Vehicle Schema"),
      reqTable([
        reqRow("BR-014","The Customer table SHALL have a minimum of 13 fields: cust_id (PK), name_masked, mobile_masked, email_masked, birth_year, gender, occ_id (FK), city, state, pincode, preferred_dealer_id (FK), created_at, updated_at.","Defined schema enables consistent joins and temporal tracking.","High","Data Eng",0),
        reqRow("BR-015","The Vehicle table SHALL have a minimum of 15 fields: vehicle_id (PK), vin (unique), reg_no, engine_no, model, variant, color, cc, mfd_year, registration_date, fuel_type_id (FK), transmission, body_type, seating_capacity, created_at.","Vehicle master enables cross-domain vehicle analytics.","High","Data Eng",1),
        reqRow("BR-016","The Customer_Vehicle bridge table SHALL model the many-to-many ownership relationship with fields: cv_id (PK), cust_id (FK), vehicle_id (FK), relationship_type, purchase_date, is_primary_owner, active_flag.","One customer may own multiple vehicles; one vehicle may have multiple owners (resale/co-ownership).","High","Data Eng",2),
      ]),
      spacer(80,80),
      H2("6.5  Feature Engineering"),
      reqTable([
        reqRow("BR-017","The system SHALL compute 17 engineered features per customer per vehicle from Sales, Service, and Insurance data. These include: vehicle_age_years, finance_flag, days_to_first_service, total_service_visits, days_since_last_service, avg_bill_amount, pct_paid_services, cancelled_visit_flag, num_policy_renewals, days_to_policy_expiry, auto_membership_flag, premium_trend, recency_score (1–5), frequency_score (1–5), monetary_score (1–5), rfm_total, churn_label.","Each feature captures a distinct signal of customer engagement or churn risk.","High","Data/ML",0),
        reqRow("BR-018","The churn_label SHALL be set to 1 (churned) if and only if: days_since_last_service > 365 AND days_to_policy_expiry < 0. Otherwise churn_label = 0.","Binary supervised label definition aligned to business definition of 'lost' after-sales customer.","High","Data/ML",1),
        reqRow("BR-019","RFM scores (recency, frequency, monetary) SHALL each be on a 1–5 integer scale. Higher = better engagement.","Standardised scale enables easy segmentation and model input.","Medium","Data/ML",2),
      ]),
      spacer(80,80),
      H2("6.6  ML / Analytical Pipeline"),
      reqTable([
        reqRow("BR-020","The pipeline SHALL consist of 5 stages: (1) Data Sources, (2) Ingestion & Processing, (3) Feature Engineering, (4) Model/Analytical Logic, (5) Output & Action.","5-stage architecture ensures separation of concerns and maintainability.","High","ML Eng",0),
        reqRow("BR-021","Stage 4 SHALL implement three parallel analytical approaches: Rule-Based Baseline, XGBoost Supervised Classifier, and K-Means Unsupervised Segmentation.","Multi-approach ensures both immediate actionability (rules) and long-term model value.","High","ML Eng",1),
        reqRow("BR-022","The model output SHALL include per-customer: churn_probability (0.0–1.0), risk_tier (High/Medium/Low), top_driver_1, top_driver_2, top_driver_3 (SHAP-based), and recommended_action.","Explainable output enables CRM agents to personalise outreach.","High","ML Eng",2),
        reqRow("BR-023","The system SHALL implement a feedback loop: churn labels refreshed monthly; model retrained quarterly; AUC-ROC drift monitored.","Prevents model staleness; ensures continuous improvement.","Medium","ML Eng",3),
      ]),
      spacer(100,100),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════════
      //  SECTION 7 — NON-FUNCTIONAL REQUIREMENTS
      // ══════════════════════════════════════════════════════════════════
      H1("7.  Non-Functional Requirements"),
      nfrTable([
        nfrRow("NFR-001","Performance","Feature engineering pipeline SHALL complete within 5 minutes for 100,000 records.","Measured by pipeline execution time log on test dataset of 100K rows.","High",0),
        nfrRow("NFR-002","Performance","Churn scoring output SHALL be generated within 10 minutes of feature computation completion.","Model inference time log; test on 100K records.","High",1),
        nfrRow("NFR-003","Security","PII_Vault SHALL be encrypted at rest using AES-256 in production environments.","Security audit log; encryption verification test.","High",2),
        nfrRow("NFR-004","Security","Access to PII_Vault SHALL require an authorised role (CRM_ADMIN or DATA_STEWARD). Analysts see masked data only.","RBAC penetration test: analyst role must NOT retrieve raw PII.","High",3),
        nfrRow("NFR-005","Scalability","Schema design SHALL support a 10x increase in data volume without structural changes.","Architecture review: confirm no hard-coded limits, FK tables are extensible.","High",4),
        nfrRow("NFR-006","Availability","Daily churn scoring pipeline SHALL achieve 99.5% monthly uptime.","Monitoring dashboard; < 3.6 hours downtime per month.","Medium",5),
        nfrRow("NFR-007","Green AI","ML model SHALL use only features with SHAP importance > 0.01 (prune low-signal features).","Feature importance report; max 17 features used.","Medium",6),
        nfrRow("NFR-008","Green AI","Model training SHALL be re-triggered only when AUC-ROC drops > 5% from baseline (avoid unnecessary retraining).","Model monitoring dashboard; automated drift alert threshold.","Medium",7),
        nfrRow("NFR-009","Auditability","All data transformation steps SHALL be logged with: operator name, timestamp, input hash, output row count.","Audit log table; reviewed in monthly data quality check.","High",8),
        nfrRow("NFR-010","Compliance","Solution SHALL comply with India DPDP Act 2023 and GDPR Art.5 principles: lawfulness, data minimisation, purpose limitation, storage limitation.","Compliance checklist sign-off by Compliance Officer.","High",9),
      ]),
      spacer(100,100),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════════
      //  SECTION 8 — DATA REQUIREMENTS
      // ══════════════════════════════════════════════════════════════════
      H1("8.  Data Requirements"),
      H2("8.1  Input Data Sources"),
      makeTable(
        ["Source", "Domain", "Key Fields", "Update Frequency", "Volume (est.)"],
        [1800, 1200, 4000, 1800, 1200],
        [
          ["Sales System","Sales","sales_id, cust_name, vin, sale_date, finance_flag, bank_id","Daily","~5,000 records/year/dealer"],
          ["DMS Workshop","Service","smr_id, vin, work_type_id, visit_date, bill_amount, mileage","Real-time","~20,000 records/year/dealer"],
          ["Insurance Portal","Insurance","ins_id, vin, policy_type_id, policy_expiry_date, premium","Monthly","~8,000 records/year/dealer"],
          ["Dealer Master","Reference","dealer_id, dealer_name, city, state, zone","Quarterly","~10 dealers"],
        ],
        { headerBg: C.NAVY, altBg: C.lNAVY }
      ),
      spacer(80,80),
      H2("8.2  Data Quality Requirements"),
      makeTable(
        ["Field", "Rule", "Action on Violation"],
        [2500, 4500, 3000],
        [
          ["sales_id / smr_id / ins_id","NOT NULL, unique within table","Reject record; log error"],
          ["vin","NOT NULL, exactly 17 characters, alphanumeric","Reject record; log error"],
          ["sale_date","Valid date; NOT NULL; sale_date <= delivery_date","Reject record; log error"],
          ["bill_amount","Numeric; >= 0; NULL allowed only for free services","Impute 0 for free services; log warning"],
          ["policy_expiry_date","Valid date; > policy_issue_date","Reject record; log error"],
          ["mobile_1","10-digit Indian mobile (starts with 6–9)","Flag for review; do not reject"],
          ["bank_id (Sales)","Must exist in dim_Bank if finance_flag = Y","Reject if finance_flag=Y and bank_id blank/invalid"],
          ["work_type_id (Service)","Must exist in dim_WorkType","Reject record; log error"],
          ["policy_type_id (Insurance)","Must exist in dim_PolicyType","Reject record; log error"],
        ],
        { headerBg: C.GREEN, altBg: C.lGREEN }
      ),
      spacer(100,100),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════════
      //  SECTION 9 — RISK REGISTER
      // ══════════════════════════════════════════════════════════════════
      H1("9.  Risk Register"),
      makeTable(
        ["Risk ID","Risk Description","Likelihood","Impact","Mitigation"],
        [900, 3500, 1200, 1200, 3200],
        [
          ["R-001","Customer deduplication fails — same person has multiple cust_ids due to mobile number changes","Medium","High","Use composite key (name+mobile) + fuzzy matching on name for secondary dedup"],
          ["R-002","PII data breach if PII_Vault access controls are misconfigured","Low","Critical","RBAC audit quarterly; encrypt at rest (AES-256); separate database schema"],
          ["R-003","Churn model becomes stale due to seasonal patterns or new products","Medium","Medium","Monthly label refresh; quarterly retrain trigger; AUC-ROC drift monitoring"],
          ["R-004","Class imbalance in churn label (too few churn=1 examples)","Medium","High","Oversample minority class (SMOTE); adjust decision threshold; use F1 over accuracy"],
          ["R-005","VIN-based join fails for vehicles not registered in current database","Low","Medium","Use composite fallback key (engine_no + reg_no) when VIN join yields no match"],
          ["R-006","Service data missing for customers who service at non-authorised workshops","High","Medium","Model includes 'no-service signal' as a feature; cannot eliminate but can flag"],
          ["R-007","CRM team does not act on High-risk list (last-mile failure)","Medium","High","Integrate directly into CRM as automated tasks; track outreach conversion rate"],
        ],
        { headerBg: C.AMBER, altBg: C.lAMBER }
      ),
      spacer(100,100),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════════
      //  SECTION 10 — ACCEPTANCE CRITERIA
      // ══════════════════════════════════════════════════════════════════
      H1("10.  Business Acceptance Criteria"),
      makeTable(
        ["AC ID","Criterion","Verification Method","Accepted By"],
        [900, 4500, 3000, 1600],
        [
          ["AC-001","All 21 Excel sheets present with correct headers and > 0 data rows","Run validate.py — all checks must PASS","Data Steward"],
          ["AC-002","Zero raw PII in Sales, Service, Insurance, Churn_Features, Churn_Scores sheets","PII leak scan in validate.py — zero names found","Compliance Officer"],
          ["AC-003","All FK IDs in fact tables resolve to valid dimension table entries","FK spot-check in validate.py — zero orphans","Data Eng Lead"],
          ["AC-004","Customer.name_masked, mobile_masked, email_masked fields use correct masking formats","Format check in validate.py — all contain * / X","Security Team"],
          ["AC-005","Churn label distribution is between 20% and 60% (realistic representation)","validate.py check — churn rate in 20–60% range","ML Engineer"],
          ["AC-006","Churn_Scores contains churn_probability (0.0–1.0) and top_driver_1/2/3 for all customers","Column existence + value range check","Business Sponsor"],
          ["AC-007","Python code runs end-to-end without errors on a clean Python 3.10+ environment","pip install requirements.txt && python run_solution.py — exit code 0","IT Team"],
          ["AC-008","ML_Pipeline sheet contains all 5 stage headers clearly visible","Visual review of ML_Pipeline sheet","Business Sponsor"],
          ["AC-009","dim_Bank uses IDs (BNK001, BNK002…) — no raw bank name in Sales.bank_id column","Column name check: Sales has bank_id not financed_by","Data Eng Lead"],
          ["AC-010","Solution document (Solution_Document.docx) contains source-to-schema mapping table","Manual review of Section 4.4","Business Sponsor"],
        ],
        { headerBg: C.NAVY, altBg: C.lNAVY }
      ),
      spacer(100,100),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════════
      //  SECTION 11 — GLOSSARY
      // ══════════════════════════════════════════════════════════════════
      H1("11.  Glossary"),
      makeTable(
        ["Term", "Definition"],
        [2500, 7500],
        [
          ["After-Sales","Revenue-generating activities post vehicle purchase: service, repairs, insurance, accessories."],
          ["AMC","Annual Maintenance Contract — a prepaid service plan covering scheduled maintenance for 1 year."],
          ["AUC-ROC","Area Under the Receiver Operating Characteristic Curve — model performance metric (0.5 = random, 1.0 = perfect)."],
          ["Churn","A customer who has stopped using dealership services (no service visit > 12 months AND no active insurance policy)."],
          ["CRM","Customer Relationship Management — system used to manage customer interactions and outreach."],
          ["DPDP Act","India's Digital Personal Data Protection Act, 2023 — governs processing and storage of personal data."],
          ["DMS","Dealer Management System — software used by dealerships to manage sales, service, and parts."],
          ["FK","Foreign Key — a column in one table that references the primary key of another table."],
          ["GDPR","General Data Protection Regulation (EU) — data privacy regulation. Art.5 covers data minimisation."],
          ["Green AI","Practice of designing AI/ML systems to minimise energy consumption and compute waste."],
          ["PII","Personally Identifiable Information — data that can identify an individual (name, mobile, email, address)."],
          ["PUCC","Pollution Under Control Certificate — mandatory vehicle emission test certificate (India)."],
          ["RBAC","Role-Based Access Control — security model that restricts system access based on user roles."],
          ["RFM","Recency, Frequency, Monetary — customer segmentation framework based on engagement behaviour."],
          ["SHAP","SHapley Additive exPlanations — ML explainability method that attributes model predictions to individual features."],
          ["SMR","Service Management Record — unique identifier for a workshop service visit."],
          ["Star Schema","Data warehouse design pattern with one central fact table surrounded by dimension tables."],
          ["VIN","Vehicle Identification Number — unique 17-character code identifying a specific vehicle chassis."],
          ["XGBoost","Extreme Gradient Boosting — high-performance supervised ML algorithm for classification/regression."],
        ],
        { headerBg: C.GREY, altBg: C.lGREY }
      ),
      spacer(80,80),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════════
      //  SECTION 12 — TEST CASES
      // ══════════════════════════════════════════════════════════════════
      H1("12.  Test Case Specification"),
      P_plain([
        F("This section covers "),
        F("70 test cases", { bold:true, color:C.NAVY }),
        F(" across 8 categories. Run automated tests via: "),
        F("python solution_code/validate.py", { bold:true, color:C.PURPLE }),
        F(". Manual/visual tests are marked accordingly.")
      ], { spacing: { after: 120 } }),
      makeTable(
        ["Category", "# Tests", "Automated?", "Description"],
        [3000, 1000, 1200, 5800],
        [
          ["TC-D: Data Ingestion & Quality",    "10", "Yes", "Validates data loads, mandatory fields, format rules, and logical date constraints."],
          ["TC-G: PII & Data Governance",        "10", "Yes", "Verifies PII masking, isolation, and compliance with DPDP/GDPR requirements."],
          ["TC-S: Schema & FK Integrity",        "12", "Yes", "Checks all foreign key references resolve; no orphaned IDs; schema correctness."],
          ["TC-F: Feature Engineering",          "15", "Yes", "Validates all 17 features: formula logic, value ranges, and derived calculations."],
          ["TC-M: Churn Logic & Model Output",   "10", "Yes/Partial", "Verifies churn label definition, risk tier assignment, probability range."],
          ["TC-O: Output & Reporting",            "5",  "Partial", "Checks dashboard fields, SHAP driver columns, pipeline visual sheet."],
          ["TC-E: Edge Cases",                    "8",  "Yes", "Boundary conditions: zero visits, only free services, co-ownership, etc."],
          ["TC-P: Performance & NFR",             "5",  "Manual", "Execution time, scalability review, security spot-check."],
        ],
        { headerBg: C.NAVY, altBg: C.lNAVY }
      ),
      spacer(80,80),

      // ── Category D ───────────────────────────────────────────────────
      H2("12.1  TC-D: Data Ingestion & Quality", C.NAVY),
      new Table({
        width: { size: 14100, type: WidthType.DXA },
        rows: [
          tcHead(),
          tcRow("TC-D001","High","Sales Sheet Exists & Loaded","Verify Sales sheet is present with expected 14 columns","Task .xlsx exists; run_solution.py completed","1. Open Task .xlsx\n2. Navigate to Sales sheet\n3. Verify columns: sales_id, cust_id, dealer_id, vin, mfd_year, registration_date, tax_validity, pucc_validity, finance_flag, bank_id, sale_date, delivery_date, sales_poc, loc_id","All 14 columns present; ≥ 25 data rows"),
          tcRow("TC-D002","High","Service Sheet Exists & Loaded","Verify Service sheet has 14 columns and data","Task .xlsx exists","1. Navigate to Service sheet\n2. Verify 14 columns including smr_id, cust_id, vin, work_type_id\n3. Check ≥ 50 data rows","14 columns; ≥ 50 rows (multiple visits per vehicle)"),
          tcRow("TC-D003","High","Insurance Sheet Exists & Loaded","Verify Insurance sheet has 15 columns","Task .xlsx exists","1. Navigate to Insurance sheet\n2. Verify columns include ins_id, cust_id, vin, policy_type_id, policy_expiry_date\n3. Check ≥ 25 rows","15 columns; ≥ 25 rows"),
          tcRow("TC-D004","High","Mandatory Fields Not Null","No null values in primary key fields","Sheets loaded","Run: df.isnull().sum() on sales_id, smr_id, ins_id, vin, cust_id columns across all fact sheets","Zero null values in all mandatory PK/FK fields"),
          tcRow("TC-D005","High","VIN Format Validation","VIN must be exactly 17 characters","Sales sheet loaded","1. Read Sales.vin column\n2. Check len(vin) == 17 for each row\n3. Check starts with 'MA3'","All VINs are exactly 17 characters; all start with 'MA3'"),
          tcRow("TC-D006","High","Date Field Parseable","All date fields must be DD-MM-YYYY parseable","Fact sheets loaded","For each date column (sale_date, visit_date, policy_expiry_date etc.): attempt datetime.strptime(val, '%d-%m-%Y')","Zero parse errors across all date fields"),
          tcRow("TC-D007","High","Bill Amount Non-Negative","Service bill_amount must be >= 0","Service sheet loaded","df[df['bill_amount'] < 0] should be empty","Zero rows with negative bill_amount"),
          tcRow("TC-D008","Medium","Registration Date After Manufacture Year","reg date year must be >= mfd_year","Sales/Vehicle sheets loaded","For each record: assert year(registration_date) >= mfd_year","Zero violations of temporal logic"),
          tcRow("TC-D009","High","Policy Expiry After Issue Date","Insurance dates must be logically consistent","Insurance sheet loaded","assert policy_expiry_date > policy_issue_date for all rows","Zero rows where expiry ≤ issue date"),
          tcRow("TC-D010","High","Delivery Date >= Sale Date","Vehicle delivery cannot precede sale","Sales sheet loaded","assert delivery_date >= sale_date for all rows","Zero rows where delivery_date < sale_date"),
        ]
      }),
      spacer(80,80),

      // ── Category G ───────────────────────────────────────────────────
      H2("12.2  TC-G: PII & Data Governance", C.RED),
      new Table({
        width: { size: 14100, type: WidthType.DXA },
        rows: [
          tcHead(),
          tcRow("TC-G001","High","Name Masking Format in Customer","Customer.name_masked must contain * for every row","Customer sheet loaded","1. Read name_masked column\n2. Check '*' in str(value) for all rows","100% of rows have * in name_masked; no plain full names"),
          tcRow("TC-G002","High","Mobile Masking Format in Customer","Customer.mobile_masked must contain X","Customer sheet loaded","Check 'X' in str(value) for all mobile_masked values","100% of rows have X in mobile_masked"),
          tcRow("TC-G003","High","Email Masking Format","Email must match masked pattern","Customer sheet loaded","Check email_masked matches regex: r'^.\\*+@.\\*+\\..+'","All email_masked values match masked format"),
          tcRow("TC-G004","High","No cust_name Column in Sales","Sales must NOT have a cust_name column","Sales sheet loaded","assert 'cust_name' not in df.columns","cust_name column absent from Sales sheet"),
          tcRow("TC-G005","High","No cust_name Column in Service","Service must NOT have a cust_name column","Service sheet loaded","assert 'cust_name' not in df.columns","cust_name column absent from Service sheet"),
          tcRow("TC-G006","High","No cust_name Column in Insurance","Insurance must NOT have a cust_name column","Insurance sheet loaded","assert 'cust_name' not in df.columns","cust_name column absent from Insurance sheet"),
          tcRow("TC-G007","High","No Raw PII in Churn_Features","ML input table must be PII-safe","Churn_Features loaded; PII_Vault loaded","Extract raw names from PII_Vault; search for any raw name in Churn_Features string representation","Zero raw names found in Churn_Features"),
          tcRow("TC-G008","High","PII_Vault cust_id Matches Customer","Every cust_id in PII_Vault must exist in Customer","Both sheets loaded","set(pii.cust_id) == set(customer.cust_id)","Exact match — no extra or missing cust_ids"),
          tcRow("TC-G009","Medium","DOB Shows Only Birth Year","Full DOB must not appear in Customer table","Customer sheet loaded","birth_year column must be 4-digit year string only; no DD-MM format","All values are 4-digit years (e.g., 1985); no full DOB visible"),
          tcRow("TC-G010","High","PII_Vault Row Count = Customer Row Count","One PII record per customer","Both sheets loaded","assert len(pii_vault) == len(customer)","Counts are equal; no missing or duplicate PII entries"),
        ]
      }),
      spacer(80,80),

      // ── Category S ───────────────────────────────────────────────────
      H2("12.3  TC-S: Schema & FK Integrity", C.GREEN),
      new Table({
        width: { size: 14100, type: WidthType.DXA },
        rows: [
          tcHead(),
          tcRow("TC-S001","High","Sales.bank_id → dim_Bank","All bank IDs in Sales must exist in dim_Bank","Both sheets loaded","set(sales.bank_id.dropna()) — set(dim_bank.bank_id) == empty","Zero orphaned bank_id values"),
          tcRow("TC-S002","High","Sales.dealer_id → dim_Dealer","All dealer IDs must resolve","Both sheets loaded","set(sales.dealer_id) ⊆ set(dim_dealer.dealer_id)","Zero orphaned dealer_id values"),
          tcRow("TC-S003","High","Sales.loc_id → dim_Location","All location IDs must resolve","Both sheets loaded","set(sales.loc_id) ⊆ set(dim_location.location_id)","Zero orphaned loc_id values"),
          tcRow("TC-S004","High","Service.work_type_id → dim_WorkType","All work type IDs must resolve","Both sheets loaded","set(service.work_type_id) ⊆ set(dim_worktype.work_type_id)","Zero orphaned work_type_id values"),
          tcRow("TC-S005","High","Service.pay_mode_id → dim_PayMode","All payment mode IDs must resolve","Both sheets loaded","set(service.pay_mode_id) ⊆ set(dim_paymode.pay_mode_id)","Zero orphaned pay_mode_id values"),
          tcRow("TC-S006","High","Service.cancel_reason_id → dim_CancelReason","Non-blank cancel reason IDs must resolve","Both sheets loaded","non_blank = service.cancel_reason_id.dropna().replace('', np.nan).dropna(); all in dim_cancelreason","Zero orphaned cancel_reason_id values"),
          tcRow("TC-S007","High","Insurance.policy_type_id → dim_PolicyType","All policy type IDs must resolve","Both sheets loaded","set(insurance.policy_type_id) ⊆ set(dim_policytype.policy_type_id)","Zero orphaned policy_type_id values"),
          tcRow("TC-S008","Medium","Customer.occ_id → dim_Occupation","All occupation IDs must resolve","Both sheets loaded","set(customer.occ_id) ⊆ set(dim_occupation.occ_id)","Zero orphaned occ_id values"),
          tcRow("TC-S009","Medium","Vehicle.fuel_type_id → dim_FuelType","All fuel type IDs must resolve","Both sheets loaded","set(vehicle.fuel_type_id) ⊆ set(dim_fueltype.fuel_type_id)","Zero orphaned fuel_type_id values"),
          tcRow("TC-S010","High","Sales.cust_id → Customer","All customer tokens in Sales must exist","Both sheets loaded","set(sales.cust_id) ⊆ set(customer.cust_id)","Zero orphaned cust_id values in Sales"),
          tcRow("TC-S011","High","Sales.vin → Vehicle","All VINs in Sales must exist in Vehicle","Both sheets loaded","set(sales.vin) ⊆ set(vehicle.vin)","Zero orphaned VINs in Sales"),
          tcRow("TC-S012","High","Customer_Vehicle → Vehicle","All vehicle_id values in bridge must resolve","Both sheets loaded","set(cv.vehicle_id) ⊆ set(vehicle.vehicle_id)","Zero orphaned vehicle_id values in bridge table"),
        ]
      }),
      spacer(80,80),

      // ── Category F ───────────────────────────────────────────────────
      H2("12.4  TC-F: Feature Engineering", C.PURPLE),
      new Table({
        width: { size: 14100, type: WidthType.DXA },
        rows: [
          tcHead(),
          tcRow("TC-F001","High","vehicle_age_years Non-Negative","Age cannot be negative","Churn_Features loaded","assert (cf.vehicle_age_years >= 0).all()","All values >= 0; no negative vehicle ages"),
          tcRow("TC-F002","High","days_since_last_service Non-Negative","Days since service cannot be negative","Churn_Features loaded","assert (cf.days_since_last_service >= 0).all()","All values >= 0"),
          tcRow("TC-F003","High","total_service_visits >= 1","Every customer had at least 1 visit","Churn_Features loaded","assert (cf.total_service_visits >= 1).all()","All values >= 1 (data generated with ≥1 visit)"),
          tcRow("TC-F004","Medium","avg_bill_amount >= 0","Average bill cannot be negative","Churn_Features loaded","assert (cf.avg_bill_amount >= 0).all()","All values >= 0"),
          tcRow("TC-F005","High","pct_paid_services in [0.0, 1.0]","Percentage must be a valid proportion","Churn_Features loaded","assert ((cf.pct_paid_services >= 0) & (cf.pct_paid_services <= 1)).all()","All values in [0.0, 1.0]"),
          tcRow("TC-F006","High","cancelled_visit_flag is 0 or 1","Binary flag validation","Churn_Features loaded","assert cf.cancelled_visit_flag.isin([0,1]).all()","Only values 0 and 1 present"),
          tcRow("TC-F007","Medium","num_policy_renewals >= 0","Cannot have negative renewals","Churn_Features loaded","assert (cf.num_policy_renewals >= 0).all()","All values >= 0"),
          tcRow("TC-F008","High","days_to_policy_expiry can be negative","Negative means already expired — valid","Churn_Features loaded","Column exists and is numeric; no type errors","Numeric column; both negative and positive values present"),
          tcRow("TC-F009","High","auto_membership_flag is 0 or 1","Binary flag validation","Churn_Features loaded","assert cf.auto_membership_flag.isin([0,1]).all()","Only 0 and 1 present"),
          tcRow("TC-F010","High","recency_score in [1, 5]","Score must be on defined scale","Churn_Features loaded","assert cf.recency_score.between(1,5).all()","All values between 1 and 5 inclusive"),
          tcRow("TC-F011","High","frequency_score in [1, 5]","Score must be on defined scale","Churn_Features loaded","assert cf.frequency_score.between(1,5).all()","All values between 1 and 5 inclusive"),
          tcRow("TC-F012","High","monetary_score in [1, 5]","Score must be on defined scale","Churn_Features loaded","assert cf.monetary_score.between(1,5).all()","All values between 1 and 5 inclusive"),
          tcRow("TC-F013","High","rfm_total = R + F + M","Derived column must equal sum of components","Churn_Features loaded","assert (cf.rfm_total == cf.recency_score + cf.frequency_score + cf.monetary_score).all()","All rfm_total values equal exact sum of R+F+M"),
          tcRow("TC-F014","High","rfm_total in [3, 15]","Min(1+1+1)=3, Max(5+5+5)=15","Churn_Features loaded","assert cf.rfm_total.between(3,15).all()","All rfm_total values between 3 and 15"),
          tcRow("TC-F015","Medium","churn_label is 0 or 1","Binary target variable","Churn_Features loaded","assert cf.churn_label.isin([0,1]).all()","Only values 0 and 1 present"),
        ]
      }),
      spacer(80,80),

      // ── Category M ───────────────────────────────────────────────────
      H2("12.5  TC-M: Churn Logic & Model Output", C.RED),
      new Table({
        width: { size: 14100, type: WidthType.DXA },
        rows: [
          tcHead(),
          tcRow("TC-M001","High","Churn Label = 1 When Both Conditions Met","Core business rule","Churn_Features with known test data","Create test row: days_since_last_service=400, days_to_policy_expiry=-10\nassert churn_label == 1","churn_label = 1 for the test row"),
          tcRow("TC-M002","High","Churn Label = 0 When Service Recent","Active customer must not be labelled churned","Churn_Features with known test data","Create test row: days_since_last_service=100, days_to_policy_expiry=-10\nassert churn_label == 0","churn_label = 0 (service is recent, so not churned)"),
          tcRow("TC-M003","High","Churn Label = 0 When Policy Active","Active policy prevents churn label","Churn_Features with known test data","Create test row: days_since_last_service=400, days_to_policy_expiry=90\nassert churn_label == 0","churn_label = 0 (policy still active)"),
          tcRow("TC-M004","High","Churn Label Binary Only","No null or unexpected values","Churn_Features loaded","assert cf.churn_label.isin([0,1]).all() and cf.churn_label.notna().all()","Only 0 and 1; zero nulls"),
          tcRow("TC-M005","High","risk_tier = High for churn_label = 1","Risk tier must align with churn label","Churn_Features loaded","high_risk = cf[cf.churn_label==1]; assert (high_risk.risk_tier == 'High').all()","All churn=1 rows have risk_tier='High'"),
          tcRow("TC-M006","High","risk_tier Values Are Valid","Only allowed values in risk_tier","Churn_Features loaded","assert cf.risk_tier.isin(['High','Medium','Low']).all()","Only 'High', 'Medium', 'Low' present"),
          tcRow("TC-M007","High","Churn Rate in Realistic Range","Rate must reflect ~40% annual churn","Churn_Features loaded","rate = cf.churn_label.mean(); assert 0.20 <= rate <= 0.60","Churn rate between 20% and 60%"),
          tcRow("TC-M008","High","Churn_Scores Probability in [0, 1]","Model output must be a valid probability","Churn_Scores loaded","assert cs.churn_probability.between(0.0, 1.0).all()","All probabilities in [0.0, 1.0]"),
          tcRow("TC-M009","High","High Risk Tier for Probability > 0.65","Risk tier must match probability threshold","Churn_Scores loaded","hi = cs[cs.churn_probability > 0.65]; assert (hi.risk_tier == 'High').all()","All rows with probability > 0.65 labelled 'High'"),
          tcRow("TC-M010","Medium","All Customers Scored","Every customer in Features has a Score","Both tables loaded","assert set(cf.cust_id) == set(cs.cust_id)","Exact same set of cust_ids in both tables"),
        ]
      }),
      spacer(80,80),

      // ── Category O ───────────────────────────────────────────────────
      H2("12.6  TC-O: Output & Reporting", C.NAVY),
      new Table({
        width: { size: 14100, type: WidthType.DXA },
        rows: [
          tcHead(),
          tcRow("TC-O001","High","High-Risk Customers Have Recommended Action","CRM action must be populated","Churn_Scores loaded","high_risk = cs[cs.risk_tier=='High']; assert (high_risk.recommended_action != '').all()","Non-empty recommended_action for all High-risk rows"),
          tcRow("TC-O002","Medium","SHAP Drivers Are Valid Feature Names","Drivers must be actual feature names","Churn_Scores loaded","valid_feats = [list of 17 feature names]; assert cs.top_driver_1.isin(valid_feats).all()","top_driver_1/2/3 all contain valid feature names from Churn_Features schema"),
          tcRow("TC-O003","Medium","Churn_Scores score_date Is Valid","Score date must be parseable","Churn_Scores loaded","pd.to_datetime(cs.score_date, format='%d-%m-%Y') — no errors","All score_date values parse without error"),
          tcRow("TC-O004","High","ML_Pipeline Has All 5 Stage Headers","Visual pipeline is complete","ML_Pipeline sheet loaded manually","Open ML_Pipeline sheet; verify presence of: STAGE 1 DATA SOURCES, STAGE 2 INGESTION, STAGE 3 FEATURE ENGINEERING, STAGE 4 MODEL, STAGE 5 OUTPUT","All 5 stage banners present with correct colour coding"),
          tcRow("TC-O005","Medium","README Contains Run Instructions","Examiner must be able to reproduce results","README sheet loaded","Open README sheet; verify presence of: 'pip install', 'python run_solution.py', 'python validate.py'","All three run commands present in README"),
        ]
      }),
      spacer(80,80),

      // ── Category E ───────────────────────────────────────────────────
      H2("12.7  TC-E: Edge Cases", C.AMBER),
      new Table({
        width: { size: 14100, type: WidthType.DXA },
        rows: [
          tcHead(),
          tcRow("TC-E001","High","Finance Flag = N Means No Bank ID","Unfinanced vehicles must not have a bank ID","Sales sheet loaded","financed_n = sales[sales.finance_flag=='N']; assert (financed_n.bank_id == '').all()","All finance_flag=N rows have blank bank_id"),
          tcRow("TC-E002","High","Free Service Has bill_amount = 0","Free services must not be billed","Service sheet loaded","free = service[service.work_type_id=='WT001']; assert (free.bill_amount == 0).all()","All WT001 rows have bill_amount = 0"),
          tcRow("TC-E003","High","Cancelled Service Has cancel_reason_id","Cancellation must have a reason","Service sheet loaded","cancelled = service[service.status=='Cancelled']; assert (cancelled.cancel_reason_id != '').all()","All Cancelled rows have non-blank cancel_reason_id"),
          tcRow("TC-E004","High","Completed Service Has No cancel_reason_id","Completed visits must not have a reason","Service sheet loaded","completed = service[service.status=='Completed']; assert (completed.cancel_reason_id == '').all()","All Completed rows have blank cancel_reason_id"),
          tcRow("TC-E005","Medium","Co-Owner Has is_primary_owner = N","Secondary owners must be flagged","Customer_Vehicle loaded","co_owners = cv[cv.relationship_type=='Co-Owner']; assert (co_owners.is_primary_owner == 'N').all()","All Co-Owner rows have is_primary_owner = N"),
          tcRow("TC-E006","Medium","Many-to-Many: Customer Has > 1 Vehicle","Bridge table demonstrates many-to-many","Customer_Vehicle loaded","cust_vehicle_counts = cv.groupby('cust_id').vehicle_id.nunique(); assert (cust_vehicle_counts > 1).any()","At least one customer maps to more than one vehicle"),
          tcRow("TC-E007","Medium","Many-to-Many: Vehicle Has > 1 Customer","Bridge table demonstrates many-to-many","Customer_Vehicle loaded","vehicle_cust_counts = cv.groupby('vehicle_id').cust_id.nunique(); assert (vehicle_cust_counts > 1).any()","At least one vehicle maps to more than one customer"),
          tcRow("TC-E008","Low","dim_FuelType Has Electric Vehicle Entry","Green AI: EV data must be supported","dim_FuelType loaded","assert 'Electric' in dim_fueltype.fuel_type_name.values","'Electric' fuel type present in dim_FuelType"),
        ]
      }),
      spacer(80,80),

      // ── Category P ───────────────────────────────────────────────────
      H2("12.8  TC-P: Performance & NFR", C.PURPLE),
      new Table({
        width: { size: 14100, type: WidthType.DXA },
        rows: [
          tcHead(),
          tcRow("TC-P001","High","End-to-End Script Runs Under 120 Seconds","Pipeline must be fast enough for daily use","Python environment with dependencies installed","time python solution_code/run_solution.py; check elapsed time","Execution completes in under 120 seconds"),
          tcRow("TC-P002","High","run_solution.py Exits with Code 0","No unhandled errors during generation","Python 3.10+ environment","Run: python solution_code/run_solution.py; echo exit code","Exit code = 0"),
          tcRow("TC-P003","High","validate.py Reports All Checks Passed","Validation must succeed end-to-end","run_solution.py completed","Run: python solution_code/validate.py; verify all lines show PASS","Zero FAIL lines in validation output"),
          tcRow("TC-P004","Medium","Schema Supports Additional dim Table","Architecture is extensible","Task .xlsx open","Manually add a new dim_Colour sheet with color_id and color_name; verify no existing formulas break","New sheet added without any FK errors in existing sheets"),
          tcRow("TC-P005","High","PII_Vault Not Accessible Without cust_id Join","PII isolation enforced by design","PII_Vault sheet; Customer sheet","Verify PII_Vault has no direct customer-identifying linkage other than cust_id token; no name/mobile in any fact table","cust_id is the only bridge; raw PII inaccessible without explicit vault join"),
        ]
      }),
      spacer(100,100),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════════
      //  SIGN-OFF
      // ══════════════════════════════════════════════════════════════════
      H1("13.  Document Sign-Off"),
      makeTable(
        ["Role", "Name", "Signature", "Date"],
        [2500, 3000, 2500, 2000],
        [
          ["Business Sponsor",   "Kaviya Priya S, Relatim", "", ""],
          ["Data Eng Lead",      "[Team Lead Name]",         "", ""],
          ["ML Engineer",        "[ML Engineer Name]",       "", ""],
          ["Compliance Officer", "[Compliance Officer Name]","", ""],
          ["IT / Security",      "[Security Lead Name]",     "", ""],
        ],
        { headerBg: C.GREY, altBg: C.lGREY }
      ),
      spacer(160,80),
      divider(C.NAVY),
      P_center([
        F("End of Document  —  BRD v1.0  |  Automotive After-Sales Churn Prediction  |  Relatim",
          { size: 17, italic: true, color: "888888" })
      ]),
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  const out = 'C:/Users/shays/Desktop/interview/BRD_and_TestCases.docx';
  fs.writeFileSync(out, buf);
  console.log('BRD_and_TestCases.docx created at:', out);
});
