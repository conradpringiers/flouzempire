import { useCallback, useEffect, useRef } from 'react';
import { WebHaptics } from 'web-haptics';

let hapticsInstance: WebHaptics | null = null;

function getHaptics(): WebHaptics {
  if (!hapticsInstance) {
    hapticsInstance = new WebHaptics();
  }
  return hapticsInstance;
}

export function useHaptics() {
  const haptics = useRef(getHaptics());

  const tap = useCallback(() => {
    haptics.current.trigger([{ duration: 10 }]);
  }, []);

  const light = useCallback(() => {
    haptics.current.trigger('nudge');
  }, []);

  const success = useCallback(() => {
    haptics.current.trigger('success');
  }, []);

  const heavy = useCallback(() => {
    haptics.current.trigger([{ duration: 30, intensity: 1 }]);
  }, []);

  return { tap, light, success, heavy };
}
