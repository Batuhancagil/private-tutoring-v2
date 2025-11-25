# Private Tutoring Dashboard Platform UX Design Specification

_Created on 2025-11-24 by BatuRUN_
_Generated using BMad Method - Create UX Design Workflow v1.0_

---

## Executive Summary

A private tutoring dashboard platform that replaces Excel-based student progress tracking with intelligent daily question logging and visual timeline-based assignment management. The platform enables teachers to track every question students solve (right/wrong/empty), monitor daily progress, and manage assignments through an adaptive timeline system.

**Target Users:**
- **Primary:** Private Tutors (Desktop-first for management)
- **Secondary:** Students (Mobile-first for logging)
- **Tertiary:** Parents (Mobile/Desktop for viewing)

**Core Experience:** "Instant Insight" - A teacher logs in and immediately sees who is on track and who is struggling, with zero manual analysis.

---

## 1. Design System Foundation

### 1.1 Design System Choice
**Primary Framework:** **Ant Design** (for complex data tables, calendars, and grids)
**Visual Layer:** **Shadcn/UI** (for modern aesthetics, typography, and clean cards)

**Rationale:** Ant Design provides the robust "enterprise" components needed for the complex timeline and data tables, while Shadcn/UI ensures the app feels modern and friendly, avoiding the "generic admin panel" look.

---

## 2. Core User Experience

### 2.1 Defining Experience
**The "Deep Dive" Monitor:**
The app's heart is the ability to switch instantly between a high-level "Health Check" (Who is red?) and a granular "Progress Tracker" (What specifically did they miss?).

### 2.2 Emotional Goal
**"Informed & In Control":**
Teachers should feel relieved that the manual tracking burden is gone and empowered by having instant, accurate data at their fingertips.

### 2.3 Novel UX Pattern: Dual-Mode Timeline
We are introducing a novel **Dual-Mode Timeline** to separate planning from execution:
1.  **Planning Mode (Gantt):** For setting up schedules. Teachers drag bars to extend topic duration.
2.  **Tracking Mode (Calendar):** For daily monitoring. Teachers see specific deliverables and status for each day.

---

## 3. Visual Foundation

### 3.1 Color System
**Theme:** "Trust Blue"
A professional, reliable palette that allows functional status colors to pop.

*   **Primary:** `#3b82f6` (Blue 500) - Trust, Action
*   **Success:** `#22c55e` (Green 500) - On Track, Completed
*   **Warning:** `#f59e0b` (Amber 500) - Needs Attention, Falling Behind
*   **Error:** `#ef4444` (Red 500) - Critical, Missed, Struggling
*   **Background:** `#f8fafc` (Slate 50) - Clean, distraction-free

**Interactive Visualization:** [ux-color-themes.html](./ux-color-themes.html) (See "Trust" theme)

---

## 4. Design Direction

### 4.1 Layout Strategy: "The Modern Workplace"
A hybrid layout combining the best of accessibility and productivity:

1.  **Global Navigation (Top Nav):**
    *   Persistent access to Dashboard, Students, Schedule, Library.
    *   Friendly, app-like feel (from "Classroom Cards" concept).

2.  **Work Area (Split-Screen):**
    *   **Left Panel:** Searchable Student List with status indicators.
    *   **Right Panel:** Detailed Workspace (Timeline, Progress, Actions).
    *   Allows rapid "next student" switching without page reloads (from "Focus Flow" concept).

**Interactive Mockup:** [ux-design-directions.html](./ux-design-directions.html) (See "Focus Flow" for workspace dynamics)

---

## 5. User Journey Flows

### 5.1 Critical Daily Review Loop
**Scenario:** Teacher checking daily progress.

1.  **Dashboard (Entry):** Teacher sees high-level summary. "2 Students At Risk."
2.  **Drill Down:** Clicks "At Risk" alert or selects student from Split-Screen list.
3.  **Review:** Right panel loads student's **Tracking Mode Timeline**.
    *   sees "Algebra: 10/50 questions (20%) - Behind."
4.  **Action:**
    *   Teacher clicks "Message" to send a nudge.
    *   OR Teacher toggles to **Planning Mode** to extend the deadline.
5.  **Next:** Teacher clicks next student in list.

---

## 6. Component Library Strategy

### 6.1 Key Components
1.  **Smart Data Table:** Sortable, filterable, with inline progress bars (AntD based).
2.  **Student List Item:** Rich list item with Name, Status Dot, and Mini-Sparkline.
3.  **Dual-Mode Timeline:**
    *   *View A (Gantt):* Draggable bars for duration.
    *   *View B (Grid):* Daily buckets with status indicators.
4.  **Metric Card:** Clean stats for "Questions Today," "Accuracy," etc.

---

## 7. UX Pattern Decisions

### 7.1 Consistency Rules
*   **Status Colors:** Green/Amber/Red meanings must be consistent across ALL screens (dots, bars, text).
*   **Navigation:** Top nav for context switching (Where am I?), Side list for content switching (Who am I looking at?).
*   **Feedback:** "Toast" notifications for success (saved), Modal alerts for destructive actions (delete student).

---

## 8. Responsive Design & Accessibility

### 8.1 Responsive Strategy
*   **Desktop (Teacher):** Split-screen, dense data views.
*   **Mobile (Student):**
    *   **Timeline:** **Horizontal Day View** (Calendar Strip). Students swipe left/right to change days, keeping focus on the current day's tasks.
    *   **Logging:** Large touch targets, simple number inputs.
    *   **Nav:** Bottom tab bar (Dashboard, Calendar, Profile).

### 8.2 Accessibility
*   **Contrast:** High contrast text for readability.
*   **Color Blindness:** Status colors must be accompanied by icons or text labels (e.g., a Red dot also says "Behind").
*   **Keyboard:** Full keyboard navigation for data entry and list switching.

---

## 9. Implementation Guidance

### 9.1 Completion Summary
We have defined a professional, data-rich, yet accessible UX for the Private Tutoring Platform. The **Dual-Mode Timeline** and **Split-Screen Layout** are the standout features that will deliver the promise of "efficiency" and "control" to teachers.

---

## Appendix

### Interactive Deliverables
*   **Color Theme:** [ux-color-themes.html](./ux-color-themes.html)
*   **Layout Mockups:** [ux-design-directions.html](./ux-design-directions.html)
*   **Timeline Comparison:** [ux-timeline-options.html](./ux-timeline-options.html)

---
