# Vortiq Business OS: Master Product Plan & Engineering Specification

This document is the master engineering specification and implementation plan for building and running **Vortiq Business OS**—a complete, unified, AI-ready business operating system.

---

## 1. Product Architecture

Vortiq Business OS is designed as a secure, scalable, multi-tenant enterprise system. It is built using a modern monorepo structure containing separate, loosely coupled packages for the client workspace, api services, and helper libraries.

```
vortiq-monorepo/
├── apps/
│   ├── web/        --> Next.js React frontend client (Port 3005)
│   └── api/        --> Express Node.js backend server (Port 4000)
├── packages/
│   ├── db/         --> Prisma Client & Supabase schema definitions
│   ├── types/      --> TypeScript interfaces shared across workspaces
│   ├── agents/     --> Core AI Agent routing engine
│   └── voice/      --> Outbound calling & NCPR validation utilities
```

### 1.1 Technical Stack & Infrastructure
* **Frontend**: Next.js 15, React, Tailwind CSS (Bypassing color typo problems by using standardized Tailwind stops), Lucide icons.
* **Authentication**: Clerk Next.js SDK, providing email/password and OAuth sign-in with pre-built user profile components.
* **Backend**: Node.js Express server running TypeScript (`tsx` execution for production compatibility).
* **Database**: Supabase PostgreSQL database managed via Prisma ORM.
* **Caching & Queue**: Upstash Redis for message caching and background job task queues.
* **AI Provider Layer**: Decoupled Bring-Your-Own-Key (BYOK) middleware supporting Anthropic Claude, OpenAI, and Google Gemini APIs.

---

## 2. Complete Sitemap

The system partitions user navigation based on state: public marketing pages, guest personas sandboxes, and secure authenticated dashboard views protected by Clerk.

```
/ (Public Landing Page)
├── /pricing (Public Pricing Page - Redirects to /dashboard if logged in)
├── /demo (Guest Persona Sandbox Selector)
├── /login (Clerk Themed Sign-In Panel)
├── /signup (Clerk Themed Registration Panel)
├── /onboarding (Multi-Step Workspace Setup Wizard)
└── /dashboard (Secure Consolidated Command Center)
    ├── /crm (CRM & Pipelines - Contacts, Deals, Meetings)
    ├── /lead-engine (ICP leads matching & scrapers)
    ├── /sales (Dialer calling queue & scripts)
    ├── /marketing (Content calendars & campaign planners)
    ├── /inventory (SKU items catalog & low-stock alerts)
    ├── /finance (GST invoices, expense ledgers, & P&L)
    ├── /hr (Employee directory & payroll disbursals)
    ├── /tasks (Kanban operations board & workloads)
    ├── /support (SLA ticketing queue & reply drawers)
    ├── /analytics (NLP Text-to-SQL dashboards)
    ├── /briefings (WhatsApp briefing scheduler)
    ├── /settings (API BYOK keys & safety rules)
    └── /admin (Internal Vortiq Team Portal)
```

---

## 3. Page-by-Page Breakdown

### 3.1 Public Landing Page (`/`)
* **Purpose**: Marketing portal introducing Vortiq Business OS.
* **Components**: Hero section with dynamic number counters, competitive grids (Vortiq vs. Zoho vs. HubSpot), features carousel, customer feedback logs.

### 3.2 Pricing & ROI Calculator (`/pricing`)
* **Purpose**: Transparent plans selector and ROI calculator.
* **Redirect Rules**: If the user is logged in, immediately redirect to `/dashboard`.

### 3.3 Persona Sandbox Selector (`/demo`)
* **Purpose**: Allow prospective clients to preview pre-populated dashboard screens.
* **Authentication isolation**: Guests do not get access to actual customer data. Pre-populated mock datasets (Tata Motors, Reliance Retail, Alpha Components) are strictly sandboxed.

### 3.4 Operational Module Pages
* All pages from `/crm` to `/briefings` share a unified responsive layout layout containing:
  1. Overview header metrics cards.
  2. Tabbed detail directory (Search, Filter, Export, and Add buttons).
  3. Interactive side-drawer layout (View/Edit form fields, notes thread, audit logs timeline, file attachments).
  4. Contextual AI module agent helper console.

---

## 4. Module-Wise Sections

Every active module contains specialized sub-tabs to partition operational data:

1. **CRM**: Contacts List | Companies | Deals Pipeline | Meetings Calendar.
2. **Lead Engine**: Manual Leads Input | ICP Search Lists | Campaign Leads | Exporter.
3. **Sales**: Outbound Calling Queue | Call Logs History | Targets Dashboard | Sales Scripts.
4. **Marketing**: Campaign Planner | Social Media Calendar | Asset Library | Content Approvals.
5. **Inventory**: SKUs Catalog | Warehouses | Stock Movements Ledger | Low-Stock Warnings.
6. **Finance**: Invoice Generator | Estimate Bills | Credit/Debit Notes | Expense Ledger | P&L.
7. **HR**: Employee Records | Attendance Geofencing | Leaves Queue | Payroll Runs.
8. **Tasks**: My Tasks | Team Kanban Board | Project Calendars | Workload Grid.
9. **Support**: Tickets Queue | SLA Status | CSAT Scores | FAQ Knowledge Base.
10. **Analytics**: NLP SQL Compiler | Custom Telemetry Charts.
11. **WhatsApp Briefings**: Daily Briefings Scheduler | Dispatched Logs.
12. **Settings**: Company Profile | API Key Credentials | Webhooks | Security Logs.

---

## 5. Module-Wise Forms

To maintain system integrity, forms implement strict schemas, format validations, and manual override capabilities:

### 5.1 Add/Edit Contact Form (CRM)
* **Fields**: Name (string, req), Company Name (string), Email (validated format, req), Phone (national digits format, req), Assigned Rep (dropdown selection), GSTIN (15-character alphanumeric format check), Status (LEAD, QUALIFIED, CUSTOMER), Priority (LOW, MEDIUM, HIGH), Consent Status (DPDP Opt-In/Opt-Out, req).

### 5.2 Add SKU Form (Inventory)
* **Fields**: SKU Code (string, unique, req), Name (string, req), Category (dropdown), Current Stock (integer, req), Reorder Threshold (integer, req), Unit Cost Price (float, req), Unit Selling Price (float, req), HSN/SAC Code (8-digit format check), GST Rate Slab (dropdown select: Exempt, 5%, 12%, 18%, 28%), Warehouse Location (dropdown).

### 5.3 Invoice Generator Form (Finance)
* **Fields**: Invoice Number (string, req), Client ID (dropdown relation), Invoice Date (date selector), Due Date (date selector), Line Items Grid (Select SKU, Description, Quantity, Rate, GST Rate, HSN Code), CGST / SGST / IGST (calculated, display only), Total Value, Status (DRAFT, SENT, PAID, OVERDUE).
* *Note: Final calculations must be audited by business owners or certified accountants before filing GSTR.*

---

## 6. Database Schema (43 Entities)

```sql
-- Core organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    gstin VARCHAR(15),
    plan VARCHAR(50) DEFAULT 'FREE',
    trial_ends_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Core users table linked to Clerk
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    organization_id UUID REFERENCES organizations(id),
    role_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CRM Contacts table
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    company_id UUID,
    gstin VARCHAR(15),
    consent_status VARCHAR(50) DEFAULT 'OPTED_OUT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Finance Invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    client_id UUID REFERENCES contacts(id),
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    taxable_amount DECIMAL(12,2) DEFAULT 0.00,
    cgst DECIMAL(12,2) DEFAULT 0.00,
    sgst DECIMAL(12,2) DEFAULT 0.00,
    igst DECIMAL(12,2) DEFAULT 0.00,
    grand_total DECIMAL(12,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'DRAFT',
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Schema Checklist for remaining 39 entities:
* **CRM**: `companies`, `deals`, `pipelines`, `deals_stages`, `meetings`.
* **Sales & Marketing**: `calls` (DND-checked, call durations), `campaigns` (spent, leads generated), `campaign_assets`.
* **Inventory**: `products`, `skus` (reorder points), `vendors`, `warehouses`, `stock_movements`.
* **Finance**: `invoice_items`, `estimates`, `expenses`, `payments`.
* **HR**: `employees` (salary allocations, bank records), `attendance` (geofenced punch ins), `leaves`, `payroll` (computed gross disbursements).
* **Tasks & Support**: `tasks` (assignees, priorities), `support_tickets` (SLA deadlines), `ticket_messages`.
* **WhatsApp & AI Logs**: `whatsapp_briefings` (status, delivery logs), `ai_agents` (status), `ai_memories` (vector storage), `ai_workflows` (execution configurations), `ai_agent_messages` (internal agent conversations), `approvals` (review logs), `notifications`, `audit_logs` (immutable actions trackers), `reports`, `settings`, `integrations`.

---

## 7. API Structure

Every API route supports CRUD, faceted searching, filters, audit logs, and permission checks.

### 7.1 Example endpoint endpoints: `POST /api/v1/finance/invoices`
1. **Request payload**: `{ clientId, items: [{ skuId, qty, rate }] }`.
2. **Permission Guard**: Verifies active user JWT. Restricts role: Reps can create drafts; Managers can approve and publish.
3. **Logic Flow**:
   * Fetch client state.
   * Query SKU pricing and compute CGST/SGST/IGST tax rates.
   * Write records inside `invoices` and `invoice_items` under a database transaction.
4. **Audit Logger**: Write a record in `audit_logs` capturing payload delta.
5. **Errors handling**: Catch database constraint violations and return structured JSON (e.g., `400 Bad Request: GSTIN missing`).

---

## 8. User Roles & Permissions Matrix

Vortiq implements strict role-based access controls (RBAC) to enforce security boundaries:

| Role | Module Access | Create/Edit | Delete | Export Data | Approvals | AI Agent Access |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | All Modules | Unlimited | Yes | Yes | Yes | Master Config |
| **Admin** | All Modules | Yes | Yes | Yes | Yes | Module Context |
| **Sales Rep** | CRM, Lead Engine, Sales | Owned records | No | No | No | Outbound calling |
| **Marketing Rep** | Marketing | Yes | No | No | No | Campaign Copy |
| **Finance Mgr** | Finance, CRM | Yes | No | Yes | Yes | Ledger read |
| **HR Manager** | HR & Payroll | Yes | No | Yes | Yes | Resume match |
| **Support Rep** | Support, CRM | Yes | No | No | No | FAQ auto-draft |
| **Viewer** | All Modules | Read-Only | No | No | No | Read-Only |

---

## 9. Manual Workflows

Every workflow functions 100% manually, requiring zero AI keys to execute:

* **Manual Lead Qualification**: Sales reps click stars to rate leads (1-5 stars) and select the priority state from dropdown lists.
* **Manual Outbound Dialing**: Sales reps view phone numbers and click "Call". A form is provided to type conversation notes and select call outcomes.
* **Manual GST Calculation**: Finance managers add lines to invoices, select CGST/SGST percentages from checkboxes, and click "Submit".
* **Manual Task Delegation**: Managers allocate tasks to staff using member assignment dropdown selectors.

---

## 10. AI-Assisted Workflows

When Bring-Your-Own-Keys (BYOK) configurations are active, AI assistance enhances productivity without overriding human controls:

* **AI Lead Fit Scoring**:
  * *Data Used*: Lead industry, employee count, website copy.
  * *Action*: Computes ICP fit rating (0-100) and displays the confidence level.
  * *Safeguard*: Reps can manually override the score or adjust criteria.
* **AI Call Transcripts & Summaries**:
  * *Data Used*: Outbound call recording audio.
  * *Action*: Transcribes call and drafts next follow-up tasks.
  * *Safeguard*: Summaries require human review before saving to contact history.
* **AI Ticket Response Drafting**:
  * *Data Used*: Customer support query + FAQ knowledge base.
  * *Action*: Drafts customer email reply.
  * *Safeguard*: AI replies cannot be sent directly; support staff must review, edit, and click "Send".

---

## 11. Superboss AI Architecture

The **Superboss Consolidated AI Agent** is a Level 2 centralized command orchestrator positioned on the main dashboard. It aggregates alerts, anomalies, and metrics from Level 3 module agents, representing a unified business analyst console.

```
                  ┌──────────────────────────────┐
                  │ Level 1: Superadmin (Owner)  │
                  └──────────────┬───────────────┘
                                 ▼
              ┌─────────────────────────────────────┐
              │   Level 2: Superboss Command AI     │
              └──────┬───────────────────────▲──────┘
                     │ Delegates             │ Reports
                     ▼                       │ Logs
              ┌──────────────────────────────┴──────┐
              │    Level 3: Module AI Agents        │
              │  (CRM, Finance, Lead Engine, etc.)  │
              └─────────────────────────────────────┘
```

* **Aggregation**: Scans all modules for payment delays, low stock, support SLA threats, and employee task bottlenecks.
* **Collaboration**: Coordinates actions across departments (e.g. telling the sales agent to follow up when the finance agent flags an unpaid invoice).
* **Restrictions**: Superboss cannot make database modifications, change financial settings, or dispatch messages without manual human approval.

---

## 12. Module AI Agents (Level 3)

Thirteen domain-specific agents configured to access only their respective database collections:

1. **Dashboard Agent**: Aggregates company metrics and forecasts targets.
2. **CRM Agent**: Auto-scores deals and updates contact timelines.
3. **Lead Agent**: Screens inbound directories for duplicates and qualifies ICP scores.
4. **Sales Agent**: Monitors TRAI calling hours and drafts outbound call follow-ups.
5. **Marketing Agent**: Compiles ad-spend ROI metrics and drafts social media copy.
6. **Inventory Agent**: Checks SKU counts and drafts purchase orders (PO) when stock is low.
7. **Finance Agent**: Pre-populates CGST/SGST categories and flags ledger variations.
8. **HR Agent**: Screens resume matches and flags attendance check-in discrepancies.
9. **Tasks Agent**: Identifies delayed tasks and calculates employee load metrics.
10. **Support Agent**: Indexes ticket categories and matches incoming issues to FAQs.
11. **Analytics Agent**: Compiles text-to-SQL database queries.
12. **Briefing Agent**: Formats daily WhatsApp scorecard summaries.
13. **Settings Agent**: Audits BYOK API logs and monitors workflow statuses.

---

## 13. Employee AI Agents (Level 4)

Employees can assign tasks to a personal AI assistant configured under their account settings:

* **Role Alignment**: Adheres to the employee's role limitations (e.g., a Support user's agent cannot view financial invoices).
* **Functionality**: Drafts email follow-ups, structures daily task lists, flags overdue schedules, and escalates bottlenecks to the department head.

---

## 14. AI Memory Structure

Vortiq segregates memory tiers using permissions boundaries to protect company privacy:

1. **Company Memory**: Stores company details, industry type, branches, brand tone, and standard operating procedures (SOPs).
2. **Module Memory**: Stores CRM pipeline stages, lead qualifying thresholds, reorder alert levels, and FAQ lists.
3. **User Memory**: Captures individual user settings, template preferences, and assigned rosters.
4. **Record-Level Memory**: Tracks historical timelines, logs notes, updates deal status, and stores chat histories.
5. *Privacy Control*: Memory can be wiped, exported, or disabled at the tenant level.

---

## 15. Agent-to-Agent Communication

When agents collaborate across modules, they log structured updates in `ai_agent_messages`:

```json
{
  "messageId": "msg_90123",
  "sourceAgent": "FinanceAgent",
  "destAgent": "SuperbossAgent",
  "relatedModule": "FINANCE",
  "relatedRecord": "INV-101",
  "actionRequested": "NOTIFY_OVERDUE_INVOICE",
  "priority": "HIGH",
  "payload": {
    "clientId": "Tata Motors",
    "overdueDays": 5,
    "amount": 450000
  },
  "approvalRequired": true,
  "timestamp": "2026-06-15T18:10:00Z"
}
```

---

## 16. Workflow Automation Examples

### 16.1 Lead-to-Sale Workflow
1. A contact is created via a web-form.
2. `LeadAgent` checks for duplicate entries.
3. `LeadAgent` evaluates the contact's ICP fit score.
4. If score > 80, `SalesAgent` assigns a follow-up task to a rep.
5. `BriefingAgent` adds the reminder to the daily WhatsApp briefing.
6. `SuperbossAgent` monitors completion.

### 16.2 Sales-to-Invoice Workflow
1. A deal is marked as "Won".
2. `CRMAgent` updates the client status to `CUSTOMER`.
3. `FinanceAgent` auto-drafts a GST invoice based on deal values.
4. `InventoryAgent` updates stock counts.
5. *Human review is required before publishing the invoice or dispatching updates to the customer.*

---

## 17. Approval Flows

High-risk actions require manual confirmation. The system queues drafts inside the **Human Review Queue**:

* **Send Message**: Emails and WhatsApp messages drafted by AI must be reviewed. Users click "Approve" to send.
* **Financial Modification**: AI cannot post ledger entries, update invoices, or write payouts directly. Invoices are queued as `DRAFT` for accountant review.
* **System Operations**: Adjusting tax configurations, downloading audits, or changing workspace settings requires administrator override.

---

## 18. Notification Logic

Notifications are categorized based on priority and destination:

* **In-App Alerts**: Pushed instantly for new tasks, ticket assignments, or client notes.
* **Daily Briefing Digests**: Compiled scorecards dispatched via WhatsApp/Email to administrators (e.g. "Outstanding receivables: Rs 4.5L").
* **Escalations**: Triggered when tasks remain overdue or high-priority tickets approach SLA breach limits.

---

## 19. Audit Log Structure

To comply with enterprise audits, mutations write immutable records in `audit_logs`:

```json
{
  "logId": "audit_80123",
  "organizationId": "org_abc",
  "userId": "usr_sneha",
  "action": "UPDATE_INVOICE_STATUS",
  "entityType": "INVOICE",
  "entityId": "INV-101",
  "oldValues": { "status": "DRAFT" },
  "newValues": { "status": "SENT" },
  "ipAddress": "192.168.1.5",
  "timestamp": "2026-06-15T18:15:00Z"
}
```

---

## 20. AI Integration Settings

Administrators manage BYOK configurations within the `/settings` module:

* **Provider Config**: Select Anthropic, OpenAI, or Gemini, enter credentials, and test connectivity.
* **Safe Switches**: Enable/disable specific automations (e.g., require manual approval for emails, allow auto-scoring for leads).
* **Cost Tracking**: Estimate token consumption and trace call logs for compliance audits.

---

## 21. Security & Privacy Controls

* **Decoupled Keys**: Client API keys are encrypted before database storage.
* **Compliance Safeguards**: Voice calling includes built-in filters checking TRAI compliance hours (10:00 AM - 7:00 PM IST) and NCPR scrubbing lists.
* **DPDP Act (India) Compliance**: Contacts include clear flags mapping consent (Consent Given / Opted Out). Opting out wipes contact history from memory cache repositories.

---

## 22. Reports & Dashboards

* **P&L Statements**: Dynamically calculates revenue, tax splits (CGST/SGST/IGST), expenses, and net profit.
* **Sales Funnel Charts**: Displays conversion percentages across stages (Lead -> Qualified -> Negotiation -> Won).
* **Telemetry Insights**: Generates automated summaries of monthly updates (e.g. "Monthly revenue increased by 12%").

---

## 23. Error States & Fallback Logic

* **AI Connection Failed**:
  * *State*: The API key is missing or invalid.
  * *UX Alert*: *"AI services offline. Operating in Manual Mode. Forms and directories remain fully functional."*
* **SLA Breaches**:
  * *State*: A support ticket exceeds resolution time limits.
  * *UX Alert*: Auto-assigns the ticket to a supervisor and logs a critical flag.
* **Invalid GSTIN Inputs**:
  * *State*: User enters an invalid GST identification format.
  * *UX Alert*: Highlights input field in red: *"Format must match 15-digit alphanumeric Indian GST structure."*

---

## 24. Empty States & Loading States

* **Empty Directory panels**: Displays a clean folder graphic, explanatory help text, and an **"+ Add New"** action button.
* **Loading shimmers**: Table lists display gradient animation shimmers; dashboard metric widgets display loading spin overlays during fetch cycles.

---

## 25. UI/UX Component Structure

* **Top Header**: Logo, sidebar menu toggle, NLP text command input, theme selector, and user account dropdown (Profile details, Settings links, Logout).
* **Sidebar Menu**: Clean navigation links with active indicators, hidden on mobile/tablet viewports and accessible via an overlay drawer.
* **Mobile Sticky Bottom Nav**: Simple navigation shortcuts (Dashboard, CRM, Sales, Support, Settings) sticky at the bottom of viewports < 1024px.
* **Main Frame Layout**: Core cards containing metrics, forms, and data tables.

---

## 26. Developer-Ready Build Roadmap

### Phase 1: Authentication & Schema Provisioning (Completed)
* Clerk Next.js SDK integrated.
* Prisma Supabase database migrations deployed.

### Phase 2: Core Manual Layouts & Routing (Completed)
* Responsive layouts (`ConsoleLayout.tsx`) designed with sticky bottom navigation.
* All 12 module views implemented.

### Phase 3: Legibility & Theme Adjustments (Completed)
* Color stops standardized in globals.css.
* Light mode readability optimized for all tables and forms.

### Phase 4: Data Isolation & Demo Account Constraints (Completed)
* Fresh signups default to 100% empty state screens.
* Demo databases are isolated and accessible only to `demo@vortiq@vortiq.ai` credentials.

### Phase 5: Production Deployment & Go-Live (Completed)
* Render, Supabase, Redis, and Vercel environments linked and running.
* Turborepo workspaces successfully built and validated.
