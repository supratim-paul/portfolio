import React from 'react';

// Splits a word into letters that each react to hover (see .ch in styles.css).
export default function Word({ text }) {
  return (
    <span className="word" aria-hidden="true">
      {[...text].map((c, i) => <span className="ch" key={i} style={{ '--d': `${i * 28}ms` }}>{c}</span>)}
    </span>
  );
}
