'use client';

import type { ScanEventWithCode } from '@/lib/supabaseClient';
import { useCallback, useEffect, useState } from 'react';

interface UseScanEventsReturn {
  scans: ScanEventWithCode[];
  isLoading: boolean;
  error: Error | null;
  recordScan: (rawPayload: string) => Promise<ScanEventWithCode>;
  refreshScans: () => Promise<void>;
}

/**
 * Hook for managing QR code scan events with Supabase backend.
 *
 * This replaces the previous in-memory-only approach with persistent storage.
 *
 * Features:
 * - Fetches scan history from the database
 * - Records new scans via API
 * - Automatically refreshes after recording
 * - Loading and error states
 *
 * Future enhancements:
 * - Real-time subscriptions via Supabase
 * - Pagination for large histories
 * - Filtering and search
 * - Optimistic updates
 */
export function useScanEvents(): UseScanEventsReturn {
  const [scans, setScans] = useState<ScanEventWithCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetches scan events from the API
   */
  const refreshScans = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/scan-events');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch scan events');
      }

      const data: ScanEventWithCode[] = await response.json();
      setScans(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error';
      setError(new Error(errorMessage));
      console.error('Error fetching scan events:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Records a new scan event
   */
  const recordScan = useCallback(
    async (rawPayload: string): Promise<ScanEventWithCode> => {
      try {
        const response = await fetch('/api/scan-events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ rawPayload })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to record scan');
        }

        const data = await response.json();

        // Create a ScanEventWithCode object from the response
        const newScan: ScanEventWithCode = {
          id: data.scanEvent.id,
          code_id: data.scanEvent.code_id,
          scanned_at: data.scanEvent.scanned_at,
          raw_payload: rawPayload,
          scanned_by_user_id: '', // Will be set by the server
          code: {
            id: data.code.id,
            system_acronym: data.code.system_acronym,
            size: data.code.size,
            year: data.code.year,
            owner_user_id: '', // Will be set by the server
            created_at: data.scanEvent.scanned_at
          }
        };

        // Optimistically add to local state
        setScans((prev) => [newScan, ...prev]);

        // Refresh to get the canonical list from the server
        // (This ensures consistency, especially with RLS policies)
        await refreshScans();

        return newScan;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(new Error(errorMessage));
        throw err;
      }
    },
    [refreshScans]
  );

  // Load scans on mount
  useEffect(() => {
    refreshScans();
  }, [refreshScans]);

  return {
    scans,
    isLoading,
    error,
    recordScan,
    refreshScans
  };
}
