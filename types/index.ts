// Student Information
export type Student = {
    roll_no: string;
    name: string;
    section: string;
    branch: string;
    year: string;
};

// Academic Data
export type StudentBase = {
    rollno: string;
    year_branch_section: string;
};

export type AttendanceBySubject = {
    subject: string;
    attended: number;
    conducted: number;
    lastUpdated: string;
};

export type MidmarksBySubject = {
    subject: string;
    M1: number | null;
    M2: number | null;
    average: number | null;
    type: string;
};

export type Attendance = StudentBase & {
    percentage: number;
    totalClasses: {
        attended: number;
        conducted: number;
    };
    subjects: AttendanceBySubject[];
};

export type Midmarks = StudentBase & {
    subjects: MidmarksBySubject[];
};

// Statistics
export interface LeaderboardEntry {
    roll_no: string;
    name?: string;
    attendance_percentage: number | null;
    mid_marks_avg: number | null;
    last_updated?: string;
}

export interface LeaderboardResponse {
    success: boolean;
    page: number;
    limit: number;
    data: LeaderboardEntry[];
}

export interface LeaderboardParams {
    page?: number;
    limit?: number;
    sort?: 'attendance' | 'midmarks';
    year?: string;
    branch?: string;
    section?: string;
}
