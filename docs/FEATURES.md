# Frontend Features & Architecture (TCMS-Client)

## 1. Architecture Overview

- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI (Radix Primitives)
- **State Management**:
  - **Global**: React Context (`AuthContext`, `BreadcrumbContext`)
  - **Server State**: Hybrid approach. Older components use `useEffect` + local state. Newer components uses `@tanstack/react-query`.
- **Routing**: `react-router-dom` (v7)
- **HTTP Client**: Axios wrapper with interceptors.
- **Internationalization**: `react-i18next` (English/Bulgarian).

---

## 2. Feature Modules

### 2.1 Dashboard Module

**Route**: `/dashboard`
**Entry Component**: `src/pages/dashboard/page.tsx`

#### Description

The central hub for users, displaying high-level metrics, compliance status, and quick actions.

#### Key Components

- `ComplianceDetails.tsx`: Modal showing breakdown of valid/expiring/expired items.
- `MyActions.tsx`: Priority task list for the logged-in user.
- **Charts**: Recharts-based visualizations (Competence by Dept, Personnel by Role, Training Trend).

#### Data Flow

- **Fetching**: Parallel fetching in `useEffect` using `Promise.allSettled`.
- **Endpoints**:
  - `GET /employees` (for counts/roles)
  - `GET /campaigns` (for active programmes)
  - `GET /reports/expiring` (for alerts)
  - `GET /competence` (for summary stats)
  - `GET /sessions` (for trend analysis)
- **State**: Raw data is transformed locally into chart-compatible formats.

---

### 2.2 Personnel Management

**Routes**:

- `/personnel` (Main List)
- `/personnel/:id/history` (Employee Dossier)

#### Description

Manages employee records, roles, and provides access to individual training histories.

#### Key Components

- `PersonnelTable.tsx`: DataTable with filtering and actions (Edit, History, Delete).
- `PersonnelForm.tsx`: Form for creating/editing employees (uses `react-hook-form` + `zod`).
- `PersonnelHistoryModal.tsx`: Quick view of history.
- `AuditorInviteModal.tsx`: Special flow for inviting external auditors.

#### Data Flow

- **Fetching**: `useEffect` triggers `fetchEmployees`.
- **Endpoints**:
  - `GET /employees` (supports filtering by `status=active|inactive`)
  - `POST /auth/register` (for employees with login access)
  - `POST /employees` (for records without login)
  - `PATCH /employees/:id` (updates)
  - `DELETE /employees/:id`
- **RBAC**: UI elements (Add, Delete) are conditionally rendered based on `user.role` (Admin/Super Admin only).

---

### 2.3 Curriculum Management

**Routes**:

- `/curriculums` (List)
- `/curriculums/new`, `/curriculums/:id/edit` (Builder)

#### Description

Defines the _blueprint_ for training. A curriculum is a reusable template containing a sequence of modules, grading criteria, and regulatory associations.

#### 1. Curriculum Metadata (Fields)

- **Code**: Unique identifier (e.g., "A320-REC-2024").
- **Name**: Human-readable title.
- **Type**: Training category (Initial, Recurrent, Refresher, Conversion, Differences).
- **Description**: Optional details about the curriculum scope.
- **Regulatory Tags**: Links to specific standards (e.g., EASA-LVO).

#### 2. Module Configuration

Each curriculum consists of an ordered list of modules.

- **Fields**:
  - **Name**: Module title.
  - **Duration**: Estimated time in hours (`durationHours`).
  - **Delivery Method**: Classroom, E-Learning, Practical, Simulator, or Self Study.
  - **Required Assessors**: Number of assessors required (for checks/exams).

- **Assessment Strategies**:
  1.  **No Assessment (Lecture/Study)**:
      - Pure instruction (hours only).
      - No grading required.
      - _Use case_: Ground school theory modules.
  2.  **Integrated Grading**:
      - Grading occurs _during_ the training session.
      - Can include Theory (Pass score %), Practical (Pass score %), or both.
      - _Use case_: Shorter modules where instruction and assessment happen together.
  3.  **Dedicated Assessment**:
      - Adds a specific "Check" or "Exam" session type.
      - Separates the learning phase from the testing phase.
      - _Use case_: Final exams or simulator checks.

#### Capabilities & Features

- **Validation Rules**:
  - **Mandatory Standard**: Must be linked to at least one regulatory standard.
  - **Assessment Gate**: The system enforces that the curriculum _as a whole_ results in a grade. Therefore, **at least one module** must effectively have an assessment (Strategy 2 or 3). It cannot consist entirely of "No Assessment" modules.

#### Data Flow

- **State**: The builder uses local React state (`useState`) for the draft curriculum before saving.
- **API**:
  - `POST /curriculums`: Sends the full tree (metadata + modules + sequence).
  - `GET /curriculums/:id`: Fetches the blueprint for editing or campaign creation.

---

### 2.4 Training Campaigns

**Routes**: `/campaigns`, `/campaigns/:id`

#### Description

Manages the _execution_ of a Curriculum for a specific group of employees over a specific time range. It tracks who is enrolled, their progress, and validities.

#### Capabilities & Features

1.  **Advanced Enrollment**:
    - **Batch Selection**: Filter employees by department or search term to enroll multiple users at once.
    - **Eligibility Check**: Prevents duplicate enrollments.
    - **Dynamic Status**: Tracks status as `active`, `paused`, or `completed`.

2.  **Smart Scheduling System**:
    - **Auto-Scheduler (Batch)**:
      - _Inputs_: Date range, Preferred days (e.g., Mon/Wed/Fri), Preferred time (e.g., 09:00), Instructor, and Location.
      - _Logic_: Automatically generates a sequence of sessions for all curriculum modules, respecting duration and instructor availability.
      - _Overrides_: specific instructors can be assigned to specific modules during generation.
    - **Manual Scheduling (Ad-hoc)**:
      - _Targeted_: Schedules a single session for a specific module.
      - _Smart Selection_: Automatically pre-selects trainees who have **not yet completed** the chosen module.
      - _Visual Aid_: Shows "Scheduled Hours vs. Required Hours" per module to guide planning.

3.  **Progress & Retakes**:
    - **Individual Trainee Tracking**: Drill down into a specific trainee to see status per module (Attendance, Theory Score, Practical Score).
    - **Retake Logic**:
      - Identifies trainees with failed modules.
      - **Wizard**: "Schedule Retake" action creates a dedicated session (type: `combined`) linked to the original failed attempt.
    - **Overall Metrics**: Real-time calculation of Campaign Progress % based on total completed modules vs. total required.

4.  **Certification**:
    - **Eligibility Engine**: Automatically flags trainees who have passed **ALL** modules (`allModulesPassed: true`).
    - **Batch Generation**: Generates PDF certificates for all eligible trainees in one click.
    - **Distribution**: Options to download or email (roadmap) certificates.

#### Data Flow

- **Fetching Strategy**:
  - `GET /campaigns/:id`: Core metadata and stats.
  - `GET /sessions?campaignId=...`: Paginated list of sessions (Client-side pagination for responsiveness).
  - `GET /campaigns/:id/modules`: Aggregated stats per module (completion rates).
  - `GET /campaigns/:id/trainees/:uid/modules`: Detailed history for a specific student.
- **Key Actions**:
  - `POST /campaigns/:id/generate-schedule`: Triggers the complex backend scheduling engine.
  - `POST /campaigns/:id/schedule-module`: Manual session creation.
  - `POST /campaigns/:id/sessions/retake`: Specialized retake session creation.
  - `POST /reports/campaigns/:id/certificate`: Triggers the PDF generation worker.

---

### 2.5 Sessions & Grading

**Routes**: `/sessions`, `/sessions/:id`

#### Description

The operational interface for Instructors to manage attendance, grading, and session finalization. It bridges the gap between planned schedules and recorded history.

#### Capabilities & Features

1.  **Attendance Tracking**:
    - Granular status tracking per trainee: `Planned`, `Present`, `Late`, `Absent`, `Excused`.
    - **Validation**: Prevents grading for absent trainees.

2.  **Instructional Grading**:
    - **Dual-Score Support**: Independent input for _Theory_ (0-100%) and _Practical_ (0-100%) scores.
    - **Auto-Calculation**: System automatically determines `Pass`/`Fail` based on the Programme/Curriculum thresholds (e.g., 75%).
    - **Remedial Actions**: If a trainee fails, allows the instructor to log specific "Remedial Notes" directly on the result record.

3.  **Instructor Sign-off**:
    - **Purpose**: Validates the _delivery_ of training and accuracy of attendance.
    - **Input Methods**: Supports both **Drawing** (via signature pad) and **Typed** (name entry with confirmation checkbox).
    - **Tamper-Proofing**: Once signed (`isSigned: true`), the session and its results are locked and cannot be edited.

4.  **Process Workflows**:
    - **Start/End**: Buttons to transition session state (`Planned` -> `In Progress` -> `Completed`).
    - **Batch Operations**: `RecordResultsModal` allows rapid entry of grades for all participants in a grid view.
    - **Retakes**: "Schedule Retake" button on failed participants creates a linked remedial session.

5.  **Output & Reporting**:
    - **Attendance Sheets**: Auto-generated PDF for physical signatures (if required/preferred).
    - **Session Results**: Digital record of grades.
    - _(Note: Formal Certificates are typically generated at the **Campaign** level upon curriculum completion, though session-level generation is available for standalone modules)_.

#### Data Flow

- **Fetching**:
  - `GET /sessions/:id`: Session details and metadata.
  - `GET /sessions/:id/participants`: List of trainees with current results.
- **Actions**:
  - `PATCH /sessions/:id/start` / `end`: State transitions.
  - `POST /sessions/:id/results`: Bulk submission of grades.
  - `POST /sessions/:id/sign`: Submits digital signature (base64 image or text).
  - `POST /sessions/:id/attendance-sheet`: Generates PDF.

---

### 2.6 Proficiency Checks

**Routes**: `/checks`, `/checks/:id`

#### Description

Manages regulatory proficiency checks (OPC/LPC) and assessments. Unlike training sessions, these are strict Pass/Fail evaluations against specific regulatory standards, resulting in the issuance of a **Competence** (License/Rating).

#### Capabilities & Features

1.  **Eligibility & Scheduling**:
    - **Smart Eligibility**: Automatically flags trainees with expiring competences or those who have completed initial training (`EligibleTraineesTable`).
    - **Flexible Scheduling**: Supports **Single Candidate** or **Group Checks**.

2.  **Assessment Workflow (`CheckDetailPage`)**:
    - **Gatekeeping**: Prevents starting the check before the scheduled date (`canStartCheck`).
    - **Evaluation**: Assessors grade specific **Required Elements** defined in the Proficiency Profile.
      - _Elements_: Pass/Fail per item.
      - _Outcome_: Algorithmic determination of overall Pass/Fail based on elements.

3.  **Strict Sign-off & Finalization**:
    - **Assessor Signature**: Digital signature (Draw) with strict acknowledgments ("Accurate", "Fair", "Matches Result").
    - **Finalization**: Requires **Password Re-entry** to lock the record and issue the competence. This is a higher security level than training sessions.

4.  **Regulatory Output**:
    - **Protocols**: Generates the official "Proficiency Check Protocol" PDF, signed by the Assessor.
    - **Competence Issuance**: A passed and finalized check automatically updates the trainee's Competence record (validity, expiry).

#### Data Flow

- **Fetching**:
  - `GET /checks`: List with filters (Status, Assessor, Candidate).
  - `GET /checks/:id`: Full check details, candidates, and evaluation status.
- **Actions**:
  - `POST /checks/:id/start`: Opens the check for evaluation.
  - `POST /checks/:id/evaluate`: Submit grades for a candidate.
  - `POST /checks/:id/sign`: Submit Assessor's digital signature.
  - `PATCH /checks/:id/finalise`: **(Protected)** Finalizes check using Password auth.
  - `GET /checks/:id/protocol`: Generates the official PDF.

---

### 2.7 Standards & Compliance

**Routes**: `/standards`, `/standards/:id`

#### Description

The backbone of the regulatory framework. Standards define the _requirements_ that Curriculums and Proficiency Checks must satisfy. They act as the "single source of truth" for validity periods, pass marks, and assessment criteria.

#### Capabilities & Features

1.  **Standard Definition**:
    - **Core Metadata**: Code (e.g., "EASA-OPS-01"), Name, Description, and Validity Period (months).
    - **Assessment Rules**: Configurable thresholds for _Theory_ and _Practical_ exams (e.g., 75% pass mark).
    - **Allowed Methods**: Restricts how the standard can be delivered (e.g., "Written", "Oral", "Computer-based").

2.  **Material Management (`StandardDetailPage` -> Materials Tab)**:
    - **Centralized Repository**: Upload training materials (PDF, Video, Procedures) linked directly to the standard.
    - **Versioning**: Tracks material versions (v1, v2) to ensure trainees valid documents.
    - **Approval Workflow**: `Draft` -> `Approved` -> `Archived` lifecycle for quality control.

3.  **Proficiency Check Configuration (`CheckConfigurationEditor`)**:
    - **Item Bank**: Defines the specific line-items assessors must evaluate during a check (e.g., "Device Setup", "Emergency Procedures").
    - **Categorization**: Items grouped by `Theory`, `Practical`, or `General`.
    - **Mandatory Items**: Flag critical items that _must_ be passed for a renewal.
    - **Grading Logic**: Supports both `Pass/Fail` and `Scored (0-100)` item types.

4.  **Revision History**:
    - Full audit trail of changes to the standard definition, ensuring regulatory traceability.

#### Data Flow

- **Fetching**:
  - `GET /standards`: List with status filters.
  - `GET /standards/:id`: Full definition.
  - `GET /standards/:id/materials`: Versioned list of files.
  - `GET /standards/:id/check-definition`: JSON structure of check items.
- **Actions**:
  - `POST /standards`: Create new standard.
  - `POST /materials/:id/approve` / `archive`: Manage material lifecycle.
  - `PATCH /standards/:id/check-definition`: Update the assessment item bank.

---

### 2.8 Personnel Management

**Routes**: `/personnel`, `/personnel/:id/history`

#### Description

Centralized directory for managing the organization's workforce, including Instructors, Auditors, and Trainees.

#### Capabilities & Features

1.  **Employee Lifecycle**:
    - **Onboarding**: Create profiles with Role assignment (Admin, Instructor, Employee, etc.).
    - **Account Management**: Toggle Active/Inactive status. Inactive employees are preserved for historical compliance but removed from active selection.
    - **Dossier View**: (`/personnel/:id/history`) A unified timeline of every training session, proficiency check, and qualification obtained by the individual.

2.  **Auditor Management**:
    - **Invitation System**: Securely invite external or internal auditors with read-only access to specific compliance data.

#### Data Flow

- **Fetching**: `GET /employees` (with status filters).
- **Actions**: `POST /auth/register` (new accounts), `PATCH /employees/:id` (status updates).

---

### 2.9 Competence & Licensing

**Routes**: `/competence`

#### Description

A real-time "Traffic Light" dashboard for tracking license validity across the entire organization.

#### Capabilities & Features

1.  **Status Tracking**:
    - **Green (Valid)**: Compliant.
    - **Amber (Expiring Soon)**: Configurable window (e.g., 90 days) to trigger renewal planning.
    - **Red (Expired)**: Non-compliant; immediate action required.
2.  **Smart Filtering**:
    - **Expiry Slider**: Interactive slider to look ahead (e.g., "Show me everything expiring in the next 6 months").
    - **Department/User Filters**: Drill down to specific teams or individuals.

3.  **Protocol Viewer**:
    - Direct access from the dashboard to the signed **Proficiency Check Protocols** that underscore the competence.

---

### 2.10 Reporting

**Routes**: `/reports/expiring`

#### Description

Tools for compliance officers to extract data for external audits or internal analysis.

#### Capabilities & Features

1.  **Expiring Competences Report**:
    - **Scope**: Generates a list of all competences expiring within a custom timeframe (up to 2 years).
    - **Format**: Optimized for Print (CSS print media queries) and CSV Export.
    - **Data Points**: Employee Name, Competence Code, Date Completed, Expiry Date, Days Remaining.

2.  **Monthly Compliance Report** _(Backend Process)_:
    - Automated PDF generation summarizing the organization's health, sent via email (as referenced in system tasks).

---

## 3. Security & Compliance

### 3.1 Audit Logs

**Routes**: `/audit-logs`

#### Service

A comprehensive, immutable record of all system activity, crucial for regulatory compliance (EASA) and security monitoring.

- **Automatic Capture**:
  - **Middleware**: Intercepts every HTTP request (GET, POST, PUT, DELETE) to automatically log the actor, action, and resource.
  - **Context Awareness**: Captures `User ID`, `Role`, `Organization ID`, `IP Address`, and `User Agent`.
- **Data Granularity**:
  - **Action Mapping**: HTTP methods are mapped to semantic actions (e.g., `POST` -> `CREATE`).
  - **Payload Logging**: Captures request bodies (sanitized of sensitive data like passwords) to show exactly _what_ changed.
  - **Diff Tracking**: For critical updates, logs "Before" and "After" states to trace specific field modifications.
- **Security**:
  - **Tamper-Evidence**: Logs are stored in a strict append-only table.
  - **Organization Isolation**: Users can only view logs pertaining to their own organization.

### 3.2 Role-Based Access Control (RBAC)

- **Context**: `src/context/AuthContext.tsx`
- **Implementation**:
  - **Route Protection**: `ProtectedRoute` wrapper checks `user.role` against `allowedRoles`.
  - **UI Gating**: Components conditionally render (e.g., "Create Button" only visible to `training_manager`+).
  - **Backend Enforcement**: API Middleware verifies scopes/claims.

### 3.3 Authentication

- **Mechanism**: JWT (JSON Web Token) based stateless auth.
- **Session**: Persisted in `localStorage`; Auto-redirect on 401 Expiry.

### 3.4 User Roles & Capabilities

The system implements a strict Role-Based Access Control (RBAC) model with a defined hierarchy. Permissions are enforced at both the API level (middleware) and UI level (component gating).

#### Role Hierarchy

The backend enforces a numeric hierarchy [level] where higher levels inherit base access, though specific functional permissions are role-dependent.

1.  **Super Admin** `(1000)`: Platform-wide access across all organizations.
2.  **Admin** `(100)`: Full administrative control within a single organization.
3.  **Auditor** `(90)`: Read-only access to all organizational records for compliance verification.
4.  **Training Manager** `(80)`: Manages training programs, scheduling, and strategic planning.
5.  **Instructor / Assessor** `(60)`: Conducts training and signs off on proficiency checks.
6.  **Employee** `(40)`: Standard user, access to own records and assigned training.

#### Detailed Capabilities

- **Super Admin**
  - **Scope**: Global (All Orgs)
  - **Capabilities**:
    - Manage Tenant Organizations (Create/Suspend)
    - Impersonate any organization context
    - Full system configuration

- **Admin**
  - **Scope**: Organization
  - **Capabilities**:
    - **User Management**: Onboard/Offboard employees, assign roles.
    - **Configuration**: Manage Standards, Privileges, and Settings.
    - **Override**: Can delete records and correct errors.

- **Training Manager**
  - **Scope**: Organization
  - **Capabilities**:
    - **Planning**: Create Curriculums and Campaigns.
    - **Scheduling**: Bulk schedule sessions.
    - **Reporting**: Access comprehensive training reports.
    - _Restriction_: Cannot manage system settings or Organization details.

- **Instructor**
  - **Scope**: Assigned Sessions
  - **Capabilities**:
    - **Delivery**: Conduct training sessions.
    - **Grading**: Grade Theory/Practical elements.
    - **Sign-off**: Digital signature for session completion.
    - _Restriction_: Cannot change Curriculums or delete historic records.

- **Assessor**
  - **Scope**: Assigned Checks
  - **Capabilities**:
    - **Evaluation**: Conduct Proficiency Checks (LPC/OPC).
    - **Grading**: Pass/Fail assessment items.
    - **Licensing**: Revalidate competences upon successful check.
    - _Restriction_: Higher MFA requirements (roadmap).

- **Auditor**
  - **Scope**: Organization (Read-Only)
  - **Capabilities**:
    - **Traceability**: View detailed Audit Logs.
    - **Inspection**: View all Personnel, Training, and Check records.
    - **Protocols**: Verify signed PDF protocols.
    - _Restriction_: **Strictly Read-Only**. Middleware blocks all POST/PUT/DELETE methods.

- **Employee**
  - **Scope**: Self
  - **Capabilities**:
    - **Profile**: View own dossier and expiry dates.
    - **Schedule**: View upcoming assigned training.
    - **History**: Download own certificates and protocols.
    - _Restriction_: No access to other users' data.

#### Special Controls

- **Auditor Mode**: When logged in as an Auditor, the UI displays a persistent "Auditor Mode: Read-Only Access" banner. All write-actions (buttons, forms) are hidden or disabled.
- **MFA Enforcement**: Roles with critical safety impact (Admin, Instructor, Assessor) are flagged for Multi-Factor Authentication enforcement.

### 3.5 Scheduler & Automation

**Infrastructure**: `pg-boss` (PostgreSQL-based Job Queue)

#### Description

A robust background job system that handles time-sensitive tasks independently of user interaction.

#### Capabilities & Features

1.  **Organization-Specific Scheduling**:
    - **Configurable Jobs**: Each organization has its own `org_job_configs` allowing custom schedules (Cron expressions) and timezones.
    - **Dispatcher**: A minute-by-minute system process checks for due jobs and pushes them to the execution queue.

2.  **Key Automated Processes**:
    - **Monthly Compliance Reports**: Automatically aggregates data on the 1st of each month and generates PDF summaries for management.
    - **Expiry Notifications**: Scans for expiring competences/medicals and queues email alerts.
    - **Maintenance**: Routine cleanup of temporary files and session tokens.

3.  **Reliability**:
    - **Retries**: Jobs automatically retry with exponential backoff upon failure.
    - **Dead Letter Queue**: Failed jobs are logged for developer investigation without crashing the system.

---

## 4. Technical Stack & Utilities

### 4.1 Frontend Architecture

- **Framework**: React 18 + Vite.
- **Language**: TypeScript.
- **UI Library**: **Shadcn UI** (Radix Primitives + Tailwind CSS).
- **State Management**:
  - **Server State**: React Query (TanStack Query) for caching, optimistic updates, and background refetching.
  - **Global State**: Minimal `Context` usage (Auth, Theme).

### 4.2 Internationalization (i18n)

- **Library**: `react-i18next`.
- **Storage**: JSON locale files (`en.json`, `bg.json`) in `src/locales`.
- **Usage**: `useTranslation()` hook for all UI text.

### 4.3 API Layer (`src/lib/api.ts`)

- **Service Objects**: Grouped methods (e.g., `sessions.start()`, `users.get()`) acting as a typed SDK.
- **Interceptors**: Centralized error handling and token injection.
