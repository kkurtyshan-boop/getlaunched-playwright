# BUG PATTERNS

Project regression knowledge base. Companion to `PROJECT_KNOWLEDGE.md` (app
map) and `RELEASE_CHECKLIST.md` (what to test). This file is the **historical
memory** of every *confirmed* bug, regression, unstable area, workaround,
limitation, and important implementation detail discovered while testing
GetLaunched — so nothing has to be rediscovered from scratch in a future
session.

**Rules for maintaining this file** (do not violate these when appending):
- Only log **confirmed** findings — reproduced live, or documented in the
  codebase itself (README.md, CLAUDE.md, spec code/comments) by whoever
  originally discovered them through real test execution. Never invent or
  speculate a bug into existence here — unverified hypotheses belong in
  `RELEASE_CHECKLIST.md` as things still to check, not here.
- When a bug is fixed, **update its Status in place** — do not delete the
  entry. The point of this file is that history is never lost, including
  the history of things that *used* to be broken.
- **Newest entries go at the top** of both the detailed section and the
  quick-index in "Regression Checklist" at the end.
- If a future session finds no new confirmed bugs, still update this file's
  "Last reviewed" line below so it's clear the file was checked, not just
  stale.

**Last reviewed:** 2026-08-07, second pass (Dedicated Dashboard **Mobile**
QA follow-up — 390×844 only, both projects, Figma Mobile page re-attempted,
plus mobile-only surfaces: hamburger nav drawer, Notifications/Profile
overlays, Invite dialog layout parity, data-truncation recovery)

**Last reviewed:** 2026-08-07, first pass (Dedicated Dashboard QA session —
Figma comparison attempt via Dev Mode, empty-state project + populated "Dior
Brand" project, desktop + mobile, functional/data/edge-case/diagnostics
passes)

**Last reviewed:** 2026-08-06 (Full-suite regression run + release-readiness
pass across all 25 existing specs, plus new coverage for Dashboard, Magic
Triangle Overview, Financial, Business Plan, Invite, and Minor Global
Settings)

**How this initial version was populated:** no destructive/full regression
pass has been executed against the live app yet as of this writing — the
work done so far was app discovery (`PROJECT_KNOWLEDGE.md`) and checklist
planning (`RELEASE_CHECKLIST.md`), not systematic bug-hunting. This file's
initial entries are therefore seeded from **already-confirmed** facts sitting
in the codebase (`README.md` "Known quirks", `CLAUDE.md`, and code comments
in `tests/*.spec.js` written by whoever built the suite through real,
executed test runs), plus **one** anomaly directly observed during this
session's live exploration. Nothing below is speculative — items whose root
cause or exact scope is still uncertain are explicitly marked as such rather
than overstated.

**Last reviewed:** 2026-08-26 (Dior-Brand decoupling refactor — full suite
migrated onto a bootstrapped "Autotest Project"; two new confirmed bugs found
via stricter persistence assertions and a live network probe)

---

## Team & Staff — "Line Staff" Creation Always Fails (Missing `employment_percent` in `staffing[]`)

### Module
Operations → Team and Staff — Create team role, "Line staff" shape

### Feature
Create Line Staff — form submission

### Status
**Confirmed** (2026-08-26)

### Description
Creating a Line Staff role (as opposed to a Key Member) always fails.
Confirmed via a direct network probe (not just UI timeout): the frontend's
`POST /api/v1/projects/{id}/team-members` call always returns `422` with
`{"staffing.0.employment_percent field is required..."}`. The form's single
"Presence of the importance,%" input is sent as a top-level
`engagement_percent`, but is never copied into each `staffing[]` row (one row
per planning-horizon year, populated from "Quantity per year" — itself
required client-side). Reproduced 3x with different field values and fill
orders.

### Expected Behaviour
Submitting a fully-filled Line Staff form (Role name, Quantity per year,
Engagement %, Employment type, Salary, Pay period, Start year) should create
the record, matching Key Member's working submission.

### Actual Behaviour
Every Line Staff submission is rejected by the backend with a 422 validation
error the UI does not surface in a readable way (the click just appears to
do nothing).

### Root Cause (if known)
Frontend payload bug: `staffing[]` rows are built from "Quantity per year"
but never receive the `employment_percent` value the backend requires per
row.

### Regression Risk
High — Line Staff is a documented, load-bearing part of Operations → Team and
Staff (drives Resources/Financial cost rollups per PROJECT_KNOWLEDGE.md §8),
and is currently 0% functional.

### Areas Affected
Operations → Team and Staff → Create/Edit Line Staff.

### QA Notes
`tests/14-create-team-and-staff.spec.js` and `tests/15-edit-team-and-staff.spec.js`
now `test.skip()` their Line Staff cases with this explanation, keeping the
correct implementation in place so they start passing the moment this is
fixed — re-verify every release.

### Workaround (if any)
None found.

---

## Client Edit Form Discards an Uncommitted Name Change After Deleting a Need

### Module
Magic Triangle → Clients — Edit Client

### Feature
Edit Client form — Name field, combined with deleting a Need in the same
session

### Status
**Confirmed** (2026-08-24)

### Description
In the Edit Client form, typing a new Name and then deleting one of the
client's Needs (via the need's own delete + "Yes, delete this need" confirm)
silently discards the uncommitted Name edit — the need-delete action appears
to refetch/reset the form's data, and the Name reverts to its last-saved
value. Clicking Update afterward saves the need deletion but not the
intended rename.

### Expected Behaviour
An in-progress Name edit should survive an unrelated need deletion within the
same edit session, matching how Update is expected to save every changed
field together.

### Actual Behaviour
Confirmed by filling Name, deleting a need, clicking Update, reloading, and
finding the old Name unchanged while the need was correctly removed.

### Root Cause (if known)
Not confirmed from the outside — consistent with the need-delete action
refetching the client record into the form (to refresh the needs list) in a
way that also clobbers other locally-edited-but-unsaved fields.

### Regression Risk
Medium — silently loses user input with no error shown; easy to miss in
manual testing since the need deletion itself does succeed.

### Areas Affected
Magic Triangle → Clients → Edit Client, when combining a Name change with a
Need deletion in one session.

### QA Notes
`tests/05-edit-client-delete-need.spec.js` works around this by filling the
Name field *after* the need-delete confirmation, not before — confirmed this
ordering makes the rename persist correctly. No fix needed on the test side
beyond that ordering; flagging here as a real product bug.

### Workaround (if any)
Re-enter/re-confirm the Name field immediately before clicking Update, after
any need deletions in the same session.

---

## Dashboard — "Competitor Summary" Empty State Reuses the "Critical Risk" Icon

### Module
Dashboard (project overview)

### Feature
Empty-state illustration shown per widget card when a module has no data yet

### Status
**Confirmed** (2026-08-07)

### Description
On a freshly created, fully empty project, every Dashboard widget card shows
a distinct empty-state illustration (SVG icon) paired with its own
"Describe your ..." / "Add your ..." prompt — a box icon for "Products
purchased by customers", a banknote icon for "Financial overview", a map-pin
icon for "Location Analysis", a delivery-truck icon for "Supplier Analysis",
a kanban icon for "Action plan", and so on. **"Competitor summary" and
"Critical risk" are the only two widgets that render the identical
icon** — a hexagon with an exclamation mark — even though they are two
unrelated modules (competitive analysis vs. risk register). Confirmed by
diffing the two widgets' `<svg><path d="...">` data directly in the DOM: the
path strings are byte-for-byte identical between the "Critical risk" and
"Competitor summary" empty-state icons, while every other widget pair has a
distinct path. Reproduced on both Desktop (1440×900) and Mobile (390×844)
viewports, and confirmed visually via screenshot on both.

### Expected Behaviour
Consistent with every other widget on the page, "Competitor summary" should
show its own semantically distinct empty-state icon (e.g. something
evoking comparison/analysis — a chart, magnifying glass, or people icon),
not the risk-warning icon already used by "Critical risk".

### Actual Behaviour
"Competitor summary"'s empty-state icon is pixel-for-pixel (path-for-path)
identical to "Critical risk"'s.

### Root Cause (if known)
Not confirmed from the outside — consistent with the "Competitor summary"
empty-state component being wired to the wrong icon asset/key at
implementation time (e.g. copy-pasted from the Critical risk widget and the
icon reference never swapped).

### Regression Risk
Low functionally (doesn't block any action), but a real, visible content
bug on the very first screen every new user sees, and it will resurface on
every future empty project until the icon reference is fixed.

### Areas Affected
Dashboard → "Competitor summary" widget, empty state only (populated state
was not affected — the populated "Dior Brand" project's Competitor summary
widget renders its real weighted-score content, not this icon, once data
exists).

### QA Notes
Confirmed live on project `QA Empty State (2026-08-07)`
(`/project/019fdbaa-1d51-727a-9153-b79f4f6c0f45/dashboard`), both desktop and
mobile viewports. Verified via `document.querySelectorAll('svg')` path
comparison, not just visual inspection, to rule out a screenshot artifact.

### Workaround (if any)
None needed for end users (cosmetic only).

---

## Dashboard / Forecasts & Reports — "Revenue vs Expenses" Chart Y-Axis Mislabeled

### Module
Dashboard (Financial overview widget) and Financial → Forecasts & Reports

### Feature
"Revenue vs Expenses" line chart — Y-axis tick labels

### Status
**Confirmed** (2026-08-07)

### Description
The Y-axis of the "Revenue vs Expenses" chart renders tick labels as
`₴150000k`, `₴300000k`, `₴450000k`, `₴600000k` instead of a correctly
formatted compact value such as `₴150M` / `₴300M` / `₴450M` / `₴600M` (or, at
minimum, a thousands-separated `₴150,000K`). Confirmed by reading the actual
SVG `<text>` node contents via the DOM (`Array.from(document.querySelectorAll
('svg text')).map(t => t.textContent)`), not just visually — the raw
strings are exactly `"₴150000k"`, `"₴300000k"`, `"₴450000k"`, `"₴600000k"`.
Reproduced identically on both the Dashboard's "Financial overview" widget
mini-chart and the full-size chart on Financial → Forecasts & Reports, on
the populated "Dior Brand" project.

### Expected Behaviour
Axis labels should use a single, correctly scaled unit consistent with the
stat tiles directly above the chart on the same page, which format the same
order of magnitude correctly (e.g. "Initial Investment (CAPEX) ₴4.18M").

### Actual Behaviour
The axis appends a lowercase "k" suffix directly onto an already
6-digit number with no thousands separator, producing a value that reads as
"150,000 thousand" — off by a factor of 1,000 in how it's presented, even
though the underlying data/scale of the chart itself (line positions,
0–2028 range) is otherwise correct.

### Root Cause (if known)
Not confirmed — consistent with the axis tick formatter dividing the raw
value by 1,000 to compute a "k" label without also checking whether the
result should instead be promoted to "M", or with the formatter being
applied to an already-thousands-scaled value a second time.

### Regression Risk
Medium — this is a highly visible chart on both the Dashboard (seen by every
user on every visit) and the primary Financial reporting page, and a
mislabeled axis undermines trust in the financial numbers even though the
stat tiles themselves are accurate.

### Areas Affected
- Dashboard → Financial overview widget → Revenue vs Expenses mini-chart
- Financial → Forecasts & Reports → Revenue vs Expenses chart

### QA Notes
Confirmed live on `/project/019dfc93-1e50-70f3-ac16-7c8c5dd1e6c9/dashboard`
and `/project/019dfc93-1e50-70f3-ac16-7c8c5dd1e6c9/financial/forecasts-reports/financial-evaluation`.
The stat tiles on both pages (CAPEX/OPEX/Break-even/Profitability) were
cross-checked and are accurate and consistent between the two pages — only
this chart's axis labels are affected. **Reconfirmed on Mobile (390×844)**
during the 2026-08-07 mobile follow-up pass — same exact mislabeled values
visible on the Dashboard widget's mini-chart at that viewport too.

### Workaround (if any)
None needed for correctness of the underlying data — only the axis label
text is wrong.

---

## App-Wide Overlay Primitive Triggers Two Accessibility Violations on Open (Invite Dialog, Mobile Nav Drawer, Profile Menu — at Minimum)

### Module
Global — shared dialog/drawer/dropdown primitive underlying at least the
Invite dialog, the mobile hamburger navigation drawer, and the account
Profile menu

### Feature
Any overlay built on this shared primitive — dialog semantics and focus
management on open

### Status
**Confirmed** (2026-08-07; scope widened 2026-08-07 mobile follow-up)

### Description
Opening the "Add team members" dialog (via the Dashboard's "Invite" button)
reliably produces two distinct browser console warnings on every open,
confirmed on both the empty test project and the populated "Dior Brand"
project:
1. `Warning: Missing 'Description' or aria-describedby={undefined} for
   {DialogContent}.` — the dialog has no accessible description wired up.
2. `Blocked aria-hidden on an element because its descendant retained
   focus... Element with focus: <button ...>` — an ancestor of the
   currently-focused button (the app shell's root content wrapper) is
   marked `aria-hidden="true"` while a descendant of it still holds
   keyboard focus, which is an explicit WAI-ARIA violation the browser
   itself refuses to fully apply.

**Mobile follow-up (same day):** the identical `aria-hidden`/focus warning
(same exact ancestor class `div.flex h-dvh flex-col flex-auto overflow-hidden`)
was also reproduced by opening the **mobile hamburger navigation drawer**
("Open navigation" button, 390×844 viewport), and **both** warnings
(missing Description *and* the aria-hidden/focus conflict) were reproduced
together by opening the **account Profile menu** (avatar button, top-right,
mobile). This confirms the issue lives in a shared overlay/dialog primitive
used across the app, not something specific to the Invite dialog.

### Expected Behaviour
Radix/whatever dialog primitive backs this component should have an
accessible description (or `aria-describedby` explicitly set to nothing if
none is needed) and should not leave focus inside an `aria-hidden` subtree —
assistive-technology users should be able to both understand the dialog's
purpose and have their focus correctly exposed to the accessibility tree at
all times.

### Actual Behaviour
Both warnings fire on every observed open of this dialog, with no
functional breakage for sighted mouse/keyboard users — the dialog opens,
the form is usable, and it closes cleanly via Cancel/✕/Escape (per the
already-documented, mostly-reliable behavior of this specific dialog).

### Root Cause (if known)
Not confirmed — consistent with the dialog's underlying primitive (likely
Radix `Dialog`) being used without a `DialogDescription` child, and with
whatever mounts the background overlay applying `aria-hidden` to the app
shell before/without properly re-parenting or blurring focus first.

### Regression Risk
Low for sighted users, but a real, reproducible accessibility defect for
screen-reader/assistive-technology users, and now **confirmed on 3
independent surfaces** (Invite dialog, mobile nav drawer, Profile menu) —
strongly suggesting every overlay in the app built on the same shared
primitive is affected. Still worth spot-checking modals not yet tested
(Create Client, Create Product, Create Risk, Notifications panel, Language
menu, "Assist me" drawer) for the same pattern in a future accessibility
pass, but this should now be treated as a systemic/global issue rather than
an Invite-specific one.

### Areas Affected
- Dashboard → "Invite" button → "Add team members" dialog (both warnings)
- Mobile (390×844) → hamburger "Open navigation" button → nav drawer
  (aria-hidden/focus warning)
- Mobile (390×844) → account avatar button (top-right) → Profile menu
  (both warnings)
- Not yet checked: other create/edit modals (Create Client, Create Product,
  Create Risk, etc.), Notifications panel, Language menu, "Assist me" drawer.

### QA Notes
Confirmed via `page.on('console')` / browser console warnings on both
`/project/019fdbaa-1d51-727a-9153-b79f4f6c0f45/dashboard` (empty project) and
`/project/019dfc93-1e50-70f3-ac16-7c8c5dd1e6c9/dashboard` ("Dior Brand"),
including on a rapid double-click open of Invite (no duplicate dialogs were
spawned — that part is safe; only these accessibility warnings are at
issue). Mobile nav drawer and Profile menu reproductions confirmed on the
empty project at 390×844 on the 2026-08-07 mobile follow-up pass.

### Workaround (if any)
None needed for sighted users. No end-user-facing workaround for
assistive-technology users exists today.

---

## Mobile Invite Dialog Drops the "Cancel" Button Present on Desktop

### Module
Global — Invite / Add team members dialog, mobile layout only

### Feature
"Add team members" dialog footer — action buttons

### Status
**Confirmed** (2026-08-07, mobile follow-up)

### Description
On Desktop (1440×900), the "Add team members" dialog footer shows two
buttons side by side: **Cancel** and **Invite**. On Mobile (390×844), the
same dialog (now rendered as a full-screen sheet) shows only **Invite** at
the bottom and a "✕" icon in the header — the **Cancel** button does not
exist anywhere in the mobile DOM (confirmed via a text search across the
full page, not just a viewport/scroll check).

### Expected Behaviour
Per the task's own instruction to verify nothing is missing on Mobile
compared to Desktop where it should exist: the dialog should offer the same
explicit "Cancel" action on both viewports, consistent with every other
create/edit dialog in the app.

### Actual Behaviour
Mobile users can only dismiss the dialog via the "✕" icon (functionally
equivalent to Cancel — closes without saving, confirmed) or by submitting
via "Invite". The labeled "Cancel" affordance itself is simply absent.

### Root Cause (if known)
Not confirmed — consistent with the mobile dialog footer template only
including the primary action button and relying on the header "✕" to cover
the secondary/cancel action, without an explicit design decision to also
drop the "Cancel" label.

### Regression Risk
Low functionally (the "✕" provides an equivalent escape hatch, confirmed
working), but a real Desktop/Mobile parity gap and a minor discoverability
regression — "✕" icons are conventionally understood as "close", not
always as explicitly as a labeled "Cancel" button, and some users scan for
the labeled action they saw elsewhere in the app.

### Areas Affected
Dashboard → "Invite" button → "Add team members" dialog, Mobile (390px)
layout only. Not yet checked whether other dialogs have the same
Desktop-has-Cancel / Mobile-drops-Cancel pattern.

### QA Notes
Confirmed on the empty test project
(`/project/019fdbaa-1d51-727a-9153-b79f4f6c0f45/dashboard`) at 390×844,
cross-checked against the same dialog at 1440×900 on the same project.

### Workaround (if any)
None needed — the "✕" icon achieves the same result.

---

## Dashboard Widgets Truncate Long Data-Driven Text With No Way to Recover the Full Value

### Module
Dashboard — widgets that render real record names/descriptions as row
labels (confirmed: "Products purchased by customers" matrix rows,
"Critical risk" list items; likely also "Action plan" task names)

### Feature
Row-label text rendering inside Dashboard widget cards

### Status
**Confirmed** (2026-08-07, mobile follow-up; also visible on Desktop)

### Description
Several Dashboard widgets render real record text (product names, risk
descriptions, task names) truncated with a trailing ellipsis when the
container is too narrow — e.g. "Eau de Parfum Dior — Signature (50 мл)"
renders as "Eau de Par...", and "Internal risk — critical inventory system
outage in peak s..." is cut mid-sentence. Confirmed via direct DOM
inspection that the **full, untruncated text does exist** in the DOM (e.g.
`textContent` correctly returns the complete product name) — this is a
purely visual/CSS truncation, not missing data. However, unlike the
matrix's own **column** headers (which get single-letter chips *plus* a
legend below spelling out each full name), there is **no equivalent
recovery mechanism for the truncated row labels**: no `title` attribute
(confirmed absent via `getAttribute('title')` on the text node and its
parent), no tooltip on hover/tap, no legend, and the row itself is not
clickable/linked (confirmed — no ancestor element within 5 levels has
`cursor: pointer` or is an `<a>`/link) to view the full record elsewhere.
Most visible on Mobile (390px) due to narrower columns, but the same
truncation (without recovery) is also present on Desktop (1440px) once
names exceed the column width.

### Expected Behaviour
A user should always have some way to read the full value of a truncated
row label — at minimum a native `title` tooltip, ideally a proper tooltip
component, or making the row clickable through to the underlying record —
consistent with how the same widget already solves this exact problem for
its column headers via a legend.

### Actual Behaviour
Truncated row labels are a dead end: no tooltip, no legend, not clickable.

### Root Cause (if known)
Not confirmed — consistent with the row-label component using a plain
`truncate`/`text-overflow: ellipsis` CSS class with no accompanying
`title` prop or tooltip wrapper, while the column-header component (built
separately, evidently) was given the legend treatment.

### Regression Risk
Low-Medium — doesn't block any action, but is a real, repeatable usability
gap on the very widgets meant to give an at-a-glance summary, and will
worsen as product/risk/task names get longer or as more segments are added.

### Areas Affected
- Dashboard → "Products purchased by customers" widget → row labels
  (product names)
- Dashboard → "Critical risk" widget → list item descriptions
- Dashboard → "Action plan" widget → task names (same visual pattern
  observed; not independently DOM-verified for a `title` attribute)

### QA Notes
Confirmed on "Dior Brand" project, both 390×844 and 1440×900, via
`document.querySelectorAll` + `getBoundingClientRect`/`getAttribute`
inspection, not just visual screenshot comparison.

### Workaround (if any)
For product names specifically: the user can open the widget's own deep
link ("→") to the full Products / Services page, which shows untruncated
names — but this is a two-step detour, and no such detour exists for an
individual truncated Critical risk entry (the widget's arrow link goes to
the general Risk analysis page, not that specific risk).

---

## Intermittent Sidebar Menu/Panel/Drawer Open Failure (Assist me, Notifications, Language)

### Module
Global — Sidebar UI shell (Assist me AI chat, Notifications panel, Language
switcher; the Invite modal shares the same failure signature but is far less
affected)

### Feature
Any sidebar-triggered dropdown/menu/drawer that renders via a client-side
overlay (as opposed to a full page navigation)

### Status
**Confirmed, but not reproduced 2026-08-07 — likely fixed or greatly
improved, pending a larger re-verification sample** (see History below)

### Description
Clicking several different sidebar controls — the **"Assist me"** button
(AI chat drawer), the **Notifications** bell/link, and the **Language**
switcher — frequently does nothing visible at all: no dialog, menu, or
listbox ever appears, the triggering `<button>`'s `aria-expanded`/
`data-state` attributes never change, and the page's DOM is otherwise
byte-for-byte identical before and after the click (confirmed via
screenshot diffing). This is sometimes, but not reliably, accompanied by a
generic browser console error: `Uncaught application error: undefined
{componentStack: ...}` referencing the app's main JS bundle — the error
does not fire on every failed attempt, and does not fire on every
*successful* attempt either, so it should be treated as a loosely
correlated symptom of the same underlying issue rather than its direct
cause.

Failure rates observed across repeated live attempts in a single session
(headless Chromium, prod):
- **Assist me**: failed to open in **5 out of 5** attempts.
- **Notifications**: failed to open in **6 out of 6** attempts.
- **Language**: opened successfully in roughly half of ~7 attempts; on the
  attempts where it *did* open, the menu itself was sometimes observed to
  detach from the DOM moments later, causing a subsequent click on one of
  its menu items to fail with "element was detached from the DOM".
- **Invite** (Dashboard "Invite" button → "Add team members" drawer): the
  most reliable of the four — opened correctly in the large majority of
  attempts across two separate sessions today, but did show the same
  console error once, correlated with a stray `401` on a background
  request that same time (not reproduced again in 7 further attempts).

### Expected Behaviour
Every one of these controls should reliably open its corresponding
dropdown/menu/drawer on click, every time, with no console errors.

### Actual Behaviour
As described above — failure is the *norm*, not the exception, for Assist
me and Notifications specifically; Language is a coin flip; Invite is
mostly fine but not immune.

### Root Cause (if known)
Not confirmed from the outside. The shared, generic
`componentStack`-only error message (no readable stack trace, no specific
component name) suggests either: (a) a shared error boundary wrapping all
of these overlay-rendering components that swallows the real underlying
error and only logs a stub message, or (b) a race condition in whatever
shared state/portal-mounting mechanism backs these overlays (all four are
plausibly built on the same underlying drawer/dialog/dropdown library given
the shared visual language elsewhere in the app). The fact that failure
rates differ sharply by feature (Assist me/Notifications ~100% failure,
Language ~50%, Invite <15%) suggests it isn't a single global outage but
something sensitive to each component's specific data-loading path (e.g.
Assist me and Notifications both need to fetch data before rendering,
whereas Invite's form has no such dependency and Language's option list is
presumably static/small).

### Regression Risk
**High** — this affects four distinct, real features (one of them, Assist
me, is documented in `PROJECT_KNOWLEDGE.md` §7 as present on almost every
page in the app) and none of it was previously covered by any automated
spec, so it could have been present for any number of past releases
without being caught. It's also exactly the kind of bug that's easy to
miss manually, since a single retry click "fixes" it often enough that a
tester who doesn't count attempts could walk away thinking the feature
works.

### Areas Affected
- Dashboard / every page → "Assist me" button (chat drawer)
- Sidebar → Notifications bell/link (panel)
- Sidebar → Language switcher (menu)
- Dashboard → "Invite" button (drawer) — lower rate, same signature

### QA Notes
Reproduction recipe: navigate to any project's Dashboard, click "Assist
me" (or Notifications, or Language) once, and check whether a
`role="dialog"`/`role="menu"`/`role="listbox"` element became visible and
whether the DOM changed at all (a plain screenshot diff works fine — no
special tooling needed). Repeat 5+ times fresh (full page reload between
attempts is *not* required to reproduce it — it recurs within the same
page load too). `tests/32-minor-global-settings.spec.js` encodes a
click-and-retry-up-to-5-times workaround for Notifications and Language
specifically so that spec doesn't flake — **that retry loop is a
test-robustness workaround, not evidence the bug is fixed**; re-verify the
underlying failure rate every release rather than assuming it's resolved
because the spec passes. No automated coverage exists yet for "Assist me"
itself (deliberately — see `RELEASE_CHECKLIST.md` §18's guidance to test
AI features by behavior, and this bug means "does it open at all" is
itself the behavior worth asserting before anything about the AI response
can be tested).

### Workaround (if any)
For end users: click the control again (or a few times) — it does
eventually open, at least for Language and Invite. For Assist me and
Notifications, 5 consecutive attempts in this session never once
succeeded, so there may be no reliable end-user workaround for those two
specifically today.

### History
- **2026-08-06:** First systematically confirmed — Assist me 0/5, Notifications
  0/6, Language ~50% (~3-4/7), Invite mostly fine but not immune.
- **2026-08-07 (Dashboard QA session, re-verification):** Re-tested on the
  populated "Dior Brand" project, Dashboard page. **Assist me: 5/5 successful
  opens** (open → close → reopen, repeated 5 times, no console errors on any
  attempt). **Notifications: 1/1 successful open.** **Language: 1/1
  successful open.** This is a sharp reversal from 2026-08-06's near-total
  failure rate for Assist me and Notifications specifically. Given the much
  smaller sample size for Notifications and Language this session (1 attempt
  each, vs. Assist me's 5), this is reported as **likely fixed/improved, not
  yet fully re-confirmed** — a future session should repeat Notifications and
  Language 5+ times each (as was done for Assist me here and for all three in
  the original 2026-08-06 pass) before marking this entry's Status as
  **Fixed**. Do not assume this is fully resolved from a single successful
  attempt on the weaker-sampled two controls.

---

## Marketing Channel — Custom "Other" Category Names Permanently Pollute the Shared Category Dropdown

### Module
Operations → Marketing Channels

### Feature
Create/Edit Channel — Category field, "Other" option's custom free-text
name

### Status
**Confirmed** (2026-08-06)

### Description
When a Marketing Channel is created with Category = "Other" and a custom
category name is typed into the resulting free-text field, that custom
name does **not** stay scoped to the one channel that introduced it — it
permanently joins the shared Category dropdown's option list for **every**
future channel created on the project, indistinguishable from the seven
built-in categories. There is no visible admin/cleanup surface for this
list. Confirmed live: the Category dropdown on the shared "Dior Brand"
project currently contains, alongside the real categories, several
custom values from unrelated past sessions — including two that are
obvious throwaway/test input (`"test test test test test test test test
test test"` and `"наг"`) sitting permanently in a list every real user of
this project now sees.

### Expected Behaviour
Unconfirmed against actual product intent — a per-project custom-category
list that grows over time may well be intentional (so a user doesn't have
to retype "Influencer & UGC" every time). If so, there should likely be a
way to rename/remove a custom category later; if not, "Other" entries
probably should stay scoped to the one record that introduced them.

### Actual Behaviour
Every custom "Other" category name ever entered on a project accumulates
forever in that project's Category dropdown, with no way (found in this
pass) to edit or delete an entry, and no visual distinction from the
built-in categories.

### Root Cause (if known)
Not confirmed — consistent with "Other" custom values being stored as
regular rows in a project-scoped categories table rather than as a
channel-local field, with no delete/admin path exposed in the UI explored
so far.

### Regression Risk
Low functionally (doesn't break anything), but real and compounding for
UX/data-quality: every QA session or user that exercises "Other" adds one
more permanent, unremovable entry to a list every future user of that
project sees. On the shared "Dior Brand" test project specifically, this
list is already visibly polluted with test/garbage strings.

### Areas Affected
Operations → Marketing Channels → Create/Edit Channel, Category dropdown
(shared per-project list).

### QA Notes
`tests/12-create-marketing-channels.spec.js` exercises "Other" once per
run with a name tagged `(QA)` (previously untagged, e.g. "Influencer &
UGC") specifically so future entries stay identifiable as test data among
real ones — but this does not fix the underlying accumulation, and every
run still adds one more permanent row. Consider using a disposable project
for this specific scenario rather than the shared live one, per
`CLAUDE.md`'s data-hygiene guidance, if this becomes a maintenance problem.

### Workaround (if any)
None found. Avoid typing throwaway/garbage text into the "Other" custom
category field on the shared project even for a one-off manual check —
it does not go away afterward.

---

## Marketing Channels — Sales Funnels Step Redesigned Into a Multi-Stage Funnel Builder

### Module
Operations → Marketing Channels

### Feature
Create/Edit Channel — Step 2 ("Sales funnels")

### Status
Confirmed implementation detail, not a defect (documentation/automation
was simply out of date)

### Description
`PROJECT_KNOWLEDGE.md` (and, until this session, `tests/12` and `tests/13`)
described Step 2 of the Channel wizard as four flat fields: Monthly budget,
Reach, Conversion to lead %, Conversion to customer %. The live app has
replaced this with a **"Build your sales funnel"** builder: a channel
starts with one generic funnel stage (**Quantity**, **Cost (optional)**,
and a **Conversion rate,%** into the next stage), and an **"Add funnel
step"** button lets a user chain up to 5 stages end-to-end (e.g. a
"Reach" stage feeding a "Leads" stage), with each stage after the first
having its Quantity auto-computed (and shown disabled) from the previous
stage's quantity × conversion rate. The page totals a **Total Cost** and a
**Final Result** ("N Deals") across all configured stages.

### Expected Behaviour
N/A — this is a legitimate feature enhancement (a fixed 4-field form
generalized into a flexible N-stage funnel model), not a bug. Documenting
it here purely so it isn't mistaken for a regression the next time
someone opens this form and it doesn't match `PROJECT_KNOWLEDGE.md`.

### Actual Behaviour
Confirmed live on both Create and Edit: a fresh channel starts with
exactly one stage ("Step 1", all three fields enabled); an
already-multi-stage channel (e.g. one edited by an earlier QA session)
shows named stages ("Reach", "Leads") with later stages' Quantity/Cost
shown disabled once auto-computed.

### Root Cause (if known)
Intentional product redesign.

### Regression Risk
Low for the feature itself; was **High** for test-suite maintenance until
this session — `tests/12-create-marketing-channels.spec.js` and
`tests/13-edit-marketing-channels.spec.js` both broke completely on Step 2
until rewritten against the new field structure (see their in-file
comments for the mapping from old field names to new one:
`quantity`/`cost`/`conversionRate` replace
`reach`/`monthlyBudget`/`conversionToLead`; `conversionToCustomer` has no
direct one-stage equivalent anymore and was dropped from the fixture data).

### Areas Affected
Operations → Marketing Channels → Create/Edit Channel, Step 2.

### QA Notes
Only the first funnel stage's fields are exercised by the current specs;
adding a second stage via "Add funnel step" and editing an existing
second stage are both coverage gaps worth closing in a future session.

### Workaround (if any)
N/A.

---

## Marketing Channel Category Labels Recapitalized / "Paid Search" Dropped "(Google Ads)"

### Module
Operations → Marketing Channels

### Feature
Create/Edit Channel — Category dropdown option labels

### Status
Confirmed implementation detail, not a defect

### Description
The Category dropdown's built-in option labels are now Title Case in the
live app ("Social Media", "Direct Sales", "Email Marketing", "Paid
Search", "SEO & Content") where `PROJECT_KNOWLEDGE.md` and the pre-existing
specs expected sentence case ("Social media", "Direct sales", "Email
marketing", "SEO & content"). Additionally, "Paid search (Google Ads)" has
been shortened to just **"Paid Search"** — the "(Google Ads)" qualifier is
gone. "Events & PR", "Referral", and "Other" are unchanged.

### Expected Behaviour
N/A — a copy/content change, not a functional issue.

### Actual Behaviour
Exact-match category selectors written against the old labels fail to find
any option at all (not a wrong-option selection — a `strict mode`/"element
not found" failure), because Playwright's `exact: true` name matching is
case-sensitive.

### Root Cause (if known)
Intentional copy update.

### Regression Risk
Low for the product; was the direct cause of `tests/12`'s and (indirectly,
once past the category step) `tests/13`'s full-suite failures this
session — now fixed by updating both specs' category values to match.

### Areas Affected
Operations → Marketing Channels → Create/Edit Channel, Category dropdown.

### QA Notes
Update `PROJECT_KNOWLEDGE.md` §3.3 to stop describing sentence-case labels
and the "(Google Ads)" qualifier as current.

### Workaround (if any)
N/A — specs now use the Title Case labels.

---

## Duplicate Products From Non-Idempotent, Unmarked Test Fixtures

### Module
Magic Triangle → Products / Services (and, by the same mechanism, likely
every other module whose create-spec has no unique run-marker — see
`CLAUDE.md`'s Data Hygiene section and this file's Regression Checklist
notes on specs `06`, `08`, `09`, `12`, `14`, `16`, `18`, `20`, `22`, `24`)

### Feature
Products list on the shared "Dior Brand" project

### Status
Confirmed (2026-08-06) — a concrete, observed instance of the
already-documented general data-hygiene risk, not a new mechanism

### Description
The shared live project currently has **two** copies of all four seed
products (`Eau de Parfum Dior — Signature`, `Parfum Intense Dior —
L'Imperiale`, `Сироватка для обличчя Dior — Capture / Hydra`, `Крем для
обличчя Dior — Anti-Age / Зволоження`), each pair sharing an identical
name, description, price, and revenue type — because
`tests/06-create-product.spec.js` has no unique-run marker and has now
been executed at least twice against this project without any teardown.
This directly caused a downstream test-suite bug: `tests/07`'s
name-based product lookup (`page.getByText(name).first()`) always
resolves to whichever copy happens to render first in DOM order, and a
prior session's edits (attaching/detaching a client) had only ever been
applied to that first-rendered copy — so when a later session re-ran and
a *different* first-rendered copy existed, the hardcoded "this product has
the client" assumption from `tests/07` broke (see the fix in that file's
in-code comments for the idempotent rewrite).

### Expected Behaviour
N/A for the product itself (creating a product with the same name as an
existing one is a documented open question in `RELEASE_CHECKLIST.md` §6,
not asserted here either way). Documented purely because it's now a
*confirmed*, concrete instance with real consequences for testing, not
just a theoretical risk.

### Actual Behaviour
8 total product records exist today where 4 unique ones were intended;
confirmed by reading the live Products / Services list directly.

### Root Cause (if known)
Test-data hygiene: `06-create-product.spec.js` creates its fixture
products with static, non-unique names and no cleanup step, so every full
suite run against the shared project adds another complete duplicate set.

### Regression Risk
Medium and growing — every additional full-suite run adds another
duplicate set, and any spec (existing or future) that locates a product by
name and takes `.first()` is silently at risk of operating on the wrong
copy depending on DOM/creation order, exactly as happened to `tests/07`.

### Areas Affected
Magic Triangle → Products / Services directly; potentially every other
module listed above via the same mechanism. **Now also confirmed
(2026-08-07) in two further modules on the same "Dior Brand" project**,
visible directly on the Dashboard: **Implementation → Action Plan** (the
Dashboard's "Action plan" widget shows two identical entries each for
"Prepare investor update deck" (Done) and "Coordinate boutique staff
training session" (To Do)) and **Implementation → Risk analysis** (the
Dashboard's "Critical risk" widget lists two identical "Internal risk —
critical inventory system outage in peak s..." entries under Extreme). Same
root cause as Products — non-idempotent create-test fixtures with no unique
run marker, re-run against the shared project with no teardown.

### QA Notes
`tests/07-edit-product-add-delete-client.spec.js` was rewritten this
session to detect *which* of its two named products currently holds the
client attachment at runtime rather than assuming a fixed one, and to
restore the attachment to the same product it removed it from — making
that specific pair of tests idempotent regardless of duplication. This
does **not** clean up the existing duplicate records, and does not
prevent new duplicates from `06` on the next full-suite run. A disposable
project per full-suite run (already suggested in `TESTING_IMPROVEMENTS.md`
and the repo's env-config work) would fix this at the root.

### Workaround (if any)
None applied — the existing duplicates were left in place (deleting them
was out of scope for this session and risks removing a copy something else
now depends on). Recommend a dedicated cleanup pass or, better, switching
the create-heavy specs to a disposable per-run project.

---

## Session Lost on One Side When Two Tabs/Contexts Reload Concurrently

### Module
Global — Authentication / Session

### Feature
Session/refresh-token handling across multiple concurrent browser
tabs/contexts sharing the same login

### Status
**Confirmed** (upgraded from "Open — unconfirmed hypothesis" after a
deliberate, successful reproduction on 2026-08-05; see history below)

### Description
When two browser contexts are authenticated with the **same** session
(e.g. a user with the app open in two tabs) and both perform a full-page
reload at close to the same time, one side silently loses its session and
is redirected to `/sign-in`, while the other continues working normally.
The losing side does **not** recover on its own — subsequent solo reloads
of that same tab stay on `/sign-in` until the user logs in again manually.
Which of the two tabs "wins" is not fixed — repeating the experiment showed
either side could be the one logged out.

### Expected Behaviour
Opening the same authenticated session in two tabs and reloading both
around the same time should not log either one out; both should remain
authenticated, the same way a single tab does across any number of solo
reloads.

### Actual Behaviour
Reproduced deliberately: two Playwright browser contexts were seeded with
the same post-login `storageState` and made to `goto()` the app's root URL
concurrently, five rounds in a row. In the first 5-round run, the same
context lost its session on every single round (5/5). In a follow-up run,
the *other* context lost its session instead — confirming the outcome is a
race, not tied to a specific tab. Once a context loses the race, it stays
logged out through further solo reloads with no automatic recovery.

### Root Cause (if known)
Consistent with the original hypothesis, now supported by reproducible
evidence: refresh-token rotation. Each full-page load appears to trigger a
call to `POST /api/v1/auth/refresh`; if two contexts sharing one refresh
token call it at nearly the same time, the backend most likely rotates the
token on the first request it processes and invalidates the old one — the
second, now-stale request is then rejected, and that context has no valid
token left to fall back on, so it drops to the signed-out state. This is
inferred from behavior, not from reading the backend implementation, so it
should still be treated as the leading explanation rather than a verified
mechanism.

### Regression Risk
High-ish for real users, low for visibility: this is exactly the kind of
bug that never shows up in single-tab manual testing (which is how this
app has almost certainly been tested so far) but will affect any user who
routinely keeps the app open in two tabs or windows — a common habit, not
an edge case. Every existing Playwright spec is unaffected because the
suite deliberately avoids concurrent contexts, so this class of bug has no
automated coverage today and could regress or worsen silently.

### Areas Affected
Every page and every module — this lives at the session/auth layer, below
any individual feature. Any multi-tab or multi-device-simultaneous-use
scenario for the same account is at risk.

### QA Notes
Reproduction recipe (headless Playwright, adaptable to manual multi-tab
testing): log in once, capture `storageState`, open two `browser.newContext()`
instances with that same state, then call `page.goto(BASE_URL)` on both
pages inside a single `Promise.all([...])` so they fire together; repeat a
few rounds. Expect one side to land on `/sign-in?redirect=%2F` within the
first round or two. This is now reliable enough to turn into a real
automated regression test (e.g. `tests/26-concurrent-session.spec.js`) —
recommended as a follow-up, since right now the only verification is the
manual reproduction run during this QA session, not a committed spec.

### Workaround (if any)
None at the product level. For test authors: continue relying on a single
shared `storageState.json` per run (per `auth.setup.js`) rather than
spinning up multiple concurrent authenticated contexts against the same
account, until this is fixed. For end users: if the app unexpectedly shows
the sign-in screen in one tab while another tab still works, simply log
back in on the affected tab — no data was found to be lost, only the
session token.

---

### History
- **2026-08-05 (earlier same day):** First noticed as a single, unreproduced
  anomaly during live app exploration for `PROJECT_KNOWLEDGE.md`. Logged as
  "Open — unconfirmed," root cause marked as a hypothesis only.
- **2026-08-05 (this entry):** Deliberately reproduced via two concurrent
  Playwright contexts sharing one session, 5/5 rounds in the first attempt;
  confirmed the effect is a genuine race (not one-sided) via a follow-up
  run; confirmed the losing side does not self-recover. Status upgraded to
  **Confirmed**.

---

## Action Plan Edit Form Does Not Persist Stage Changes

### Module
Implementation → Action Plan

### Feature
Edit Task modal — Stage field

### Status
Open

### Description
In the "Edit action item" form, the **Stage** dropdown (the field that
determines which Kanban column a task belongs to) visually updates when a
different stage is selected, but the change does not persist once **Update**
is clicked and the page is reloaded.

### Expected Behaviour
Changing a task's Stage in the Edit form and clicking Update should move the
task to the newly selected stage/column, matching what drag-and-drop does.

### Actual Behaviour
The task remains in its original column after Update, even though the
dropdown appeared to change during the edit session. The **only** way to
move a task between stages is dragging its card to a different column on the
board.

### Root Cause (if known)
Not confirmed. Suspected that the Update handler for this form omits the
Stage field from its payload, or the Stage field is display-only/decorative
in this modal while the backend relationship is only updated by the
board's dedicated drag-and-drop mutation.

### Regression Risk
Medium. This is exactly the kind of thing that silently "fixes itself" (or
breaks further) during an unrelated Action Plan refactor without anyone
noticing, since the form doesn't error — it just quietly fails to save one
field.

### Areas Affected
- Implementation → Action Plan → Edit Task modal
- Any automated test or manual workflow that assumes editing Stage via the
  form is equivalent to drag-and-drop

### QA Notes
- Confirmed via `tests/23-edit-action-plan.spec.js` (explicit code comment:
  *"Note: the Stage dropdown (index 1) in this form visually updates but
  does not persist the change on Update — moving stages only works via
  drag-and-drop."*) and cross-referenced in `README.md` → "Known quirks".
- Re-verify every release per `RELEASE_CHECKLIST.md` §15 (Action Plan
  Regression items) — if this is ever fixed, this entry's Status should
  move to **Fixed** (not deleted) and the affected specs/checklist updated
  to actually exercise Stage-change-via-form.

### Workaround (if any)
To move a task between stages, use drag-and-drop on the board
(`dragCardToColumn` helper in `tests/22-create-action-plan.spec.js`) instead
of the Edit form.

---

## Action Plan Board Ignores Playwright's Native `dragTo()`

### Module
Implementation → Action Plan

### Feature
Kanban board drag-and-drop (test-automation compatibility)

### Status
Open

### Description
Not a user-facing defect — an implementation detail that breaks the
"normal" way of automating drag-and-drop. The board's drag-and-drop
implementation does not respond to Playwright's built-in
`locator.dragTo()` call; dragging a card produces no visible movement and no
state change when triggered that way.

### Expected Behaviour
N/A for end users (the board's manual mouse-driven drag-and-drop works fine
for a real human user). For test automation, a standard `dragTo()` call
would ideally work like it does on most drag-and-drop UIs.

### Actual Behaviour
`dragTo()` is a silent no-op against this board. A card only moves when
driven by a manual `mouse.down()` → several stepped `mouse.move()` calls →
`mouse.up()` sequence, with explicit waits between steps.

### Root Cause (if known)
Likely the underlying drag-and-drop library requires intermediate
`pointermove`/`dragover` events with real timing/step counts that
Playwright's single-jump `dragTo()` doesn't emit, so the library never
registers a valid drag gesture.

### Regression Risk
Low for end users; Medium for test suite maintenance — if the drag library
is ever swapped or upgraded, this constraint should be re-tested, since a
library change could either fix `dragTo()` compatibility (test code could
then simplify) or make the manual sequence unreliable in a new way.

### Areas Affected
- Any current or future automated test exercising Action Plan
  drag-and-drop (`tests/22-create-action-plan.spec.js`,
  `tests/23-edit-action-plan.spec.js`)

### QA Notes
Documented in `README.md` → "Known quirks" and `CLAUDE.md`. This is a
testing-technique constraint, not something to file against the product
team — but it must survive in institutional memory or every future spec
author re-discovers it the hard way.

### Workaround (if any)
Use the `dragCardToColumn` helper pattern already established in
`tests/22-create-action-plan.spec.js`: `mouse.down()` on the card center →
`mouse.move()` in small steps toward the target column → pause → final
`mouse.move()` to the target center → `mouse.up()`, with short
`waitForTimeout` pauses between phases.

---

## MVP Submission Requires At Least One "Core" Feature

### Module
Implementation → MVP

### Feature
Create/Edit MVP — Key Feature Type field

### Status
Open (confirmed business rule, not yet verified whether intentional or a
missing "at least one feature of any type" fallback)

### Description
An MVP cannot be created (or, presumably, saved in edit) if all of its Key
Features are marked "Optional" — at least one Feature must be Feature Type
"Core" or the submission is rejected.

### Expected Behaviour
Unconfirmed from a product-requirements standpoint — this may well be
correct, intentional business logic (an MVP should always have some
non-negotiable core capability). Flagged here so it isn't mistaken for a
random validation bug if a future test unexpectedly fails on it.

### Actual Behaviour
Submitting an MVP whose only Key Feature(s) are "Optional" type fails
validation/submission.

### Root Cause (if known)
By design, most likely — but not confirmed against actual product
requirements/documentation.

### Regression Risk
Medium for test-suite stability: any new MVP-creation test that forgets to
include a Core feature will fail in a way that looks like an unrelated bug
if this rule isn't front-of-mind.

### Areas Affected
- Implementation → MVP → Create MVP (full-page form, not a modal)
- Implementation → MVP → Edit MVP

### QA Notes
Confirmed via `README.md` → "Known quirks" (*"MVP creation requires at
least one Key feature of type 'Core' — an MVP with only 'Optional' features
fails to submit."*) and exercised by every MVP fixture in
`tests/24-create-mvp.spec.js` (each MVP's single feature is always type
"Core"). No spec currently exists that *deliberately* tests the
all-Optional rejection path — that's a coverage gap noted in
`RELEASE_CHECKLIST.md` §16, not a bug in itself.

### Workaround (if any)
Always include at least one Key Feature with Feature Type = "Core" when
creating or editing an MVP.

---

## IP Rights Nav Buttons Carry a Live Status Badge in Their Label

### Module
Operations → Other → Intellectual Property Rights

### Feature
IP Type selector buttons (Trademark / Patent / Copyright / Design)

### Status
Open (confirmed implementation detail, not a defect)

### Description
The four IP Rights type-selector buttons render their current registration
status as part of the visible button label (e.g. "Patent Planned"), and
this label updates immediately after Save (e.g. becomes "Patent
Registered"). Anything matching these buttons by **exact** text will break
the moment the status changes.

### Expected Behaviour
N/A — this is working as designed; documenting purely so automated
selectors and manual testers don't get tripped up by it.

### Actual Behaviour
Button accessible name is `"{Type} {Status}"` (e.g. "Trademark Planned",
"Design Registered"), not just the bare type name.

### Root Cause (if known)
Intentional UI design — the status badge is meant to be visible at a
glance without opening each panel.

### Regression Risk
Low functionally, but High for test-suite fragility if this pattern isn't
followed consistently — any new selector written against an exact IP Rights
button label will be flaky by construction.

### Areas Affected
- Operations → Other → IP Rights, all four type panels
- Any test or automation selecting these buttons

### QA Notes
Confirmed via `README.md` → "Known quirks" and directly implemented in
`tests/18-create-other.spec.js` / `tests/19-edit-other.spec.js`, which match
by prefix regex (`/^Patent\b/`) rather than exact label text specifically
because of this behavior.

### Workaround (if any)
Always match IP Rights type buttons by **prefix** (`getByRole('button',
{ name: /^Patent\b/ })`), never by exact full-label text.

---

## Resources — Amortization Period Capped at 100

### Module
Operations → Resources (Investment type)

### Feature
Create/Edit Resource — Amortization period field

### Status
Open (confirmed validation limit)

### Description
The Amortization period field (months) for an Investment resource rejects
values above 100.

### Expected Behaviour
Unconfirmed whether 100 months (~8.3 years) is an intentional business rule
or an arbitrary/legacy limit that should be higher for long-lived assets
(e.g. the "Office space" category in the current seed data uses a 96-month
amortization, close to this ceiling).

### Actual Behaviour
Values above 100 are rejected by client-side (and presumably server-side)
validation.

### Root Cause (if known)
Not confirmed — flagged for product clarification rather than assumed to be
either "working as intended" or "a bug."

### Regression Risk
Low functionally (it's a stable, apparently-enforced limit), but worth
re-checking after any Resources form refactor since it's an easy
off-by-one to accidentally loosen or tighten (99 vs. 100 vs. 101).

### Areas Affected
Operations → Resources → Investment create/edit form.

### QA Notes
Confirmed via `README.md` → "Known quirks" (*"Amortization period has a
max value of 100"*). No dedicated boundary test exists yet for exactly 100
(accepted) vs. 101 (rejected) — see `RELEASE_CHECKLIST.md` §10 Edge Cases.

### Workaround (if any)
N/A — keep Amortization period ≤ 100 when creating test fixtures.

---

## Resources — Running Cost Rejected for Years Before Start Year

### Module
Operations → Resources (Running costs type)

### Feature
Create/Edit Resource — Cost per year fields

### Status
Open (confirmed validation rule)

### Description
For a Running Costs resource, the "Cost" input for any planning-horizon
year **before** the resource's own Start year is rejected by validation.

### Expected Behaviour
Consistent with the rule's evident intent: a running cost shouldn't be
recorded for a year before the resource existed. Not independently
confirmed against product requirements, but internally logical.

### Actual Behaviour
Attempting to fill a per-year cost column for a year earlier than Start
year fails validation; the existing test suite works around this by simply
skipping those columns rather than asserting on the rejection message
itself.

### Root Cause (if known)
By design, most likely.

### Regression Risk
Low functionally; Medium for test-suite correctness if a future spec
naively fills every year column without checking Start year first (as
`tests/16-create-resources.spec.js` already does correctly).

### Areas Affected
Operations → Resources → Running Costs create/edit form.

### QA Notes
Confirmed via `README.md` → "Known quirks" and implemented defensively in
`tests/16-create-resources.spec.js` (`if (columnYear < startYearNum)
continue;`). No spec currently asserts on the actual rejection/error
message when this rule is violated on purpose — coverage gap, see
`RELEASE_CHECKLIST.md` §10.

### Workaround (if any)
When filling Running Costs cost-per-year fields programmatically, always
skip any year column earlier than the resource's Start year.

---

## App Never Reaches `networkidle` (Continuous Background Polling)

### Module
Global / Test Infrastructure

### Feature
All pages — network activity

### Status
Open (confirmed, ongoing app behavior)

### Description
The application continuously makes background network requests (observed:
notification polling, likely session/token-refresh checks, possibly other
live-data polling), so `page.waitForLoadState('networkidle')` never
naturally resolves — calling it without an explicit timeout hangs for the
full test/action budget.

### Expected Behaviour
N/A — not necessarily wrong for a live, notification-driven app; documented
purely as a hard constraint on how tests and any manual network-based
waiting must be written.

### Actual Behaviour
`networkidle` waits hang indefinitely (until timeout) on every page in the
app, including static-looking pages.

### Root Cause (if known)
Background polling — likely the Notifications bell and/or an
auth-refresh interval, not confirmed exhaustively across every module.

### Regression Risk
Low (stable, long-known constraint) but High-impact if forgotten: any new
test written with a bare `waitForLoadState('networkidle')` (no timeout)
will intermittently or permanently hang.

### Areas Affected
Every page in the application; every existing and future Playwright spec.

### QA Notes
Documented in `README.md`, `CLAUDE.md`, and applied consistently across
every existing spec as
`page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})`.
Any new spec must follow the same pattern — never call it bare.

### Workaround (if any)
Always pass an explicit timeout and swallow the resulting timeout error;
prefer waiting on a concrete signal (element visible/enabled, URL change,
specific response) over `networkidle` entirely where possible.

---

## Create Project Empty-Field Validation Relies on the Browser's Native Tooltip

### Module
Project Management

### Feature
Create Project form — required-field validation UX

### Status
**Fixed** (confirmed 2026-08-05 as Open; re-verified 2026-08-07 during
full-app functional regression session — now shows styled in-app messages)

### Description
Submitting the Create Project form with required fields empty is correctly
blocked (the form does not submit), but the only feedback shown to the
user is the browser's own native HTML5 constraint-validation tooltip
("Please fill out this field.") popping up on the first empty required
field. There is no in-app, styled validation message — unlike Clients,
Products, Marketing Channels, and other create forms across the app, which
all show the app's own red/styled inline text ("required",
"must be at least 2 characters", etc.).

**2026-08-07 re-verification — now Fixed:** submitting the fully-empty
Create Project form now shows a styled, accessible (`role="alert"`) inline
message under **every** required field simultaneously, not just the first
one: "Project name must be at least 2 characters", "Legal form is
required", "Development stage is required", "Currency is required", "Tax
rate is required", "Foundation year is required", "Calculation plan year
is required", "Planning years is required". This exactly matches the
"Expected Behaviour" below and the validation style used elsewhere in the
app. Confirmed via a full DOM snapshot after an empty submit, not just a
screenshot.

### Expected Behaviour
Consistent with the rest of the app: a styled, in-app validation message
under or near each invalid field, matching the visual language used by
every other create form (Clients, Products, Competitors, Evaluation
Criteria, and others all show custom validation text, confirmed live in
this same session).

### Actual Behaviour
Only the browser's default tooltip appears; no custom validation text is
rendered anywhere in the form's DOM (confirmed via a full innerText dump of
the modal after an empty submit — no "required"/"must be" text present at
all, only the transient native tooltip visible in a screenshot).

### Root Cause (if known)
Likely the Project name (and possibly other) fields rely on the native
`required` HTML attribute alone for validation, without the app's own
form-validation library/component being wired up the way it is on other
forms.

### Regression Risk
Low functionally (the block itself works correctly — no invalid project
can be created), but it's a real UX/consistency defect: the native tooltip
only appears on the *first* invalid field and disappears as soon as the
user interacts with anything else, so a user with multiple empty required
fields (Legal form, Development stage, Currency, Income tax, Year of
foundation, Start calculation year, Planning years are all marked
required) gets no indication of the other unmet requirements after fixing
the first one.

### Areas Affected
Project Management → Create Project modal. Not observed on Edit Project
(not retested independently, but shares the same form component, so likely
affected too) or on any other module's create form.

### QA Notes
Confirmed by screenshotting the modal immediately after clicking "Create
project" on a fully empty form: the visible feedback was exclusively the
orange native browser tooltip anchored to the Project name field, with no
other styled error text anywhere on the page. Cross-checked against
Clients/Products/Competitors in the same session, all of which show clear
custom validation text instead.

### Workaround (if any)
None needed for correctness (the form is safely blocked either way); this
is a UI/UX consistency issue to fix, not a functional blocker.

---

# Regression Checklist

Quick-reference index of every entry above, **newest first**. When a new
confirmed bug is added to this file, add its row to the **top** of this
table (below the header) as well as writing its full entry above. When an
existing bug's status changes (e.g. Open → Fixed), update its row here too
— do not remove the row or its detailed section.

| Bug Name | Module | Status |
|---|---|---|
| Team & Staff — "Line Staff" Creation Always Fails (Missing `employment_percent` in `staffing[]`) | Operations → Team and Staff | **Confirmed** |
| Client Edit Form Discards an Uncommitted Name Change After Deleting a Need | Magic Triangle → Clients | **Confirmed** |
| Dashboard Widgets Truncate Long Data-Driven Text With No Way to Recover the Full Value | Dashboard | **Confirmed** |
| Mobile Invite Dialog Drops the "Cancel" Button Present on Desktop | Global — Invite dialog (Mobile) | **Confirmed** |
| App-Wide Overlay Primitive Triggers Two Accessibility Violations on Open (Invite Dialog, Mobile Nav Drawer, Profile Menu) | Global — shared overlay primitive | **Confirmed** |
| Dashboard — "Competitor Summary" Empty State Reuses the "Critical Risk" Icon | Dashboard | **Confirmed** |
| Dashboard / Forecasts & Reports — "Revenue vs Expenses" Chart Y-Axis Mislabeled | Dashboard, Financial | **Confirmed** |
| Intermittent Sidebar Menu/Panel/Drawer Open Failure (Assist me, Notifications, Language) | Global — Sidebar UI shell | Confirmed, **not reproduced 2026-08-07** (likely fixed/improved — re-verify) |
| Marketing Channel — Custom "Other" Category Names Permanently Pollute the Shared Category Dropdown | Operations → Marketing Channels | **Confirmed** |
| Marketing Channels — Sales Funnels Step Redesigned Into a Multi-Stage Funnel Builder | Operations → Marketing Channels | Confirmed (not a defect) |
| Marketing Channel Category Labels Recapitalized / "Paid Search" Dropped "(Google Ads)" | Operations → Marketing Channels | Confirmed (not a defect) |
| Duplicate Products From Non-Idempotent, Unmarked Test Fixtures | Magic Triangle → Products / Services | **Confirmed** |
| Create Project Empty-Field Validation Relies on the Browser's Native Tooltip | Project Management | **Fixed** (was: Open) |
| Session Lost on One Side When Two Tabs/Contexts Reload Concurrently | Global — Auth/Session | **Confirmed** (was: Open/unconfirmed) |
| App Never Reaches `networkidle` (Continuous Background Polling) | Global / Test Infrastructure | Open |
| Resources — Running Cost Rejected for Years Before Start Year | Operations → Resources | Open |
| Resources — Amortization Period Capped at 100 | Operations → Resources | Open |
| IP Rights Nav Buttons Carry a Live Status Badge in Their Label | Operations → Other → IP Rights | Open |
| MVP Submission Requires At Least One "Core" Feature | Implementation → MVP | Open |
| Action Plan Board Ignores Playwright's Native `dragTo()` | Implementation → Action Plan | Open |
| Action Plan Edit Form Does Not Persist Stage Changes | Implementation → Action Plan | Open |

**Next entry goes here (top of table + new section above).**

## Session log

- **2026-08-07 — Dashboard Mobile-only follow-up** (390×844 exclusively,
  both projects; Figma Mobile page re-attempted with the same result as the
  first pass that day — canvas screenshot fails, Dev Mode paywalled, Layers
  tree still won't expand): 2 new confirmed bugs (mobile Invite dialog is
  missing the "Cancel" button that exists on Desktop; Dashboard widgets
  truncate real product/risk/task names with zero recovery path — no
  `title`, no legend, not clickable — confirmed via direct DOM inspection,
  present on Desktop too but most visible on Mobile). Widened the scope of
  the same-day accessibility finding from "Invite dialog only" to a
  **3-surface confirmed pattern** by reproducing the identical aria-hidden/
  focus warning on the mobile hamburger nav drawer, and both warnings
  together on the account Profile menu — now treated as a shared overlay
  primitive issue, not Invite-specific. Reconfirmed the Revenue vs Expenses
  chart axis mislabeling reproduces on Mobile too. Functionally clean
  otherwise: mobile nav drawer, Notifications, Profile menu, "Assist me",
  and the Role picker (rendered as a native-style bottom sheet on mobile)
  all opened and closed correctly with no console errors; no horizontal
  overflow on either project; a mobile deep-link tap navigated correctly
  with a clean console. Full results in
  `test-reports/Dashboard_Mobile_UA_Test_Report_2026-08-07.md`.

- **2026-08-07 — Dedicated Dashboard QA session** (empty-state project +
  populated "Dior Brand" project, desktop 1440×900 + mobile 390×844,
  Figma comparison attempt via Figma Dev Mode/Properties panel, functional/
  data-validation/edge-case/diagnostics passes): 3 new confirmed bugs
  (Competitor summary empty-state icon incorrectly reusing Critical risk's
  icon; Revenue vs Expenses chart Y-axis mislabeled as "₴150000k" instead of
  "₴150M" on both Dashboard and Forecasts & Reports; Invite modal firing two
  accessibility console warnings — missing Dialog description, and
  aria-hidden blocking a focused descendant — on every open). Extended the
  existing "Duplicate Products" data-hygiene finding with two new confirmed
  instances (Action Plan tasks, Risk analysis entries) on the same "Dior
  Brand" project. Re-verified the "Intermittent Sidebar Menu/Panel/Drawer
  Open Failure" bug and found it **not reproduced** this session — Assist me
  5/5 successful opens (vs. 0/5 on 2026-08-06), Notifications 1/1,
  Language 1/1 — reported as likely fixed/improved pending a larger
  re-verification sample for Notifications/Language specifically. All
  Financial stat tiles (CAPEX/OPEX/Break-even/Profitability) confirmed
  consistent between Dashboard and Forecasts & Reports with no drift; no
  broken images or failed network requests found; no horizontal overflow on
  mobile for either project. Figma's canvas remains impossible to
  screenshot in this environment (WebGL tab-capture readback failure,
  reconfirmed), and Figma Dev Mode requires a paid seat upgrade not
  available on this account — but the Properties panel and Layers list
  still yielded real, non-fabricated structural facts (Dashboard section
  bounding boxes for both the Desktop "Ready to Dev" and dedicated "Mobile"
  pages, confirming a mobile Dashboard design does exist). Full results in
  `test-reports/Dashboard_UA_Test_Report_2026-08-07.md`.

- **2026-08-06 — Full release-readiness pass** (all 25 existing specs run
  as a regression baseline, plus new coverage written and validated for
  Dashboard, Magic Triangle Overview, Financial x2, Business Plan, Invite,
  and Minor Global Settings): 5 new confirmed findings — the cross-cutting
  intermittent sidebar drawer/menu/panel open failure (Assist me 0/5,
  Notifications 0/6, Language ~50%, Invite mostly fine but not immune),
  custom "Other" category names permanently polluting the Marketing
  Channels category list, the Sales Funnels step's redesign into a
  multi-stage funnel builder, Category label recapitalization (+ "Paid
  Search" dropping "(Google Ads)"), and a concrete, observed instance of
  duplicate Products from non-idempotent test fixtures. The 4 real
  full-suite failures this session (`tests/07`, `12`, `13`, `23`) were all
  test-suite/fixture issues rather than product defects, and are now fixed
  and confirmed idempotent (each re-run twice consecutively without
  failure) — see each spec's in-file comments and the entries above for
  the underlying app changes that caused them. Full results in
  `test-reports/Release_Readiness_Test_Report.md`.

- **2026-08-05 — Core Flows manual QA session** (Login, Project, Client,
  Product, Competitor, Magic Triangle): 1 new confirmed issue (Create
  Project native-tooltip validation), 1 existing issue upgraded from
  unconfirmed to **Confirmed** with a reliable repro (concurrent-tab session
  loss). All other tested behavior across these 6 flows matched expectations
  — no new regressions found in Login, Client, Product, Competitor CRUD, or
  Magic Triangle overview. Full results in
  `test-reports/Core_Flows_Test_Report.md`.

No known bugs have been marked **Fixed**, **Regression**, or **Cannot
Reproduce** yet — this is the file's first population. As real testing
sessions are run against the app (per `RELEASE_CHECKLIST.md`), append
genuinely new confirmed findings here; do not backfill speculative items
from the checklist's open questions until they've actually been verified.
