# QR Inventory Dashboard

A modern Next.js 16 dashboard with integrated QR code scanning capabilities. Built with TypeScript, Tailwind CSS, and shadcn/ui components.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example.txt .env.local
# Add your Clerk credentials to .env.local

# Run development server
npm run dev

# Open http://localhost:3000
```

## ✨ Features

### QR Code Scanner
- **Live Camera Scanning**: Real-time QR code detection using device camera
- **Scan History**: Session-based history with timestamps and data preview
- **Smart Detection**: Auto-detects and pretty-prints JSON payloads
- **Error Handling**: Graceful camera permission and error states
- **Responsive Design**: Works on mobile and desktop browsers

### Dashboard
- **Modern UI**: Built with shadcn/ui components
- **Dark Mode**: Full theme support
- **Authentication**: Clerk integration for user management
- **Navigation**: Keyboard shortcuts and command palette

## 📁 Project Structure

```
qr-inventory/
├── src/
│   ├── app/
│   │   └── dashboard/
│   │       ├── qr-scanner/      # QR scanner feature
│   │       │   ├── page.tsx     # Main scanner page
│   │       │   └── README.md    # Feature docs
│   │       ├── overview/        # Dashboard overview
│   │       └── layout.tsx       # Dashboard layout
│   ├── components/
│   │   ├── layout/
│   │   │   └── dashboard-layout-client.tsx  # Client wrapper
│   │   └── ui/                  # shadcn/ui components
│   ├── hooks/
│   │   └── use-scan-history.ts  # Scan state management
│   ├── types/
│   │   └── scan.ts              # TypeScript interfaces
│   └── constants/
│       └── data.ts              # Navigation config
├── CHANGES.md                   # Detailed changelog
├── QR_SCANNER_IMPLEMENTATION.md # Implementation guide
├── UI_FLOW.md                   # UI/UX documentation
└── KNOWN_ISSUES.md              # Known issues & fixes
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS 4.0
- **UI Components**: shadcn/ui
- **Icons**: Tabler Icons
- **Auth**: Clerk
- **QR Scanning**: react-qr-reader
- **State**: React Hooks + Zustand

## 📸 QR Scanner Usage

### Access the Scanner
1. Navigate to Dashboard
2. Click "Scan Now" CTA card, OR
3. Use sidebar navigation, OR
4. Press `q` + `s` keyboard shortcut

### Scanning Process
1. Allow camera permissions when prompted
2. Point camera at QR code
3. Scanner auto-detects and saves scan
4. View in scan history table

### Data Handling
- **Generic Approach**: All QR data treated as opaque strings
- **JSON Support**: Auto-detects and formats JSON payloads
- **Session Storage**: Currently in-memory (ready for API integration)

## 🔌 API Integration (Future)

The architecture is ready for backend integration:

```typescript
// Update src/hooks/use-scan-history.ts
const addScan = async (rawValue: string) => {
  const response = await fetch('/api/scans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawValue })
  });
  const scan = await response.json();
  setScans(prev => [scan, ...prev]);
};
```

## 📱 Browser Support

✅ Chrome/Edge (latest)
✅ Safari 14.3+ (iOS & macOS)
✅ Firefox (latest)
✅ Chrome Mobile (Android)

**Requirements:**
- Camera access
- WebRTC support
- HTTPS (or localhost)

## 🧪 Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Format code
npm run format
```

## 📝 Environment Variables

Required environment variables (see `env.example.txt`):

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

## 🎨 Customization

### Add Custom QR Processing
```typescript
// src/hooks/use-scan-history.ts
const addScan = useCallback((rawValue: string) => {
  // Add your custom logic here
  const processed = customQRProcessor(rawValue);

  const newScan: ScanEvent = {
    id: uuidv4(),
    rawValue,
    scannedAt: new Date().toISOString(),
    parsedJson: processed
  };

  setScans(prev => [newScan, ...prev]);
}, []);
```

### Modify UI Components
All components use shadcn/ui and can be customized via:
- Tailwind classes
- Component variants
- Theme tokens

## 📚 Documentation

- **[CHANGES.md](CHANGES.md)** - Complete file changes summary
- **[QR_SCANNER_IMPLEMENTATION.md](QR_SCANNER_IMPLEMENTATION.md)** - Implementation details
- **[UI_FLOW.md](UI_FLOW.md)** - User journey and UI states
- **[KNOWN_ISSUES.md](KNOWN_ISSUES.md)** - Known issues and solutions
- **[src/app/dashboard/qr-scanner/README.md](src/app/dashboard/qr-scanner/README.md)** - Feature documentation

## 🐛 Troubleshooting

### Camera Not Working
1. Check browser permissions
2. Ensure HTTPS (or localhost)
3. Close other apps using camera
4. Try different browser

### Hydration Warnings
✅ Already fixed! See `KNOWN_ISSUES.md` for details.

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

## 🔐 Security

- **Camera Access**: Only accessed when explicitly requested by user
- **Data Storage**: Currently session-only (no persistence)
- **Authentication**: Handled by Clerk (industry-standard)
- **HTTPS**: Required for camera access in production

## 🚢 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

### Other Platforms
Works on any platform supporting Next.js:
- Netlify
- Railway
- Digital Ocean
- AWS Amplify

## 📄 License

Same as parent template - see LICENSE file.

## 🤝 Contributing

This is a private repository. For issues or suggestions, contact the repository owner.

## 🔗 Links

- **Repository**: https://github.com/lennybeadle/qr-inventory
- **Base Template**: https://github.com/Kiranism/next-shadcn-dashboard-starter
- **Next.js Docs**: https://nextjs.org/docs
- **shadcn/ui**: https://ui.shadcn.com

---

Built with Next.js 16, TypeScript, and shadcn/ui
