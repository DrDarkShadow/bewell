import React, { useEffect, useRef } from 'react';

const BreathingExercise = ({ cycles = 3 }) => {
  const circleRef = useRef();
  const [started, setStarted] = React.useState(false);
  const [finished, setFinished] = React.useState(false);

  React.useEffect(() => {
    if (!started) return;
    let cycle = 0;
    let phase = 'inhale';
    let timeout;
    const animate = () => {
      if (cycle >= cycles) {
        setFinished(true);
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 32 }}>
      <div
        ref={circleRef}
        style={{
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ffe0ec 0%, #fffbe7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          color: '#d63384',
          fontWeight: 600,
          transition: 'transform 4s cubic-bezier(0.4,0,0.2,1)',
          marginBottom: 24,
        }}
      >
        {!started ? 'Ready?' : 'Inhale...'}
      </div>
      {!started ? (
        <button
          style={{
            background: '#ffc107',
            color: '#856404',
            border: 'none',
            borderRadius: 12,
            padding: '10px 24px',
            fontWeight: 600,
            fontSize: '1.1rem',
            cursor: 'pointer',
            marginBottom: 16,
          }}
          onClick={() => { setStarted(true); setFinished(false); }}
        >
          Start
        </button>
      ) : finished ? (
        <div style={{ color: '#388e3c', fontWeight: 600, marginTop: 12 }}>Well done! 🎉</div>
      ) : null}
      <p style={{ color: '#856404', fontSize: '1.1rem' }}>Follow the circle for {cycles} cycles</p>
    </div>
  );
};

export default BreathingExercise;
