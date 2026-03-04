# Project Plan: Doctor Accept Flow Fix

## Overview
When a doctor accepts a patient's escalation request, the system successfully creates the appointment in the backend. However, the UI on both sides needs to reflect this immediately. On the doctor's side, the "Active Patients" count and "Recent Patients" list should update. On the patient's side, the new appointment and the connected doctor should appear in the appointments section.

## Project Type
WEB

## Success Criteria
1. When a doctor clicks "Accept", their "Active Patients" count immediately increments, and the patient appears in their "Recent Patients" list.
2. When the patient's WebSocket receives `request_accepted`, the professional automatically appears in their "Appointments & Doctors" dashboard.
3. No manual page reloads should be required on either side.

## Tech Stack
- Frontend: Next.js (React), React Hooks (`useState`, `useEffect`)
- Backend: FastAPI, SQLAlchemy, WebSockets
- DB: PostgreSQL via SQLAlchemy

## File Structure
- `frontend/app/professional/page.tsx` (Doctor Dashboard UI)
- `frontend/app/patient/appointments/page.tsx` (Patient Appointments UI)
- `frontend/app/patient/book-professional/page.tsx` (Patient Escalation Flow UI)
- `backend/src/api/common/escalations.py` (API and WebSocket logic)

## Task Breakdown

### Task 1: Fix Doctor Dashboard UI Update on Accept
- **Agent**: `frontend-specialist`
- **Skills**: `react-best-practices`
- **Priority**: High
- **Dependencies**: None
- **INPUT**: `professional/page.tsx` `handleAcceptRequest`
- **OUTPUT**: Automatically re-fetch or optimistically update the `recentPatients` list and `activePatientsCount` after a successful `/accept`.
- **VERIFY**: Clicking "Accept" makes the patient card disappear from pending and appear in the "Recent Patients" tracker below.

### Task 2: Ensure Real-Time Patient UI Update on Accept
- **Agent**: `frontend-specialist`
- **Skills**: `react-best-practices`
- **Priority**: High
- **Dependencies**: None
- **INPUT**: `patient/appointments/page.tsx` and `patient/book-professional/page.tsx`
- **OUTPUT**: Ensure that when `request_accepted` WS event is sent to the patient, the UI re-fetches the appointments list so the patient sees the new session immediately. Note that `book-professional` handles the success modal, so the data should flow correctly between them.
- **VERIFY**: The patient sees the success modal, and when clicking "Return to Dashboard", the connected doctor and the pending appointment details show up instantly.

### Task 3: Verify Backend Appointment Creation & Relationships
- **Agent**: `backend-specialist`
- **Skills**: `api-patterns`
- **Priority**: Medium
- **Dependencies**: Task 1 & 2
- **INPUT**: `escalations.py` `doctor_accept_request` and `/doctor/dashboard` endpoints
- **OUTPUT**: Ensure the backend's `/dashboard` endpoint correctly aggregates `activePatientsCount` and `recentPatients` directly from the newly created `Appointment`. Ensure the patient `/appointments` endpoint correctly fetches the newly associated doctor.
- **VERIFY**: Re-fetching dashboard/appointments API immediately after accept returns the updated data.

## Phase X: Verification
- [ ] Code Quality: Run `npm run lint` and `python .agent/skills/lint-and-validate/scripts/lint_runner.py .`
- [ ] Functionality: Test accepting a request in the app and verify real-time state changes on both the Doctor and Patient browsers simultaneously.
- [ ] No regressions in WebSocket connections or prior bug fixes.
