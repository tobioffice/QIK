# API Routes Documentation

Base URL: `/api`

---

## User Routes

| Method | Route | Description | Parameters |
|--------|-------|-------------|------------|
| GET | `/api/user/:rollNumber` | Get user/student details by roll number | `rollNumber` (path) - Student roll number |

**Response:** Returns `Student` object

```typescript
type Student = {
  roll_no: string;    // e.g., "21BQ1A0501"
  name: string;       // e.g., "John Doe"
  section: string;    // e.g., "A"
  branch: string;     // e.g., "CSE"
  year: string;       // e.g., "3"
}
```

**Example Response:**
```json
{
  "roll_no": "21BQ1A0501",
  "name": "John Doe",
  "section": "A",
  "branch": "CSE",
  "year": "3"
}
```

---

## Academic Routes

| Method | Route | Description | Parameters |
|--------|-------|-------------|------------|
| GET | `/api/acadamic/marks/:rollNumber` | Get mid marks for a student | `rollNumber` (path) - Student roll number |
| GET | `/api/acadamic/attendace/:rollNumber` | Get attendance for a student | `rollNumber` (path) - Student roll number |

### Get Mid Marks Response

Returns `Midmarks` type:

```typescript
type MidmarksBySubject = {
  subject: string;           // Subject name
  M1: number | null;         // Mid-1 marks (0-30)
  M2: number | null;         // Mid-2 marks (0-30)
  average: number | null;    // Average of M1 and M2
  type: string;              // Subject type
}

type Midmarks = {
  rollno: string;                    // Student roll number
  year_branch_section: string;       // e.g., "3_CSE_A"
  subjects: MidmarksBySubject[];
}
```

**Example Response:**
```json
{
  "rollno": "21BQ1A0501",
  "year_branch_section": "3_CSE_A",
  "subjects": [
    {
      "subject": "Data Structures",
      "M1": 25,
      "M2": 28,
      "average": 26.5,
      "type": "Theory"
    },
    {
      "subject": "Algorithms",
      "M1": 24,
      "M2": null,
      "average": null,
      "type": "Theory"
    }
  ]
}
```

### Get Attendance Response

Returns `Attendance` type:

```typescript
type AttendanceBySubject = {
  subject: string;        // Subject name
  attended: number;       // Classes attended
  conducted: number;      // Classes conducted
  lastUpdated: string;    // ISO 8601 timestamp
}

type Attendance = {
  rollno: string;                    // Student roll number
  year_branch_section: string;       // e.g., "3_CSE_A"
  percentage: number;                // Overall attendance percentage
  totalClasses: {
    attended: number;     // Total classes attended
    conducted: number;    // Total classes conducted
  };
  subjects: AttendanceBySubject[];
}
```

**Example Response:**
```json
{
  "rollno": "21BQ1A0501",
  "year_branch_section": "3_CSE_A",
  "percentage": 85.5,
  "totalClasses": {
    "attended": 120,
    "conducted": 140
  },
  "subjects": [
    {
      "subject": "Data Structures",
      "attended": 15,
      "conducted": 18,
      "lastUpdated": "2024-01-15"
    },
    {
      "subject": "Algorithms",
      "attended": 12,
      "conducted": 15,
      "lastUpdated": "2024-01-15"
    }
  ]
}
```

**Notes:**
- Roll number is validated against `ROLL_REGEX` pattern
- Returns 404 if student not found

---

## Statistics Routes

| Method | Route | Description | Parameters |
|--------|-------|-------------|------------|
| GET | `/api/statistics/leaderboard` | Get leaderboard data | `page` (query, optional) - Page number (default: 1)<br>`limit` (query, optional) - Items per page (default: 50)<br>`sort` (query, optional) - Sort by `attendance` or `midmarks` (default: `attendance`)<br>`year` (query, optional) - Filter by year (use `all` for no filter)<br>`branch` (query, optional) - Filter by branch (use `all` for no filter)<br>`section` (query, optional) - Filter by section (use `all` for no filter) |

**Response:** Returns paginated leaderboard data

```typescript
interface StudentStat {
  roll_no: string;                  // Student roll number
  attendance_percentage: number | null;
  mid_marks_avg: number | null;
  last_updated: string;             // ISO 8601 timestamp
}
```

**Response Format:**
```json
{
  "success": true,
  "page": 1,
  "limit": 50,
  "data": [
    {
      "roll_no": "21BQ1A0501",
      "name": "John Doe",
      "attendance_percentage": 95.5,
      "mid_marks_avg": 28.5
    },
    {
      "roll_no": "21BQ1A0502",
      "name": "Jane Smith",
      "attendance_percentage": 92.0,
      "mid_marks_avg": 27.0
    }
  ]
}
```

---

## Type Definitions Summary

### Core Types

```typescript
// Student Information
type Student = {
  roll_no: string;
  name: string;
  section: string;
  branch: string;
  year: string;
}

// Academic Data
type StudentBase = {
  rollno: string;
  year_branch_section: string;
}

type AttendanceBySubject = {
  subject: string;
  attended: number;
  conducted: number;
  lastUpdated: string;
}

type MidmarksBySubject = {
  subject: string;
  M1: number | null;
  M2: number | null;
  average: number | null;
  type: string;
}

type Attendance = StudentBase & {
  percentage: number;
  totalClasses: {
    attended: number;
    conducted: number;
  };
  subjects: AttendanceBySubject[];
}

type Midmarks = StudentBase & {
  subjects: MidmarksBySubject[];
}

// Statistics
interface StudentStat {
  roll_no: string;
  attendance_percentage: number | null;
  mid_marks_avg: number | null;
  last_updated: string;
}
```

---

## Route Summary

| Base Path | Routes |
|-----------|--------|
| `/api/user` | `/:rollNumber` |
| `/api/acadamic` | `/marks/:rollNumber`<br>`/attendace/:rollNumber` |
| `/api/statistics` | `/leaderboard` |

---

## Error Responses

- **400 Bad Request**: Invalid roll number format
  ```json
  {
    "error": "Invalid roll number format"
  }
  ```
  
- **404 Not Found**: Student not found
  ```json
  {
    "error": "Student not found"
  }
  ```
  
- **500 Internal Server Error**: Server error
  ```json
  {
    "success": false,
    "error": "Internal Server Error"
  }
  ```
