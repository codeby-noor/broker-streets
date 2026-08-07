import { useEffect, useState } from 'react';

export default function useCountdown(initialSeconds) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = window.setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  const reset = () => setSeconds(initialSeconds);

  return { seconds, reset, isComplete: seconds <= 0 };
}
