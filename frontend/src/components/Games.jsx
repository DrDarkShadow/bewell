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
        const res = await fetch('/games.json');
        const data = await res.json();
        setGames(data);
      } catch (e) {
        console.error('Error loading games:', e);
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

  const saveGameActivity = async (activityType, score = null, metadata = null) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
      await fetch(`${apiBase}/patient/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          activity_type: activityType,
          score: score,
          metadata_json: metadata
        })
      });
    } catch (e) {
      console.error(`Failed to log ${activityType} activity:`, e);
    }
  };

  if (loading) {
    return <div className="games-status">Loading games...</div>;
  }
  if (!games || !games.length) {
    return <div className="games-status">No games available.</div>;
  }

  if (openGameIdx === null) {
    // Show all games as smaller cards
    return (
      <div className="games-container">
        <div className="games-grid">
          {games.map((g, idx) => (
            <button
              key={g.type}
              className="game-card"
              onClick={() => { setOpenGameIdx(idx); setQIdx(0); setShowAnswer(false); }}
              type="button"
            >
              <h3>{g.title}</h3>
            </button>
          ))}
        </div>
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
    return <div className="games-status">No questions available for this game.</div>;
  }

  return (
    <div className="games-detail">
      <button onClick={() => setOpenGameIdx(null)} className="ghost" title="Back to Games">← </button>
      <div className="game-panel">
        <h2>{game.title}</h2>
        <div className="game-question">{question.q}</div>
        {/* Gratitude input */}
        {isGratitudeInput && (
          <div className="game-input-block">
            <div className="game-input-row">
              <input
                type="text"
                value={gratitudeInput}
                onChange={e => setGratitudeInput(e.target.value)}
                placeholder="Write your gratitude..."
              />
              <button
                className="game-button"
                onClick={() => {
                  if (gratitudeInput.trim()) {
                    setGratitudeList([...gratitudeList, gratitudeInput]);
                    saveGameActivity('gratitude', null, { entry: gratitudeInput });
                    setGratitudeInput("");
                  }
                }}
                type="button"
              >
                Submit
              </button>
            </div>
            <div className="game-list">
              {gratitudeList.map((g, i) => (
                <div key={i} className="game-list-item positive">{g}</div>
              ))}
            </div>
          </div>
        )}
        {/* Word chain input */}
        {isWordChainInput && (
          <div className="game-input-block">
            <div className="game-input-row">
              <input
                type="text"
                value={wordChainInput}
                onChange={e => setWordChainInput(e.target.value)}
                placeholder="Continue the chain..."
              />
              <button
                className="game-button"
                onClick={() => {
                  if (wordChainInput.trim()) {
                    const newScore = wordChainList.length + 1;
                    setWordChainList([...wordChainList, wordChainInput]);
                    saveGameActivity('word_chain', newScore, { word: wordChainInput });
                    setWordChainInput("");
                  }
                }}
                type="button"
              >
                Add
              </button>
            </div>
            <div className="game-list">
              {wordChainList.map((w, i) => (
                <div key={i} className="game-list-item info">{w}</div>
              ))}
            </div>
          </div>
        )}
        {/* Emoji Movie Guess input */}
        {isEmojiGameInput && (
          <div className="game-input-block">
            <div className="game-input-row">
              <input
                type="text"
                value={emojiInput}
                onChange={e => setEmojiInput(e.target.value)}
                placeholder="Your movie guess..."
                disabled={emojiShowAnswer}
              />
              <button
                className="game-button"
                disabled={emojiShowAnswer}
                onClick={() => {
                  if (emojiInput.trim()) {
                    const isCorrect = emojiInput.trim().toLowerCase() === question.a.toLowerCase();
                    if (isCorrect) {
                      setEmojiFeedback('Correct!');
                    } else {
                      setEmojiFeedback('Not quite.');
                    }
                    saveGameActivity('emoji_guess', isCorrect ? 1 : 0, { guess: emojiInput });
                    setEmojiShowAnswer(true);
                  }
                }}
                type="button"
              >
                Submit
              </button>
            </div>
            {emojiFeedback && (
              <div className={`game-feedback ${emojiFeedback.includes('Correct') ? 'success' : 'danger'}`}>
                {emojiFeedback}
              </div>
            )}
            {emojiShowAnswer && (
              <div className="game-answer">Answer: {question.a}</div>
            )}
          </div>
        )}
        {/* Show answer for other games */}
        {question.a && showAnswer && !isGratitude && !isWordChain && !isEmojiGame && (
          <div className="game-answer">Answer: {question.a}</div>
        )}
        <div className="games-actions">
          <button
            onClick={() => { setQIdx((qIdx + 1) % game.questions.length); setShowAnswer(false); setEmojiInput(""); setEmojiFeedback(""); setEmojiShowAnswer(false); }}
            className="game-button"
            type="button"
          >
            New Question
          </button>
          {question.a && !isGratitude && !isWordChain && !isEmojiGame && (
            <button onClick={() => setShowAnswer(true)} className="game-button" type="button">Show Answer</button>
          )}
          <button
            onClick={() => {
              const next = (openGameIdx + 1) % games.length;
              setOpenGameIdx(next);
              setQIdx(0);
              setShowAnswer(false);
              setEmojiInput("");
              setEmojiFeedback("");
              setEmojiShowAnswer(false);
            }}
            className="game-button"
            type="button"
          >
            Random Game
          </button>
        </div>
      </div>
    </div>
  );
};
export default Games;
