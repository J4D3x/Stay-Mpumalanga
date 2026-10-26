
'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'reslink_last_visit';
const VISIT_TIMEOUT = 24 * 60 * 60 * 1000;
const SPLASH_DURATION = 2000;

export function SplashScreen() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const now = Date.now();
    const lastVisit = Number(localStorage.getItem(STORAGE_KEY) || 0);

    // Show on first visit or after 24 hours.
    if (lastVisit && now - lastVisit < VISIT_TIMEOUT) {
      return;
    }

    setShow(true);

    const timer = window.setTimeout(() => {
      setShow(false);
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }, SPLASH_DURATION);

    return () => window.clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="splashScreen" role="status" aria-label="ResLink loading">
      <h1 aria-label="ResLink">
        {'ResLink'.split('').map((letter, index) => (
          <span
            key={index}
            className="splashLetter"
            style={{ animationDelay: `${index * 0.18}s` }}
          >
            {letter}
          </span>
        ))}
      </h1>
    </div>
  );
}
