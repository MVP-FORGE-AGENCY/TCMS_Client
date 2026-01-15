export interface ErrorResponse {
    error: {
        code: string;
        message: string;
        details?: Record<string, any>;
    };
}

export type ProgrammeType = 'initial' | 'recurrent' | 'refresher' | 'continuation';

export interface Programme {
    id: string;
    code: string;
    name: string;
    type: ProgrammeType;
    standardId?: string | null;
    standard?: {
        id: string;
        code: string;
        name: string;
    } | null;
    validityMonths?: number | null;
    durationHours?: number;
    frequencyMonths?: number | null;
    departmentTag?: string | null;
    isActive: boolean;
    revision?: number;
}

export interface ProgrammeCreate {
    code: string;
    name: string;
    type: ProgrammeType;
    standardId: string;
    validityMonths?: number | null;
    durationHours?: number;
    frequencyMonths?: number | null;
    departmentTag?: string | null;
}

export interface ProgrammeUpdate {
    name?: string;
    validityMonths?: number | null;
    durationHours?: number;
    frequencyMonths?: number | null;
    departmentTag?: string | null;
    isActive?: boolean;
}

export type SessionType = 'theory' | 'practical' | 'combined';
export type SessionStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export interface Session {
    id: string;
    curriculumId?: string;
    curriculumModuleId?: string;
    programmeId?: string; // Legacy - deprecated
    dateStart: string;
    dateEnd?: string;
    location: string;
    instructorId: string;
    sessionType: SessionType;
    capacity?: number;
    status: SessionStatus;
    isSigned?: boolean;
    campaignId?: string;
    retakeOf?: string;
    attemptNumber?: number;
    instructor?: {
        id: string;
        fullName: string;
        email: string;
    } | null;
    curriculum?: {
        id: string;
        code: string;
        name: string;
        type: string;
    } | null;
    programme?: {
        id: string;
        name: string;
        code: string;
        passScorePercent?: number;
    } | null; // Legacy - deprecated
}

export interface SessionCreate {
    curriculumId: string;
    curriculumModuleId?: string;
    dateStart: string;
    dateEnd?: string;
    location: string;
    instructorId: string;
    sessionType: SessionType;
    capacity?: number;
    campaignId?: string;
}

export interface SessionEnrolRequest {
    userIds: string[];
}

export type AttendanceStatus = 'planned' | 'present' | 'absent';
export type AssessmentMethod = 'none' | 'written' | 'oral' | 'computer' | 'practical';
export type SessionResultStatus = 'not_assessed' | 'pass' | 'fail';

export interface SessionResultItem {
    userId: string;
    attendance: AttendanceStatus;
    assessmentMethod?: AssessmentMethod | null;
    score?: number | null;
    result?: SessionResultStatus | null;
    comments?: string | null;
    theoryMethod?: AssessmentMethod | null;
    theoryScore?: number | null;
    theoryResult?: SessionResultStatus | null;
    practicalMethod?: AssessmentMethod | null;
    practicalScore?: number | null;
    practicalResult?: SessionResultStatus | null;
    overallResult?: SessionResultStatus | null;
}

export interface SessionResult {
    id: string;
    userId: string;
    fullName: string;
    email: string;
    departmentTag?: string;
    attendance: AttendanceStatus;
    assessmentMethod?: AssessmentMethod;
    score?: number;
    result?: SessionResultStatus;
    comments?: string;
    theoryMethod?: AssessmentMethod;
    theoryScore?: number;
    theoryResult?: SessionResultStatus;
    practicalMethod?: AssessmentMethod;
    practicalScore?: number;
    practicalResult?: SessionResultStatus;
    overallResult?: SessionResultStatus;
    certificateUrl?: string;
    certificateNumber?: string;
}

export interface SessionResultsRequest {
    results: SessionResultItem[];
}

export interface ProficiencyProfile {
    id: string;
    code: string;
    name: string;
    intervalMonths: number;
    requiredAssessors: number;
    requiredElements?: Record<string, any>;
}

export interface ProficiencyProfileCreate {
    code: string;
    name: string;
    intervalMonths: number;
    requiredAssessors: number;
    requiredElements?: Record<string, any>;
}

export type CheckCondition = 'normal' | 'abnormal' | 'emergency' | 'mixed';
export type CheckResult = 'planned' | 'pass' | 'fail' | 'cancelled';

export interface ProficiencyCheck {
    id: string;
    profileId: string;
    traineeId: string;
    assessorId: string;
    assessorIds?: string[]; // New: Multiple assessors support
    dateStart: string;
    dateEnd?: string | null;
    conditions?: CheckCondition | null;
    elementsResults?: Record<string, string> | null;
    result: CheckResult;
    comments?: string | null;
    protocolUrl?: string | null;
    evaluations?: CheckAssessorEvaluation[];
}

export interface CheckAssessorEvaluation {
    assessorId: string;
    result: 'pass' | 'fail';
    comments?: string | null;
    signature?: string | null;
    signedAt?: string | null;
}

export interface ProficiencyCheckCreate {
    profileId: string;
    traineeId: string;
    assessorId: string;
    assessorIds?: string[]; // New
    dateStart: string;
    location?: string | null;
}

export interface ProficiencyCheckComplete {
    dateEnd: string;
    conditions: CheckCondition;
    elementsResults: Record<string, string>;
    result: CheckResult;
    comments?: string | null;
    signatures?: Record<string, string>; // assessorId -> signature data
    evaluations?: CheckAssessorEvaluation[];
}


export interface Organization {
    id: string;
    name: string;
    code: string;
    country: string;
    status: 'active' | 'suspended' | 'trial' | 'archived';
    licenseType?: 'trial' | 'standard' | 'premium' | 'enterprise';
    trialEndsAt?: string;
    adminCount?: number;
    userCount?: number;
}

export interface Employee {
    id: string;
    fullName: string;
    email?: string;
    organisationId: string;
    role: 'super_admin' | 'admin' | 'training_manager' | 'instructor' | 'assessor' | 'employee' | 'readonly';
    areaOfActivity?: string | null;
    departmentTag?: string | null;
    employmentStart?: string;
    employmentEnd?: string | null;
    mustChangePassword?: boolean;
    organisation?: {
        id: string;
        name: string;
        code: string;
    } | null;
}

export interface EmployeeHistory {
    employee: Employee;
    trainings: {
        sessionId: string;
        programmeCode: string;
        date: string;
        result: string;
    }[];
    checks: {
        checkId: string;
        profileCode: string;
        date: string;
        result: string;
    }[];
}

export type CompetenceStatusType = 'not_acquired' | 'valid' | 'expiring_soon' | 'expired';

export interface CompetenceStatus {
    userId: string;
    fullName: string;
    competenceCode: string;
    status: CompetenceStatusType;
    validUntil?: string | null;
}

export interface ReportUrl {
    url: string;
}

export interface Standard {
    id: string
    code: string
    name: string
    description?: string
    objectives?: string[]
    validityMonths?: number
    hasTheory: boolean
    hasPractical: boolean
    theoryPassScore?: number
    practicalPassScore?: number
    allowedMethods?: string[]
    isActive: boolean
    revision: number
    departmentTag?: string
    createdAt: string
    updatedAt: string
    isLatestRevision: boolean
    createdFrom?: string
    supersededBy?: string
    validFrom?: string
    validUntil?: string
    deactivatedAt?: string
    deactivatedBy?: {
        id: string
        name: string
    }
}

// ============================================================================
// CURRICULUM SYSTEM (Merged Programmes + Profiles)
// ============================================================================

export type CurriculumType = 'initial' | 'recurrent' | 'refresher' | 'conversion' | 'differences';
export type ModuleType = 'instruction' | 'assessment';
export type DeliveryMethod = 'classroom' | 'elearning' | 'practical' | 'simulator' | 'self_study';

export interface GradingElement {
    id: string;
    name: string;
    description?: string;
    isMandatory: boolean;
    defaultGrade?: number;
}

export interface PassCriteria {
    passThreshold: number;
    failThreshold: number;
    mandatoryAllPass: boolean;
}

export interface CurriculumModule {
    id: string;
    curriculumId: string;
    type: ModuleType;
    name: string;
    description?: string;
    durationHours?: number;
    sequence: number;
    // For instruction modules
    deliveryMethod?: DeliveryMethod;
    // For assessment modules
    gradingElements?: GradingElement[];
    passCriteria?: PassCriteria;
    requiredAssessors?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CurriculumModuleCreate {
    type: ModuleType;
    name: string;
    description?: string;
    durationHours?: number;
    sequence?: number;
    deliveryMethod?: DeliveryMethod;
    gradingElements?: GradingElement[];
    passCriteria?: PassCriteria;
    requiredAssessors?: number;
}

export interface Curriculum {
    id: string;
    code: string;
    name: string;
    type: CurriculumType;
    validityMonths?: number;
    standardTags: string[];
    description?: string;
    isActive: boolean;
    revision: number;
    modules: CurriculumModule[];
    // Computed fields from summary view
    totalHours?: number;
    instructionModulesCount?: number;
    assessmentModulesCount?: number;
    totalModulesCount?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CurriculumCreate {
    code: string;
    name: string;
    type: CurriculumType;
    validityMonths?: number;
    standardTags?: string[];
    description?: string;
    modules?: CurriculumModuleCreate[];
}

export interface CurriculumUpdate {
    name?: string;
    type?: CurriculumType;
    validityMonths?: number;
    standardTags?: string[];
    description?: string;
    isActive?: boolean;
}

// ============================================================================
// CAMPAIGN SYSTEM (Bulk Scheduling)
// ============================================================================

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
export type EnrollmentStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'withdrawn';
export type EnrollmentResult = 'pass' | 'fail' | 'incomplete';

export interface CampaignEnrollment {
    id: string;
    campaignId: string;
    userId: string;
    status: EnrollmentStatus;
    result?: EnrollmentResult;
    enrolledAt: string;
    completedAt?: string;
    notes?: string;
    user?: {
        id: string;
        fullName: string;
        email: string;
        departmentTag?: string;
    };
}

export interface Campaign {
    id: string;
    name: string;
    description?: string;
    curriculumId: string;
    curriculum?: {
        id: string;
        code: string;
        name: string;
        type: CurriculumType;
        validityMonths?: number;
    };
    dateRangeStart: string;
    dateRangeEnd: string;
    maxPerSession: number;
    defaultLocation?: string;
    defaultInstructorId?: string;
    status: CampaignStatus;
    progressPercent: number;
    enrollments?: CampaignEnrollment[];
    // Stats from summary view
    totalEnrollments?: number;
    pendingCount?: number;
    scheduledCount?: number;
    inProgressCount?: number;
    completedCount?: number;
    failedCount?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CampaignCreate {
    name: string;
    description?: string;
    curriculumId: string;
    dateRangeStart: string;
    dateRangeEnd: string;
    maxPerSession?: number;
    defaultLocation?: string;
    defaultInstructorId?: string;
}

export interface CampaignUpdate {
    name?: string;
    description?: string;
    dateRangeStart?: string;
    dateRangeEnd?: string;
    maxPerSession?: number;
    defaultLocation?: string;
    defaultInstructorId?: string;
    status?: CampaignStatus;
}

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface GenerateScheduleRequest {
    instructorId?: string;
    location?: string;
    sessionDurationHours?: number;
    preferredDays?: WeekDay[];
    preferredTime?: string; // HH:mm format
    breakBetweenMinutes?: number;
}

export interface GenerateScheduleResponse {
    data: Session[];
    summary: {
        sessionsCreated: number;
        participantsScheduled: number;
    };
}

// ============================================================================
// RETAKE SYSTEM
// ============================================================================

export interface RetakeChainItem {
    id: string;
    attemptNumber: number;
    dateStart: string;
    status: SessionStatus;
    result?: SessionResultStatus;
}

export interface ScheduleRetakeRequest {
    traineeId: string;
    dateStart: string;
    dateEnd?: string;
    location?: string;
    instructorId?: string;
}

// ============================================================================
// ACTION DASHBOARD (My Actions)
// ============================================================================

export type ActionItemType = 
    | 'expiry_warning' 
    | 'pending_signature' 
    | 'session_approval' 
    | 'acknowledge_training'
    | 'pending_grading'
    | 'retake_required'
    | 'session_reminder';

export type ActionItemPriority = 'critical' | 'high' | 'medium' | 'low';

export interface ActionItem {
    id: string;
    type: ActionItemType;
    title: string;
    description?: string;
    priority: ActionItemPriority;
    dueDate?: string;
    targetUrl: string;
    entityType?: 'session' | 'check' | 'competence' | 'campaign';
    entityId?: string;
    metadata?: Record<string, any>;
    createdAt: string;
    isRead?: boolean;
}

export interface ActionItemsResponse {
    data: ActionItem[];
    total: number;
    unreadCount: number;
}

// ============================================================================
// EXCEPTION-BASED GRADING
// ============================================================================

export type GradeValue = 1 | 2 | 3 | 4 | 5;
export type GradeDeviation = 'below_standard' | 'standard' | 'above_standard';

export interface ElementGrade {
    elementId: string;
    grade: GradeValue;
    deviation: GradeDeviation;
    comments?: string; // Required only for grades 1, 2, or 5
}

export interface ExceptionGradingRequest {
    deviations: ElementGrade[]; // Only non-standard grades
    defaultGrade?: GradeValue; // Default is 3 (standard)
}

export interface ExceptionGradingResponse {
    allElements: ElementGrade[];
    overallResult: 'pass' | 'fail';
    requiresRetake: boolean;
}
