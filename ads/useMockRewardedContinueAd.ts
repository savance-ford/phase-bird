import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Mock rewarded-ad adapter used until real AdMob integration is dropped in.
 *
 * Why this file exists:
 * - The game screen should already know how to ask for a rewarded continue.
 * - AdMob-specific code can later replace this hook without rewriting the UI.
 * - We intentionally simulate the async states a real ad SDK has: loading,
 *   loaded, showing, and unavailable.
 *
 * Swap path later:
 * - Keep the returned API the same.
 * - Replace loadAd/showAd internals with react-native-google-mobile-ads.
 * - See `ads/AD_MOB_SETUP.md` for the exact handoff notes and config checklist.
 * - See `ads/admobConfig.ts` for test IDs, production placeholders, and
 *   reminders about App IDs vs ad unit IDs.
 */

export type RewardedAdShowResult = 'reward-earned' | 'not-ready' | 'dismissed' | 'error';

const MOCK_LOAD_DELAY_MS = 1100;
const MOCK_SHOW_DELAY_MS = 1450;
const MOCK_FILL_RATE = 0.85;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useMockRewardedContinueAd() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isShowing, setIsShowing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadAd = useCallback(async () => {
    if (isLoading || isLoaded) return isLoaded;

    setIsLoading(true);
    setLastError(null);

    await wait(MOCK_LOAD_DELAY_MS);

    const didFill = Math.random() < MOCK_FILL_RATE;
    if (!mountedRef.current) return false;

    setIsLoading(false);
    setIsLoaded(didFill);
    setLastError(didFill ? null : 'No test ad was ready yet.');

    return didFill;
  }, [isLoaded, isLoading]);

  const showAd = useCallback(async (): Promise<RewardedAdShowResult> => {
    if (!isLoaded || isShowing) return 'not-ready';

    setIsShowing(true);
    setLastError(null);

    // Simulate the time a real rewarded video/playable would stay on screen.
    await wait(MOCK_SHOW_DELAY_MS);

    if (!mountedRef.current) return 'dismissed';

    setIsShowing(false);
    setIsLoaded(false);
    return 'reward-earned';
  }, [isLoaded, isShowing]);

  const resetForNextRun = useCallback(() => {
    setIsLoading(false);
    setIsLoaded(false);
    setIsShowing(false);
    setLastError(null);
  }, []);

  return {
    isLoading,
    isLoaded,
    isShowing,
    lastError,
    loadAd,
    showAd,
    resetForNextRun,
  };
}
