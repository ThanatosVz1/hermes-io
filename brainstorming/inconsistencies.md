# UI/UX Inconsistencies & Issues Tracker

*This document tracks all visual, UX, and functional inconsistencies identified in the application. Items will be documented and organized here under your guidance.*

## 📋 Logged Inconsistencies
## 📋 Logged Inconsistencies & Enhancements

*(Awaiting your list of inconsistencies...)*
### 1. Card & Tile Consistency (Grid View)
- [x] **Standardize Tile Layout:** Benchmarked all cards against the "Frontend Web Developer Mastery" card design. Applied uniform layout hierarchy, border styling, padding, and clean aesthetic across all dashboard and template gallery cards.
- [x] **Tag / Skill List Wrapping:** Formatted tags into a single-line badge list capped at max 3 badges with a `+X more` counter pill. Added fixed 2-line clamping for titles (`height: 3.1rem; line-clamp: 2`) and descriptions (`height: 2.55rem; line-clamp: 2`). Enforced `height: 100%`, flex column structure, and pinned bottom footers so every card in the grid row is razor-sharp and uniformly aligned.

### 2. Roadmap Detail Header & Controls
- [x] **Header Hierarchy & Visibility:** Designed a two-tier sticky header. Tier 1 prominently showcases the roadmap title (`font-size: 1.75rem`, `font-weight: 800`) paired with the circular progress ring and neat metadata pills (`Target Role`, `Total Hours`, `Checkpoints`), with primary actions (`Export`, `Delete`) pinned to the right.
- [x] **De-clutter Control Bar:** Separated controls into Tier 2 (a clean bottom toolbar with subtle top border). Placed the View Mode toggle (`Visual Graph` vs `Tree View`) on the left and aligned the Search input + Status Filter dropdown on the right with standardized heights (38px), unified borders, and balanced spacing.

### 3. Graph / Tree View State & Transitions
- [x] **Active View Syncing:** Fixed active class toggling in `setViewMode(mode)` on both `#btn-view-graph` and `#btn-view-tree` so the toggle indicator updates immediately. Added view container classes (`view-graph`, `view-tree`).
- [x] **Connector Lines & Continuity:** Created clean vertical branch connector rails (`.side-left .branch-subnodes-stack` and `.side-right .branch-subnodes-stack`) with horizontal stub lines connecting directly into each submodule card. Added complete, Taitor-inspired styles for Tree View (`.recursive-tree-root`, `.tree-node-card`, etc.) matching the 960px container width to eliminate layout shifts when switching views.

### 4. Progress / To-Do State & Layering
- [x] **Toggle / Undo Completion:** Enabled bidirectional cycling: clicking a completed milestone checkbox, submodule checkbox, tree node checkbox, or drawer status button allows users to cycle or toggle back to "Not Started" (undo action) with immediate progress rollup recalculation.
- [x] **Z-Index & Layering Bleed-Through:** Fixed connector lines bleeding through completed nodes. Changed `.graph-spine-node.status-completed` and `.graph-submodule-card.status-completed` to use 100% opaque surface backgrounds (`var(--bg-surface)`) layered with subtle tints and `z-index: 3`, keeping connector lines strictly behind the card.

