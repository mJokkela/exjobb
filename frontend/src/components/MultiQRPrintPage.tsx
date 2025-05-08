import React, { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { SparePart } from '../types';

interface MultiQRPrintPageProps {
  parts: SparePart[];
}

// Base64 encoded SVG placeholder - simple "no image" icon with transparent background
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGM0Y0RjYiLz48cGF0aCBkPSJNODUgOTVIMTE1TTEwMCA4MFYxMTAiIHN0cm9rZT0iI0Q1RDZEQiIgc3Ryb2tlLXdpZHRoPSI4IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=';

export const MultiQRPrintPage = forwardRef<HTMLDivElement, MultiQRPrintPageProps>(({ parts }, ref) => {
  return (
    <div ref={ref} className="bg-white">
      {parts.map((part) => (
        // Each QR code gets its own A4 page
        <div 
          key={part.internalArticleNumber} 
          className="w-[210mm] h-[297mm] p-8 flex items-center justify-center page-break"
          style={{ pageBreakAfter: 'always' }}
        >
          <div className="max-w-[300px] mx-auto">
            <div className="flex flex-col items-center gap-6">
              {/* QR Code */}
              <div className="w-full aspect-square max-w-[200px]">
                <QRCodeSVG
                  value={part.internalArticleNumber}
                  size={200}
                  level="H"
                  includeMargin={true}
                  className="w-full h-full"
                />
              </div>

              {/* Product Image */}
              <div className="w-full aspect-square max-w-[200px]">
                {part.imageUrl ? (
                  <img
                    src={part.imageUrl}
                    alt={part.name}
                    className="w-full h-full object-contain rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                    <img
                      src={PLACEHOLDER_IMAGE}
                      alt="Ingen bild tillgänglig"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-2 text-center">
                <p className="text-xl font-bold">{part.internalArticleNumber}</p>
                <p className="text-gray-600">{part.name}</p>
                <p className="text-sm text-gray-500">
                  Lagerplats: {part.location}
                  {part.building && ` • ${part.building}`}
                  {part.storageRack && ` • ${part.storageRack}`}
                  {part.shelfLevel && ` • ${part.shelfLevel}`}
                </p>
              </div>

              {/* Print Info */}
              <div className="mt-4 text-xs text-gray-400 print:text-gray-500">
                Utskriven {new Date().toLocaleDateString('sv-SE')}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

MultiQRPrintPage.displayName = 'MultiQRPrintPage';