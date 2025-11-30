/**
 * Represents a single QR code scan event.
 *
 * This interface is intentionally generic to support any QR code payload.
 * Future implementations may:
 * - Add domain-specific fields (e.g., productId, assetId)
 * - Parse and validate the rawValue against specific schemas
 * - Map QR data to inventory items, users, or other entities
 */
export interface ScanEvent {
  /** Unique identifier for this scan event */
  id: string;

  /** The raw string value read from the QR code (unparsed, unvalidated) */
  rawValue: string;

  /** ISO 8601 timestamp when the scan occurred */
  scannedAt: string;

  /**
   * Optional: If rawValue is valid JSON, this contains the parsed object.
   * This is for display/debugging purposes only - no business logic should depend on this.
   */
  parsedJson?: unknown;
}

/**
 * Hook for managing scan history.
 *
 * Currently stores scans in component state (session-only).
 * Future implementation should:
 * - Persist to backend API (POST /api/scans)
 * - Associate scans with authenticated user
 * - Support pagination, search, and filtering
 */
export interface UseScanHistoryReturn {
  scans: ScanEvent[];
  addScan: (rawValue: string) => void;
  clearHistory: () => void;
  isLoading?: boolean;
  error?: Error;
}
