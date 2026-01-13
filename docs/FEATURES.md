# Features Specification

## Overview

TCMS (Training & Competence Management System) is a comprehensive enterprise solution designed for aviation and other high-compliance industries. It manages the complete lifecycle of employee training, proficiency checks, and regulatory compliance tracking.

## Core Modules

### 1. Personnel Management

#### Employee Profiles
- **Centralized Database**: Complete employee database with roles, departments, contact information, and employment details
- **Employee Status**: Active/inactive status tracking
- **Employment History**: Track employment start dates, role changes, and department assignments
- **Contact Management**: Email, phone, and address information
- **Employee Search**: Advanced search and filtering capabilities

#### Role-Based Access Control (RBAC)
- **Role Hierarchy**:
  - `super_admin` - System-wide administration
  - `org_admin` - Organization administration
  - `training_manager` - Training programme and session management
  - `instructor` - Training session delivery and grading
  - `assessor` - Proficiency check assessment
  - `employee` - Self-service access to own records
- **Granular Permissions**: Role-based access to features and data
- **Permission Enforcement**: Middleware-level and database-level enforcement

#### Multi-Tenancy
- **Organization Isolation**: Complete data separation between organizations
- **Organization Management**: Create and manage multiple organizations
- **Organization Settings**: Configurable thresholds and settings per organization
- **Data Segregation**: Row-level security ensures complete isolation

### 2. Training Management

#### Training Programmes
- **Programme Definition**: Create and manage training programmes with codes, names, and descriptions
- **Programme Types**: Initial, Recurrent, Conversion, and custom types
- **Validity Periods**: Configure validity periods in months for each programme
- **Pass Criteria**: Set pass score percentages and grading requirements
- **Theory/Practical Split**: Track theory hours and practical hours separately
- **Standards Association**: Link programmes to regulatory standards (EASA, etc.)
- **Versioning**: Track programme changes over time

#### Session Management
- **Session Scheduling**: Schedule training sessions with start and end dates
- **Instructor Assignment**: Assign instructors to sessions
- **Trainee Management**: Add/remove trainees from sessions
- **Session Status**: Track session status (scheduled, in_progress, completed, cancelled)
- **Retake Tracking**: Mark sessions as retakes and link to original sessions
- **Attendance Tracking**: Record trainee attendance

#### Grading & Results
- **Result Recording**: Record Pass/Fail outcomes for each trainee
- **Grading Scales**: Support for 1-5 scale or custom grading scales
- **Component Grading**: Grade individual training components
- **Digital Signatures**: Require instructor and trainee signatures
- **Result Finalization**: Lock results after signing to prevent changes

### 3. Competence & Proficiency Checks

#### Proficiency Profiles
- **Profile Definition**: Create proficiency check profiles (LPC, OPC, etc.)
- **Interval Configuration**: Set check intervals in months
- **Grading Schemas**: Support for:
  - Standard grading (1-5 scale)
  - AQP (Advanced Qualification Programme) schemas
  - EBT (Evidence-Based Training) schemas
  - Custom grading schemas (JSONB)
- **Element Definitions**: Define assessment elements and criteria

#### Proficiency Checks
- **Check Scheduling**: Schedule proficiency checks with dates and times
- **Assessor Assignment**: Assign assessors to checks
- **Multi-Assessor Support**: Support for multiple assessors per check
- **Element Grading**: Grade individual assessment elements
- **Result Recording**: Record overall pass/fail result
- **Attempt Tracking**: Track attempt numbers (max 3 attempts)
- **Check Finalization**: Lock checks after completion and signing

#### Fail/Retake Workflows
- **Automated Retake Scheduling**: Automatically schedule retakes for failed checks
- **Remedial Training**: Assign remedial training after failures
- **Attempt Limits**: Enforce maximum 3 attempts per check
- **Retake Tracking**: Link retake checks to original checks
- **Workflow Automation**: Automated notifications and assignments

#### Assessment Criteria
- **Element Breakdown**: Break checks into specific elements (e.g., "Take-off", "Emergency Procedures")
- **Criteria Definition**: Define criteria for each element
- **Grading Per Element**: Grade each element individually
- **Overall Assessment**: Calculate overall result from element grades

### 4. Tracking & Compliance

#### Traffic Light Dashboard
- **Visual Status**: Color-coded status indicators:
  - 🟢 Green: Valid (expires >90 days)
  - 🟡 Amber: Expiring Soon (expires ≤90 days)
  - 🔴 Red: Expired (past expiry date)
- **Aggregated Views**: Counts of valid/expiring/expired competences per user
- **Interactive Filtering**: Click status cards to filter personnel table
- **Real-time Updates**: Status calculated in real-time from database

#### Expiry Tracking
- **Automatic Calculation**: Calculate valid-until dates based on:
  - Training programme validity periods
  - Proficiency check intervals
  - Last completion dates
- **Status Calculation**: Automatic status calculation (valid/expiring_soon/expired)
- **Expiry Alerts**: Automated expiry notifications (90, 30, 14, 7, 0 days)
- **Compliance Monitoring**: Track compliance status across organization

#### Notifications
- **Expiry Alerts**: Email notifications for upcoming expiries (planned)
- **Audit Notifications**: Notifications for critical actions
- **System Notifications**: System-wide announcements

### 5. Reporting & Documentation

#### Employee Dossier
- **Comprehensive PDF**: Generate complete training history PDF for individual employees
- **Training History**: All training sessions and results
- **Proficiency History**: All proficiency checks and results
- **Competence Status**: Current competence status for all programmes/profiles
- **Audit Trail**: Complete audit trail of changes
- **Export Options**: PDF download or email delivery

#### Training File Generation
- **Session Reports**: Auto-generated PDF reports for training sessions
- **Check Reports**: PDF reports for proficiency checks
- **Customizable Templates**: EJS templates for report customization
- **Digital Signatures**: Include digital signatures in reports
- **Branding**: Organization branding support

#### CSV Exports
- **Competence Metrics**: Export competence data for analysis
- **Trainee Lists**: Export trainee lists with filtering
- **Training Records**: Export training session data
- **Check Records**: Export proficiency check data
- **Custom Exports**: Customizable export formats

### 6. Security & Verification

#### Digital Signatures
- **Signature Methods**:
  - PIN-based signatures (quick signing)
  - Canvas signature pad (detailed signing)
- **Signature Data**: Store signature image/data, IP address, timestamp, user agent
- **Non-Repudiation**: Cryptographic verification of signatures
- **Signature Protocol**: Detailed metadata for audit purposes
- **Required Signatures**: Instructor and trainee signatures required

#### Audit Logging
- **Comprehensive Logging**: Log all critical actions:
  - CREATE, UPDATE, DELETE operations
  - Grade changes
  - Status changes
  - Access attempts
- **Audit Trail**: Complete audit trail with:
  - User who performed action
  - Timestamp
  - IP address
  - User agent
  - Old and new values
- **Immutable Logs**: Append-only audit log table
- **Query Interface**: Search and filter audit logs

#### Row Level Security (RLS)
- **Database-Level Security**: RLS policies enforce data access at database level
- **Organization Isolation**: Users can only access data from their organization
- **Role-Based Access**: RLS policies respect user roles
- **Bypass Protection**: Even direct database access respects RLS policies

### 7. Additional Features

#### Absence Management
- **Absence Tracking**: Track employee absences (sick leave, vacation, etc.)
- **Absence Types**: Categorize absences by type
- **Date Ranges**: Track absence start and end dates
- **Impact on Training**: Consider absences when scheduling training

#### Training Materials
- **Material Upload**: Upload training materials (PDFs, documents, etc.)
- **Version Control**: Track material versions
- **Approval Workflow**: Material approval process
- **Programme Association**: Link materials to training programmes
- **Storage**: Secure storage in Supabase Storage

#### Standards Management
- **Regulatory Standards**: Manage regulatory standards (EASA, etc.)
- **Standard Versioning**: Track standard versions and revisions
- **Programme Association**: Link programmes to standards
- **Compliance Tracking**: Track compliance with standards

#### Eligibility Management
- **Eligibility Checks**: Check trainee eligibility for checks
- **Conflict Detection**: Detect assessor conflicts (within 12 months)
- **Automated Validation**: Automatic validation of eligibility criteria
- **Eligibility Reports**: Generate eligibility reports

#### Super Admin Features
- **Organization Management**: Create and manage organizations
- **User Management**: Manage users across organizations
- **System Configuration**: Configure system-wide settings
- **Data Management**: Manage system data

## Feature Roadmap

### Planned Features

- **Email Notifications**: Automated email alerts for expiries
- **Mobile App**: Native mobile application for field use
- **Offline Support**: Offline capability for tablet use
- **Advanced Analytics**: Advanced reporting and analytics dashboard
- **Integration APIs**: Third-party integrations (HR systems, etc.)
- **Workflow Automation**: Advanced workflow automation
- **Multi-Language Support**: Additional language support (currently English/Bulgarian)

### Future Enhancements

- **AI-Powered Insights**: AI-powered training recommendations
- **Predictive Analytics**: Predict training needs and expiries
- **Advanced Scheduling**: Intelligent scheduling optimization
- **Video Training**: Integrated video training support
- **Gamification**: Gamification elements for training engagement
