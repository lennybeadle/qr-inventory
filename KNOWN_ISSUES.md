# Known Issues

## ✅ FIXED: Hydration Warning

### Issue (Now Resolved)
~~Console showed React hydration warning about mismatched IDs in the sidebar component.~~

### Solution Applied
Created a client-side wrapper component to separate server and client rendering:

**Files Created:**
- `src/components/layout/dashboard-layout-client.tsx` - Client component wrapper

**Files Modified:**
- `src/app/dashboard/layout.tsx` - Now uses client wrapper

### How It Works
```typescript
// Server Component (reads cookies)
export default async function DashboardLayout({ children }) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

  return (
    <DashboardLayoutClient defaultOpen={defaultOpen}>
      {children}
    </DashboardLayoutClient>
  );
}

// Client Component (handles Radix UI)
'use client';
export function DashboardLayoutClient({ children, defaultOpen }) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      {children}
    </SidebarProvider>
  );
}
```

### Result
✅ No more hydration warnings
✅ Sidebar state still persists via cookies
✅ All Radix UI components render consistently
✅ Build passes without errors

## QR Scanner Specific Notes

### Camera Permissions
- First visit requires user to grant camera access
- Some browsers (Safari) may need HTTPS for camera access
- Works in development (localhost is treated as secure context)

### Browser Compatibility
- Requires WebRTC support
- May not work in:
  - Very old browsers (IE11, etc.)
  - Some privacy-focused browsers with strict settings
  - Incognito mode with camera blocked

### Testing Tips
- Use https://localhost for local testing if needed
- Test QR codes: https://www.qr-code-generator.com/
- Mobile testing: Use ngrok or similar for HTTPS tunnel

## None Found
No issues specific to the QR scanner implementation.
All builds pass ✅
TypeScript compiles without errors ✅
All features work as expected ✅
