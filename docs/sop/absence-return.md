# Return to Duty After Absence

This document outlines the requirements for personnel returning to duty after an extended absence, including refresher training and initial training requirements.

## 1. Overview

### 1.1 Purpose

Extended absences may result in skill degradation and knowledge gaps. This procedure ensures personnel returning from absence are adequately prepared to resume duties safely and competently.

### 1.2 Types of Absence

Absences covered by this procedure include:

- Medical leave
- Parental leave
- Sabbatical
- Suspension
- Any continuous period away from duties

## 2. Absence Duration Thresholds

### 2.1 Duration Categories

| Duration        | Requirement                     |
| --------------- | ------------------------------- |
| **< 3 months**  | No additional training required |
| **3-12 months** | Refresher training required     |
| **> 12 months** | Full initial training required  |

### 2.2 Calculation

- Duration calculated from absence start date to end date
- Contiguous absences are combined (gap < 7 days = same absence)
- Only **approved** absences are counted

## 3. Refresher Training (3-12 months)

### 3.1 When Required

Refresher training is triggered when:

- Total absence duration is **3 months or more** but less than 12 months
- Absence ended within the **last 30 days**

### 3.2 What It Covers

Refresher training includes:

- Review of key procedures and updates
- Practical skills demonstration
- Knowledge verification
- Any regulatory changes during absence

### 3.3 Enrollment

- System flags employee with **"Refresher Required"** status
- Training Manager schedules appropriate refresher session
- Enrollment in non-refresher training is **blocked**

### 3.4 Completion

Upon successful completion:

- Refresher flag is cleared
- Employee eligible for normal training/duties
- Record logged with completion date

## 4. Initial Training (> 12 months)

### 4.1 When Required

Initial training is triggered when:

- Total absence duration **exceeds 12 months**
- Absence ended within the **last 30 days**

### 4.2 What It Covers

Full initial training programme:

- Complete foundational training
- All practical competencies
- Full assessment cycle
- Equivalent to new employee onboarding

### 4.3 Enrollment

- System flags employee with **"Initial Training Required"** status
- Only initial training programmes are available
- Other training/checks are **blocked**

### 4.4 Completion

Upon successful completion:

- Initial flag is cleared
- All competence cycles restart from new dates
- Employee returns to normal status

## 5. System Behavior

### 5.1 Automatic Detection

System automatically:

- Calculates absence duration when absence ends
- Sets appropriate flag (refresher_required or initial_required)
- Blocks incompatible enrollments

### 5.2 Dashboard Display

On Competence Dashboard:

- 🟠 **Orange indicator** - Refresher Required
- 🔴 **Red indicator** - Initial Training Required
- Tooltip shows absence duration

### 5.3 Enrollment Blocking

When attempting to enroll affected employee:

```
⚠️ John Trainee: Refresher training required due to 5-month absence
```

Admin override available with documented justification.

## 6. Clearing Absence Flags

### 6.1 Automatic Clearing

Flags are automatically cleared when:

- Employee completes the required training type (refresher/initial)
- Training result is **Pass**

### 6.2 Manual Override

Training Manager can manually clear flags when:

- Equivalent external training completed (with documentation)
- Assessment confirms competence without formal training
- Regulatory authority grants exemption

Override requires:

- Documented justification
- Evidence of competence
- Approval by Training Manager
- Audit log entry

## 7. Reporting

### 7.1 Available Reports

- **Current Absence Flags** - List of employees with active flags
- **Returning Employees** - Absences ending in next 30 days
- **Completed Returns** - Recently cleared absence cases

### 7.2 Notifications

System sends notifications:

- To Training Manager when absence ends
- To employee with requirements summary
- Reminder if flag not cleared within 30 days

## 8. Record Keeping

### 8.1 Absence Records

For each absence:

- Start and end dates
- Reason/type (optional, for reference)
- Duration calculated
- Flag triggered
- Clearance date and method

### 8.2 Integration

Absence data integrates with:

- Competence dashboard (flag display)
- Enrollment validation
- Employee history view
- Audit trail

---

**Document Control**

- Version: 1.0
- Last Reviewed: December 2024
- Next Review: December 2025
- Owner: Training Manager
