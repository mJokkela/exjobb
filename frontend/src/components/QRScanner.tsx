import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Scan, Minus, Plus, CheckCircle, ArrowLeft } from 'lucide-react';
import { SparePart } from '../types';

interface QRScannerProps {
  parts: SparePart[];
  onUpdateQuantity: (articleNumber: string, newQuantity: number) => Promise<void>;
}

export function QRScanner({ parts, onUpdateQuantity }: QRScannerProps) {
  const [data, setData] = useState<string>('');
  const [scanning, setScanning] = useState(true);
  const [scannedPart, setScannedPart] = useState<SparePart | null>(null);
  const [quantityToRemove, setQuantityToRemove] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [withdrawalInfo, setWithdrawalInfo] = useState<{ removed: number; remaining: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMounted = useRef(true);

  // Initialize scanner instance
  useEffect(() => {
    scannerRef.current = new Html5Qrcode("reader");

    return () => {
      isMounted.current = false;
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  // Handle scanner start/stop
  useEffect(() => {
    const startScanner = async () => {
      if (!scanning || !scannerRef.current || isTransitioning || !isMounted.current) return;

      try {
        setIsTransitioning(true);
        setError(null);

        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
          // Small delay to ensure complete stop
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const qrCodeSuccessCallback = async (decodedText: string) => {
          if (!isMounted.current) return;
          
          setData(decodedText);
          const part = parts.find(p => p.internalArticleNumber === decodedText);
          
          if (part) {
            setScannedPart(part);
            setScanning(false);
            setError(null);
          } else {
            setError('Ingen produkt hittades för den skannade koden');
          }
        };

        await scannerRef.current.start(
          { facingMode: "environment" },
          { 
            fps: 10,
            qrbox: { width: 200, height: 200 },
            aspectRatio: 1.0
          },
          qrCodeSuccessCallback,
          undefined
        );
      } catch (error) {
        if (isMounted.current) {
          console.error('Error starting scanner:', error);
          setError('Det gick inte att starta kameran. Kontrollera att du har gett tillstånd för kameraåtkomst.');
        }
      } finally {
        if (isMounted.current) {
          setIsTransitioning(false);
        }
      }
    };

    startScanner();
  }, [scanning, parts, isTransitioning]);

  const handleStartScanning = async () => {
    if (isTransitioning) return;

    try {
      setIsTransitioning(true);
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
        // Small delay to ensure complete stop
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      setScanning(true);
      setData('');
      setScannedPart(null);
      setQuantityToRemove(1);
      setShowSuccess(false);
      setWithdrawalInfo(null);
      setIsProcessing(false);
      setError(null);
    } catch (error) {
      console.error('Error resetting scanner:', error);
      setError('Ett fel uppstod när skannern skulle startas om');
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleQuantityChange = (amount: number) => {
    if (!scannedPart) return;
    const newQuantity = Math.max(1, Math.min(quantityToRemove + amount, scannedPart.quantity));
    setQuantityToRemove(newQuantity);
  };

  const handleConfirmWithdrawal = async () => {
    if (!scannedPart || isProcessing) return;

    try {
      setIsProcessing(true);
      const newQuantity = Math.max(0, scannedPart.quantity - quantityToRemove);
      await onUpdateQuantity(scannedPart.internalArticleNumber, newQuantity);
      setWithdrawalInfo({
        removed: quantityToRemove,
        remaining: newQuantity
      });
      setShowSuccess(true);
      setError(null);
    } catch (error) {
      console.error('Error updating quantity:', error);
      setError('Ett fel uppstod när antalet skulle uppdateras');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = async () => {
    if (showSuccess) {
      await handleStartScanning();
    } else if (scannedPart) {
      setScannedPart(null);
      setQuantityToRemove(1);
      setScanning(true);
    }
  };

  if (showSuccess && withdrawalInfo && scannedPart) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center mb-6 text-green-600">
            <CheckCircle className="h-16 w-16" />
          </div>
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Uttag bekräftat</h2>
            <div className="space-y-2">
              <p className="text-lg text-gray-700">
                {withdrawalInfo.removed} st {scannedPart.name}
              </p>
              <p className="text-gray-600">
                Kvar i lager: {withdrawalInfo.remaining} st
              </p>
            </div>
            <button
              onClick={handleStartScanning}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Skanna ny artikel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {scanning ? (
          <>
            <div className="flex items-center space-x-2 mb-6">
              <Scan className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">QR Scanner</h2>
            </div>

            <div className="relative mb-6">
              <div id="reader" className="w-full max-w-[300px] mx-auto overflow-hidden rounded-lg" style={{ aspectRatio: '1/1' }} />
              <div className="absolute inset-0 pointer-events-none" style={{ maxWidth: '300px', margin: '0 auto', left: 0, right: 0 }}>
                <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-blue-500 rounded-tl"></div>
                <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-blue-500 rounded-tr"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-blue-500 rounded-bl"></div>
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-blue-500 rounded-br"></div>
              </div>
            </div>

            <p className="text-sm text-center text-gray-500 mt-4">
              Rikta kameran mot en QR-kod för att skanna.
            </p>
          </>
        ) : scannedPart ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </button>
              <h2 className="text-xl font-bold text-gray-900">Ta ut artikel</h2>
              <div className="w-10"></div>
            </div>

            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{scannedPart.name}</h3>
                <p className="text-lg text-gray-700">I lager: {scannedPart.quantity} st</p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-sm text-gray-600 text-center mb-4">Antal att ta ut:</p>
                <div className="flex items-center justify-center space-x-6">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="p-3 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={quantityToRemove <= 1 || isProcessing}
                  >
                    <Minus className="h-6 w-6" />
                  </button>
                  <span className="text-3xl font-bold text-blue-800">{quantityToRemove}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="p-3 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={quantityToRemove >= scannedPart.quantity || isProcessing}
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleConfirmWithdrawal}
                  disabled={isProcessing}
                  className={`w-full px-6 py-4 text-white rounded-md transition-colors flex items-center justify-center ${
                    isProcessing 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isProcessing ? 'Bearbetar...' : 'Bekräfta uttag'}
                </button>
                <button
                  onClick={handleStartScanning}
                  disabled={isProcessing}
                  className="w-full px-6 py-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Avbryt
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              Ingen produkt hittades för den skannade koden. Försök igen.
            </p>
            <button
              onClick={handleStartScanning}
              className="mt-2 w-full px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors"
            >
              Skanna igen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}