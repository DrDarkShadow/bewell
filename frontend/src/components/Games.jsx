import React, { useState, useEffect } from 'react';

const Games = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openGameIdx, setOpenGameIdx] = useState(null);
  const [qIdx, setQIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [gratitudeInput, setGratitudeInput] = useState("");
  const [gratitudeList, setGratitudeList] = useState([]);
  const [wordChainInput, setWordChainInput] = useState("");
  const [wordChainList, setWordChainList] = useState([]);
  const [emojiInput, setEmojiInput] = useState("");
  const [emojiFeedback, setEmojiFeedback] = useState("");
  const [emojiShowAnswer, setEmojiShowAnswer] = useState(false);

  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:8000/api/games');
        const data = await res.json();
        console.log('Fetched games:', data); // DEBUG LOG
        setGames(data);
      } catch (e) {
        console.error('Error fetching games:', e); // DEBUG LOG
        setGames([]);
      }
      setLoading(false);
    };
    fetchGames();
  }, []);

  useEffect(() => {
    setEmojiInput("");
    setEmojiFeedback("");
    setEmojiShowAnswer(false);
  }, [openGameIdx, qIdx]);

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: 40 }}>Loading games...</div>;
  }
  if (!games.length) {
    return <div style={{ textAlign: 'center', marginTop: 40 }}>No games available.</div>;
  }

  if (openGameIdx === null) {
    // Show all games as smaller cards
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 24, marginTop: 40 }}>
        {games.map((g, idx) => (
          <div key={g.type} style={cardStyleSmall} onClick={() => { setOpenGameIdx(idx); setQIdx(0); setShowAnswer(false); }}>
            <img src={g.image} alt={g.title} style={{ width: 64, height: 64, marginBottom: 10 }} />
            <h3 style={{ margin: 0, color: '#856404', fontSize: '1.1rem' }}>{g.title}</h3>
          </div>
        ))}
      </div>
    );
  }


  // Always define these before any conditional return!
  const game = games[openGameIdx];
  const question = game && game.questions ? (game.questions[qIdx] || { q: '', a: '' }) : { q: '', a: '' };
  const isGratitude = game && game.type === 'gratitude';
  const isWordChain = game && game.type === 'word_chain';
  const isEmojiGame = game && game.type === 'emoji_guess';
  const isGratitudeInput = isGratitude;
  const isWordChainInput = isWordChain;
  const isEmojiGameInput = isEmojiGame;

  // Defensive: If game/questions are missing, show fallback
  if (!game || !game.questions || !game.questions.length) {
    return <div style={{ textAlign: 'center', marginTop: 40 }}>No questions available for this game.</div>;
  }

  return (
    <div style={{ textAlign: 'center', marginTop: 40 }}>
      <button onClick={() => setOpenGameIdx(null)} style={{ ...btnStyle, marginBottom: 24 }}>← Back to Games</button>
      <div style={{ ...cardStyleRect, maxWidth: 600, margin: '0 auto 24px', cursor: 'default' }}>
        <img src={game.image} alt={game.title} style={{ width: 64, height: 64, marginBottom: 10 }} />
        <h2 style={{ color: '#856404', fontSize: '1.3rem' }}>{game.title}</h2>
        <div style={{ fontSize: '1.1rem', color: '#333', margin: '18px 0' }}>{question.q}</div>
        {/* Gratitude input */}
        {isGratitudeInput && (
          <div style={{ margin: '12px 0' }}>
            <input
              type="text"
              value={gratitudeInput}
              onChange={e => setGratitudeInput(e.target.value)}
              placeholder="Write your gratitude..."
              style={{ padding: '8px', borderRadius: 8, border: '1px solid #ffc107', width: '80%' }}
            />
            <button
              style={{ ...btnStyle, marginLeft: 8, padding: '8px 14px', fontSize: '0.95rem' }}
              onClick={() => {
                if (gratitudeInput.trim()) {
                  setGratitudeList([...gratitudeList, gratitudeInput]);
                  setGratitudeInput("");
                }
              }}
            >Submit</button>
            <div style={{ marginTop: 10, textAlign: 'left' }}>
              {gratitudeList.map((g, i) => (
                <div key={i} style={{ color: '#388e3c', fontWeight: 500, marginBottom: 4 }}>🌸 {g}</div>
              ))}
            </div>
          </div>
        )}
        {/* Word chain input */}
        {isWordChainInput && (
          <div style={{ margin: '12px 0' }}>
            <input
              type="text"
              value={wordChainInput}
              onChange={e => setWordChainInput(e.target.value)}
              placeholder="Continue the chain..."
              style={{ padding: '8px', borderRadius: 8, border: '1px solid #ffc107', width: '80%' }}
            />
            <button
              style={{ ...btnStyle, marginLeft: 8, padding: '8px 14px', fontSize: '0.95rem' }}
              onClick={() => {
                if (wordChainInput.trim()) {
                  setWordChainList([...wordChainList, wordChainInput]);
                  setWordChainInput("");
                }
              }}
            >Add</button>
            <div style={{ marginTop: 10, textAlign: 'left' }}>
              {wordChainList.map((w, i) => (
                <div key={i} style={{ color: '#1976d2', fontWeight: 500, marginBottom: 4 }}>🔗 {w}</div>
              ))}
            </div>
          </div>
        )}
        {/* Emoji Movie Guess input */}
        {isEmojiGameInput && (
          <div style={{ margin: '12px 0' }}>
            <input
              type="text"
              value={emojiInput}
              onChange={e => setEmojiInput(e.target.value)}
              placeholder="Your movie guess..."
              style={{ padding: '8px', borderRadius: 8, border: '1px solid #ffc107', width: '80%' }}
              disabled={emojiShowAnswer}
            />
            <button
              style={{ ...btnStyle, marginLeft: 8, padding: '8px 14px', fontSize: '0.95rem' }}
              disabled={emojiShowAnswer}
              onClick={() => {
                if (emojiInput.trim()) {
                  if (emojiInput.trim().toLowerCase() === question.a.toLowerCase()) {
                    setEmojiFeedback('✅ Correct!');
                  } else {
                    setEmojiFeedback('❌ Not quite.');
                  }
                  setEmojiShowAnswer(true);
                }
              }}
            >Submit</button>
            {emojiFeedback && (
              <div style={{ marginTop: 10, fontWeight: 500, color: emojiFeedback.includes('Correct') ? '#388e3c' : '#d63384' }}>{emojiFeedback}</div>
            )}
            {emojiShowAnswer && (
              <div style={{ marginTop: 10, color: '#1976d2', fontWeight: 600 }}>Answer: {question.a}</div>
            )}
          </div>
        )}
        {/* Show answer for other games */}
        {question.a && showAnswer && !isGratitude && !isWordChain && !isEmojiGame && (
          <div style={{ marginTop: 16, color: '#d63384', fontWeight: 600 }}>
            Answer: {question.a}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 12 }}>
          <button onClick={() => { setQIdx((qIdx + 1) % game.questions.length); setShowAnswer(false); setEmojiInput(""); setEmojiFeedback(""); setEmojiShowAnswer(false); }} style={btnStyle}>🔄 New Question</button>
          {question.a && !isGratitude && !isWordChain && !isEmojiGame && (
            <button onClick={() => setShowAnswer(true)} style={btnStyle}>Show Answer</button>
          )}
          <button onClick={() => {
            const next = (openGameIdx + 1) % games.length;
            setOpenGameIdx(next);
            setQIdx(0);
            setShowAnswer(false);
            setEmojiInput("");
            setEmojiFeedback("");
            setEmojiShowAnswer(false);
          }} style={btnStyle}>🎲 Random Game</button>
        </div>
      </div>
    </div>
  );
};

const cardStyle = {
  background: '#fffbe7',
  border: '2px solid #ffc107',
  borderRadius: 18,
  padding: 18,
  minWidth: 160,
  minHeight: 160,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  boxShadow: '0 2px 8px #ffe0ec',
  cursor: 'pointer',
  transition: 'transform 0.2s',
};

const cardStyleSmall = {
  background: '#fffbe7',
  border: '2px solid #ffc107',
  borderRadius: 14,
  padding: 12,
  minWidth: 140,
  minHeight: 140,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  boxShadow: '0 2px 8px #ffe0ec',
  cursor: 'pointer',
  transition: 'transform 0.2s',
};


const cardStyleRect = {
  background: '#fffbe7',
  border: '2px solid #ffc107',
  borderRadius: 18,
  padding: 28,
  minWidth: 420,
  minHeight: 180,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  boxShadow: '0 2px 8px #ffe0ec',
  cursor: 'pointer',
  transition: 'transform 0.2s',
};

const btnStyle = {
  background: '#ffc107',
  color: '#856404',
  border: 'none',
  borderRadius: 12,
  padding: '12px 28px',
  fontWeight: 600,
  fontSize: '1.08rem',
  cursor: 'pointer',
  margin: '2px 0',
};

export default Games;
