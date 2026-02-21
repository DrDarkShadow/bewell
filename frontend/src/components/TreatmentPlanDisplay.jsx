import React from 'react';

const TreatmentPlanDisplay = ({ plan }) => {
  // Try to parse the plan if it's a string (JSON)
  let parsedPlan = plan;
  if (typeof plan === 'string') {
    try {
      parsedPlan = JSON.parse(plan);
    } catch {
      return <div className="error">Invalid treatment plan format.</div>;
    }
  }

  const {
    diagnosis = '',
    severity = '',
    identified_symptoms = [],
    duration_of_condition = '',
    medications_prescribed = [],
    therapy_recommended = [],
    lifestyle_recommendations = [],
    treatment_goals = [],
    risk_level = 'LOW',
    follow_up_plan = '',
    doctor_summary = '',
  } = parsedPlan || {};

  const getRiskLevelColor = (level) => {
    if (level === 'HIGH') return '#ef4444';
    if (level === 'MODERATE') return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="treatment-plan-display">
      {/* Risk Alert */}
      {risk_level && (
        <div
          className="risk-alert"
          style={{
            backgroundColor: `${getRiskLevelColor(risk_level)}20`,
            borderLeft: `4px solid ${getRiskLevelColor(risk_level)}`,
            padding: '1rem',
            marginBottom: '1.5rem',
            borderRadius: '6px',
          }}
        >
          <div style={{ fontWeight: '600', color: getRiskLevelColor(risk_level) }}>
            Risk Level: {risk_level}
          </div>
        </div>
      )}

      {/* Diagnosis & Severity */}
      {(diagnosis || severity) && (
        <div className="plan-section">
          <h3>Clinical Assessment</h3>
          {diagnosis && (
            <div className="plan-item">
              <span className="label">Diagnosis:</span>
              <span className="value">{diagnosis}</span>
            </div>
          )}
          {severity && (
            <div className="plan-item">
              <span className="label">Severity:</span>
              <span className="value">{severity}</span>
            </div>
          )}
          {duration_of_condition && (
            <div className="plan-item">
              <span className="label">Duration:</span>
              <span className="value">{duration_of_condition}</span>
            </div>
          )}
        </div>
      )}

      {/* Identified Symptoms */}
      {identified_symptoms && identified_symptoms.length > 0 && (
        <div className="plan-section">
          <h3>Identified Symptoms</h3>
          <ul className="symptom-list">
            {identified_symptoms.map((symptom, idx) => (
              <li key={idx}>{symptom}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Medications */}
      {medications_prescribed && medications_prescribed.length > 0 && (
        <div className="plan-section">
          <h3>Prescribed Medications</h3>
          <div className="medication-list">
            {medications_prescribed.map((med, idx) => (
              <div key={idx} className="medication-item">
                {med.name && <div><span className="label">Name:</span> {med.name}</div>}
                {med.dosage && <div><span className="label">Dosage:</span> {med.dosage}</div>}
                {med.frequency && <div><span className="label">Frequency:</span> {med.frequency}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Therapy Recommendations */}
      {therapy_recommended && therapy_recommended.length > 0 && (
        <div className="plan-section">
          <h3>Recommended Therapies</h3>
          <ul className="therapy-list">
            {therapy_recommended.map((therapy, idx) => (
              <li key={idx}>{therapy}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Lifestyle Recommendations */}
      {lifestyle_recommendations && lifestyle_recommendations.length > 0 && (
        <div className="plan-section">
          <h3>Lifestyle Recommendations</h3>
          <ul className="lifestyle-list">
            {lifestyle_recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Treatment Goals */}
      {treatment_goals && treatment_goals.length > 0 && (
        <div className="plan-section">
          <h3>Treatment Goals</h3>
          <ul className="goals-list">
            {treatment_goals.map((goal, idx) => (
              <li key={idx}>{goal}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Follow-up Plan */}
      {follow_up_plan && (
        <div className="plan-section">
          <h3>Follow-up Plan</h3>
          <p className="follow-up-text">{follow_up_plan}</p>
        </div>
      )}

      {/* Doctor's Summary */}
      {doctor_summary && (
        <div className="plan-section">
          <h3>Doctor's Summary</h3>
          <div className="summary-box">
            <p>{doctor_summary}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreatmentPlanDisplay;
