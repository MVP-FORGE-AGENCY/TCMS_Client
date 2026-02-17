# Test Scenarios: Workflow-Driven Design Features

This document provides step-by-step test scenarios for the new workflow-driven features.

---

## Prerequisites

Before testing, ensure:

1. The API server is running with migrations 028-031 applied
2. You have an admin or training_manager account
3. At least 5-10 test employees exist in the system

---

## Scenario 1: Create a Curriculum

### Goal

Create a complete curriculum with both instruction and assessment modules.

### Steps

1. **Navigate to Curriculums**
   - Click "Planning" in the sidebar
   - Click "Curriculums"
   - You should see the curriculums list page

2. **Create New Curriculum**
   - Click the "New Curriculum" button (top right)
   - Fill in the form:
     - **Code**: `A320-REC-2025`
     - **Name**: `A320 Type Rating Recurrent 2025`
     - **Type**: Select "Recurrent"
     - **Validity**: `12` months
     - **Description**: `Annual recurrent training for A320 pilots`

3. **Add Regulatory Standards (Tags)**
   - In the "Regulatory Standards" section
   - Type `EASA-ORO-FC-230` and press Enter
   - Type `EASA-ORO-FC-A.245` and press Enter
   - You should see both as badges

4. **Add Instruction Module**
   - Click "Add Module" button
   - In the dialog:
     - **Type**: Select "Instruction"
     - **Name**: `Ground School - Systems Review`
     - **Duration**: `4` hours
     - **Delivery Method**: Select "Classroom"
   - Click "Add Module"

5. **Add Assessment Module**
   - Click "Add Module" button again
   - In the dialog:
     - **Type**: Select "Assessment"
     - **Name**: `LPC/OPC Check`
     - **Duration**: `2` hours
   - Click "Add Module"

6. **Save Curriculum**
   - Click "Save Curriculum" button
   - Verify success toast appears
   - You should be redirected to the curriculums list

### Expected Result

- Curriculum appears in the list with:
  - Blue "Recurrent" badge
  - Shows "2 modules"
  - Shows "6h total"
  - Active status (green badge)

---

## Scenario 2: Create a Campaign (Bulk Scheduling)

### Goal

Create a training campaign for Winter 2025 recurrent training.

### Steps

1. **Navigate to Campaigns**
   - Click "Planning" in the sidebar
   - Click "Campaigns"

2. **Create New Campaign**
   - Click "New Campaign" button
   - Fill in the form:
     - **Name**: `Winter 2025 A320 Recurrent`
     - **Curriculum**: Select the curriculum created in Scenario 1
     - **Start Date**: First day of next month
     - **End Date**: Last day of the quarter
     - **Max per Session**: `6`
   - Click "Create Campaign"

3. **Open Campaign Details**
   - Click on the newly created campaign card
   - You should see the Campaign Detail page with:
     - Overview stats (0 enrolled, 0% progress)
     - Tabs: Enrollments, Schedule, Settings

4. **Enroll Employees**
   - Click the "Enrollments" tab
   - Click "Add Enrollments" button
   - In the dialog, check 6-8 employees
   - Click "Enroll Selected"
   - Verify the enrollment count updates

5. **Generate Schedule (Auto-Scheduler)**
   - Click "Generate Schedule" button (wand icon)
   - In the Auto-Scheduler dialog:
     - **Instructor**: Select an instructor
     - **Location**: Enter `SIM Bay 1`
     - **Preferred Days**: Check Mon, Wed, Fri
     - **Preferred Time**: `09:00`
     - **Session Duration**: `4` hours
   - Click "Generate Schedule"
   - Verify sessions are created in the Schedule tab

6. **Activate Campaign**
   - Click the status dropdown (shows "Draft")
   - Select "Active"
   - Verify the status badge changes to blue "Active"

### Expected Result

- Campaign shows with:
  - Correct enrollment count
  - Progress bar (starts at 0%)
  - Generated sessions visible in Schedule tab
  - Active status

---

## Scenario 3: Exception-Based Grading

### Goal

Grade a proficiency check using the new "click-to-deviate" interface.

### Steps

1. **Navigate to a Check Session**
   - Go to Schedule or Checks
   - Find or create a proficiency check session
   - Open the grading interface

2. **Understand the Default State**
   - All grading elements should show "3 - Standard" by default
   - Elements appear in a collapsed list
   - Green checkmarks indicate standard grade

3. **Mark an Element as Below Standard**
   - Click on an element (e.g., "Takeoff Procedure")
   - The element expands
   - Click grade "2" (Below Standard)
   - A comment field appears (required)
   - Enter: `Slight deviation on rotation speed, corrected after prompt`
   - The element now shows amber indicator

4. **Mark an Element as Unsatisfactory**
   - Click another element (e.g., "Emergency Descent")
   - Click grade "1" (Unsatisfactory)
   - Enter comment: `Failed to maintain correct descent rate, requires retake`
   - Element shows red indicator

5. **Leave Most Elements at Standard**
   - Notice you don't need to click through every element
   - Only the exceptions need attention

6. **Submit Grading**
   - Click "Submit Grades"
   - System calculates overall result based on:
     - Any grade 1 = Fail
     - All grades 2-5 with mandatory passes = Pass

### Expected Result

- Grading legend shows color coding
- Only deviated elements require comments
- Overall result correctly calculated
- Failed elements trigger retake option

---

## Scenario 4: Schedule a Retake

### Goal

Schedule a retake session for a failed trainee.

### Steps

1. **Find a Failed Session**
   - Navigate to a completed session where someone failed
   - Or use the session from Scenario 3

2. **Locate Failed Participant**
   - In the participants table
   - Find a row with "Fail" badge

3. **Click Retake Button**
   - Click the "Schedule Retake" button (circular arrow icon)
   - A dialog appears pre-filled with:
     - Original session reference
     - Trainee name
     - Suggested date (2 weeks from original)

4. **Configure Retake**
   - Adjust the date if needed
   - Select instructor (can be different from original)
   - Optionally add notes: `Retake focusing on emergency procedures`
   - Click "Schedule Retake"

5. **Verify Retake Chain**
   - The new session is created
   - It shows a "Retake #1" badge
   - Clicking on the session shows link to original

### Expected Result

- Retake session created with proper linkage
- Original session shows "Has Retake" indicator
- Retake counter increments for each attempt

---

## Scenario 5: My Actions Dashboard

### Goal

Verify the prioritized task list shows relevant actions.

### Steps

1. **Log in as Instructor**
   - Use an instructor account
   - Navigate to Dashboard

2. **View My Actions Widget**
   - Located at top of dashboard
   - Should show role-specific actions:
     - Upcoming sessions (next 7 days)
     - Pending signatures
     - Grading due

3. **Check Priority Styling**
   - Critical items (red): Expiring competences, overdue grading
   - High items (amber): Sessions tomorrow, pending signatures
   - Medium items (blue): Sessions this week
   - Low items (gray): Informational reminders

4. **Click an Action**
   - Click on any action item
   - Should navigate to the relevant page
   - Example: "Session tomorrow" navigates to session detail

5. **Log in as Training Manager**
   - Switch to training manager account
   - Dashboard shows different actions:
     - Pending approvals
     - Expiring competences across org
     - Campaign progress alerts

### Expected Result

- Actions filtered by user role
- Priority correctly assigned based on urgency
- Navigation works for all action types

---

## Scenario 6: Visual Differentiation (Training vs Checking)

### Goal

Verify the UI correctly distinguishes training and checking activities.

### Steps

1. **Navigate to Schedule/Calendar**
   - View the unified schedule

2. **Check Training Sessions**
   - Training sessions should show:
     - Blue accent color
     - "Instructor" label for trainer
     - "Trainee" label for participants

3. **Check Proficiency Checks**
   - Proficiency checks should show:
     - Violet/Purple accent color
     - "Examiner" label for trainer
     - "Candidate" label for participants

4. **View Mixed Calendar**
   - Both types visible with distinct colors
   - Prevents confusion about event type

### Expected Result

- Clear visual distinction between training and checking
- Consistent terminology throughout

---

## API Endpoints Reference

### Curriculums

```
GET    /api/v1/curriculums           - List all curriculums
GET    /api/v1/curriculums/:id       - Get single curriculum with modules
POST   /api/v1/curriculums           - Create curriculum
PUT    /api/v1/curriculums/:id       - Update curriculum
PUT    /api/v1/curriculums/:id/modules - Update modules
DELETE /api/v1/curriculums/:id       - Delete curriculum
```

### Campaigns

```
GET    /api/v1/campaigns             - List all campaigns
GET    /api/v1/campaigns/:id         - Get campaign with enrollments
POST   /api/v1/campaigns             - Create campaign
PUT    /api/v1/campaigns/:id         - Update campaign
POST   /api/v1/campaigns/:id/enroll  - Enroll users
DELETE /api/v1/campaigns/:id/enroll/:userId - Remove enrollment
POST   /api/v1/campaigns/:id/generate-schedule - Auto-generate sessions
GET    /api/v1/campaigns/:id/progress - Get progress stats
DELETE /api/v1/campaigns/:id         - Delete campaign
```

### Retakes

```
POST   /api/v1/sessions/:id/schedule-retake - Create retake session
GET    /api/v1/sessions/:id/retake-chain    - Get retake history
```

---

## Database Tables Added

| Table                  | Purpose                              |
| ---------------------- | ------------------------------------ |
| `curriculums`          | Merged programme/profile definitions |
| `curriculum_modules`   | Instruction and assessment modules   |
| `campaigns`            | Bulk scheduling containers           |
| `campaign_enrollments` | User assignments to campaigns        |

### New Columns on Existing Tables

| Table                | Column           | Purpose                   |
| -------------------- | ---------------- | ------------------------- |
| `training_sessions`  | `retake_of`      | Links to original session |
| `training_sessions`  | `campaign_id`    | Links to campaign         |
| `training_sessions`  | `attempt_number` | Retake counter            |
| `proficiency_checks` | `retake_of`      | Links to original check   |
| `proficiency_checks` | `campaign_id`    | Links to campaign         |

---

## Troubleshooting

### "Module not found" errors

- Clear Vite cache: `rm -rf node_modules/.vite`
- Restart dev server

### Types not exported

- Ensure imports use `import type { ... }` for type-only imports
- Check `verbatimModuleSyntax` in tsconfig

### Campaign not showing enrollments

- Verify the curriculum exists
- Check user permissions (admin/training_manager required)

### Retake button not appearing

- Only shows for failed participants
- Session must be completed
- User must have scheduling permission
