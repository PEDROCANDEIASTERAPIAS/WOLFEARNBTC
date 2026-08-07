import { useEffect, useState } from 'react';

interface UseCountdownOpts {
  duration: number;
  onComplete: () => void;
  active: boolean;
}

export function useCountdown({ duration, onComplete, active }: UseCountdownOpts) {
  const [remaining, setRemaining] = useState(duration);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) return;
    setRemaining(duration);
    setDone(false);
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(interval);
          setDone(true);
          onComplete();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [active, duration, onComplete]);

  return { remaining, done };
}
