import React, { useMemo, useRef, useState } from 'react';
import TreatmentPlanDisplay from './TreatmentPlanDisplay';

const demoTips = [
  'Capture the session audio, then upload it here for review.',
  'Use the session notes to highlight moments to revisit.',
  'Summaries are generated once the recording is complete.',
];

function ListeningAgent() {
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [notes, setNotes] = useState('');
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [files, setFiles] = useState([]);
  const [speakers, setSpeakers] = useState(['Doctor', 'Patient']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummaryPanel, setShowSummaryPanel] = useState(false);
  const [showTreatmentPanel, setShowTreatmentPanel] = useState(false);
  const [processingTranscription, setProcessingTranscription] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [doctorRecording, setDoctorRecording] = useState(false);
  const [patientRecording, setPatientRecording] = useState(false);
  const [doctorElapsed, setDoctorElapsed] = useState(0);
  const [patientElapsed, setPatientElapsed] = useState(0);
  const [doctorCount, setDoctorCount] = useState(0);
  const [patientCount, setPatientCount] = useState(0);
  const doctorRecorderRef = useRef(null);
  const patientRecorderRef = useRef(null);
  const doctorChunksRef = useRef([]);
  const patientChunksRef = useRef([]);
  const doctorTimerRef = useRef(null);
  const patientTimerRef = useRef(null);
  const doctorBlobsRef = useRef([]);
  const patientBlobsRef = useRef([]);
  const tips = useMemo(() => demoTips[Math.floor(Math.random() * demoTips.length)], []);
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

  const handleReset = () => {
    setNotes('');
    setTranscript('');
    setSummary('');
    setTreatmentPlan('');
    setFiles([]);
    setSpeakers(['Doctor', 'Patient']);
    setError('');
    setSuccess('');
    setShowSummaryPanel(false);
    setShowTreatmentPanel(false);
    setSessionActive(false);
    setSessionEnded(false);
    setDoctorElapsed(0);
    setPatientElapsed(0);
    setDoctorCount(0);
    setPatientCount(0);
    doctorBlobsRef.current = [];
    patientBlobsRef.current = [];
  };

  const handleStopSession = () => {
    setSessionActive(false);
    setSessionEnded(true);
    setError('');
    setSuccess('');
  };

  const handleFileChange = (event) => {
    const nextFiles = Array.from(event.target.files || []);
    if (!nextFiles.length) return;
    const updated = [...files, ...nextFiles];
    setFiles(updated);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const startRecording = async (role) => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Audio recording is not supported in this browser.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunksRef = role === 'doctor' ? doctorChunksRef : patientChunksRef;
      const setRecording = role === 'doctor' ? setDoctorRecording : setPatientRecording;
      const setElapsed = role === 'doctor' ? setDoctorElapsed : setPatientElapsed;
      const recorderRef = role === 'doctor' ? doctorRecorderRef : patientRecorderRef;
      const timerRef = role === 'doctor' ? doctorTimerRef : patientTimerRef;

      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (role === 'doctor') {
          doctorBlobsRef.current.push(blob);
          setDoctorCount(doctorBlobsRef.current.length);
        } else {
          patientBlobsRef.current.push(blob);
          setPatientCount(patientBlobsRef.current.length);
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setElapsed(0);
      timerRef.current = window.setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
      setSessionActive(true);
    } catch (err) {
      setError('Microphone access denied. Please allow microphone permission.');
    }
  };

  const stopRecording = (role) => {
    const recorderRef = role === 'doctor' ? doctorRecorderRef : patientRecorderRef;
    const timerRef = role === 'doctor' ? doctorTimerRef : patientTimerRef;
    const setRecording = role === 'doctor' ? setDoctorRecording : setPatientRecording;

    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecording(false);
    // Keep session active - only stop when user clicks "Stop session" button
  };

  const handleTranscribeAndProcess = async () => {
    if (doctorBlobsRef.current.length === 0 && patientBlobsRef.current.length === 0) {
      setError('Please record at least one audio file.');
      return;
    }
    setError('');
    setSuccess('');
    setProcessingTranscription(true);
    try {
      // Step 1: Transcribe all recordings
      const formData = new FormData();

      // Add all doctor recordings
      doctorBlobsRef.current.forEach((blob, index) => {
        formData.append('files', blob, `doctor-${index}.webm`);
        formData.append('speakers', 'Doctor');
      });

      // Add all patient recordings
      patientBlobsRef.current.forEach((blob, index) => {
        formData.append('files', blob, `patient-${index}.webm`);
        formData.append('speakers', 'Patient');
      });

      formData.append('mental_health_only', 'true');

      const token = localStorage.getItem('token');
      const transcribeRes = await fetch(`${apiBase}/patient/listening/transcribe-summarize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!transcribeRes.ok) {
        const data = await transcribeRes.json().catch(() => ({}));
        throw new Error(data?.detail || 'Failed to transcribe audio.');
      }

      const transcribeData = await transcribeRes.json();
      const newTranscript = transcribeData.transcript || '';
      setTranscript(newTranscript);
      setSummary(transcribeData.summary || '');
      setSuccess('Transcription and summary completed successfully.');

      // Show results panel and hide recording controls
      setShowSummaryPanel(true);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setProcessingTranscription(false);
    }
  };

  const handleSummarize = async () => {
    if (!transcript.trim()) {
      setError('Please transcribe the audio first.');
      return;
    }
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/patient/listening/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ transcript, mental_health_only: true }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || 'Failed to generate summary.');
      }

      const data = await res.json();
      setSummary(data.summary || '');
      setSuccess('Summary generated successfully.');
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateTreatmentPlan = async () => {
    if (!transcript.trim()) {
      setError('Please transcribe the audio first to generate a treatment plan.');
      return;
    }
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/patient/listening/generate-treatment-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          transcript,
          summary: summary || '',
          session_notes: notes || '',
          mental_health_only: true
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || 'Failed to generate treatment plan.');
      }

      const data = await res.json();
      setTreatmentPlan(data.treatment_plan || data || '');
      setShowTreatmentPanel(true);
      setSuccess('Treatment plan generated successfully.');
    } catch (err) {
      setError(err.message || 'Something went wrong while generating the treatment plan.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <section className="listening-shell">
      <header className="listening-header">
        <div>
          <p className="eyebrow">Listening Agent</p>
          <h1>Session capture & instant summaries</h1>
          <p className="subhead">
            Record therapy sessions, generate transcripts, summaries, and treatment plans in one place.
          </p>
        </div>
        <div className="listening-status">
          <span className={sessionActive ? 'status-pill live' : 'status-pill idle'}>
            {sessionActive ? '🔴 Live session running' : '⚪ Session idle'}
          </span>
          <p className="muted">{tips}</p>
        </div>
      </header>

      <div className="listening-grid">
        {/* Session Control Panel - Only show Start button before session, Stop during session */}
        <div className="panel">
          <h2>Session control</h2>
          <p className="muted">Start and stop your therapy session recording.</p>
          <div className="button-row">
            {!sessionActive && !sessionEnded && (
              <button
                className="primary"
                onClick={() => {
                  setSessionActive(true);
                  setSessionEnded(false);
                  setShowSummaryPanel(false);
                  setShowTreatmentPanel(false);
                  setDoctorElapsed(0);
                  setPatientElapsed(0);
                  setDoctorRecording(false);
                  setPatientRecording(false);
                  setError('');
                  setSuccess('');
                }}
              >
                ▶️ Start session
              </button>
            )}

            {sessionActive && (
              <button
                className="ghost"
                onClick={handleStopSession}
              >
                ⏹️ Stop session
              </button>
            )}

            {sessionEnded && (
              <>
                <button
                  className="ghost"
                  onClick={handleReset}
                >
                  🔄 Reset all
                </button>
              </>
            )}
          </div>
        </div>

        {/* Recording Controls - Show only when session is active */}
        {sessionActive && (
          <>
            <div className="panel">
              <h2>Record session</h2>
              <p className="muted">Record doctor and patient audio. You can record multiple times during the session.</p>

              <div className="recording-grid">
                <div className="record-card">
                  <div>
                    <p className="record-role">🏥 Doctor channel</p>
                    <p className="record-time">{formatTime(doctorElapsed)}</p>
                  </div>
                  <div className="record-actions">
                    <button
                      className="primary"
                      onClick={() => startRecording('doctor')}
                      disabled={doctorRecording}
                    >
                      Record
                    </button>
                    <button
                      className="ghost"
                      onClick={() => stopRecording('doctor')}
                      disabled={!doctorRecording}
                    >
                      Stop
                    </button>
                  </div>
                  <p className="muted">{doctorCount > 0 ? `✔ ${doctorCount} statement${doctorCount !== 1 ? 's' : ''} captured` : 'Waiting...'}</p>
                </div>
                <div className="record-card">
                  <div>
                    <p className="record-role">👤 Patient channel</p>
                    <p className="record-time">{formatTime(patientElapsed)}</p>
                  </div>
                  <div className="record-actions">
                    <button
                      className="primary"
                      onClick={() => startRecording('patient')}
                      disabled={patientRecording}
                    >
                      Record
                    </button>
                    <button
                      className="ghost"
                      onClick={() => stopRecording('patient')}
                      disabled={!patientRecording}
                    >
                      Stop
                    </button>
                  </div>
                  <p className="muted">{patientCount > 0 ? `✔ ${patientCount} statement${patientCount !== 1 ? 's' : ''} captured` : 'Waiting...'}</p>
                </div>
              </div>
            </div>

            <div className="panel">
              <label className="field">
                <span>📝 Session notes</span>
                <textarea
                  placeholder="Capture key moments, observations, or themes from the session..."
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={6}
                />
              </label>
            </div>
          </>
        )}

        {/* After Session Ends - Show all options */}
        {sessionEnded && (
          <>
            {/* Status message */}
            <div className="panel post-session-options">
              <h2>Session ended</h2>
              {doctorBlobsRef.current.length > 0 && patientBlobsRef.current.length > 0 && (
                <div style={{ padding: '1rem 0', marginBottom: '1rem', textAlign: 'center', backgroundColor: '#dcfce7', borderRadius: '8px', border: '2px solid #86efac' }}>
                  <p style={{ margin: 0, color: '#166534', fontWeight: '600' }}>✔ {doctorBlobsRef.current.length} doctor + {patientBlobsRef.current.length} patient recordings captured</p>
                </div>
              )}
              {(doctorBlobsRef.current.length === 0 || patientBlobsRef.current.length === 0) && (
                <div style={{ padding: '1rem 0', marginBottom: '1rem', textAlign: 'center', backgroundColor: '#fef3c7', borderRadius: '8px', border: '2px solid #fcd34d' }}>
                  <p style={{ margin: 0, color: '#92400e', fontWeight: '600' }}>⚠ Record both doctor and patient audio for best results</p>
                </div>
              )}
            </div>

            {/* Transcription & Summary Panel */}
            <div className="panel">
              <h2>📝 Transcription & Summary</h2>
              <p className="muted">Generate transcription and summary from the recording.</p>
              <div className="button-row">
                <button
                  className="primary"
                  onClick={handleTranscribeAndProcess}
                  disabled={processingTranscription || (doctorBlobsRef.current.length === 0 || patientBlobsRef.current.length === 0)}
                >
                  {processingTranscription ? 'Processing...' : '📄 Transcribe & Summarize'}
                </button>
              </div>
              {error && <p className="error">{error}</p>}
              {success && <p className="success">{success}</p>}
            </div>

            {transcript && (
              <div className="panel">
                <h2>Transcript</h2>
                <textarea
                  placeholder="Transcript will appear here."
                  value={transcript}
                  onChange={(event) => setTranscript(event.target.value)}
                  rows={6}
                />
              </div>
            )}

            {summary && (
              <div className="panel">
                <h2>📋 Summary</h2>
                <textarea
                  placeholder="Summary will appear here."
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  rows={6}
                />
              </div>
            )}

            {/* Treatment Plan Panel */}
            <div className="panel">
              <h2>🩺 Treatment Plan</h2>
              <p className="muted">Generate a comprehensive treatment plan based on the session.</p>
              <button
                className="primary"
                onClick={handleGenerateTreatmentPlan}
                disabled={isSubmitting || (doctorBlobsRef.current.length === 0 || patientBlobsRef.current.length === 0)}
              >
                {isSubmitting ? 'Generating...' : '📋 Generate Treatment Plan'}
              </button>
              {error && <p className="error">{error}</p>}
              {success && <p className="success">{success}</p>}
            </div>

            {treatmentPlan && (
              <div className="panel">
                <h2>Treatment Plan</h2>
                <TreatmentPlanDisplay plan={treatmentPlan} />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default ListeningAgent;
