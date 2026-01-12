import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
})

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 Unauthorized (e.g., redirect to login)
        if (error.response?.status === 401) {
            console.error("Unauthorized access")
            // window.location.href = "/login"
        }
        return Promise.reject(error)
    }
)

export interface ApiError {
    message: string
    code?: string
    details?: Record<string, unknown>
}

export const auth = {
    register: async (data: any) => {
        const response = await api.post("/auth/register", data)
        return response.data
    },
    changePassword: async (data: any) => {
        const response = await api.post("/auth/change-password", data)
        return response.data
    },
}

export const employees = {
    create: async (data: any) => {
        const response = await api.post("/employees", data)
        return response.data
    },
    list: async (params?: { role?: string; isActive?: boolean }) => {
        const response = await api.get("/employees", { params })
        return response.data
    },
}

// Absences CRUD
export const absences = {
    list: async (params?: { userId?: string; from?: string; to?: string; status?: string; type?: string }) => {
        const response = await api.get("/absences", { params })
        return response.data
    },
    get: async (id: string) => {
        const response = await api.get(`/absences/${id}`)
        return response.data
    },
    create: async (data: { userId: string; absenceType: string; dateStart: string; dateEnd: string; reason?: string }) => {
        const response = await api.post("/absences", data)
        return response.data
    },
    update: async (id: string, data: { absenceType?: string; dateStart?: string; dateEnd?: string; reason?: string; status?: string }) => {
        const response = await api.patch(`/absences/${id}`, data)
        return response.data
    },
    delete: async (id: string) => {
        const response = await api.delete(`/absences/${id}`)
        return response.data
    },
}

// Training Materials
export const materials = {
    list: async (params?: { programmeId?: string; approved?: boolean }) => {
        const response = await api.get("/materials", { params })
        return response.data
    },
    get: async (id: string) => {
        const response = await api.get(`/materials/${id}`)
        return response.data
    },
    create: async (data: { programmeId: string; name: string; description?: string; filePath: string; fileSize?: number; mimeType?: string }) => {
        const response = await api.post("/materials", data)
        return response.data
    },
    approve: async (id: string) => {
        const response = await api.patch(`/materials/${id}/approve`)
        return response.data
    },
    delete: async (id: string) => {
        const response = await api.delete(`/materials/${id}`)
        return response.data
    },
}

// Eligibility
export const eligibility = {
    getEligibleTrainees: async (profileId: string) => {
        const response = await api.get("/eligibility", { params: { profileId } })
        return response.data
    },
    checkConflict: async (traineeId: string, assessorId: string, checkDate?: string) => {
        const response = await api.get("/eligibility/conflict-check", { params: { traineeId, assessorId, checkDate } })
        return response.data
    },
}

// PDF Reports
export const reports = {
    generateTrainingFile: async (employeeId: string, options?: { includeAbsences?: boolean; includeCertificates?: boolean; includeProtocols?: boolean }) => {
        const response = await api.post(`/reports/employees/${employeeId}/training-file`, options)
        return response.data
    },
    getExpiring: async (withinDays?: number) => {
        const response = await api.get("/reports/expiring", { params: { withinDays } })
        return response.data
    },
    generateAttendance: async (sessionId: string) => {
        const response = await api.post(`/reports/sessions/${sessionId}/attendance`, {}, { responseType: "blob" })
        return response.data
    },
    generateCertificate: async (sessionId: string, userId: string) => {
        const response = await api.post(`/reports/sessions/${sessionId}/certificate/${userId}`, {}, { responseType: "blob" })
        return response.data
    },
    generateCertificates: async (sessionId: string) => {
        const response = await api.post(`/reports/sessions/${sessionId}/certificates`)
        return response.data
    },
    generateCheckProtocol: async (checkId: string) => {
        const response = await api.post(`/reports/checks/${checkId}/protocol`, {}, { responseType: "blob" })
        return response.data
    },
}

// Training Standards CRUD
export const standards = {
    list: async (params?: { isActive?: boolean; departmentTag?: string }) => {
        const response = await api.get("/standards", { params })
        return response.data
    },
    get: async (id: string) => {
        const response = await api.get(`/standards/${id}`)
        return response.data
    },
    create: async (data: {
        code: string
        name: string
        description?: string
        objectives?: string[]
        validityMonths?: number
        hasTheory?: boolean
        hasPractical?: boolean
        theoryPassScore?: number
        practicalPassScore?: number
        allowedMethods?: string[]
        departmentTag?: string
    }) => {
        const response = await api.post("/standards", data)
        return response.data
    },
    update: async (id: string, data: Partial<{
        name: string
        description: string
        objectives: string[]
        validityMonths: number
        hasTheory: boolean
        hasPractical: boolean
        theoryPassScore: number
        practicalPassScore: number
        allowedMethods: string[]
        departmentTag: string
        isActive: boolean
    }>) => {
        const response = await api.patch(`/standards/${id}`, data)
        return response.data
    },
    delete: async (id: string) => {
        const response = await api.delete(`/standards/${id}`)
        return response.data
    },
    getMaterials: async (id: string, params?: { status?: string; type?: string }) => {
        const response = await api.get(`/materials/standards/${id}/materials`, { params })
        return response.data
    },
    uploadMaterial: async (id: string, data: { title: string; type: string; fileSize?: number; mimeType?: string }) => {
        const response = await api.post(`/materials/standards/${id}/materials`, data)
        return response.data
    },
    getRevisions: async (id: string) => {
        const response = await api.get(`/standards/${id}/revisions`)
        return response.data
    },
}

// Material actions
export const materialActions = {
    approve: async (id: string) => {
        const response = await api.post(`/materials/${id}/approve`)
        return response.data
    },
    archive: async (id: string) => {
        const response = await api.post(`/materials/${id}/archive`)
        return response.data
    },
    getDownloadUrl: async (id: string) => {
        const response = await api.get(`/materials/${id}/download-url`)
        return response.data
    },
}

// Proficiency Checks with multi-assessor
export const checks = {
    list: async (params?: { traineeId?: string; from?: string; to?: string; result?: string; page?: number; limit?: number }) => {
        const response = await api.get("/checks", { params })
        return response.data
    },
    get: async (id: string) => {
        const response = await api.get(`/checks/${id}`)
        return response.data
    },
    create: async (data: {
        profileId: string
        traineeId: string
        assessorId: string
        assessorIds?: string[]
        dateStart: string
        location?: string
    }) => {
        const response = await api.post("/checks", data)
        return response.data
    },
    complete: async (id: string, data: {
        dateEnd: string
        conditions: string
        elementsResults: Record<string, string>
        result: string
        comments?: string
        signatureData?: string
    }) => {
        const response = await api.patch(`/checks/${id}/complete`, data)
        return response.data
    },
    checkConflict: async (traineeId: string, assessorId: string, checkDate?: string) => {
        const response = await api.get("/checks/conflict", { params: { traineeId, assessorId, checkDate } })
        return response.data
    },
    submitEvaluation: async (id: string, data: {
        elementsResults: Record<string, string>
        result: string
        comments?: string
    }) => {
        const response = await api.post(`/checks/${id}/assessor-evaluations`, data)
        return response.data
    },
    sign: async (id: string, signatureData: string) => {
        const response = await api.post(`/checks/${id}/sign`, { signatureData })
        return response.data
    },
    finalise: async (id: string, data: {
        finalDecision: string
        conditions?: string
        comments?: string
    }) => {
        const response = await api.patch(`/checks/${id}/finalise`, data)
        return response.data
    },
}

// Sessions with enhanced results
export const sessions = {
    list: async (params?: { programmeId?: string; standardId?: string; from?: string; to?: string; status?: string; page?: number; limit?: number }) => {
        const response = await api.get("/sessions", { params })
        return response.data
    },
    get: async (id: string) => {
        const response = await api.get(`/sessions/${id}`)
        return response.data
    },
    create: async (data: {
        programmeId: string
        dateStart: string
        dateEnd?: string
        location: string
        instructorId: string
        sessionType: string
        capacity?: number
    }) => {
        const response = await api.post("/sessions", data)
        return response.data
    },
    update: async (id: string, data: Partial<{
        dateStart: string
        dateEnd: string
        location: string
        instructorId: string
        capacity: number
        status: string
    }>) => {
        const response = await api.patch(`/sessions/${id}`, data)
        return response.data
    },
    enrol: async (id: string, userIds: string[]) => {
        const response = await api.post(`/sessions/${id}/enrol`, { userIds })
        return response.data
    },
    getParticipants: async (id: string) => {
        const response = await api.get(`/sessions/${id}/participants`)
        return response.data
    },
    recordResults: async (id: string, results: Array<{
        userId: string
        attendance: string
        theoryScore?: number
        theoryMethod?: string
        theoryResult?: string
        practicalScore?: number
        practicalMethod?: string
        practicalResult?: string
        overallResult?: string
        score?: number
        result?: string
        assessmentMethod?: string
        comments?: string
    }>) => {
        const response = await api.post(`/sessions/${id}/results`, { results })
        return response.data
    },
    sign: async (id: string, data: { signatureType: 'drawn' | 'typed'; signatureData: string }) => {
        const response = await api.post(`/sessions/${id}/sign`, data)
        return response.data
    },
}

// Super Admin
export const superAdmin = {
    listOrganizations: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
        const response = await api.get("/super-admin/organizations", { params })
        return response.data
    },
    getOrganization: async (id: string) => {
        const response = await api.get(`/super-admin/organizations/${id}`)
        return response.data
    },
    createOrganization: async (data: any) => {
        const response = await api.post("/super-admin/organizations", data)
        return response.data
    },
}
