'use client';

import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useScanEvents } from '@/hooks/use-scan-events';
import type { ScanEventWithCode } from '@/lib/supabaseClient';
import {
  IconAlertCircle,
  IconArrowLeft,
  IconCamera,
  IconLoader2
} from '@tabler/icons-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { QrReader } from 'react-qr-reader';
import { toast } from 'sonner';

export default function QRScannerPage() {
  const { scans, isLoading, error, recordScan, refreshScans } =
    useScanEvents();
  const [lastScanned, setLastScanned] = useState<ScanEventWithCode | null>(
    null
  );
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const lastScanRef = useRef<string | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  const handleScan = async (result: any, scanError: any) => {
    if (scanError) {
      console.error('QR Scanner Error:', scanError);

      // Only show camera error if it's actually a permission/access issue
      // Ignore NotFoundException and other transient errors
      const errorMessage = scanError?.message || scanError?.toString() || '';
      const isPermissionError =
        errorMessage.includes('Permission') ||
        errorMessage.includes('NotAllowedError') ||
        errorMessage.includes('denied') ||
        errorMessage.includes('NotFoundError');

      if (isPermissionError) {
        setCameraError(
          'Unable to access camera. Please ensure camera permissions are granted.'
        );
        setIsScanning(false);
      }
      // For other errors, just log them and continue trying
      return;
    }

    if (!result) return;

    const resultText = result?.text || result;
    if (!resultText) return;

    // Prevent duplicate scans within 2 seconds
    if (lastScanRef.current === resultText || isRecording) return;

    lastScanRef.current = resultText;

    // Record scan to Supabase
    try {
      setIsRecording(true);
      const scanEvent = await recordScan(resultText);

      // Update the last scanned display
      setLastScanned(scanEvent);

      // Show success toast
      toast.success('QR code scanned successfully!', {
        description: `Code ID: ${scanEvent.code?.id || 'Unknown'}`
      });
    } catch (err) {
      console.error('Error recording scan:', err);
      toast.error('Failed to record scan', {
        description: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setIsRecording(false);
    }

    // Reset duplicate check after 2 seconds
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    scanTimeoutRef.current = setTimeout(() => {
      lastScanRef.current = null;
    }, 2000);
  };

  const truncateString = (str: string, maxLength = 50) => {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
  };

  return (
    <PageContainer>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>QR Scanner</h1>
            <p className='text-muted-foreground'>
              Scan QR codes to track and manage your inventory
            </p>
          </div>
          <Button variant='outline' asChild>
            <Link href='/dashboard/overview'>
              <IconArrowLeft className='mr-2 h-4 w-4' />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Camera Preview */}
        <Card>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <IconCamera className='h-5 w-5' />
              <CardTitle>Camera Preview</CardTitle>
            </div>
            <CardDescription>
              Point your camera at a QR code to scan it
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cameraError ? (
              <div className='flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-8'>
                <IconAlertCircle className='mb-4 h-12 w-12 text-destructive' />
                <h3 className='mb-2 text-lg font-semibold'>Camera Error</h3>
                <p className='mb-4 text-center text-sm text-muted-foreground'>
                  {cameraError}
                </p>
                <div className='space-y-2 text-sm text-muted-foreground'>
                  <p>To fix this:</p>
                  <ol className='list-inside list-decimal space-y-1'>
                    <li>Check your browser permissions for camera access</li>
                    <li>Make sure no other app is using the camera</li>
                    <li>Try refreshing the page</li>
                  </ol>
                </div>
                <Button
                  className='mt-4'
                  onClick={() => {
                    setCameraError(null);
                    setIsScanning(true);
                  }}
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <div className='relative mx-auto max-w-md overflow-hidden rounded-lg bg-black'>
                {isScanning && (
                  <>
                    <QrReader
                      onResult={handleScan}
                      constraints={{
                        facingMode: 'environment',
                        aspectRatio: 1
                      }}
                      containerStyle={{
                        width: '100%',
                        paddingTop: '100%',
                        position: 'relative'
                      }}
                      videoStyle={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      scanDelay={500}
                      videoId="qr-video"
                      ViewFinder={() => null}
                    />

                    {/* QR Code Scanning Frame Overlay */}
                    <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
                      {/* Darkened overlay with transparent center */}
                      <div className='absolute inset-0 bg-black/40' />

                      {/* Scanning frame */}
                      <div className='relative z-10 h-64 w-64'>
                        {/* Corner brackets */}
                        {/* Top-left */}
                        <div className='absolute left-0 top-0 h-12 w-12 border-l-4 border-t-4 border-primary' />
                        {/* Top-right */}
                        <div className='absolute right-0 top-0 h-12 w-12 border-r-4 border-t-4 border-primary' />
                        {/* Bottom-left */}
                        <div className='absolute bottom-0 left-0 h-12 w-12 border-b-4 border-l-4 border-primary' />
                        {/* Bottom-right */}
                        <div className='absolute bottom-0 right-0 h-12 w-12 border-b-4 border-r-4 border-primary' />

                        {/* Scanning line animation */}
                        <div className='absolute left-0 right-0 top-0 h-1 animate-scan bg-gradient-to-r from-transparent via-primary to-transparent' />
                      </div>
                    </div>

                    {/* Scanning indicator */}
                    <div className='absolute bottom-4 left-1/2 z-20 -translate-x-1/2'>
                      <Badge className='bg-primary/90 backdrop-blur-sm'>
                        {isRecording ? (
                          <>
                            <IconLoader2 className='mr-2 h-3 w-3 animate-spin' />
                            Recording...
                          </>
                        ) : (
                          <>
                            <IconCamera className='mr-2 h-3 w-3' />
                            Scanning...
                          </>
                        )}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Last Scanned Code */}
        {lastScanned && lastScanned.code && (
          <Card>
            <CardHeader>
              <CardTitle>Last Scanned Code</CardTitle>
              <CardDescription>
                Scanned at {format(new Date(lastScanned.scanned_at), 'PPpp')}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Code ID
                  </p>
                  <p className='text-lg font-semibold'>
                    {lastScanned.code.id}
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    System
                  </p>
                  <p className='text-lg font-semibold'>
                    {lastScanned.code.system_acronym}
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Size
                  </p>
                  <p className='text-lg font-semibold'>
                    {lastScanned.code.size}
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Year
                  </p>
                  <p className='text-lg font-semibold'>
                    {lastScanned.code.year}
                  </p>
                </div>
              </div>

              <div>
                <h4 className='mb-2 text-sm font-medium'>Raw Payload</h4>
                <div className='rounded-md bg-muted p-4'>
                  <code className='break-all font-mono text-sm'>
                    {lastScanned.raw_payload}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scan History */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle>Scan History</CardTitle>
                <CardDescription>
                  Your recent scans ({scans.length}{' '}
                  {scans.length === 1 ? 'scan' : 'scans'})
                </CardDescription>
              </div>
              {scans.length > 0 && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={refreshScans}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
                      Refreshing...
                    </>
                  ) : (
                    'Refresh'
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className='mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4'>
                <div className='flex items-center gap-2'>
                  <IconAlertCircle className='h-5 w-5 text-destructive' />
                  <p className='text-sm font-medium'>Error loading scans</p>
                </div>
                <p className='mt-1 text-sm text-muted-foreground'>
                  {error.message}
                </p>
              </div>
            )}

            {isLoading && scans.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-12 text-center'>
                <IconLoader2 className='mb-4 h-12 w-12 animate-spin text-muted-foreground/50' />
                <p className='text-sm text-muted-foreground'>
                  Loading scan history...
                </p>
              </div>
            ) : scans.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-12 text-center'>
                <IconCamera className='mb-4 h-12 w-12 text-muted-foreground/50' />
                <p className='text-sm text-muted-foreground'>
                  No scans yet. Start scanning QR codes to see them here.
                </p>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-12'>#</TableHead>
                      <TableHead>Code ID</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Raw Payload</TableHead>
                      <TableHead className='w-48'>Scanned At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scans.map((scan, index) => (
                      <TableRow key={scan.id}>
                        <TableCell className='font-medium'>
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <code className='font-mono text-sm font-semibold'>
                            {scan.code?.id || scan.code_id}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant='outline'>
                            {scan.code?.size || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-sm'>
                          {scan.code?.year || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <code className='break-all text-xs text-muted-foreground'>
                            {truncateString(scan.raw_payload, 40)}
                          </code>
                        </TableCell>
                        <TableCell className='text-sm text-muted-foreground'>
                          {format(new Date(scan.scanned_at), 'PP p')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Integration Notice */}
        <Card className='border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20'>
          <CardContent className='p-4'>
            <p className='text-sm text-muted-foreground'>
              <strong>Database-backed:</strong> All scans are now persisted to
              Supabase and associated with your account. Your scan history is
              preserved across sessions and devices.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
