import React, { useState } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

const AppointmentScheduler = () => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [domain, setDomain] = useState('Mental Health');
  const [description, setDescription] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! 👋 I'm your mental health counseling assistant. I'm here to help you schedule your therapy sessions and support your wellness journey." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [formStep, setFormStep] = useState(1);
  const [successMessage, setSuccessMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Get token for authentication
      const token = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

      // Use AWS Bedrock-powered appointment scheduler via JWT protected route
      const res = await fetch(`${apiBase}/patient/appointments/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: input,
          conversation_history: messages,
          existing_appointment: date || time ? { date, time, description } : null
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // Add assistant response
        const assistantMessage = {
          role: 'assistant',
          content: data.message
        };

        setMessages([...newMessages, assistantMessage]);

        // If appointment was booked, update the form
        if (data.appointment && data.success) {
          setDate(data.appointment.date || date);
          setTime(data.appointment.time || time);
          setDescription(data.appointment.description || description);

          // Add to appointments list
          const newAppointment = {
            id: Date.now(),
            ...data.appointment
          };
          setAppointments([...appointments, newAppointment]);
          setSuccessMessage('✅ Appointment scheduled successfully!');
          setTimeout(() => setSuccessMessage(''), 4000);

          // Reset form
          setDate('');
          setTime('');
          setDescription('');
        }
      } else {
        // Fallback response
        setMessages([...newMessages, {
          role: 'assistant',
          content: "I'm here to help you schedule your mental health appointment. Please tell me when you'd like to book (e.g., 'Next Monday at 2 PM') and I'll get you set up!"
        }]);
      }
    } catch (e) {
      console.error('Error:', e);
      setMessages([...newMessages, {
        role: 'assistant',
        content: "I'm here to assist! You can either tell me when you'd like to schedule in the chat, or use the date and time fields on the left to book your appointment."
      }]);
    }

    setLoading(false);
  };

  const handleScheduleAppointment = () => {
    if (!date || !time || !domain) {
      alert('Please fill in all appointment details (Date, Time, and Domain)');
      return;
    }

    const newAppointment = {
      id: Date.now(),
      date,
      time,
      domain,
      description: description || 'No additional details',
      status: 'Confirmed',
      createdAt: new Date().toISOString()
    };

    setAppointments([...appointments, newAppointment]);
    setFormErrors({});
    setSuccessMessage('✅ Appointment scheduled successfully! You will receive a reminder 24 hours before.');

    // Clear success message after 4 seconds
    setTimeout(() => setSuccessMessage(''), 4000);

    // Add confirmation message to chat
    setMessages([...messages, {
      role: 'user',
      content: `I'd like to schedule a ${domain} appointment on ${date} at ${time}.`
    }, {
      role: 'assistant',
      content: `Perfect! ✅ I've successfully scheduled your mental health appointment for ${date} at ${time}. You'll receive a reminder before your session. Is there anything else I can help you with?`
    }]);

    // Reset form
    setDate('');
    setTime('');
    setDomain('Mental Health');
    setDescription('');
    setFormStep(1);
  };

  const getDomainEmoji = (domain) => {
    const emojis = {
      'Medical': '🏥',
      'Dental': '🦷',
      'Mental Health': '🧠',
      'Consultation': '💼',
      'Business': '📊',
      'Legal': '⚖️',
      'Other': '📝'
    };
    return emojis[domain] || '📋';
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="appointment-scheduler-container">
      {/* Left Panel - Appointment Form */}
      <div className="appointment-panel">
        <div className="appointment-form-section">
          <div className="form-header">
            <h2>🧠 Schedule Your Therapy Session</h2>
            <p className="form-subtext">Book your mental health counseling appointment</p>
          </div>

          {/* Progress Indicator */}
          <div className="form-progress">
            <div className={`progress-step ${formStep >= 1 ? 'active' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">Service</span>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${formStep >= 2 ? 'active' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Date & Time</span>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${formStep >= 3 ? 'active' : ''}`}>
              <span className="step-number">3</span>
              <span className="step-label">Details</span>
            </div>
          </div>

          <div className="form-group">
            <label>Service Type</label>
            <div className="service-badge">🧠 Mental Health Counseling</div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Preferred Date *</label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={e => {
                  setDate(e.target.value);
                  if (e.target.value) {
                    setFormErrors({ ...formErrors, date: '' });
                    setFormStep(Math.max(formStep, 2));
                  }
                }}
                className={`form-input ${formErrors.date ? 'error' : ''}`}
                min={new Date().toISOString().split('T')[0]}
              />
              {formErrors.date && <span className="error-text">{formErrors.date}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="time">Preferred Time *</label>
              <input
                id="time"
                type="time"
                value={time}
                onChange={e => {
                  setTime(e.target.value);
                  if (e.target.value) {
                    setFormErrors({ ...formErrors, time: '' });
                    setFormStep(Math.max(formStep, 3));
                  }
                }}
                className={`form-input ${formErrors.time ? 'error' : ''}`}
              />
              {formErrors.time && <span className="error-text">{formErrors.time}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Additional Information</label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Any additional notes or requirements for your appointment..."
              className="form-input textarea"
              rows="3"
            />
          </div>

          <button
            onClick={handleScheduleAppointment}
            className="schedule-button"
            disabled={!date || !time || !domain}
          >
            {!date || !time || !domain ? '⏳ Fill in all fields' : '✓ Confirm & Schedule'}
          </button>

          {successMessage && (
            <div className="success-banner">
              {successMessage}
            </div>
          )}
        </div>

        {/* Appointments List */}
        {appointments.length > 0 && (
          <div className="appointments-list-section">
            <h3>�️ Your Therapy Sessions</h3>
            <div className="appointments-list">
              {appointments.map(apt => (
                <div key={apt.id} className="appointment-card">
                  <div className="appointment-header">
                    <span className="appointment-domain">{getDomainEmoji(apt.domain)} {apt.domain}</span>
                    <span className={`appointment-status ${apt.status.toLowerCase()}`}>
                      {apt.status}
                    </span>
                  </div>
                  <div className="appointment-details">
                    <div>📅 {formatDate(apt.date)}</div>
                    <div>🕐 {apt.time}</div>
                  </div>
                  {apt.description && apt.description !== 'No additional details' && (
                    <div className="appointment-notes">💬 {apt.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Chatbot */}
      <div className="appointment-chat-panel">
        <div className="chat-container">
          <div className="chat-header-appt">
            <div className="chat-header-content">
              <h3>✨ Mental Health Counselor</h3>
              <p>Compassionate appointment scheduling assistant</p>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <ChatMessage
                key={idx}
                message={msg.content}
                isUser={msg.role === 'user'}
              />
            ))}
            {loading && <ChatMessage message="Thinking..." isUser={false} />}
          </div>

          <ChatInput
            value={input}
            onChange={setInput}
            onSend={handleSend}
          />
        </div>
      </div>
    </div>
  );
};

export default AppointmentScheduler;
