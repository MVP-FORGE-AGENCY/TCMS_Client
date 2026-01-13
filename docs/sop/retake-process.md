# Failed Training/Check - Retake Procedure

This document outlines the procedures when a trainee fails a training session or proficiency check, including remedial requirements, waiting periods, and escalation processes.

## 1. Immediate Actions After Failure

### 1.1 Notification

- Trainee is notified of failure with:
  - Assessment area(s) where performance was insufficient
  - Overall score achieved
  - Next steps required

### 1.2 System Recording

The system automatically:

- Records the attempt with result = **Fail**
- Increments the attempt counter
- Sets **remedial_required** flag (if configured)
- Calculates **next_attempt_allowed_after** date

## 2. Remedial Training Requirements

### 2.1 When Required

Remedial training is required if:

- Programme configuration specifies `requires_remedial_after_fail = true`
- This is the default for most programmes

### 2.2 Remedial Process

1. Instructor/Assessor documents areas needing improvement
2. Targeted coaching or additional training provided
3. Training Manager or instructor marks remedial as **complete**
4. Trainee becomes eligible for resit

### 2.3 Remedial Documentation

Required fields:

- Remedial notes (what was covered)
- Completion date
- Who delivered the remedial training
- Confirmation trainee is ready for resit

> **Important**: Trainee cannot enroll in resit until remedial is marked complete.

## 3. Waiting Period

### 3.1 Minimum Wait Time

- Default waiting period: **7 days** between attempts
- Configurable per programme (range: 0-90 days)
- Purpose: Allow time for remedial training and preparation

### 3.2 Calculation

```
next_attempt_allowed_after = failure_date + min_resit_days
```

### 3.3 Exceptions

Training Manager can override waiting period with:

- Documented justification
- Confirmation remedial is complete
- Override recorded in audit log

## 4. Maximum Attempts Policy

### 4.1 Attempt Limits

- Default maximum attempts: **3** per competence cycle
- Configurable per programme
- Counter resets after successful pass

### 4.2 When Maximum Reached

If trainee fails on maximum attempt:

1. Enrollment in further resits is **blocked**
2. Case escalated to Training Manager
3. Options:
   - Additional structured training programme
   - Alternative assessment accommodation
   - Role reassignment consideration
   - Extension of attempt limit (exceptional cases)

### 4.3 Escalation Process

Training Manager must:

- Review trainee's full attempt history
- Consult with original assessors
- Document decision and rationale
- Implement appropriate intervention

## 5. Resit Enrollment

### 5.1 Eligibility Check

Before enrolling for resit, system verifies:

- [ ] Remedial training completed (if required)
- [ ] Waiting period elapsed
- [ ] Maximum attempts not exceeded
- [ ] No other blocking conditions

### 5.2 Automatic Blocking

If conditions not met, enrollment is blocked with message:

- "Remedial training required"
- "Waiting period: X days remaining"
- "Maximum attempts reached - contact Training Manager"

### 5.3 Admin Override

Training Managers can override blocks:

- Checkbox to confirm override
- Override reason required
- Logged for audit purposes

## 6. Tracking & Reporting

### 6.1 Attempt History

For each trainee, system tracks:

- All attempts with dates
- Scores achieved
- Pass/Fail results
- Remedial completion status
- Next attempt eligibility

### 6.2 Reports Available

- **Fail Rate Report** - Percentage of failures per programme
- **Remedial Pending** - Trainees awaiting remedial completion
- **Maximum Attempts** - Cases requiring escalation
- **Waiting Period Active** - Upcoming resit eligibilities

## 7. Special Circumstances

### 7.1 Medical or Personal Issues

If failure due to documented circumstances:

- Training Manager may authorize "No Count" attempt
- Attempt not counted toward maximum
- Full documentation required

### 7.2 Assessment Irregularities

If failure due to assessment issues (e.g., technical problems):

- Investigation required
- May result in reassessment without penalty
- Documented in incident log

---

**Document Control**

- Version: 1.0
- Last Reviewed: December 2024
- Next Review: December 2025
- Owner: Training Manager
