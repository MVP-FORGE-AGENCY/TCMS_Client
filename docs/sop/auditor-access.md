# Regulatory Audit Procedures

This document outlines the procedures for supporting regulatory audits and inspections, including available documentation, access controls, and data retention policies.

## 1. Overview

### 1.1 Purpose

This procedure ensures the organization can effectively support regulatory audits by providing timely access to required documentation and maintaining appropriate records.

### 1.2 Applicable Regulations

- EASA Part-ORA (Organisation Requirements)
- ADR.OR.D.017 (Personnel Training Requirements)
- National aviation authority requirements
- Data protection regulations (GDPR where applicable)

## 2. Auditor Access

### 2.1 Auditor Role

The system includes a dedicated **Auditor** role with:

- Read-only access to training records
- Access to all SOP documentation
- Report generation capabilities
- No modification permissions

### 2.2 Access Request Process

1. Regulatory authority submits access request
2. Compliance Manager verifies auditor credentials
3. Temporary account created with Auditor role
4. Access logged and monitored
5. Account deactivated after audit period

### 2.3 Access Scope

Auditors can view:

- ✅ Training session records
- ✅ Proficiency check records
- ✅ Personnel competence status
- ✅ Programme and profile definitions
- ✅ Standard operating procedures
- ✅ Audit logs (read-only)
- ❌ Personal contact information (restricted)
- ❌ Financial data (not in scope)

## 3. Available Documentation

### 3.1 Training Records

For each training session:

- Session details (date, location, programme)
- Instructor identification and qualification
- Participant list with attendance
- Individual assessment results
- Instructor signature with timestamp

### 3.2 Proficiency Check Records

For each check:

- Check details (date, profile, assessors)
- Trainee identification
- Evaluation criteria and scores
- Overall result
- Assessor signatures

### 3.3 Employee Training Files

For each employee:

- Complete training history
- Current competence status
- Upcoming expirations
- Absence records (if applicable)
- Attempt history (including failures)

### 3.4 Programme Documentation

- Training programme definitions
- Proficiency profile specifications
- Pass criteria and thresholds
- Validity periods

## 4. Report Generation

### 4.1 Standard Reports

| Report            | Description                           |
| ----------------- | ------------------------------------- |
| Competence Matrix | Overview of all personnel competences |
| Expiring Soon     | Items expiring within 90 days         |
| Training History  | Individual or batch training records  |
| Session Summary   | Details of specific sessions          |
| Check Summary     | Details of proficiency checks         |

### 4.2 Custom Reports

Training Manager can generate custom reports with:

- Date range filters
- Programme/profile selection
- Personnel group selection
- Export to CSV/PDF formats

### 4.3 Generating for Audit

Recommended audit package:

1. Full competence matrix (current state)
2. Training completed in audit period
3. Checks completed in audit period
4. Any failures with remedial documentation
5. SOP documentation (this folder)

## 5. Protocol PDF Access

### 5.1 Certificate Generation

System can generate PDF certificates for:

- Individual training completions
- Proficiency check passes
- Current competence summary

### 5.2 Batch Export

For audits, batch export available:

- Select personnel or date range
- Generate combined PDF
- Includes digital signatures
- Tamper-evident formatting

## 6. Data Retention

### 6.1 Retention Periods

| Record Type               | Retention Period                 |
| ------------------------- | -------------------------------- |
| Training session records  | 5 years minimum                  |
| Proficiency check records | 5 years minimum                  |
| Personnel files           | Duration of employment + 5 years |
| Audit logs                | 7 years                          |
| System access logs        | 2 years                          |

### 6.2 Archival Process

- Records past retention remain accessible
- Archived data clearly marked
- Deletion only with Compliance Manager approval
- Deletion logging mandatory

### 6.3 Data Integrity

- All records include creation timestamp
- Modification history tracked
- Electronic signatures tamper-evident
- Regular backup verification

## 7. Audit Log Access

### 7.1 What Is Logged

The audit trail captures:

- User actions (create, update, delete)
- Entity affected
- Old and new values
- Timestamp and user identity
- IP address and user agent

### 7.2 Accessing Logs

Auditors can:

- View audit entries for specific records
- Filter by date range or action type
- Export audit trail for analysis
- Cannot modify audit entries

## 8. On-Site Audit Support

### 8.1 Preparation

Before regulatory audit:

- Verify auditor access credentials
- Prepare standard report package
- Brief relevant personnel
- Ensure system availability

### 8.2 During Audit

Support activities:

- Designate audit liaison
- Provide workspace and access
- Respond to data requests promptly
- Document all requests and responses

### 8.3 Post-Audit

Follow-up actions:

- Deactivate auditor access
- Archive audit correspondence
- Address any findings
- Update procedures if required

## 9. Contact Information

### 9.1 Audit Enquiries

For audit-related questions:

- Internal: Training Manager
- External: Compliance Manager
- Technical: System Administrator

---

**Document Control**

- Version: 1.0
- Last Reviewed: December 2024
- Next Review: December 2025
- Owner: Compliance Manager
