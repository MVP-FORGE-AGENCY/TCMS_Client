# Test Data for Workflow Features

Copy-paste ready test data for all new features.

---

## Workflow-Driven Design

The system now uses **Curriculums** as the primary training definition. Legacy "Programmes" have been deprecated and replaced by the new unified Curriculum structure.

### Key Changes
- **Curriculums** replace both Programmes and Proficiency Profiles
- **Modules** define instruction and assessment blocks within curriculums
- **Campaigns** enable bulk scheduling for entire training cycles
- **Sessions** now link to curriculums instead of programmes

---

## Curriculum Test Data

### Curriculum 1: A320 Recurrent Training

| Field | Value |
|-------|-------|
| Code | `A320-REC-2025` |
| Name | `A320 Type Rating Recurrent 2025` |
| Type | `recurrent` |
| Validity (months) | `12` |
| Description | `Annual recurrent training program for A320 type-rated pilots. Includes ground school, simulator training, and LPC/OPC checks.` |
| Standard Tags | `EASA-ORO-FC-230`, `EASA-ORO-FC-A.245` |

**Modules:**

| # | Type | Name | Duration | Delivery Method |
|---|------|------|----------|-----------------|
| 1 | instruction | Ground School - Aircraft Systems | 4h | classroom |
| 2 | instruction | CBT - Emergency Procedures | 2h | elearning |
| 3 | instruction | Simulator Session 1 - Normal Ops | 4h | simulator |
| 4 | instruction | Simulator Session 2 - Abnormal Ops | 4h | simulator |
| 5 | assessment | LPC/OPC Proficiency Check | 4h | simulator |

---

### Curriculum 2: Initial Type Rating

| Field | Value |
|-------|-------|
| Code | `B737-INIT-2025` |
| Name | `Boeing 737 MAX Initial Type Rating` |
| Type | `initial` |
| Validity (months) | `24` |
| Description | `Complete initial type rating course for Boeing 737 MAX series aircraft.` |
| Standard Tags | `EASA-FCL.725`, `EASA-ORO-FC-200` |

**Modules:**

| # | Type | Name | Duration | Delivery Method |
|---|------|------|----------|-----------------|
| 1 | instruction | Ground School - Systems | 40h | classroom |
| 2 | instruction | Ground School - Performance | 16h | classroom |
| 3 | instruction | CBT - Normal Procedures | 8h | elearning |
| 4 | instruction | FTD Training | 12h | simulator |
| 5 | instruction | Full Flight Simulator | 32h | simulator |
| 6 | assessment | Skill Test | 4h | simulator |

---

### Curriculum 3: Dangerous Goods Refresher

| Field | Value |
|-------|-------|
| Code | `DGR-REF-2025` |
| Name | `Dangerous Goods Awareness Refresher` |
| Type | `refresher` |
| Validity (months) | `24` |
| Description | `Biennial refresher training for dangerous goods awareness.` |
| Standard Tags | `IATA-DGR-1.5`, `ICAO-TI` |

**Modules:**

| # | Type | Name | Duration | Delivery Method |
|---|------|------|----------|-----------------|
| 1 | instruction | DGR Updates & Changes | 2h | classroom |
| 2 | instruction | Recognition & Handling | 2h | classroom |
| 3 | assessment | Written Examination | 1h | - |

---

## Campaign Test Data

### Campaign 1: Winter Recurrent Season

| Field | Value |
|-------|-------|
| Name | `Winter 2025 A320 Recurrent` |
| Description | `Q1 2025 recurrent training cycle for all A320 pilots` |
| Curriculum | A320-REC-2025 (from above) |
| Start Date | `2025-01-06` |
| End Date | `2025-03-31` |
| Max Per Session | `6` |
| Default Location | `Training Center - SIM Bay 1` |

---

### Campaign 2: Summer Initial Training

| Field | Value |
|-------|-------|
| Name | `Summer 2025 B737 Type Rating` |
| Description | `New hire type rating course - Summer intake` |
| Curriculum | B737-INIT-2025 (from above) |
| Start Date | `2025-06-01` |
| End Date | `2025-08-31` |
| Max Per Session | `4` |
| Default Location | `Training Center - Main Building` |

---

### Campaign 3: DGR Compliance Push

| Field | Value |
|-------|-------|
| Name | `DGR Compliance Q2 2025` |
| Description | `Mandatory dangerous goods refresher for all cabin crew` |
| Curriculum | DGR-REF-2025 (from above) |
| Start Date | `2025-04-01` |
| End Date | `2025-06-30` |
| Max Per Session | `20` |
| Default Location | `Conference Room A` |

---

## Auto-Scheduler Test Data

### Schedule Config 1: Intensive Week

| Field | Value |
|-------|-------|
| Instructor | (select any instructor) |
| Location | `SIM Bay 1` |
| Preferred Days | Monday, Wednesday, Friday |
| Preferred Time | `08:00` |
| Session Duration | `4` hours |
| Break Between Sessions | `1` hour |

---

### Schedule Config 2: Spread Out

| Field | Value |
|-------|-------|
| Instructor | (select any instructor) |
| Location | `Training Room B` |
| Preferred Days | Tuesday, Thursday |
| Preferred Time | `09:30` |
| Session Duration | `2` hours |
| Break Between Sessions | `30` minutes |

---

## Grading Elements Test Data

### LPC/OPC Check Elements

| Element Name | Mandatory | Description |
|-------------|-----------|-------------|
| Pre-flight Preparation | Yes | Flight planning, weather analysis, NOTAM review |
| Cockpit Setup | No | Panel setup, FMS programming, briefings |
| Normal Takeoff | Yes | Standard departure procedures |
| Engine Failure After V1 | Yes | Continued takeoff with engine failure |
| Instrument Departure | Yes | SID following, altitude/speed management |
| Holding Pattern | No | Entry and holding procedures |
| ILS Approach Cat I | Yes | Precision approach to minimums |
| ILS Approach Cat II/III | Yes | Low visibility approach procedures |
| Circling Approach | No | Visual maneuvering after instrument approach |
| Go-Around | Yes | Missed approach execution |
| Engine Failure in Flight | Yes | Drift down, diversion planning |
| Emergency Descent | Yes | Rapid descent procedures |
| TCAS RA Response | Yes | Traffic avoidance maneuvers |
| Windshear Escape | Yes | Predictive and reactive windshear |
| Normal Landing | Yes | Standard approach and landing |
| Crosswind Landing | No | Crosswind technique |
| Rejected Takeoff | Yes | High speed abort procedures |
| CRM Assessment | Yes | Crew coordination and communication |

---

### Skill Test Elements (Initial)

| Element Name | Mandatory | Description |
|-------------|-----------|-------------|
| Flight Preparation | Yes | Complete pre-flight planning |
| Pre-start Checks | Yes | Cockpit preparation procedures |
| Engine Start | No | Normal and abnormal starts |
| Taxi Operations | No | Ground movement and runway entry |
| Normal Takeoff | Yes | Standard departure |
| Crosswind Takeoff | No | Crosswind technique > 15kt |
| Instrument Departure | Yes | SID compliance |
| En-route Navigation | Yes | FMS and raw data navigation |
| Steep Turns | No | 45-degree bank turns |
| Stall Recovery | Yes | Approach and clean configuration |
| Upset Recovery | Yes | Nose high/low unusual attitudes |
| Non-precision Approach | Yes | VOR or NDB approach |
| Precision Approach | Yes | ILS to minimums |
| Visual Approach | No | Visual pattern and landing |
| Go-Around from DH | Yes | Missed approach from decision height |
| Normal Landing | Yes | Stabilized approach criteria |
| Touch and Go | No | Full stop optional |
| One Engine Inoperative Approach | Yes | Single engine ILS |
| Emergency Procedures | Yes | Memory items and QRH usage |
| Systems Knowledge | Yes | Oral examination on systems |

---

## Test Employees Data

### Pilots (for A320/B737 training)

| Full Name | Email | Department | Role |
|-----------|-------|------------|------|
| John Mitchell | john.mitchell@airline.test | Flight Ops | employee |
| Sarah Chen | sarah.chen@airline.test | Flight Ops | employee |
| Michael Torres | michael.torres@airline.test | Flight Ops | employee |
| Emma Wilson | emma.wilson@airline.test | Flight Ops | employee |
| David Park | david.park@airline.test | Flight Ops | employee |
| Lisa Anderson | lisa.anderson@airline.test | Flight Ops | employee |
| Robert Kim | robert.kim@airline.test | Flight Ops | employee |
| Jennifer Brown | jennifer.brown@airline.test | Flight Ops | employee |

### Instructors/Examiners

| Full Name | Email | Role |
|-----------|-------|------|
| Captain James Wright | james.wright@airline.test | instructor |
| Captain Maria Santos | maria.santos@airline.test | instructor |
| Captain Thomas Miller | thomas.miller@airline.test | assessor |

### Cabin Crew (for DGR training)

| Full Name | Email | Department |
|-----------|-------|------------|
| Amy Johnson | amy.johnson@airline.test | Cabin Services |
| Brian Lee | brian.lee@airline.test | Cabin Services |
| Carol White | carol.white@airline.test | Cabin Services |
| Daniel Green | daniel.green@airline.test | Cabin Services |
| Elena Rodriguez | elena.rodriguez@airline.test | Cabin Services |

---

## Grading Test Scenarios

### Scenario A: All Pass (Standard Grading)
- All elements: Grade 3 (Standard)
- No comments needed
- Result: **PASS**

### Scenario B: Pass with Minor Deviations
| Element | Grade | Comment |
|---------|-------|---------|
| Cockpit Setup | 2 | Minor delay in FMS programming, within acceptable limits |
| Holding Pattern | 4 | Excellent entry technique and timing |
| All others | 3 | (no comment needed) |
- Result: **PASS**

### Scenario C: Fail - Critical Item
| Element | Grade | Comment |
|---------|-------|---------|
| Engine Failure After V1 | 1 | Failed to maintain directional control, departed runway centerline |
| All others | 3 | (no comment needed) |
- Result: **FAIL** (mandatory item failed)

### Scenario D: Fail - Multiple Below Standard
| Element | Grade | Comment |
|---------|-------|---------|
| ILS Approach Cat I | 2 | Unstabilized approach, late configuration |
| Go-Around | 2 | Delayed initiation, below MDA before climb |
| Emergency Descent | 2 | Incorrect initial actions, required prompting |
| TCAS RA Response | 1 | Failed to follow RA, continued climb during descend command |
| All others | 3 | (no comment needed) |
- Result: **FAIL**

### Scenario E: Exceptional Performance
| Element | Grade | Comment |
|---------|-------|---------|
| CRM Assessment | 5 | Outstanding leadership and communication throughout check |
| Engine Failure in Flight | 5 | Textbook handling, excellent decision making |
| Emergency Descent | 5 | Rapid recognition and perfect execution |
| All others | 3 | (no comment needed) |
- Result: **PASS** (with commendation)

---

## Retake Test Data

### Retake Session 1

| Field | Value |
|-------|-------|
| Original Session | (ID from failed check) |
| Trainee | John Mitchell |
| Retake Date | 14 days after original |
| Instructor | Captain Thomas Miller |
| Location | `SIM Bay 2` |
| Notes | `Retake focusing on TCAS RA procedures. Additional briefing on memory items required.` |

### Retake Session 2 (Second Attempt)

| Field | Value |
|-------|-------|
| Original Session | (ID from first retake) |
| Trainee | John Mitchell |
| Retake Date | 14 days after first retake |
| Instructor | Captain Maria Santos |
| Location | `SIM Bay 1` |
| Notes | `Second retake attempt. Remedial training completed. Focus on all previously failed items.` |

---

## Locations

| Location Code | Full Name |
|--------------|-----------|
| SIM-1 | Training Center - SIM Bay 1 |
| SIM-2 | Training Center - SIM Bay 2 |
| SIM-3 | Training Center - SIM Bay 3 |
| TR-A | Training Room A |
| TR-B | Training Room B |
| CONF-A | Conference Room A |
| CONF-B | Conference Room B |
| CBT-LAB | Computer Based Training Lab |
| BRIEF-1 | Briefing Room 1 |
| BRIEF-2 | Briefing Room 2 |

---

## Standard Tags Reference

| Tag | Description |
|-----|-------------|
| EASA-FCL.725 | Type rating requirements |
| EASA-ORO-FC-200 | Flight crew competence requirements |
| EASA-ORO-FC-230 | Recurrent training and checking |
| EASA-ORO-FC-A.245 | Alternative training and qualification |
| IATA-DGR-1.5 | Dangerous goods regulations |
| ICAO-TI | ICAO Technical Instructions |
| FAA-61.58 | Pilot proficiency check |
| FAA-121.427 | Recurrent training |
| UK-CAA-AMC1 | UK CAA acceptable means of compliance |

---

## Quick Copy-Paste JSON

### Create Curriculum Request
```json
{
  "code": "A320-REC-2025",
  "name": "A320 Type Rating Recurrent 2025",
  "type": "recurrent",
  "validityMonths": 12,
  "description": "Annual recurrent training program for A320 type-rated pilots.",
  "standardTags": ["EASA-ORO-FC-230", "EASA-ORO-FC-A.245"],
  "modules": [
    {
      "type": "instruction",
      "name": "Ground School - Aircraft Systems",
      "durationHours": 4,
      "sequence": 1,
      "deliveryMethod": "classroom"
    },
    {
      "type": "instruction",
      "name": "Simulator Session - Normal Ops",
      "durationHours": 4,
      "sequence": 2,
      "deliveryMethod": "simulator"
    },
    {
      "type": "assessment",
      "name": "LPC/OPC Proficiency Check",
      "durationHours": 4,
      "sequence": 3
    }
  ]
}
```

### Create Campaign Request
```json
{
  "name": "Winter 2025 A320 Recurrent",
  "description": "Q1 2025 recurrent training cycle for all A320 pilots",
  "curriculumId": "<curriculum-id>",
  "dateRangeStart": "2025-01-06",
  "dateRangeEnd": "2025-03-31",
  "maxPerSession": 6,
  "defaultLocation": "Training Center - SIM Bay 1"
}
```

### Enroll Users Request
```json
{
  "userIds": [
    "<user-id-1>",
    "<user-id-2>",
    "<user-id-3>",
    "<user-id-4>",
    "<user-id-5>",
    "<user-id-6>"
  ]
}
```

### Generate Schedule Request
```json
{
  "instructorId": "<instructor-id>",
  "location": "SIM Bay 1",
  "preferredDays": ["monday", "wednesday", "friday"],
  "preferredTime": "08:00",
  "sessionDurationHours": 4,
  "breakBetweenMinutes": 60
}
```

### Schedule Retake Request
```json
{
  "traineeId": "<user-id>",
  "scheduledDate": "2025-02-15",
  "instructorId": "<instructor-id>",
  "location": "SIM Bay 2",
  "notes": "Retake focusing on failed items. Additional briefing required."
}
```
