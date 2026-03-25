# Home Regions SVG Desktop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Use the SVG-plus-HTML region layout on desktop as well as mobile, then validate the desktop result against the live homepage module with the screenshot diff workflow.

**Architecture:** Replace the duplicated desktop PNG branch with a single semantic region grid that serves all breakpoints. Keep breakpoint-specific layout differences in SCSS, and use the visual diff script to compare the desktop rendering against the live site baseline after each iteration.

**Tech Stack:** HTML, SCSS, Parcel build, headless Chrome, ImageMagick

---

### Task 1: Unify the homepage region markup

**Files:**
- Modify: `src/index.html`

- [ ] **Step 1: Remove the desktop-only PNG list**

Delete the `home-regions-desktop` `<ul>` so the module no longer renders PNG assets on non-mobile breakpoints.

- [ ] **Step 2: Promote the SVG grid to the shared markup**

Keep one `home-regions-grid` block in the page and make it the only rendered version for desktop and mobile.

- [ ] **Step 3: Preserve accessibility semantics**

Keep descriptive text in HTML labels and keep decorative map images marked as hidden from assistive tech.

### Task 2: Rework breakpoint styling around the shared SVG grid

**Files:**
- Modify: `src/assets/scss/pages/_home.scss`

- [ ] **Step 1: Remove desktop/mobile visibility toggles**

Delete the rules that show PNG on desktop and SVG on mobile only.

- [ ] **Step 2: Keep desktop layout faithful to the original module**

Use the existing 200x100 card positioning model for desktop, and retain the current two-row layout with per-region offsets.

- [ ] **Step 3: Keep mobile readability intact**

Preserve the grid-based mobile layout and text sizing so mobile still solves the original readability problem.

### Task 3: Validate with build and screenshot diff

**Files:**
- Test: `scripts/compare-home-regions.js`
- Test: `package.json`

- [ ] **Step 1: Build the site**

Run: `npm run build`

Expected: Parcel build completes successfully.

- [ ] **Step 2: Capture local vs live module diff**

Run: `node scripts/compare-home-regions.js --skip-build`

Expected: `output/visual-diff/home-regions/` contains `live-module.png`, `local-module.png`, `module-diff.png`, and `summary.txt`.

- [ ] **Step 3: Inspect desktop delta and iterate if needed**

Use the generated module images and diff heatmap to decide whether a follow-up CSS nudge is still needed for desktop SVG fidelity.
