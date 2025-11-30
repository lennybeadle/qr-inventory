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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useScanHistory } from '@/hooks/use-scan-history';
import { ScanEvent } from '@/types/scan';
import {
  IconAlertCircle,
  IconArrowLeft,
  IconCamera,
  IconChevronDown,
  IconTrash
} from '@tabler/icons-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { QrReader } from 'react-qr-reader';

export default function QRScannerPage() {
  const { scans, addScan, clearHistory } = useScanHistory();
  const [lastScanned, setLastScanned] = useState<ScanEvent | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const lastScanRef = useRef<string | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  const handleScan = (result: any, error: any) => {
    if (error) {
      console.error('QR Scanner Error:', error);
      setCameraError(
        'Unable to access camera. Please ensure camera permissions are granted.'
      );
      setIsScanning(false);
      return;
    }

    if (!result) return;

    const resultText = result?.text || result;
    if (!resultText) return;

    // Prevent duplicate scans within 2 seconds
    if (lastScanRef.current === resultText) return;

    lastScanRef.current = resultText;
    addScan(resultText);

    // Update the last scanned display
    const scannedEvent: ScanEvent = {
      id: Date.now().toString(),
      rawValue: resultText,
      scannedAt: new Date().toISOString(),
      parsedJson: tryParseJson(resultText)
    };
    setLastScanned(scannedEvent);

    // Reset duplicate check after 2 seconds
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    scanTimeoutRef.current = setTimeout(() => {
      lastScanRef.current = null;
    }, 2000);
  };

  const tryParseJson = (value: string): unknown => {
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
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
              Scan QR codes using your camera
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
              <div className='relative mx-auto max-w-md overflow-hidden rounded-lg'>
                {isScanning && (
                  <>
                    <QrReader
                      onResult={handleScan}
                      constraints={{
                        facingMode: 'environment'
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
                    />
                    {/* Scanning indicator */}
                    <div className='absolute bottom-4 left-1/2 -translate-x-1/2'>
                      <Badge className='bg-primary/90 backdrop-blur-sm'>
                        <IconCamera className='mr-2 h-3 w-3' />
                        Scanning...
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Last Scanned Data */}
        {lastScanned && (
          <Card>
            <CardHeader>
              <CardTitle>Last Scanned Data</CardTitle>
              <CardDescription>
                Scanned at {format(new Date(lastScanned.scannedAt), 'PPpp')}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <h4 className='mb-2 text-sm font-medium'>Raw Value</h4>
                <div className='rounded-md bg-muted p-4'>
                  <code className='break-all font-mono text-sm'>
                    {lastScanned.rawValue}
                  </code>
                </div>
              </div>

              {lastScanned.parsedJson ? (
                <div>
                  <Collapsible>
                    <CollapsibleTrigger className='flex w-full items-center justify-between rounded-md bg-muted/50 p-3 text-sm font-medium transition-colors hover:bg-muted'>
                      <span>View Parsed JSON</span>
                      <IconChevronDown className='h-4 w-4 transition-transform ui-expanded:rotate-180' />
                    </CollapsibleTrigger>
                    <CollapsibleContent className='mt-2'>
                      <div className='rounded-md bg-muted p-4'>
                        <pre className='overflow-x-auto text-xs'>
                          {JSON.stringify(lastScanned.parsedJson, null, 2)}
                        </pre>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ) : null}
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
                  Session history ({scans.length} scan
                  {scans.length !== 1 ? 's' : ''})
                </CardDescription>
              </div>
              {scans.length > 0 && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={clearHistory}
                  className='text-destructive hover:bg-destructive/10'
                >
                  <IconTrash className='mr-2 h-4 w-4' />
                  Clear History
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {scans.length === 0 ? (
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
                      <TableHead>Scanned Data</TableHead>
                      <TableHead className='w-48'>Scanned At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scans.map((scan, index) => (
                      <TableRow key={scan.id}>
                        <TableCell className='font-medium'>
                          {scans.length - index}
                        </TableCell>
                        <TableCell>
                          <div className='max-w-md'>
                            <code className='break-all text-xs'>
                              {truncateString(scan.rawValue, 80)}
                            </code>
                            {scan.parsedJson ? (
                              <Badge
                                variant='outline'
                                className='ml-2 text-xs'
                              >
                                JSON
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className='text-sm text-muted-foreground'>
                          {format(new Date(scan.scannedAt), 'PP p')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Future Integration Notice */}
        <Card className='border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20'>
          <CardContent className='p-4'>
            <p className='text-sm text-muted-foreground'>
              <strong>Note:</strong> Scan history is currently stored in your
              session only. Future updates will save scans to your account and
              enable advanced features like search, filtering, and integration
              with inventory management.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
