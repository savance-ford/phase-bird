// Loads the best score from persistent storage and exposes an update function
import { useState, useEffect, useCallback } from 'react';
import { loadBestScore, saveBestScore } from '../utils/storage';

export function useBestScore() {
  const [best, setBest] = useState(0);

  useEffect(() => {
    loadBestScore().then(setBest);
  }, []);

  /**
   * Call after each run.
   * Returns true if `newScore` beats the current best (used for "New Best!" banner).
   */
  const update = useCallback(
    async (newScore: number): Promise<boolean> => {
      if (newScore > best) {
        setBest(newScore);
        await saveBestScore(newScore);
        return true;
      }
      return false;
    },
    [best],
  );

  return { best, update };
}
