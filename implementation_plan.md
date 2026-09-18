# Implementation Plan: Student Evaluation, Dashboards, and Database Migration

This plan details the steps required to migrate the system to a robust production-ready database (PostgreSQL), implement the manual evaluation feature, and build visual dashboards for both students and lecturers.

## User Review Required
> [!IMPORTANT]
> To ensure the system runs without issues as it scales, we will migrate from SQLite to **PostgreSQL**. 
> - **Local Development:** Do you already have PostgreSQL installed locally, or would you like me to create a `docker-compose.yml` file so you can easily spin up a local database?
> - **Note:** Migrating to PostgreSQL means we will start with a fresh, empty database. Any previous data in the SQLite file will be left behind.

## Process Flow: Manual Evaluation

1. **Student Completes Assessment**: The student finishes their chat session and clicks a "Finish Assessment" button. This updates the attempt's status to `pending_review`.
2. **Lecturer Review**: The lecturer logs into the Lecturer Dashboard and sees a list of student attempts, specifically noting those that are `pending_review`.
3. **Manual Grading**: The lecturer clicks on a pending attempt, reviews the chat transcript, and fills out an evaluation form providing **Marks (0-100)**, **Strengths**, and **Areas for Improvement**. 
4. **Submission**: Upon submitting the form, the attempt's status updates to `evaluated` and the data is saved in the database.
5. **Student Visibility**: The student can now log into their dashboard and view their evaluated marks and feedback.
6. **Dashboard Charts**: Both the student and lecturer dashboards will display visual charts (using Recharts) populated with these manually assigned marks over time.

---

## Proposed Changes

### Phase 1: PostgreSQL Migration
Since we are using SQLAlchemy, switching to PostgreSQL is seamless.

#### [MODIFY] [requirements.txt](file:///e:/Businesses/eleven%20fifteen%20ai/kiu/kiu_project/backend/requirements.txt)
- Add `psycopg2-binary` to the requirements to allow Python to connect to PostgreSQL.

#### [MODIFY] [database.py](file:///e:/Businesses/eleven%20fifteen%20ai/kiu/kiu_project/backend/app/database.py)
- Change the `SQLALCHEMY_DATABASE_URL` to point to a PostgreSQL connection string instead of SQLite. We will configure it to use an environment variable `DATABASE_URL` (falling back to a default localhost postgres string if not provided).
- Remove SQLite specific connection arguments (e.g., `check_same_thread`).

#### [NEW] [docker-compose.yml](file:///e:/Businesses/eleven%20fifteen%20ai/kiu/kiu_project/docker-compose.yml) (Optional)
- Create a Docker Compose file to easily run a local PostgreSQL database for development.

---

### Phase 2: Database Schema Updates
Now that we are on a fresh PostgreSQL database, we will add the new evaluation columns.

#### [MODIFY] [domain.py](file:///e:/Businesses/eleven%20fifteen%20ai/kiu/kiu_project/backend/app/models/domain.py)
Add the following columns to the `Attempt` model:
- `status`: String (default="in_progress") to track the state: `in_progress`, `pending_review`, or `evaluated`.
- `marks`: Float (nullable=True) to store the score out of 100.
- `feedback`: JSON (nullable=True) to store a structured object containing `strengths` and `areas_of_improvement`.

---

### Phase 3: Backend API Updates

#### [MODIFY] [chat.py](file:///e:/Businesses/eleven%20fifteen%20ai/kiu/kiu_project/backend/app/routes/chat.py)
- **New Endpoint**: `POST /chat/{attempt_id}/finish`
  - Allows the student to mark the assessment as finished. Updates the `Attempt` status to `pending_review`.

#### [MODIFY] [lecturer.py](file:///e:/Businesses/eleven%20fifteen%20ai/kiu/kiu_project/backend/app/routes/lecturer.py)
- **New Endpoint**: `POST /lecturer/attempts/{attempt_id}/evaluate`
  - Takes a payload of `marks`, `strengths`, and `areas_of_improvement`.
  - Updates the `Attempt` record with this data and sets the status to `evaluated`.
- Update `GET /lecturer/students` to calculate and return `average_marks` for each student.
- Update `GET /lecturer/students/{student_id}/progress` to return `status`, `marks`, and `feedback`.
- Update `GET /lecturer/attempts/{attempt_id}` to include the specific `status`, `marks`, and `feedback` data.

#### [MODIFY] [student.py](file:///e:/Businesses/eleven%20fifteen%20ai/kiu/kiu_project/backend/app/routes/student.py)
- Update `GET /student/attempts` to return the `status`, `marks`, and `feedback` for each attempt so the student knows if it has been graded yet.

---

### Phase 4: Frontend UI & Dashboard Updates
We will utilize the already installed `recharts` library to build beautiful, modern charts.

#### [MODIFY] [api.js](file:///e:/Businesses/eleven%20fifteen%20ai/kiu/kiu_project/frontend/src/api.js)
- Add `finishAttempt(attemptId)` function.
- Add `evaluateAttempt(attemptId, evaluationData)` function for the lecturer.

#### [MODIFY] [ChatSession.js](file:///e:/Businesses/eleven%20fifteen%20ai/kiu/kiu_project/frontend/src/pages/ChatSession.js)
- Add a **"Finish Assessment"** button for the student.
- When clicked, it calls `finishAttempt` (updating status to `pending_review`) and navigates back to the dashboard.

#### [MODIFY] [StudentDashboard.js](file:///e:/Businesses/eleven%20fifteen%20ai/kiu/kiu_project/frontend/src/pages/StudentDashboard.js)
- **Performance Progression (Line Chart)**: Tracks the student's marks chronologically across all evaluated assessments, displaying a smooth curved line with interactive tooltips to visualize growth.
- **Latest Evaluation Summary (Widgets)**: Dedicated cards highlighting the Strengths and Areas for Improvement from their most recently evaluated assessment for quick access to actionable feedback.
- **Assessment History**: List updated to show status badges (e.g., a yellow "Pending Review" or a green "Evaluated: 85/100"). Clicking an evaluated attempt expands to reveal the full written feedback.

#### [MODIFY] [LecturerDashboard.js](file:///e:/Businesses/eleven%20fifteen%20ai/kiu/kiu_project/frontend/src/pages/LecturerDashboard.js)
- **Class Overall Performance (Bar Chart)**: Shows the average score across all students for each scenario, helping identify if a specific scenario is too difficult.
- **Student Comparison (Bar Chart)**: Compares average marks of all students to quickly spot high performers or students needing extra support.
- **Needs Grading / Pending Review Panel**: A dedicated workflow list of all assessments in `pending_review` status.
- **Individual Student View**: When a specific student is selected, display their individual `LineChart` of marks progression (matching the student view).
- **Evaluation Interface**: When reviewing a `pending_review` attempt, a clean form appears next to the transcript to input Marks, Strengths, and Areas for Improvement. Once submitted, results are displayed as read-only.

## Verification Plan

### Automated/Manual Verification
- I will first verify that the backend successfully boots up and connects to the new PostgreSQL database.
- I will manually complete a chat session as a student to verify the status updates to `pending_review`.
- I will log in as a lecturer, verify that the `pending_review` attempt shows up, fill out the evaluation form, and submit it.
- I will verify the dashboard charts dynamically render the data using Recharts on both views without errors.
