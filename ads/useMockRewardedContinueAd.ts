import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

export type RewardedAdShowResult =
  | 'reward-earned'
  | 'not-ready'
  | 'dismissed'
  | 'error';

const LOAD_TIMEOUT_MS = 10000;

export function useMockRewardedContinueAd() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isShowing, setIsShowing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const adRef = useRef<RewardedAd | null>(null);
  const cleanupListenersRef = useRef<(() => void) | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPromiseRef = useRef<Promise<boolean> | null>(null);
  const loadResolverRef = useRef<((value: boolean) => void) | null>(null);
  const showResolverRef = useRef<((value: RewardedAdShowResult) => void) | null>(
    null
  );
  const earnedRewardRef = useRef(false);

  // Refs used for immediate, up-to-date values inside async callbacks.
  const isLoadedRef = useRef(false);
  const isShowingRef = useRef(false);

  const updateLoaded = useCallback((value: boolean) => {
    isLoadedRef.current = value;
    setIsLoaded(value);
  }, []);

  const updateShowing = useCallback((value: boolean) => {
    isShowingRef.current = value;
    setIsShowing(value);
  }, []);

  const clearLoadTimeout = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  }, []);

  const cleanupAd = useCallback(() => {
    cleanupListenersRef.current?.();
    cleanupListenersRef.current = null;
    adRef.current = null;
  }, []);

  const finishLoad = useCallback(
    (ok: boolean, message?: string) => {
      if (!mountedRef.current) return;

      clearLoadTimeout();
      setIsLoading(false);
      updateLoaded(ok);
      setLastError(ok ? null : message ?? 'Rewarded ad unavailable.');

      const resolver = loadResolverRef.current;
      loadResolverRef.current = null;
      loadPromiseRef.current = null;
      resolver?.(ok);
    },
    [clearLoadTimeout, updateLoaded]
  );

  const createAd = useCallback(() => {
    cleanupAd();

    const ad = RewardedAd.createForAdRequest(TestIds.REWARDED, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubscribeLoaded = ad.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        console.log('[AdMob] Rewarded LOADED');
        finishLoad(true);
      }
    );

    const unsubscribeEarned = ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      reward => {
        console.log('[AdMob] EARNED_REWARD', reward);
        earnedRewardRef.current = true;
      }
    );

    const unsubscribeOpened = ad.addAdEventListener(AdEventType.OPENED, () => {
      console.log('[AdMob] OPENED');
      if (!mountedRef.current) return;
      updateShowing(true);
      setLastError(null);
    });

    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('[AdMob] CLOSED');
      if (!mountedRef.current) return;

      updateShowing(false);
      updateLoaded(false);

      const earned = earnedRewardRef.current;
      earnedRewardRef.current = false;

      const resolver = showResolverRef.current;
      showResolverRef.current = null;
      resolver?.(earned ? 'reward-earned' : 'dismissed');

      cleanupAd();
    });

    const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, error => {
      console.log('[AdMob] ERROR', error);
      if (!mountedRef.current) return;

      const message = error?.message ?? 'Rewarded ad failed.';

      updateShowing(false);
      updateLoaded(false);
      setLastError(message);

      if (showResolverRef.current) {
        const resolver = showResolverRef.current;
        showResolverRef.current = null;
        resolver('error');
      } else {
        finishLoad(false, message);
      }

      cleanupAd();
    });

    cleanupListenersRef.current = () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeOpened();
      unsubscribeClosed();
      unsubscribeError();
    };

    adRef.current = ad;
    return ad;
  }, [cleanupAd, finishLoad, updateLoaded, updateShowing]);

  const loadAd = useCallback((): Promise<boolean> => {
    console.log('[AdMob] loadAd called', {
      isLoaded: isLoadedRef.current,
      isLoading,
    });

    if (isLoadedRef.current) return Promise.resolve(true);
    if (loadPromiseRef.current) return loadPromiseRef.current;

    const ad = adRef.current ?? createAd();

    setIsLoading(true);
    setLastError(null);

    loadPromiseRef.current = new Promise<boolean>(resolve => {
      loadResolverRef.current = resolve;

      loadTimeoutRef.current = setTimeout(() => {
        console.log('[AdMob] load timeout');
        finishLoad(false, 'Timed out loading test ad.');
        cleanupAd();
      }, LOAD_TIMEOUT_MS);

      ad.load();
    });

    return loadPromiseRef.current;
  }, [cleanupAd, createAd, finishLoad, isLoading]);

  const showAd = useCallback(async (): Promise<RewardedAdShowResult> => {
    const ad = adRef.current;

    console.log('[AdMob] showAd called', {
      hasAd: !!ad,
      isLoaded: isLoadedRef.current,
      isShowing: isShowingRef.current,
    });

    if (!ad || !isLoadedRef.current || isShowingRef.current) {
      return 'not-ready';
    }

    earnedRewardRef.current = false;
    setLastError(null);

    return new Promise<RewardedAdShowResult>(resolve => {
      showResolverRef.current = resolve;

      try {
        Promise.resolve(ad.show()).catch(error => {
          console.log('[AdMob] show failed', error);

          if (!mountedRef.current) {
            resolve('error');
            return;
          }

          updateShowing(false);
          updateLoaded(false);
          setLastError(error?.message ?? 'Rewarded ad failed to show.');
          showResolverRef.current = null;
          cleanupAd();
          resolve('error');
        });
      } catch (error: any) {
        console.log('[AdMob] show threw', error);
        updateShowing(false);
        updateLoaded(false);
        setLastError(error?.message ?? 'Rewarded ad failed to show.');
        showResolverRef.current = null;
        cleanupAd();
        resolve('error');
      }
    });
  }, [cleanupAd, updateLoaded, updateShowing]);

  const resetForNextRun = useCallback(() => {
    clearLoadTimeout();

    loadResolverRef.current?.(false);
    loadResolverRef.current = null;
    loadPromiseRef.current = null;

    showResolverRef.current = null;
    earnedRewardRef.current = false;

    cleanupAd();

    if (mountedRef.current) {
      setIsLoading(false);
      updateLoaded(false);
      updateShowing(false);
      setLastError(null);
    }
  }, [cleanupAd, clearLoadTimeout, updateLoaded, updateShowing]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      resetForNextRun();
    };
  }, [resetForNextRun]);

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