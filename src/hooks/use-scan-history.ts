'use client';

import { ScanEvent, UseScanHistoryReturn } from '@/types/scan';
import { useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

/**
 * Hook for managing QR code scan history.
 *
 * Currently stores scans in component state (session-only).
 * This is designed to be easily swappable with an API-backed implementation.
 *
 * Future implementation:
 * - Replace useState with API calls to persist scans
 * - Add user authentication context
 * - Implement pagination and filtering
 */
export function useScanHistory(): UseScanHistoryReturn {
  const [scans, setScans] = useState<ScanEvent[]>([]);

  const addScan = useCallback((rawValue: string) => {
    // Try to parse as JSON for display purposes only
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawValue);
    } catch {
      // Not JSON, that's fine - we keep it as a raw string
      parsedJson = undefined;
    }

    const newScan: ScanEvent = {
      id: uuidv4(),
      rawValue,
      scannedAt: new Date().toISOString(),
      parsedJson
    };

    setScans((prev) => [newScan, ...prev]); // Newest first

    // TODO: Replace with API call when backend is ready
    // Example:
    // try {
    //   await fetch('/api/scans', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(newScan)
    //   });
    // } catch (error) {
    //   // Handle error
    // }
  }, []);

  const clearHistory = useCallback(() => {
    setScans([]);

    // TODO: Add API call to clear user's scan history when backend is ready
    // Example:
    // await fetch('/api/scans', { method: 'DELETE' });
  }, []);

  return {
    scans,
    addScan,
    clearHistory
  };
}
