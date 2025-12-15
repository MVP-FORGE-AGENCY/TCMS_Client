import type { Programme, Session, ProficiencyProfile, ProficiencyCheck } from "@/types"

export const MOCK_PROGRAMMES: Programme[] = [
    {
        id: "1",
        code: "OPC-A320",
        name: "Operator Proficiency Check A320",
        type: "recurrent",
        validityMonths: 6,
        durationHours: 4,
        frequencyMonths: 6,
        departmentTag: "Flight Ops",
        isActive: true,
    },
    {
        id: "2",
        code: "CRM-INIT",
        name: "CRM Initial",
        type: "initial",
        validityMonths: undefined,
        durationHours: 16,
        frequencyMonths: 0,
        departmentTag: "All",
        isActive: true,
    },
    {
        id: "3",
        code: "FIRE-SAF",
        name: "Fire Safety Refresher",
        type: "refresher",
        validityMonths: 24,
        durationHours: 2,
        frequencyMonths: 24,
        departmentTag: "Cabin Crew",
        isActive: false,
    },
]

export const MOCK_SESSIONS: Session[] = [
    {
        id: "s1",
        programmeId: "1", // OPC-A320
        dateStart: "2024-03-15T09:00:00",
        dateEnd: "2024-03-15T13:00:00",
        location: "SIM-1",
        instructorId: "inst-1",
        sessionType: "combined",
        capacity: 4,
        status: "completed",
    },
    {
        id: "s2",
        programmeId: "1", // OPC-A320
        dateStart: "2024-04-20T14:00:00",
        dateEnd: "2024-04-20T18:00:00",
        location: "SIM-2",
        instructorId: "inst-2",
        sessionType: "combined",
        capacity: 4,
        status: "planned",
    },
    {
        id: "s3",
        programmeId: "2", // CRM-INIT
        dateStart: "2024-05-10T09:00:00",
        dateEnd: "2024-05-11T17:00:00",
        location: "Classroom A",
        instructorId: "inst-3",
        sessionType: "theory",
        capacity: 12,
        status: "planned",
    },
]

export const MOCK_PROFILES: ProficiencyProfile[] = [
    {
        id: "p1",
        code: "OPC",
        name: "Operator Proficiency Check",
        intervalMonths: 6,
        requiredAssessors: 1,
        requiredElements: {
            "Take-off with engine failure": true,
            "Precision approach": true,
            "Go-around": true,
            "Steep turns": false,
        },
    },
    {
        id: "p2",
        code: "LPC",
        name: "License Proficiency Check",
        intervalMonths: 12,
        requiredAssessors: 1,
        requiredElements: {
            "General handling": true,
            "Emergency procedures": true,
            "Instrument flight": true,
        },
    },
]

export const MOCK_CHECKS: ProficiencyCheck[] = [
    {
        id: "c1",
        profileId: "p1",
        traineeId: "emp1",
        assessorId: "inst-1",
        dateStart: "2024-03-20",
        result: "pass",
        conditions: "mixed",
    },
    {
        id: "c2",
        profileId: "p1",
        traineeId: "emp2",
        assessorId: "inst-1",
        dateStart: "2024-04-25",
        result: "planned",
    },
]
