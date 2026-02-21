import React, { useRef } from 'react';

const BreathingExercise = ({ cycles = 3 }) => {
  const circleRef = useRef();
  const [started, setStarted] = React.useState(false);
  const [finished, setFinished] = React.useState(false);

  // Approximate duration calculation: (4s inhale + 2s hold + 4s exhale) = 10s per cycle
  const estimatedDurationSecs = cycles * 10;

  const saveActivity = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // In production, backend URL should come from Vite env vars
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

      await fetch(`${apiBase}/patient/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          activity_type: 'breathing',
          duration_secs: estimatedDurationSecs
        })
      });
    } catch (e) {
      console.error('Failed to log breathing activity:', e);
    }
  };

  React.useEffect(() => {
    if (!started) return;
    let cycle = 0;
    let phase = 'inhale';
    let timeout;
    const animate = () => {
      if (cycle >= cycles) {
        setFinished(true);
        saveActivity(); // Automatically log upon completion
        return;
      }
      if (phase === 'inhale') {
        circleRef.current.style.transform = 'scale(1.2)';
        circleRef.current.textContent = 'Inhale...';
        timeout = setTimeout(() => {
          phase = 'hold';
          animate();
        }, 4000);
      } else if (phase === 'hold') {
        circleRef.current.textContent = 'Hold...';
        timeout = setTimeout(() => {
          phase = 'exhale';
          animate();
        }, 2000);
      } else if (phase === 'exhale') {
        circleRef.current.style.transform = 'scale(1)';
        circleRef.current.textContent = 'Exhale...';
        timeout = setTimeout(() => {
          phase = 'inhale';
          cycle++;
          animate();
        }, 4000);
      }
    };
    animate();
    return () => clearTimeout(timeout);
  }, [cycles, started]);

  return (
    <div className="breathing">
      <div
        ref={circleRef}
        className="breathing-circle"
      >
        {!started ? 'Ready?' : 'Inhale...'}
      </div>
      {!started ? (
        <button
          className="breathing-button"
          onClick={() => { setStarted(true); setFinished(false); }}
        >
          Start
        </button>
      ) : finished ? (
        <div className="breathing-finish">Well done! 🎉</div>
      ) : null}
      <p className="breathing-hint">Follow the circle for {cycles} cycles</p>
    </div>
  );
};

export default BreathingExercise;
