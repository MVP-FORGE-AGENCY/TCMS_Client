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
    programmeId: string;
    dateStart: string;
    dateEnd?: string;
    location: string;
    instructorId: string;
    sessionType: SessionType;
    capacity?: number;
    status: SessionStatus;
    isSigned?: boolean;
    instructor?: {
        id: string;
        fullName: string;
        email: string;
    } | null;
    programme?: {
        id: string;
        name: string;
        code: string;
        passScorePercent?: number;
    };
}

export interface SessionCreate {
    programmeId: string;
    dateStart: string;
    dateEnd?: string;
    location: string;
    instructorId: string;
    sessionType: SessionType;
    capacity?: number;
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
