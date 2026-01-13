# Pass Criteria & Scoring Standards

This document defines the assessment criteria, scoring standards, and pass logic for all training and proficiency evaluations.

## 1. Assessment Methods

### 1.1 Approved Methods

| Method                  | Code          | Description                      |
| ----------------------- | ------------- | -------------------------------- |
| Written Examination     | `written`     | Paper-based or digital test      |
| Oral Examination        | `oral`        | Verbal Q&A with assessor         |
| Practical Demonstration | `practical`   | Hands-on skill demonstration     |
| Computer-Based          | `computer`    | Interactive digital assessment   |
| Observation             | `observation` | On-the-job competence evaluation |
| Simulation              | `simulation`  | Scenario-based practical test    |

### 1.2 Method Selection

- Assessment method is configured per training programme
- Some programmes require **multiple methods** (e.g., theory + practical)
- Method must be appropriate for the learning objectives

## 2. Theory Assessment

### 2.1 Scoring

- Scores recorded as percentage (0-100%)
- Minimum passing score: **75%** (default, configurable per programme)
- Scores are rounded to nearest whole number

### 2.2 Question Requirements

- Questions must cover all required competency areas
- Minimum question count determined by programme
- Random selection from question bank recommended

### 2.3 Time Limits

- Time limits configured per assessment
- Extensions require Training Manager approval
- Incomplete assessments scored on completed questions only

## 3. Practical Assessment

### 3.1 Scoring

- Scores recorded as percentage (0-100%)
- Minimum passing score: **70%** (default, configurable per programme)
- Based on standardized evaluation criteria

### 3.2 Evaluation Criteria

Practical assessments are evaluated on:

- **Safety** - Adherence to safety procedures
- **Technique** - Correct application of skills
- **Efficiency** - Time management and workflow
- **Knowledge** - Understanding demonstrated during task
- **Communication** - Clear and appropriate communication

### 3.3 Critical Items

- Some criteria may be marked as **critical**
- Failure on a critical item results in overall **Fail** regardless of score
- Critical items are defined per programme

## 4. Overall Pass Logic

### 4.1 Single Assessment Programmes

- One score determines result
- Score >= pass threshold = **Pass**
- Score < pass threshold = **Fail**

### 4.2 Dual Assessment Programmes (Theory + Practical)

Both components must pass for overall pass:

```
IF theory_score >= theory_threshold
   AND practical_score >= practical_threshold
THEN result = PASS
ELSE result = FAIL
```

### 4.3 Score Not Recorded

- If no score recorded but attendance confirmed: **Incomplete**
- Incomplete results require follow-up assessment

## 5. Scoring Configuration

### 5.1 Programme-Level Settings

Each training programme can configure:
| Setting | Default | Range |
|---------|---------|-------|
| Theory Pass Score | 75% | 50-100% |
| Practical Pass Score | 70% | 50-100% |
| Has Theory Component | Yes | Yes/No |
| Has Practical Component | Yes | Yes/No |

### 5.2 Modifying Thresholds

- Only Training Managers can modify pass thresholds
- Changes are logged in audit trail
- Changes do not affect previously recorded results

## 6. Result Recording

### 6.1 Immediate Recording

- Results should be recorded **within 24 hours** of assessment
- Theory results from digital tests are recorded automatically
- Practical results require assessor input

### 6.2 Required Information

For each result:

- Trainee identification
- Assessment date and time
- Assessment method used
- Numerical score
- Pass/Fail determination
- Assessor identification
- Comments (optional, required for failures)

## 7. Appeals Process

### 7.1 Requesting Review

- Trainees may request result review within **5 working days**
- Request submitted to Training Manager
- Original assessor excluded from review

### 7.2 Review Outcome

- Result confirmed, corrected, or reassessment ordered
- All review decisions documented
- Final decision by Training Manager

---

**Document Control**

- Version: 1.0
- Last Reviewed: December 2024
- Next Review: December 2025
- Owner: Training Manager
