# Implementation Plan: Direct Doctor Escalation

## Goal
Implement a patient-controlled, rapid-request appointment system. Patients can request multiple doctors concurrently without waiting. The AI chat summary is only decrypted and shared upon a doctor accepting the request.

---

## Phase 1: Database Design (PostgreSQL / SQLAlchemy)
We need to support Option A (Centralized "Broadcast" Requests).

1. **`models/appointment.py`**:
   - `AppointmentRequest`: 
     - `id` (PK)
     - `patient_id` (FK to User)
     - `status` (PENDING, FULFILLED, CANCELED)
     - `encrypted_summary` (Text)
     - `patient_note` (Text)
   - `RequestReceiver` (Join Table):
     - `request_id` (FK)
     - `doctor_id` (FK to User)
     - `status` (PENDING, ACCEPTED, REJECTED)
   - `Appointment` (The Final Booking):
     - `id` (PK)
     - `patient_id`
     - `doctor_id`
     - `request_id` (Optional, to link back)
     - `status` (CONFIRMED)

## Phase 2: Backend API Endpoints (FastAPI)
1. **`POST /api/v1/patient/escalate/request`**
   - **Input**: `doctor_ids` (List), `note` (String)
   - **Logic**:
     1. Take the current `conversation_id`.
     2. Invoke Bedrock to generate a clinical summary of that chat.
     3. Encrypt the summary (or store securely flagged as unreadable by doctors).
     4. Create 1 `AppointmentRequest` record.
     5. Create N `RequestReceiver` records for the chosen `doctor_ids`.
   - **Output**: The `request_id`.

2. **`POST /api/v1/patient/escalate/request/{id}/add-doctor`**
   - **Input**: `doctor_id`
   - **Logic**: Appends a new `RequestReceiver` allowing the patient to add more doctors to the pending race.

3. **`POST /api/v1/doctor/escalate/request/{id}/accept`**
   - **Logic**: 
     1. Mark `AppointmentRequest` as `FULFILLED`.
     2. Mark the specific `RequestReceiver` as `ACCEPTED` (and all others `REJECTED`/Canceled).
     3. Create the final `Appointment` record.
     4. *Unlock/Decrypt* the chat summary and attach it to the `Appointment`.

## Phase 3: Frontend UI/UX (`Next.js` & `Tailwind`)
We will follow `@[/frontend-design]` psychology principles (reducing friction, clear visual hierarchy).

1. **AI Chat Modifications (`app/patient/companion/page.tsx`)**:
   - Add the permanent "Escalate to Therapist" button on the right sidebar.
   - Update the AI Agent prompt so if it detects high stress, it replies: *"Would you like to connect with a professional? [Click here to browse therapists]"* (Internal Next.js Link).

2. **The Directory Page (`app/patient/book-professional/page.tsx`)**:
   - **Data Fetch**: Load list of doctors.
   - **UI Component**: A clean grid of `DoctorCard` components.
   - **Interaction (No Waiting)**:
     - Click "Send Request" -> Button changes to a `Pending...` spinner (State: `isPending: true`).
     - State is managed via a React Context or simple array `requestedDoctorIds`. The user can keep scrolling and clicking other doctors.

3. **The Modal (Consent & Note)**:
   - *UX Psychology*: Minimize cognitive load (Miller's Law). 
   - Instead of asking for consent on *every* doctor click, ask *once* when they click the very first "Send Request".
   - "Do you consent to share an AI summary of your recent chat if a doctor accepts?" (Checkbox) + Optional Note.
   - Subsequent doctor clicks bypass the modal and just add the doctor to the active request.

## Phase 4: Performance & Polishing (`@[/react-best-practices]`)
- **WebSockets / Polling**: The frontend must know when a doctor accepts so it can change the `Pending...` button to a green `Confirmed!` screen. We will use SWR data polling (e.g., polling `/api/v1/patient/escalate/request/{id}/status` every 3 seconds).
- **Bundle Size**: Ensure Lucide icons are imported specifically (`import { Clock } from 'lucide-react'`).

---

**Next Steps**: Do you approve this technical plan to begin coding Phase 1 (Database Schema)?
