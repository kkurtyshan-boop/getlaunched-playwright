# GetLaunched — Application Knowledge Base

Compiled by driving the live app (`https://frontv2.getlaunched.io`) with an
authenticated Playwright session (`kataratest573@gmail.com`, project **"Dior
Brand"**), cross-referenced against the 25 existing specs in `tests/`. Written
for a QA engineer who has never seen the app before and needs to plan test
coverage.

## 1. What the product is

GetLaunched is a **business-planning SaaS**: a user creates a "project"
(one business idea) and fills in a structured set of modules — market
research, product catalog, competitor analysis, marketing, team, budget,
risk, execution plan, MVP experiments — and the app continuously rolls that
data up into financial forecasts, health scores, and an auto-generated
**Business Plan** document. There's also an AI assistant ("Assist me") wired
into most pages that can chat about the current project's data.

Login is email/password (or "Login with Google"). After login the user lands
on **Select a project**, a grid of project cards; opening one drops into the
per-project app shell with a persistent left sidebar.

## 2. Top-level navigation map

Every project has this sidebar (icons omitted), always visible once inside a
project:

```
[Project name] ···                       ← project-level "..." menu (see §7)
Dashboard
Magic triangle  ▾
    Clients
    Products / Services
    Competitors
Operations
Financial  ▾
    Forecasts & Reports
    Funding & Setup
Implementation
Business plan
---
Language
Knowledge base
Notifications
[Avatar] <name> <email>                  ← account menu (see §8)
```

Breadcrumbs at the top of the content pane mirror this path (e.g.
`Dashboard > Financial > Forecasts & Reports`).

URL scheme: `/project/{uuid}/{section}[/{subsection}]`, e.g.
`/project/<id>/triangle/clients`, `/project/<id>/financial/funding-setup`,
`/project/<id>/implementation/risk-analysis`.

Two sections (**Operations**, **Implementation**) present their sub-areas as
**tabs** on one page (`role="tab"`, URL doesn't always change per tab for
Operations but does for Implementation); **Magic triangle** and **Financial**
present sub-areas as separate **sidebar sub-links** with distinct URLs.

Almost every content page has a top-right **"Assist me"** button that opens
an AI chat drawer (see §9) — it's present on essentially all module pages,
not just the dashboard.

## 3. Module-by-module map

### 3.1 Dashboard (`/dashboard`)
Read-only rollup, not a data-entry module. Shows: project header card (logo,
stage badge e.g. "Idea", created date, owner avatar, **Invite** button), then
widget cards:
- **Products purchased by customers** — matrix of Product × Client segment
- **Financial overview** — CAPEX / OPEX / break-even / profitability tiles
- **Critical risk** — count by severity (High/Medium/Low)
- **Competitor summary**
- **Location Analysis** / **Supplier Analysis** summaries
- **Action plan** summary

This page is a good target for **read-only smoke tests** — assert widgets
render without requiring any specific data state. Covered as of 2026-08-06
by `tests/26-dashboard.spec.js`: all 7 widget headings render; each widget
header is a real `<a href>` (not a JS-only handler) pointing at the correct
module page (confirmed exact hrefs — Products purchased → `/triangle/
products`, Financial overview → `/financial`, Critical risk →
`/implementation/risk-analysis`, Competitor summary → `/triangle/
competitors`, Location Analysis and Supplier Analysis both → `/operations/
other`, Action plan → `/implementation/action-plan`); Invite opens "Add
team members" correctly. Note: the page's content scrolls inside an inner
`<main>` element, not the document body — a bare Playwright `fullPage`
screenshot only captures the viewport, not the true scroll height.

### 3.2 Magic Triangle
Business-model-canvas-style section. Has its own overview page
(`/triangle`) with AI-generated content: "AI insights", "Overall Strategy
Health" score, "Competitor Summary", "Strategy details", "USP", "Value
proposition", and an **"Auto analyze"** button (re-runs the AI analysis —
likely an async/expensive action worth testing for loading state and
idempotency, not just clicking it repeatedly in CI). Covered as of
2026-08-06 by `tests/27-magic-triangle-overview.spec.js`: overview section
render + "Auto analyze" button disables while running and re-enables on
completion.

**Clients** (`/triangle/clients`) — list of customer segments.
- Table columns: Name, Description, Needs count, row "..." actions menu.
- **Create client** modal: Name*, Description (textarea), and a repeatable
  **Needs** sub-list (each need: name, Priority dropdown [Low/High/Critical/
  presumably Medium], Satisfaction dropdown [Not Satisfied/Partially
  Satisfied/Fully Satisfied]). A client can be created with zero needs.
  Validation: name required, "must be at least 2 characters".
- Click a client card to drill into detail view; **Edit** (pencil icon) opens
  the same form pre-filled, where individual needs can be deleted (own
  confirm dialog: "Yes, delete this need").
- CRUD: Create ✅, Read (list + detail) ✅, Update ✅ (name, needs), Delete
  need ✅ (no test yet deletes a whole *client*, only its needs — worth a gap
  check).

**Products / Services** (`/triangle/products`) — product/service catalog.
- Cards show: name, description, price (formatted with currency, e.g. "₴
  54 000,00"), price cadence (blank / "/Month" / "/Hour" — driven by Revenue
  Type), Revenue Type badge (Item / Subscription / Hourly / Donate seen so
  far), and attached-client count ("0 Client" / "1 Client").
  Suggests a **Revenue Type** enum with different downstream math (item vs.
  subscription vs. hourly recurring revenue) — good candidate for financial
  logic testing.
- **Create product** is a **2-step wizard** (dialog with step tabs): Step 1
  "Product" — name, description, Revenue Type (custom dropdown), Selling
  price (`#price`), Variable production cost (`#productionCost`). Step 2
  "Attach clients" — **Add client** button per attachment: pick a client
  (custom dropdown = "Business Unit"), then **Quantity per year** — one input
  *per planning-horizon year* (currently 2 columns, e.g. 2027/2028 — this
  scales with the project's planning horizon set at project creation).
  A product can be created with zero attached clients.
- **Edit** reuses the same 2-step wizard; the Attach Clients tab supports
  adding another client or deleting an existing attachment (own confirm:
  "Yes, delete this client").
- Validation: Next is blocked on step 1 until required fields are filled.
- CRUD: Create ✅, Read ✅, Update ✅ (base fields + client attachments),
  Delete — no spec deletes a whole product (gap).

**Competitors** (`/triangle/competitors`) — actually **three sub-modules on
one page**:
  1. **Competitors** — list (Name, URL, Type: Direct/Indirect/Potential).
     Create modal: Name, URL, Type (custom "Select" dropdown). Row "..." menu
     → **Edit** / **Delete** (own dialog with items, not the generic
     dialog-role confirm used elsewhere — "Yes, delete this competitor").
  2. **Evaluation criteria** — list of named criteria, each with a **Score
     (weight)**, chosen via a **radio button group** (1–10 seen in specs).
     Create modal: Name + weight radio.
  3. **Evaluation matrix** — a computed table: rows = criteria, columns =
     competitors; each cell is a per-competitor score (1–10, custom dropdown
     per cell) for that criterion; a footer row shows **Total weighted
     score** per competitor, computed as `Σ(criterion weight × cell score) /
     Σ(weights)` (confirmed against expected values in spec 10 — this is a
     real, testable calculation, not just UI).
  This trio (Competitors / Evaluation criteria / Evaluation matrix) is a
  **reusable pattern** — the *exact same* 3-part structure (items list +
  weighted criteria + comparison matrix) reappears for **Location Analysis**
  and **Supplier Analysis** under Operations → Other (§3.3), and the
  underlying weighted-score math should be identical — a good target for a
  shared/parameterized test helper.

### 3.3 Operations (`/operations`, tabbed page)

Tabs: **Marketing channels** (default) / **Team and staff** / **Resources**
/ **Other**.

**Marketing channels** — **Create channel** is a 2-step wizard:
  - Step 1: Channel name, **Category** (custom dropdown — categories as of
    2026-08-06, Title Case: Social Media, Paid Search, SEO & Content, Email
    Marketing, Events & PR, Direct Sales, Referral, **Other** [reveals a
    required free-text "Type category name" field] — previously sentence
    case with "Paid search (Google Ads)"; see `BUG_PATTERNS.md` for the
    recapitalization note. **Custom "Other" names are NOT scoped to the one
    channel** — they permanently join this shared per-project dropdown for
    every future channel, with no found way to remove one; confirmed
    polluted with test/garbage entries on the shared "Dior Brand" project —
    see `BUG_PATTERNS.md` "Custom 'Other' Category Names Permanently
    Pollute the Shared Category Dropdown"), **Client** (links the channel to
    a client segment — cross-module relationship, see §5), Strategy
    (textarea).
  - Step 2 "Sales funnels" — as of 2026-08-06, this is **no longer** a flat
    Monthly budget / Reach / Conversion-to-lead / Conversion-to-customer
    form. It's a **"Build your sales funnel"** builder: a fresh channel
    starts with one stage (**Quantity**, **Cost (optional)**, **Conversion
    rate,%** into the next stage), and **"Add funnel step"** chains up to 5
    stages end-to-end (e.g. "Reach" → "Leads"), with every stage after the
    first showing its Quantity **disabled/auto-computed** (previous stage's
    quantity × conversion rate). Totals **Total Cost** and **Final Result**
    ("N Deals") across all stages. See `BUG_PATTERNS.md` for the full
    before/after and the field-name mapping used by the specs.
  - Edit reuses the wizard; list view is a **table** (not cards), row menu →
    Edit/Delete.

**Team and staff** — single **Create team role** modal with a **radio
toggle** for two very different shapes:
  - **Key member** (named individual): First name, Last name, Background
    (textarea), Role name, Engagement %, Employment type (Full time /
    Freelance / ...), Salary, Pay period (Monthly/Hourly/Annually), Start
    year.
  - **Line staff** (a role, not a person): Role name, **Quantity per year**
    (one input per planning-horizon year, like Products), Engagement %,
    Employment type, Salary, Pay period, Start year, Description.
  Both key members and line staff show as cards; row menu → Edit/Delete.
  Key members feed the **Assignee** dropdown in Action Plan tasks (§3.4) and
  the picture avatar shown on the Dashboard header.

**Resources** — **Create new resource** modal, radio toggle:
  - **Investment**: Name, Category (Equipment/Hardware/Office space/
    Inventory/Copyrights/Trade secrets/Other), Cost (one-time), Amortization
    period (months, **max 100** — validated), Start year, Description.
  - **Running costs**: Name, Category (Goods and Materials/External services
    and Production costs/Rent and Utilities/Maintenance Repairs and
    Leasing/Vehicle and Transport/Insurance fees and Duties/Energy and Waste
    disposal/Administration and IT/Marketing advertising and Sales/Legal
    auditing and Consulting/Research and Development/Financial expenses),
    Payment type (Monthly/Annually), **Cost per year** (one input per
    planning-horizon year — a year *before* the resource's Start year is
    rejected by validation), Start year, Description.
  List is filterable by a top-level radio switch: **Investments** /
  **Running costs**. Row menu → Edit/Delete. This module feeds Financial →
  Forecasts & Reports (CAPEX/OPEX numbers) directly.

**Other** — three accordion sections:
  - **Intellectual Property Rights**: a fixed set of IP types — Trademark,
    Patent, Copyright, Design — each its own panel (single-select nav
    buttons, whose **label carries a live status badge**, e.g. "Patent
    Planned" → becomes "Patent Registered" after saving; match by prefix,
    not exact text). Per type: a "Tracked" switch, Registration status
    dropdown (Planned/Pending/Registered — inferred from data), Notes
    (textarea), **Save** button. Not a list — one record per IP type.
  - **Location Analysis**: the same 3-part pattern as Competitors —
    Locations (Name, Address) + Criteria Configuration (name + weight
    radio) + a weighted comparison matrix.
  - **Supplier Analysis**: same pattern — Suppliers (Name, Email, Country) +
    Criteria Configuration + weighted comparison matrix.
  Each accordion section's items support Edit/Delete via a card row-actions
  menu, same as everywhere else.

### 3.4 Financial (`/financial`, sidebar sub-links — covered by
`tests/28-financial-forecasts.spec.js` and `tests/29-financial-funding.spec.js`
as of 2026-08-06)

**Forecasts & Reports** (`/financial/forecasts-reports/...`):
  - Stat tiles: Initial Investment (CAPEX), Monthly Burn Rate (OPEX),
    Break-even Point (a *year*, e.g. "2027"), Profitability (net margin %).
    These are computed from Resources (§3.3) and Products pricing (§3.2).
    Confirmed live that these tile values match exactly (no drift) between
    the Dashboard's "Financial overview" widget and this full page.
  - "Revenue vs Expenses" line chart across the planning horizon, with a
    break-even marker.
  - Three tabs, each its own URL: **Income** (`.../financial-evaluation`),
    **Cash flow** (`.../cash-flow`), **Balance sheet** (`.../balance-sheet`).
    Each shows a "Planning horizon breakdown" table with a **Create entry**
    button (manual entries on top of the computed forecast) and an
    **Export** button (top-right, page-level — likely a PDF/Excel export).
  - Now smoke-tested (stat tiles/chart render, all three tabs load their own
    breakdown table); "Create entry" and "Export" themselves remain
    untested — still a coverage gap.

**Funding & Setup** (`/financial/funding-setup`):
  - **Working capital** calculator: three inputs — Days Inventory Outstanding
    (DIO), Days Sales Outstanding (DSO), Days Payables Outstanding (DPO) —
    live-computes **Cash conversion cycle** (`DIO + DSO − DPO`, shown with a
    Healthy/Moderate/High banding: 0–30 / 30–60 / 60+). Has its own **Save
    changes** button. Confirmed live: DIO=30/DSO=20/DPO=10 → CCC=40 (Moderate
    band), matching the formula exactly.
  - Below that, a second section — **also headed "Funding & Setup"** on this
    page (not "Funding & Capital" as previously documented), subtitled
    "Track equity and debt transactions" — shows **Total equity**, **Total
    debt**, and **Net funding** stat tiles (all ₴0 with no activities yet),
    an **empty state** ("No financing activities yet" / "Add your first
    investment or loan to start building your financial model"), and a
    **Create activity** button. Now smoke-tested (Working capital
    calculation + this section's tiles/empty-state/button all render);
    actually creating a financing activity remains untested.

### 3.5 Implementation (`/implementation`, tabbed page)

Tabs: **Risk analysis** (default) / **Action plan** / **MVP**. (Older code
paths refer to this as a tab *inside* Operations — it is now a top-level
sidebar item; `helpers`-style code in the specs defensively checks for a tab
first and falls back to a link, which still works since both render.)

**Risk analysis** — **Create risk** modal:
  - Name, Description, **Risk type** radio (External / Internal).
  - If **External**: an additional **PESTEL category** dropdown appears
    (Political/Economic/Social/Technological/Environmental/Legal) — this
    field is conditionally rendered, not present for Internal risks.
  - **Consequences** radio (Insignificant/Minor/Moderate/Major/Catastrophic)
    and **Probability** radio (Rare/Unlikely/Moderate/Likely/Almost Certain).
  - The app **computes a Risk level** (Low/Moderate/High/Extreme) from
    Consequences × Probability and shows it in the table row — this is a
    risk-matrix calculation, testable against known combinations.
  - A visual **risk matrix** (Consequences × Probability grid) plots markers;
    hovering a marker shows a **tooltip** with Consequences / Probability /
    Risk level for that risk.
  - Edit reuses the same form; row menu → Edit/Delete.

**Action plan** — a **Kanban board**, not a list:
  - **Add Stage** creates a new column (name required); default board ships
    with at least a "To Do" stage.
  - Each column has a "+" button (3rd icon button in the column header) to
    **create a task** in that stage. Task modal: Name*, Description,
    **Priority*** (Low/Medium/High/Critical — required), Stage (defaults to
    the column it was opened from), **Due date** (custom calendar popover),
    **Assignee** (dropdown sourced from Team and Staff §3.3 key members).
  - **Drag-and-drop** moves a card between columns — this is the one flow in
    the whole app documented as needing a **manual mouse sequence**
    (`mouse.down` → stepped `mouse.move` → `mouse.up`); Playwright's native
    `dragTo()` does not work here.
  - **Known bug/limitation**: editing a task and changing its **Stage**
    dropdown in the Edit form does **not persist** — only drag-and-drop
    actually moves a task between stages. Worth a regression test that
    specifically asserts this stays broken/fixed.
  - Row/card menu → Edit/Delete.

**MVP** — unlike everything else, **Create MVP is a dedicated full page**,
not a modal. Fields, in order:
  - MVP Name, **Type** (dropdown: Prototype / Test sales / Pilot project /
    Landing page / Explanatory video — 5 types total, matches spec
    coverage), **Target segment** (dropdown sourced from Clients §3.2 —
    cross-module link).
  - **Hypothesis**, broken into 3 sentence-starter inputs: "If we
    build/test...", "Then users will...", "Because we believe..." — a
    structured If/Then/Because hypothesis format.
  - **Key feature**: name, **Feature type** (Core / Optional — **at least one
    Core feature is required**; an MVP with only Optional features fails
    validation), description.
  - **Validation** block: Success metric (free text, e.g. "e.g. Conversation
    rate" placeholder — note the app's placeholder has a typo, "Conversation"
    for "Conversion"), Target value (free text, accepts things like "> 15%"),
    Time frame (free text, e.g. "30 days").
  - Submitting returns to the MVP list; **Edit** reopens the same full-page
    form (not a modal) pre-filled.

### 3.6 Business plan (`/business-plan/generate`)

An **auto-generated, presentation-style document** that rolls up nearly
every module into slides/sections: Management Summary (Executive Summary,
Market Opportunity, Financial Highlights), Value Proposition & USP, Clients,
Products & Services, Competitive Analysis, Go-to-Market, Team, Resources
(Location/Supplier Analysis), Financials (Funding & Capital, Resources &
Expenses, Working Capital, Revenue vs Expenses, Income/Cash flow/Balance
sheet), Risk Analysis, Action Plan, Intellectual Property Rights, Conclusion.
- URL carries `?template=minimal&orientation=vertical` — implying selectable
  **templates** and **orientations** (portrait/landscape?) not yet located in
  the UI during this pass (worth a follow-up look for a template/orientation
  picker control).
- Has a **"Next slide"** button, suggesting a slide-by-slide presentation
  mode in addition to (or instead of) continuous scroll.
- This is a good **read-only regression target**: seed known data across
  modules, generate the plan, and assert each section reflects it — it's the
  one place in the app that surfaces almost everything at once.
- Covered as of 2026-08-06 by `tests/30-business-plan.spec.js`: major
  sections render (Management Summary, Value Proposition, Clients, Products
  & Services, Competitive Analysis, Team, Risk Analysis, Action Plan) and
  "Next slide" changes the visible content. Template/orientation picker
  still not located — remains a coverage gap.

## 4. Account & settings surfaces (not project-scoped)

Reached via the **avatar menu** (bottom of sidebar, or top-right depending on
page): **Profile settings** / **Logout**.

- **Profile** (`/profile`): confirmed live 2026-08-06 — **Change personal
  Info**, **Password** (shows "Last update N days ago" + **Change
  password**), a **"My Invoices"** link at the top, a **Subscription and
  Usage** section shown directly inline on this page (not a separate
  `/profile/billing` tab — see below, this supersedes the earlier
  documented structure), and **Delete account** (with an explicit
  destructive-action warning). Not exercised beyond loading the page —
  Change password / Delete account remain unsafe to exercise against the
  shared account without an explicitly disposable one.
- **Subscription and Usage** — confirmed live on the main `/profile` page
  itself (the previously-documented separate `/profile/billing` sub-tab
  with an empty "No payment method added" state was **not** what's there
  now; re-verify whether that sub-tab still exists separately). Shows:
  Current Plan name, a feature table (Module access, AI agent queries,
  Project limit, Collaboration, Support media, Token Count), an **AI
  Usage** block with a live usage percentage, tokens used/remaining, and a
  reset date, plus **Unsubscribe** / **Change plan** buttons. Real usage
  numbers were visible (not a placeholder/empty state), suggesting genuine
  AI-token metering is active. Entirely untested beyond page-load — still
  unsafe to exercise Change plan/Unsubscribe against the shared account.
- **Notifications** (bell icon, sidebar): opens a panel with **Mark all as
  read** — a notification inbox, not yet explored for content/filtering.
  **Confirmed 2026-08-06: this frequently fails to open at all** (0/6
  attempts in one session) — see `BUG_PATTERNS.md` "Intermittent Sidebar
  Menu/Panel/Drawer Open Failure".
- **Language** (sidebar): a language switcher — confirmed live 2026-08-06
  to list at least English and German (previously only English had been
  seen); note the app already renders Ukrainian content for the Dior Brand
  seed data, so i18n is a real, active concern, not theoretical. **Opening
  this menu is intermittently unreliable** (~50% failure rate observed) —
  see `BUG_PATTERNS.md`.
- **Learning center** (sidebar) — **renamed from "Knowledge base"** as of
  2026-08-06 (update any reference to the old name); likely an external
  help-center link — not explored.

## 5. Project-level (not module-level) settings

From the **Select a project** screen, each project card has a **"..."**
actions menu → **Edit** / **Delete**:
- **Edit** opens the same **Create/Edit project** form used at creation:
  Project name, Website, Description (story textarea), Income tax %,
  Currency (custom combobox), plus several native `<select>` fields for
  things like founding year, legal form, and (inferred from spec 03's
  `selects.nth(4)`) something edited a second time in the delete/edit test —
  likely **planning horizon length**, which is the field that determines how
  many year-columns show up throughout Products, Resources, and Line staff
  (§3.2, §3.3). Confirming exactly which select controls the horizon length
  is a good follow-up investigation.
- **Delete** opens a confirm dialog (`role="dialog"`) with its own **Delete**
  button.
- Inside a project, the project name button at the top of the sidebar (with
  its own "...") likely surfaces the same Edit/Delete — not separately
  confirmed.
- **"Create project"** validation and the **"Projects templates"** button
  (top of the project list) — templates were not opened during this pass;
  likely a gallery of starter projects.

**Data hygiene warning confirmed live**: the real account currently has
**5 projects** — `Tea`, `Dior Brand`, `test`, `Premium`, `test 3`. The last
three look like leftover manual/test artifacts (matches the "no teardown"
problem called out in `TESTING_IMPROVEMENTS.md`, just at the *project* level
too, not only within Dior Brand's child records).

## 6. Collaboration

**Invite** (top-right button on Dashboard, and likely elsewhere) opens **Add
team members**: Email (required) + Role (required dropdown, options not
enumerated this pass — likely Admin/Editor/Viewer-style project roles,
distinct from the Team-and-Staff *business* roles in §3.3, which are just
planning data, not app permissions). This is a real multi-user permission
surface and is currently completely untested.

## 7. The "Assist me" AI assistant

A chat drawer (right-side panel, `AI chat` heading) is reachable from an
**"Assist me"** button present on the Dashboard, Magic Triangle, Business
Plan, and (by pattern) essentially every module page. It opens with a
greeting ("Hi! Karina! Welcome back! How can I help?"), quick-prompt chips
(e.g. "📊 What is the status of my project?", "🎯 Help me analyze market
risks", "💡 What should I focus on next?", "🚀 How can I boost my project
success?", "⚠️ How many risks my project have?"), a free-text "Ask AI
anything..." input, and a **Reset** control. Magic Triangle additionally has
an **"Auto analyze"** button distinct from Assist me — likely a batch
AI-analysis trigger rather than a chat. Auto analyze is now covered by
`tests/27-magic-triangle-overview.spec.js` (button disables while running,
re-enables on completion). Both are almost certainly backed by a real LLM
call — plan for async loading states, non-determinism in assertions, and
possibly cost/rate-limit considerations before adding automated coverage
of the chat itself.

**"Assist me" is currently unreliable to the point of being effectively
broken**: confirmed live 2026-08-06, clicking the "Assist me" button failed
to open the chat drawer in **5 out of 5** attempts from the Dashboard in a
single session (`role="dialog"` count stayed at 0 every time; the trigger
button itself was correctly located each time). This is the same failure
signature as the Notifications/Language issue — see `BUG_PATTERNS.md`
"Intermittent Sidebar Menu/Panel/Drawer Open Failure". No automated spec
exists for Assist me yet; before writing one, re-verify whether it opens
at all, since a spec asserting on chat *responses* is moot if the drawer
itself won't reliably open.

## 8. Cross-module relationships (data model, as inferred from the UI)

```
Client (Magic Triangle)
 ├─< Needs (1:many, inline on Client)
 ├─< Product "Attach clients" (many:many, + quantity/year per pair)
 ├─< Marketing Channel.client (many:1 — a channel targets one client)
 └─< MVP.targetSegment (many:1 — an MVP targets one client segment)

Product / Service (Magic Triangle)
 └─  Revenue Type drives pricing cadence shown everywhere the product's
     price appears (Dashboard "Products purchased by customers" matrix,
     Business Plan)

Competitor (Magic Triangle)
 ├─  Evaluation Criteria (project-wide, not per-competitor)
 └─  Evaluation Matrix = f(Competitor × Criteria) → weighted score

Team & Staff (Operations)
 └─< Action Plan Task.assignee (many:1 — only Key Members, not Line Staff,
     appear as assignees per spec 22)

Resources (Operations: Investment + Running costs)
 └─  feeds Financial → Forecasts & Reports (CAPEX from Investment cost,
     OPEX from Running costs) and the Dashboard financial tiles

Location / Supplier Analysis (Operations → Other)
 └─  same weighted-matrix pattern as Competitors, but scoped to
     Locations and Suppliers respectively (independent criteria sets)

Risk (Implementation)
 └─  Risk level = f(Consequences, Probability) — pure computed field

Action Plan (Implementation)
 └─  Stages are project-defined (not a fixed enum); Tasks belong to exactly
     one Stage; moving stages only works via drag-and-drop, not the edit form

MVP (Implementation)
 └─  targetSegment → Client; otherwise self-contained (hypothesis, feature,
     validation plan)

Business Plan
 └─  Read-only aggregate of every module above — no independent data of
     its own

Project (top level)
 └─  planning horizon (year count, set at project creation) drives the
     number of "per year" columns/inputs across Products (quantity/year),
     Line Staff (quantity/year), Running Costs (cost/year), and the
     Financial charts/tables
```

## 9. Cross-cutting UI conventions confirmed live

(These match and slightly extend the "Selectors & waits" section of
`CLAUDE.md` / `README.md` — recorded here because they matter for planning
new coverage, not just for writing selectors.)

- **Every list-style module follows the same shape**: cards or table rows,
  each with a "..." (or 3-dot) **row actions menu** → **Edit** / **Delete**,
  Delete always confirms via a `role="dialog"` with a scenario-specific
  label ("Yes, delete this **need**/**client**/**competitor**...").
- **Every multi-field create/edit form** that has more than ~4 fields is a
  **modal dialog** (`role="dialog"`), *except* **MVP**, which is the only
  full-page create/edit form in the app — a deliberate exception worth
  flagging in any new test rather than assuming modal-everywhere.
- **Custom dropdowns are one pattern app-wide** (already documented in
  `CLAUDE.md`): trigger `button[data-open="false"]` → `role="listbox"` →
  `role="option"`.
- **"Per planning-horizon-year" inputs** (Products quantity, Line Staff
  quantity, Running Costs cost) always render as **one input per year**,
  currently 2 columns (2027/2028) for the Dior Brand project — this count is
  project-configurable and should not be hardcoded to 2 in new tests.
- **Multi-step creation** (2-step wizard) appears for **Products** and
  **Marketing Channels** only; everything else is single-step.
- Success/failure feedback is a **toast/inline text**, not a dedicated
  region — specs match loosely on `/created|success|saved|added|updated/i`
  against `body`, which works but is imprecise; a `data-testid` on the toast
  would tighten this.

## 10. Coverage gaps worth prioritizing

Updated 2026-08-06 — items 1, 2, and half of 4 below are now covered (specs
`26`–`31`); remaining gaps ranked by how much of the app they touch and how
untested they currently are:

1. ~~**Financial section (Forecasts & Reports, Funding & Setup)**~~ —
   covered by `tests/28-financial-forecasts.spec.js` and
   `tests/29-financial-funding.spec.js` (stat tiles, tab navigation, working
   capital calculation). **Create entry** and **Export** on Forecasts &
   Reports, and creating a financing activity on Funding & Setup, remain
   untested.
2. ~~**Business Plan generation**~~ — covered by
   `tests/30-business-plan.spec.js` (major sections render, "Next slide"
   advances). Template/orientation picker still not located.
3. **Assist me / Auto analyze (AI features)** — Auto analyze now covered
   (`tests/27`); **Assist me chat remains 0% covered, and is currently
   unreliable to the point of not opening at all in 5/5 attempts** — see
   `BUG_PATTERNS.md` "Intermittent Sidebar Menu/Panel/Drawer Open Failure"
   before investing in chat-content test coverage.
4. **Invite / team permissions** — the Invite modal's own validation/UI is
   now covered (`tests/31-invite.spec.js`: Role dropdown, empty/malformed
   email rejection, Cancel); actually completing an invite (real email
   delivery, pending-invite lifecycle) and role-based permissions remain
   0% covered — still a real multi-user surface worth a dedicated pass.
5. **Whole-record delete** for Products and Clients (only child-record
   deletes — Needs, attached clients — are covered today).
6. **Project-level Edit/Delete and "Projects templates"** — Edit/Delete has
   partial coverage (spec 03); templates gallery is unexplored.
7. **Profile / Billing & Subscription** — page-load only (no form
   submission) now confirmed live (see §4); billing actions likely need to
   stay manual/mocked rather than run against the live account.
8. **Data hygiene at the project level**: the account already carries 3
   likely-orphaned projects (`test`, `Premium`, `test 3`) beyond the two
   real ones (`Tea`, `Dior Brand`) — matches the child-record duplication
   problem in `TESTING_IMPROVEMENTS.md`, just one level up. **Now also
   confirmed at the child-record level too**: the Products list currently
   holds two duplicate copies of all 4 seed products from repeated
   full-suite runs with no per-run unique marker — see `BUG_PATTERNS.md`
   "Duplicate Products From Non-Idempotent, Unmarked Test Fixtures".
9. **Dashboard, Magic Triangle Overview** — both now covered
   (`tests/26-dashboard.spec.js`, `tests/27-magic-triangle-overview.spec.js`)
   after being identified as additional zero-coverage modules beyond the
   original list above.
10. **Minor Global Settings (Notifications, Language, Learning center)** —
    now covered (`tests/32-minor-global-settings.spec.js`), which is what
    surfaced the Notifications/Language open-failure bug above.
