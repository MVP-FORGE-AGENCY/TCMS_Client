# TCMS - Training & Competence Management System

## Overview

The Training & Competence Management System (TCMS) is a comprehensive enterprise solution designed specifically for the aviation industry (and similar high-compliance sectors). It streamlines the complex process of managing employee training, proficiency checks, and regulatory compliance (e.g., EASA, FAA).

TCMS replaces fragmented spreadsheets, physical files, and manual tracking systems with a modern, cloud-based platform that ensures compliance, reduces administrative burden, and provides real-time visibility into organizational competence status.

## Key Value Proposition

### Compliance Assurance
- **Automated Tracking**: Automates tracking of validity periods, ensuring no crew member operates with expired qualifications
- **Regulatory Compliance**: Built to comply with EASA ADR.OR.D.017 and similar regulations
- **Audit Readiness**: Complete audit trail and one-click report generation for regulatory audits
- **Expiry Alerts**: Automated notifications for upcoming expiries (90, 30, 14, 7, 0 days)

### Centralized Record Keeping
- **Single Source of Truth**: Replaces fragmented spreadsheets and physical files with centralized database
- **Complete History**: Maintains complete training and proficiency history for each employee
- **Digital Signatures**: Secure digital signatures replace paper-based signing
- **Immutable Records**: Audit logs ensure data integrity and prevent tampering

### Digital Workflow
- **End-to-End Digital**: Complete digital workflow from scheduling to completion
- **Tablet Support**: Designed for tablet use in training environments
- **Digital Signatures**: Canvas-based signature pad for natural signing experience
- **Real-Time Updates**: Real-time status updates across all devices

### Real-Time Visibility
- **Traffic Light Dashboard**: Visual representation of competence status (Green/Amber/Red)
- **Fleet Readiness**: Immediate insight into fleet readiness and individual competence status
- **Aggregated Metrics**: Organization-wide metrics and KPIs
- **Interactive Filtering**: Click-through filtering for detailed views

## Target Audience

### Primary Users

**Flight Operations**
- Pilots: View own training records and upcoming requirements
- Cabin Crew: Track training and proficiency status
- Operations Managers: Monitor fleet readiness

**Training Departments**
- Training Managers: Manage programmes, sessions, and schedules
- Instructors: Deliver training and record results
- Examiners/Assessors: Conduct proficiency checks and assessments
- Training Administrators: Manage training records and reports

**Management**
- HR Managers: Employee training overview
- Compliance Officers: Ensure regulatory compliance
- Executives: High-level dashboards and metrics

**Auditors**
- Internal Auditors: Access to complete audit trails
- External Auditors: Regulatory compliance verification
- Quality Assurance: Data quality and process verification

## System Capabilities

### Core Functionality

1. **Personnel Management**: Complete employee database with roles and permissions
2. **Training Management**: Programme definition, session scheduling, and result recording
3. **Proficiency Checks**: LPC/OPC scheduling, grading, and retake workflows
4. **Competence Tracking**: Automated competence status calculation and expiry tracking
5. **Reporting**: PDF generation for audits and compliance
6. **Security**: Digital signatures, audit logging, and role-based access control

### Technical Capabilities

- **Multi-Tenancy**: Support for multiple organizations in single instance
- **Scalability**: Cloud-based architecture scales with organization size
- **Security**: Enterprise-grade security with encryption and access controls
- **Integration**: RESTful API for third-party integrations
- **Mobile-Ready**: Responsive design works on desktop, tablet, and mobile

## Industry Applications

### Aviation
- **Airlines**: Pilot and cabin crew training management
- **Flight Schools**: Student training tracking
- **Maintenance Organizations**: Technician training and certification
- **Ground Handling**: Ground staff training and compliance

### Other High-Compliance Industries
- **Healthcare**: Medical staff training and certification
- **Maritime**: Crew training and certification
- **Railway**: Driver and staff training
- **Energy**: Safety-critical training and certification
- **Manufacturing**: Quality and safety training

## Benefits

### For Organizations

- **Reduced Administrative Burden**: Automates manual tracking and reporting
- **Compliance Assurance**: Ensures regulatory compliance automatically
- **Cost Savings**: Reduces training administration costs
- **Risk Reduction**: Prevents operations with expired qualifications
- **Improved Visibility**: Real-time dashboards and reporting

### For Training Departments

- **Efficient Scheduling**: Streamlined session and check scheduling
- **Digital Workflow**: Paperless training delivery and record-keeping
- **Automated Tracking**: Automatic expiry tracking and notifications
- **Easy Reporting**: One-click report generation for audits

### For Employees

- **Self-Service Access**: View own training records and status
- **Transparency**: Clear visibility into training requirements
- **Mobile Access**: Access records from any device
- **Digital Signatures**: Quick and easy signing process

## System Architecture

TCMS follows a modern, cloud-based architecture:

- **Frontend**: React-based single-page application (SPA)
- **Backend**: Node.js/Express RESTful API
- **Database**: PostgreSQL via Supabase
- **Storage**: Supabase Storage for documents and PDFs
- **Authentication**: Supabase Auth (JWT-based)

See [Technical Specification](./TECHNICAL_SPECIFICATION.md) for detailed architecture information.

## Compliance Standards

TCMS is designed to comply with:

- **EASA ADR.OR.D.017**: European Aviation Safety Agency requirements
- **FAA Part 121/135**: Federal Aviation Administration requirements
- **ICAO Standards**: International Civil Aviation Organization standards
- **Custom Regulations**: Configurable for organization-specific requirements

## Getting Started

### For Administrators

1. Set up organization and users
2. Configure training programmes and proficiency profiles
3. Set up standards and compliance requirements
4. Begin scheduling training sessions

### For Training Staff

1. Access assigned training sessions
2. Record trainee attendance and results
3. Complete digital signatures
4. Generate training reports

### For Employees

1. Log in to view own records
2. Check training status and upcoming requirements
3. View training history and certificates
4. Access reports and documents

## Support and Resources

- **Documentation**: Comprehensive documentation in `/docs` directory
- **API Documentation**: Swagger UI at `/api-docs`
- **Support**: Contact support team for assistance
- **Training**: Training materials and guides available

## Version Information

- **Current Version**: 1.0.0
- **Release Date**: 2024
- **License**: Proprietary

For detailed technical information, see:
- [Technical Specification](./TECHNICAL_SPECIFICATION.md)
- [Features](./FEATURES.md)
- [Security](./SECURITY.md)
- [Deployment](./DEPLOYMENT_SPEC.md)
