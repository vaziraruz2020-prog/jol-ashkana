import { useEffect, useRef } from 'react';

export function usePoll(fn, { interval = 6000, enabled = true } = {}) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled) return undefined;
    let timer = 0;
    let stopped = false;
    let inFlight = false;

    async function tick() {
      if (stopped) return;
      if (typeof document !== 'undefined' && document.hidden) {
        timer = window.setTimeout(tick, interval);
        return;
      }
      if (inFlight) {
        timer = window.setTimeout(tick, interval);
        return;
      }
      inFlight = true;
      try {
        await fnRef.current();
      } catch {
        /* ignore poll errors */
      } finally {
        inFlight = false;
        if (!stopped) timer = window.setTimeout(tick, interval);
      }
    }

    tick();
    const onVis = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [enabled, interval]);
}
