# QR Scanner Feature

## Overview

The QR Scanner feature allows authenticated users to scan QR codes using their device camera. The scanned data is displayed and stored in session history.

## Components

### Page Component
- **Location**: `src/app/dashboard/qr-scanner/page.tsx`
- **Type**: Client Component (`'use client'`)
- **Features**:
  - Live camera preview for QR scanning
  - Real-time scan detection
  - Display of last scanned data
  - Session-based scan history
  - JSON parsing and pretty-printing for JSON payloads
  - Error handling for camera permissions

## Data Flow

### Current Implementation (v0.1)
```
User Camera → QR Reader → useScanHistory Hook → Component State → UI Display
```

Scans are stored in component state only (session-only, not persisted).

### Future Implementation
```
User Camera → QR Reader → API Call → Database → User's Account
                                    ↓
                              Backend Processing
                                    ↓
                         Domain-Specific Mapping
```

## Types

All scan-related types are defined in `src/types/scan.ts`:

- `ScanEvent`: Represents a single QR code scan
  - `id`: Unique identifier
  - `rawValue`: Raw string from QR code
  - `scannedAt`: ISO 8601 timestamp
  - `parsedJson?`: Optional parsed JSON object (display only)

- `UseScanHistoryReturn`: Interface for scan history management hook

## Hook

### `useScanHistory()`
**Location**: `src/hooks/use-scan-history.ts`

**Returns**:
- `scans`: Array of ScanEvent objects
- `addScan(rawValue: string)`: Function to add a new scan
- `clearHistory()`: Function to clear all scans

**Current**: Stores in component state
**Future**: Will persist to backend API

## Integration Points

### Navigation
- Added to sidebar: `src/constants/data.ts`
- Icon: `IconScan` from `@tabler/icons-react`
- Route: `/dashboard/qr-scanner`
- Keyboard shortcut: `q` + `s`

### Dashboard CTA
- Location: `src/app/dashboard/overview/layout.tsx`
- Prominent call-to-action card on main dashboard
- Direct link to scanner

## Dependencies

- `react-qr-barcode-scanner`: QR code scanning library
- `uuid`: For generating unique scan IDs
- `date-fns`: For timestamp formatting

## Future Enhancements

### Backend Integration
```typescript
// Example API endpoint structure
POST /api/scans
{
  "rawValue": "string",
  "scannedAt": "ISO-8601"
}

GET /api/scans?page=1&limit=20
DELETE /api/scans/:id
```

### Domain-Specific Features
- Map QR data to inventory items
- Validate against specific schemas
- Support multiple QR formats (URLs, JSON, custom formats)
- Export scan history (CSV, JSON)
- Search and filter capabilities
- Analytics and reporting

## Permissions

The feature requires:
- Camera access (browser permission)
- User authentication (Clerk)

## Browser Compatibility

Requires browsers that support:
- `navigator.mediaDevices.getUserMedia()`
- WebRTC
- Modern JavaScript (ES6+)

Tested on:
- Chrome/Edge (latest)
- Safari (iOS 14.3+)
- Firefox (latest)
