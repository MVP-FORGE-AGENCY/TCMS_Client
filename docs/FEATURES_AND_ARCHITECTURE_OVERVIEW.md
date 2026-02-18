# Features & Architecture (CertifyCloud)

## 1. Architecture Overview

### 1.1 Frontend (Client)

- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI (Radix Primitives)
- **State Management**:
  - **Global**: React Context (`AuthContext`, `BreadcrumbContext`)
  - **Server State**: Hybrid approach. Older components use `useEffect` + local state. Newer components uses `@tanstack/react-query`.
- **Routing**: `react-router-dom` (v7)
- **HTTP Client**: Axios wrapper with interceptors.
- **Internationalization**: `react-i18next` (English/Bulgarian).

### 1.2 Backend (API)

- **Runtime**: Node.js v20+ (Express.js)
- **Language**: JavaScript (ES6+ CommonJS)
- **Database**: Supabase (PostgreSQL 15+)
  - **Auth**: Supabase Auth (JWT) linked to public `users` table via Triggers.
  - **Logic**: Heavy use of SQL Triggers and RLS (Row Level Security) for data integrity and access control.
- **Architecture Pattern**: Controller-Service-Repository (Lightweight)
- **Background Jobs**: `pg-boss` (Postgres-based message queue) for reliable scheduling.
- **Document Generation**: `pdfkit` (Server-side PDF generation) for Certificates/Reports.
- **Hosting**: Dockerized Node.js process.

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

#### Data Flow & Backend Context

- **Controllers**:
  - `CompetenceController` (`controllers/competence.js`): Serves the critical "Traffic Light" status.
  - `SessionsController` (`controllers/sessions.js`): Provides time-series data for trends.
  - `CampaignsController` (`controllers/campaigns.js`): Active training programs.
  - `UsersController` (`controllers/users.js`): Personnel counts.

- **Endpoints & Logic**:
  - `GET /competence/summary`: **High-Performance RPC**. Instead of querying the huge `user_competences` table directly, it calls a Postgres function `get_competence_summary` to pre-calculate valid/expired/expiring counts by department.
  - `GET /employees`: Fetches raw personnel list; **Client-side Aggregation** is used to group by 'Role' for the "Personnel Distribution" chart.
  - `GET /sessions`: Fetches sessions within a date range (e.g., `?from=2023-01-01`). The frontend aggregates these by month/status to build the "Training Trend" chart.
  - `GET /reports/expiring`: Uses `org_settings.compliance_expiring_days` (default 90) to determine which items appear in the "My Actions" alert list.
  - `GET /campaigns`: Filters by `status=active` to show ongoing training programs.

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

#### Data Flow & Backend Context

- **Controllers**:
  - `UsersController` (`controllers/users.js`): Standard CRUD.
  - `AuthController` (`controllers/auth.js`): Handles the complex registration flow.
  - `AuditorController` (`controllers/auditor.js`): Specialized invitation logic.

- **Key Logic**:
  - **Dual Creation**: Creating an employee involves a Two-Phase Commit transaction (logical):
    1.  **Identity**: Create Supabase Auth user (generates `auth_id`).
    2.  **Profile**: Create public `users` record linked by `auth_id`.
    3.  _Rollback_: If step 2 fails, step 1 is reversed to prevent orphan accounts.
  - **Auditor Workflow**:
    - `POST /employees/invite-auditor` triggers a unique flow.
    - Generates a **random password** (if configured) or sends a Magic Link.
    - Sets `account_type='external'` and enforces strictly Read-Only permissions via Middleware (`enforceReadOnly`).
    - Audit Log records specific `AUDITOR_INVITED` event with expiry date.
  - **RBAC Filtering**:
    - `GET /employees`: Automatically applies RLS-like filtering at the controller level:
      - **Super Admin**: Can see all or filter by `organisationId`.
      - **Admin/Manager**: Forced to `current_user.organisation_id`.
      - **Employee**: Forced to `id = current_user.id` (Self-view only).

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

#### Data Flow & Backend Context

- **Controller**: `CurriculumsController` (`controllers/curriculums.js`).
- **Versioning Engine**:
  - The backend implements strict **Semantic Versioning** logic:
    - **Minor (x.1)**: Triggered by metadata changes (Name, Description, Tags).
    - **Major (1.x)**: Triggered by structural changes that affect validity (Validity Months, Type) or **ANY Module change**.
  - **Snapshots**: Every update creates a record in `curriculum_revisions`, storing a full JSON dump (`full_snapshot`) of the curriculum state at that moment, ensuring historical integrity for audit trails.
- **Module Management**:
  - `PUT /curriculums/:id/modules` performs a **Smart Diff**:
    - _Identifies_ deleted modules (present in DB but missing in payload).
    - _Updates_ existing modules in-place (upsert).
    - _Inserts_ new modules.
    - **Re-sequences** based on the array order.
- **Validation**:
  - Enforces uniqueness of `code` within an organization.
  - Prevents deletion if linked to active Campaigns or Sessions (`integrity_constraint_violation`).

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

#### Data Flow & Backend Context

- **Controller**: `CampaignsController` (`controllers/campaigns.js`).
- **Auto-Scheduler Algorithm** (`generateSchedule`):
  - **Inputs**: Constraints (Instructor, Location, Preferred Days/Time, Date Range).
  - **Logic**:
    1.  **Grouping**: Splits trainees into chunks based on `max_per_session`.
    2.  **Sequencing**: Iterates through curriculum modules in order.
    3.  **Allocation**: allocators slots on `preferredDays`, tracking daily limits (8h max).
    4.  **Generation**: Creates `training_sessions` entries with `status='planned'`.
- **Manual Scheduling**:
  - **Hybrid Approach**: Users can auto-schedule first, then manually adjust via `PATCH /sessions/:id`, or add specific module sessions via `POST /campaigns/:id/schedule-module` (e.g., for stragglers or specialized groups).
- **Progress Tracking**:
  - **Real-Time Aggregation**: `getCampaign` and `getCampaignModules` calculate progress _on-the-fly_ by querying `session_results` (attendance) and `module_results` (grades). It does not rely on stale counters.
- **Failures & Retakes**:
  - **RetakeService**: Identifies candidates via `module_results` and allows scheduling ad-hoc `retake` sessions.
  - **RemedialService**: Manages formal Remedial Plans (`remedial_plans`) linked to failed Proficiency Checks.
- **Fetching Strategy**:
  - `GET /campaigns/:id`: Core metadata and stats.
  - `GET /sessions?campaignId=...`: Paginated list of sessions (Client-side pagination for responsiveness).
  - `GET /campaigns/:id/modules`: Aggregated stats per module (completion rates).
  - `GET /campaigns/:id/trainees/:uid/modules`: Detailed history for a specific student.
- **Key Actions**:
  - `POST /campaigns/:id/generate-schedule`: Triggers the complex backend scheduling engine.
  - `POST /campaigns/:id/schedule-module`: Manual session creation.
  - `POST /campaigns/:id/sessions/retake`: Specialized retake session creation.
  - `POST /reports/campaigns/:id/certificate`: Triggers the certificate generation.

#### Technical Deep Dive: Training Certificates (On-Demand Strategy)

Unlike Regulatory Protocols (which are immutable PDFs), **Training Certificates** for campaigns are generated **on-demand** to save storage and allow for template updates.

1.  **Trigger**: User clicks "Download Certificate" on a completed campaign.
2.  **Storage**: The system does **NOT** store the generated PDF. Instead, it stores a lightweight **Certificate Record** (`training_certificates` table) containing:
    - `certificate_number`: Unique identifier (e.g., `CAM-A320-2024-001`).
    - `metadata`: JSON blob snapshot of the trainee's name, completed modules, instructor names, and completion dates.
    - `issue_date` & `expiry_date`.
3.  **Generation**:
    - `CertificateService.js` fetches the record and its metadata.
    - It uses `pdfkit` to render the PDF _in-memory_ using the current styling template.
    - This allows certificates to always look "fresh" while preserving the historical _data_ (dates/names) exactly as they were at issuance.

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
    - **Conflict Detection**:
      - **Blocking**: Prevents scheduling if the candidate has another check at the same time.
      - **Warning**: Alerts on Assessor availability or overlap for the same standard.
    - **Unified Workflow**: Creates individual check records for each candidate to simplify tracking, even when scheduled in bulk.

2.  **Assessment Workflow (`CheckDetailPage`)**:
    - **Gatekeeping**: Prevents starting the check before the scheduled date (`canStartCheck`).
    - **Evaluation**: Assessors grade specific **Required Elements** defined in the Proficiency Profile.
      - _Elements_: Pass/Fail per item.
      - _Outcome_: Algorithmic determination of overall Pass/Fail based on elements.

3.  **Strict Sign-off & Auto-Finalization**:
    - **Assessor Signature**: Digital signature (Draw) involves **Password Re-entry** as the critical identity verification step.
    - **Auto-Finalization**: Once the required number of assessors have signed, the system **automatically** locks the record, calculates the outcome, and issues the competence. No separate manual "Finalize" step is needed.

4.  **Regulatory Output**:
    - **Protocols**: Generates the official "Proficiency Check Protocol" PDF, signed by the Assessor.
    - **Competence Issuance**: A passed checks automatically updates the trainee's Competence record (validity, expiry).

#### Data Flow & Backend Context

- **Controller**: `ChecksController` (`controllers/checks.js`).
- **Service**: `ProficiencyCheckService.js`.
- **Key Logic**:
  - **Creation**: Logic handles iterating through candidates to create distinct check records.
  - **Assignment**: Enforces **Conflict of Interest** checks (Assessor cannot have instructed the trainee on the same standard in the last 12 months).
  - **Auto-Finalization**: The last required signature (`signProtocol`) triggers the `finalizeCheck` routine, which verifies signatures, locks the record, and updates `user_competences`.
  - **Digital Seal**: Usage of cryptographic hashes for Protocol generation.
- **API Routes**:
  - **Fetching**:
    - `GET /checks`: List with filters (Status, Assessor, Candidate).
    - `GET /checks/:id`: Full check details, candidates, and evaluation status.
  - **Actions**:
  - **Actions**:
    - `POST /checks`: Schedule new checks (bulk creation supported).
    - `GET /checks/conflicts`: Pre-flight check for scheduling conflicts.
    - `POST /checks/:id/start`: Opens the check for evaluation.
    - `POST /checks/:id/evaluate`: Submit grades.
    - `POST /checks/:id/sign`: Submit Assessor's digital signature (Trigger for Auto-Finalization).
    - `POST /checks/:id/sign`: Submit Assessor's digital signature (Trigger for Auto-Finalization).
    - `GET /checks/:id/protocol`: Generates the official PDF with embedded verification hash.

#### Protocol Generation & Storage (Deep Dive)

**Trigger**: Users click "Generate Protocol" or "Download" on a finalized check.

**Data Flow**:

1.  **Request**: Frontend (`CheckDetailPage`) requests `GET /checks/:id/protocol` (optionally with `?candidateId=...` for group checks).
2.  **Controller Logic** (`checks.js`):
    - **Fetch**: Retrieves Check details, Candidates, Standards, and **Signatures** (from `check_signatures` table).
    - **Path Construction**:
      - Generates a structured storage path: `protocols/<Organisation_Name>/<Candidate_Name>/<Standard_Code>/Protocol_<Number>.pdf`.
      - **Sanitization**: All path segments are sanitized to remove special characters.
    - **Optimization (Smart Cache)**:
      - Before generating, the system checks Supabase Storage for an existing file at the constructed path.
      - **Hit**: If found, it immediately generates a Signed URL for the existing file (0ms generation time).
      - **Miss**: If missing, it triggers the PDF generation engine.
3.  **PDF Generation** (`pdfGenerator.js`):
    - Uses `pdfkit` to render the document in memory.
    - **Digital Seal**: Embeds a unique `dataHash` and verification URL (`certifycloud.com/verify?id=...`).
    - **Signatures**: Fetches the base64 signature image from the secure `check_signatures` table (protected by RLS) and embeds it into the PDF.
    - **Upload**: Streams the generated buffer directly to Supabase Storage at the structured path.
4.  **Delivery**: Returns a temporary Signed URL (valid for 1 hour) to the client for immediate download.

**Storage Structure**:

- Bucket: `certificates`
- Path: `protocols / :orgName / :candidateName / :standardCode / :filename`
- **Benefit**: This structure allows admins to browse/audit protocols via the Storage file browser organized by hierarchy.

**Security**:

- **Immutability**: Once generated and stored, the PDF serves as the permanent record. Re-downloading fetches the _same_ file, ensuring the Digital Seal and timestamps remain consistent.
- **RLS**: The `check_signatures` table is protected so that only authorized users (Same Org) can view the raw signature data needed for generation.

#### Protocol Verification (The "Digital Seal")

To ensure **EASA Compliance** and prevent tampering, protocols employ a cryptographic verification mechanism.

1.  **Sealing Process (Finalization)**:
    - When a check is finalized, `ProficiencyCheckService` creates a **canonical snapshot** of the result (Protocol Number + Timestamp + Sorted Metadata).
    - A **SHA-256 Hash** is generated from this string: `hash = SHA256(ref + time + metadata)`.
    - This hash is stored permanently in the `competence_protocols` table (`data_hash`).

2.  **Verification (Public)**:
    - The generated PDF includes a **QR Code** pointing to `https://certifycloud.com/verify?id=...&hash=...`.
    - Scanning this code hits the public `VerificationController`:
      - **Authenticity**: Checks if the Protocol exists.
      - **Integrity**: Compares the URL hash against the database hash. Any tampering with the PDF changes the content but breaks the hash link.
      - **validity**: Checks the _current_ real-time status of the competence. If a pilot is suspended _after_ the check, the verification page will show **REVOKED**, even if the paper protocol says "PASS".

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

#### Data Flow & Backend Context

- **Controller**: `StandardsController` (`controllers/standards.js`) & `MaterialsController` (`controllers/materials.js`).
- **Immutable Revision History**:
  - **Logic**: Any update triggers a "Copy-on-Write" mechanism.
    - **Minor Edit** (e.g., Typo): Revision `1.0` -> `1.1`.
    - **Major Edit** (e.g., Validity change): Revision `1.0` -> `2.0`.
  - **Archiving**: The old record is marked `is_latest_revision=false` but remains linked to historical sessions.
  - **Material Carry-over**: Major revisions automatically copy all _Approved_ materials to the new version.
- **Check Configuration**:
  - **Storage**: The Item Bank is stored as a structured JSON object (`check_definition` column) within the Standard record, allowing flexible schema evolution without DB migrations.
- **Materials**:
  - **Versioning**: Each upload increments the version number.
  - **Approval**: Approving a material automatically archives the _previous_ approved version of that type, ensuring only one "Current" document exists per type.
  - **Security**: Files are stored in Supabase Storage with private buckets; access is via short-lived Signed URLs.
- **API Routes**:
  - `GET /standards`: List active latest versions.
  - `POST /standards`: Create new standard (Rev 1.0).
  - `PATCH /standards/:id`: Update (Creates new revision).
  - `POST /standards/:id/materials`: Get signed upload URL.
  - `POST /materials/:id/approve`: Publish a document.

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

#### Data Flow & Backend Context

- **Controllers**: `UsersController` (`controllers/users.js`) & `AuthController` (`controllers/auth.js`).
- **Onboarding Logic**:
  - **Registration**: Dual-step process creating both a **Supabase Auth User** (for login) and a **Public User Record** (for relational data).
  - **Employee Creation**: Admins can create "Placeholder" employee records (`POST /employees`) for rostering before the actual user registers/claims the account.
- **Dossier & History**:
  - **Aggregation**: `getEmployeeHistory` aggregates data from 5 different sources:
    - **Competences**: Current validities.
    - **Training**: Merged history from `session_results` and `training_attempts`.
    - **Checks**: All historic proficiency checks with assessor details.
    - **Documents**: Signed protocols and certificates.
    - **Absences**: Impact on recency.
- **Security**:
  - **Inactive Status**: Setting `is_active=false` immediately blocks login (checked in `auth.login`) and hides the user from schedulers, but preserves historical data for compliance.
- **API Routes**:
  - `GET /employees`: List with filters (Active/Inactive, Role).
  - `POST /auth/register`: Create new account.
  - `GET /employees/:id/history`: Full compliance dossier.
  - `PATCH /employees/:id`: Update details or toggle `is_active`.

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

#### Data Flow & Backend Context

- **Core Service**: `CompetenceService.js`
  - **Single Source of Truth**: All competence state changes (Acquisition, Suspension, Reinstatement) flow through this service.
  - **Validity Logic**:
    - `valid_until = check_date + standard.validity_months` (default 24 months).
    - `next_check_date = valid_until - 1 month` (for planning).
  - **Status Calculation**: Dynamic property based on `valid_until`:
    - **Valid**: `daysRemaining > 90`
    - **Expiring Soon**: `0 <= daysRemaining <= 90` (Configurable via `org_settings`)
    - **Expired**: `daysRemaining < 0`
    - **Suspended**: Explicit override via `suspended_at` timestamp.

- **Reporting & Dashboards**:
  - **RPC Optimization**: Uses `get_competence_summary` (PostgreSQL function) to aggregate counts by status/dept in < 50ms, avoiding heavy application-side loop processing.
  - **Controller**: `CompetenceController` (`controllers/competence.js`) handles filtering and access control.

- **Automation & Alerts**:
  - **In-App Notifications**: `NotificationsController` (`controllers/notifications.js`) checks specifically for:
    - **Critical**: Expired items (Red).
    - **Warning**: Items expiring in < 30 days (Amber).
  - **Email Alerts**: Background Worker (`cron/worker.js`) runs `expiry_alerts` job:
    - Scans for items expiring in `90 days` (or configured threshold).
    - Sends batched email summaries to users/managers to prevent inbox spam.

- **Audit Trail**:
  - **Table**: `competence_events` (distinct from system `audit_logs`).
  - **Events Tracked**: `acquired`, `maintained`, `suspended`, `reinstated`, `expired`.
  - **Traceability**: Links every competence change to a specific `proficiency_check_id` or `manual_action_by_user`.

- **API Routes**:
  - `GET /competences`: Master list with advanced filtering (User, Standard, Status, ExpiryWindow).
  - `GET /competence/summary`: Aggregated stats for dashboards.
  - `GET /competence/:id/events`: Full history of a specific competence record.
  - `GET /competence/expiring`: Dedicated endpoint for "Compliance Risk" reports.

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
    - **Trigger**: Automated via `pg-boss` on the 1st of each month.
    - **Logic**:
      - **Compliance Score**: `(Total Active - (Expired + Grounded)) / Total Active * 100`
      - **Risk Level**:
        - **High**: Score < 90% OR > 5 critical expiries next month.
        - **Medium**: Score < 95%.
        - **Low**: Score ≥ 95%.
    - **Output**: PDF stored in Supabase Storage (`/reports`), link emailed to Training Managers.

---

## 3. Security & Compliance

### 3.1 Audit Logs

**Routes**: `/audit-logs`

#### Service & Backend Context

- **Middleware**: `middleware/audit.js`
  - **Auto-Capture**: Intercepts HTTP requests to log `Actor`, `Method`, `Path`, and `IP`.
  - **Body Logging**: Configurable to capture `req.body` and `res.body` (sanitized of sensitive fields like passwords/tokens).
  - **Entity Parsing**: Automatically extracts `resource_type` and `resource_id` from URL patterns (e.g., `/api/v1/users/:id`).

- **Domain Events**: `config/auditConstants.js` defines ~50 semantic actions (e.g., `COMPETENCE_GRANTED`, `CHECK_FINALISED`, `MFA_ENABLED`) used for high-value business logic logging via `createAuditEntry`.

- **Storage**: `audit_logs` table
  - **Immutable**: Row-level security restricts updates/deletes.
  - **Retention**: Designed for permanent retention (or compliant archival).
  - **Relationships**: Links to `users` (Actor) and `organisations` (Tenant) for easy filtering.

- **Differentiation**:
  - `audit_logs`: System-wide technical and security events (Login, API Access, Admin Overrides).
  - `competence_events`: Specialized business ledger for license history (Acquired, Suspended).

- **API Routes**:
  - `GET /audit-logs`: Admin/Auditor access only, with filtering by Actor, Entity, Date, and Action.

### 3.2 Authentication

- **Mechanism**: Hybrid (Supabase Auth + Local `users` table).
- **Flow**:
  1.  **Login**: `POST /auth/login` uses `supabase.auth.signInWithPassword`.
  2.  **Enrichment**: Backend bypasses RLS to fetch role/org details from `public.users`.
  3.  **Token**: Returns standard Supabase JWT (`access_token`) + Custom User Object.
- **Security Policies**:
  - **Password Expiry**: Enforced every 90 days for privileged roles (Admin, Instructor). Middleware blocks non-auth routes if expired.
  - **Inactive Account**: Users marked `is_active: false` in `public.users` are blocked even if they have Valid Supabase credentials.
  - **Impersonation**: Super Admins can inject `x-impersonate-organisation-id` header to switch contexts.
- **Complexity**:
  - **Change Password**: Verifies 'Old Password' against a local `password_hash` (bcrypt) before updating Supabase Auth, solving a limitation in the Supabase Admin API.

### 3.3 Role-Based Access Control (RBAC)

- **Backend Enforcement**: `middleware/auth.js`
  - `authenticate`: Verifies JWT and loads user context.
  - `authorize(['admin', 'instructor'])`: Checks `req.userDetails.role` against allowed list.
- **Frontend Gating**: `src/context/AuthContext.tsx`
  - **Route Protection**: `<ProtectedRoute allowedRoles={[...]}>`
  - **Feature Flags**: Setup via `useAuth()` hook to conditionally render UI elements (e.g., "Delete" buttons).
- **Special States**:
  - **Auditor Mode**: Read-Only enforcement via Middleware (blocks POST/PUT/DELETE) and UI Banner.

### 3.4 User Roles & Capabilities

- **Definition**: Roles are stored as string enums in `public.users` table (`role` column).
- **Hierarchy Constants**: While not strictly numeric in DB, the backend treats them hierarchically in `requireMinRole` middleware.

#### Role Breakdown

1.  **Super Admin** (`super_admin`)
    - **Backend**: Bypasses all RLS via Service Role; Can impersonate Org ID.
    - **Frontend**: Access to `/super-admin/*` routes (Tenants, System Config).

2.  **Admin** (`admin`)
    - **Scope**: Full CRUD within own Organisation.
    - **Key Abilities**: User Management (`POST /employees`), Org Settings, Critical Reversals (Delete Checks).
    - **Middleware**: Included in almost all `requireRole(...)` arrays.

3.  **Auditor** (`auditor`, `readonly`)
    - **Scope**: Read-Only access to all modules.
    - **Middleware Enforcement**:
      - explicit `requireRole('readonly', ...)` on GET routes.
      - BLOCKED on all POST/PUT/DELETE/PATCH via `enforceReadOnly` middleware (middleware/audit.js).
    - **UI**: Persistent "Auditor Mode" banner; Action buttons hidden.

4.  **Training Manager** (`training_manager`)
    - **Scope**: Operational Management.
    - **Key Abilities**:
      - Create Training/Checks (`POST /checks`, `POST /sessions`).
      - Sign-off on final results.
      - **Restriction**: Cannot manage Users or Org Settings.

5.  **Instructor / Assessor** (`instructor`, `assessor`)
    - **Scope**: Execution.
    - **Key Abilities**:
      - Conduct Sessions/Checks.
      - Digital Signatures (`POST /:id/sign`).
      - Grade Results.
      - **Restriction**: Can only see/edit _assigned_ sessions/checks (RLS + App Logic).

6.  **Employee** (`employee`)
    - **Scope**: Self-Service.
    - **Key Abilities**:
      - View Own Profile/History (`GET /me`).
      - Download Own Certificates.
      - **Restriction**: `requireMinRole('employee')` is the baseline; strict RLS prevents viewing others.

#### Special Controls

- **Auditor Mode**: When logged in as `auditor`, the UI displays a persistent "Auditor Mode: Read-Only Access" banner.
- **MFA Enforcement**: Roles with critical safety impact (Admin, Instructor, Assessor) are flagged for Multi-Factor Authentication enforcement (Roadmap Status: Partial Implementation in `middleware/auth.js`).

### 3.5 Scheduler & Automation

- **Infrastructure**: `pg-boss` (PostgreSQL-based Job Queue)
- **Components**:
  - **Dispatcher** (`cron/dispatcher.js`): Runs every minute. Checks `org_job_configs` for due Cron expressions and pushes jobs to the generic queue.
  - **Worker** (`cron/worker.js`): Consumes jobs with concurrency control. Maps `job_type` to specific handler functions.

#### Capabilities & Features

1.  **Organization-Specific Scheduling**:
    - **Configurable Jobs**: stored in `org_job_configs`. Each Org defines its own:
      - **Schedule**: Cron expression (e.g., `0 8 1 * *`)
      - **Timezone**: Respects local Org time.
      - **Payload**: Custom parameters (e.g., `days_notice: 60`).

2.  **Job Types**:
    - `monthly_report`: Aggregates compliance data (`ReportService`), generates PDF (`PDFService`), and emails signed links.
    - `expiry_alerts`: Scans active personnel for expiring competences based on configured thresholds.
    - `absence_scan`: Checks `last_active_at` dates to flag "Refresher" (>90 days) or "Initial" (>365 days) training needs.
    - `manager_digest`: Summarizes department activity (Sessions, grades).

3.  **Resilience & Monitoring**:
    - **Retries**: 3 attempts with exponential backoff (1m, 2m, 4m).
    - **Circuit Breaker**: Services auto-disable a job config after **3 consecutive failures** to protect the queue, logging a `job_config_audit` event.
    - **History**: Full execution logs in `job_run_logs` with JSON metrics (e.g., `emailsSent: 12`).

4.  **API Routes**:
    - `GET /admin/job-configs`: CRUD for schedules.
    - `POST /admin/job-configs/:id/run-now`: Immediate manual trigger for testing/adhoc needs.

---

### 3.6 Notifications System

- **Controller**: `controllers/notifications.js`
- **Architecture**: **Virtual Aggregation** (No persistent `notifications` table).
  - The `GET /notifications` endpoint queries multiple live tables (`user_competences`, `proficiency_checks`, `users`) in real-time to construct a unified alert list.
  - **Benefit**: Zero state de-sync; alerts always reflect the exact current state of the database.

#### Logic & Rules

1.  **Competence Alerts**:
    - **Expired** (Critical): Instant query for `status='expired'`.
    - **Expiring Soon**:
      - Query: `now()` to `now() + 30 days`.
      - **Critical**: < 7 days remaining.
      - **Warning**: 8-30 days remaining.

2.  **Operational Alerts**:
    - **Upcoming Checks**: Scans `proficiency_checks` for confirmed sessions in the next **14 days**.
    - **Password Expiry**:
      - Checks `password_changed_at` timestamp for non-employee roles.
      - **Critical**: Expired (>90 days).
      - **Warning**: < 10 days remaining.

3.  **Delivery**:
    - **In-App**: JSON response via `useNotifications()` hook.
    - **Email**: Separate implementation via `cron/worker.js` (see Section 3.5), allowing for batched summaries rather than instant spam.

---

## 4. Technical Stack & Utilities

### 4.1 Backend (`tcms-backend`)

- **Runtime**: Node.js v20.x
- **Framework**: Express.js v4.18
- **Database Interface**: `@supabase/supabase-js` + `pg` (PostgreSQL)
- **Job Queue**: `pg-boss` (Postgres-native background jobs, no Redis required)
- **Security**:
  - `helmet` (Headers)
  - `cors` (Cross-Origin)
  - `express-rate-limit` (DDOS protection)
  - `bcryptjs` (Legacy/Local password hashing)
- **Reporting**:
  - `pdfkit` (Vector-based PDF generation)
  - `handlebars` (Email templates)
- **Validation**: `joi`

### 4.2 Frontend (`tcms-frontend`)

- **Framework**: React 19 + Vite 6
- **Language**: TypeScript 5.7+
- **UI System**:
  - **Radix UI** (Headless primitives)
  - **Tailwind CSS 3.4** (Styling)
  - **Lucide React** (Icons)
  - **Recharts** (Analytics visualization)
- **State & Data**:
  - **Server State**: TanStack Query v5 (Caching, Auto-refetch)
  - **Forms**: React Hook Form + Zod (Schema validation)
- **Routing**: React Router v7
- **Testing**: Playwright (E2E)

### 4.3 Key Utilities

- **Internationalization (i18n)**:
  - Library: `i18next` / `react-i18next`
  - Storage: JSON locale files (`en.json`, `bg.json`) in `src/locales`
- **Signatures**: `react-signature-canvas` (Canvas-to-Image for digital sign-offs)
- **Date Handling**: `date-fns` for robust manipulation/formatting
- **API Layer**: Custom `axios` instance (`src/lib/api.ts`) with centralized interceptors for token injection and error handling.
