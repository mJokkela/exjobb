import React, { forwardRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { SparePart } from '../types';
import { MapPin, ImageIcon, Package, PenTool as Tool, Truck, Info } from 'lucide-react';

interface ProductPDFProps {
  part: SparePart;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;



// Base64 encoded SVG placeholder - simple "no image" icon with transparent background
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;utf8,' +
encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="#f3f4f6"/>
    <path d="M40 140 L80 100 L120 140 L160 80" stroke="#cbd5e0" stroke-width="10" fill="none"/>
    <circle cx="60" cy="60" r="12" fill="#cbd5e0"/>
  </svg>
`);



export const ProductPDF = forwardRef<HTMLDivElement, ProductPDFProps>(({ part }, ref) => {
  const [imageError, setImageError] = useState(false);

  const imageUrl = part.imageUrl
  ? `${API_BASE_URL}${part.imageUrl}`
  : PLACEHOLDER_IMAGE;


  return (
    <div ref={ref} className="p-8 bg-white print:p-4 w-[210mm] mx-auto">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{part.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Package className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600 text-sm">#{part.internalArticleNumber}</span>
            {part.type && (
              <>
                <span className="text-gray-400">•</span>
                <Tool className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600 text-sm">{part.type}</span>
              </>
            )}
          </div>
        </div>
        <div className="text-center">
          <QRCodeSVG value={part.internalArticleNumber} size={80} level="H" includeMargin={true} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div>
          {/* Product Image */}
          <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden mb-4">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={part.name}
                className="w-full h-full object-contain"
                onError={(e) => (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE
                }
          
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <ImageIcon className="h-12 w-12 mb-2" />
                <span className="text-sm">Ingen bild</span>
              </div>
            )}
          </div>

          {/* Basic Specifications */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Specifikationer
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600">Mått (L×H×B)</p>
                <p className="font-medium">{part.dimensions.length}×{part.dimensions.height}×{part.dimensions.width} mm</p>
              </div>
              <div>
                <p className="text-gray-600">Vikt</p>
                <p className="font-medium">{part.weight || '-'} kg</p>
              </div>
              <div>
                <p className="text-gray-600">Pris</p>
                <p className="font-medium">{part.price || '-'} tkr</p>
              </div>
              <div>
                <p className="text-gray-600">Antal</p>
                <p className="font-medium">{part.quantity}</p>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-blue-50 rounded-lg p-3 mt-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Lagerplats
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white bg-opacity-50 p-2 rounded">
                <p className="text-xs text-blue-700">Huvudplats</p>
                <p className="font-medium text-blue-900">{part.location}</p>
              </div>
              <div className="bg-white bg-opacity-50 p-2 rounded">
                <p className="text-xs text-blue-700">Byggnad</p>
                <p className="font-medium text-blue-900">{part.building || '-'}</p>
              </div>
              <div className="bg-white bg-opacity-50 p-2 rounded">
                <p className="text-xs text-blue-700">Pallställage/Skåp</p>
                <p className="font-medium text-blue-900">{part.storageRack || '-'}</p>
              </div>
              <div className="bg-white bg-opacity-50 p-2 rounded">
                <p className="text-xs text-blue-700">Hyllplan</p>
                <p className="font-medium text-blue-900">{part.shelfLevel || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Supplier Information */}
          <div className="bg-yellow-50 rounded-lg p-3">
            <h3 className="text-sm font-semibold text-yellow-900 mb-2 flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Leverantörsinformation
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-yellow-700">Leverantörens artikelnummer</p>
                <p className="font-medium text-yellow-900">{part.supplierArticleNumber || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-yellow-700">Tillverkare</p>
                <p className="font-medium text-yellow-900">{part.manufacturer || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-yellow-700">Leverantör</p>
                <p className="font-medium text-yellow-900">{part.supplier || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-yellow-700">ORG.ID</p>
                <p className="font-medium text-yellow-900">{part.supplierOrgId || '-'}</p>
              </div>
            </div>
          </div>

          {/* Stock Information */}
          <div className="bg-green-50 rounded-lg p-3">
            <h3 className="text-sm font-semibold text-green-900 mb-2">Lagerinformation</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-green-700">Senast uppdaterad</p>
                <p className="font-medium text-green-900">{part.date || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-green-700">Beställare</p>
                <p className="font-medium text-green-900">{part.ordererName || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-green-700">Lagerprioritering</p>
                <p className="font-medium text-green-900">{part.storagePriority}</p>
              </div>
              <div>
                <p className="text-xs text-green-700">Inlagd av</p>
                <p className="font-medium text-green-900">{part.addedBy}</p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {part.comment && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Kommentar</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{part.comment}</p>
            </div>
          )}
        </div>
      </div>

      {/* Print Footer */}
      <div className="mt-4 pt-2 border-t text-xs text-gray-500 text-center">
        <p>Utskriven {new Date().toLocaleDateString('sv-SE')}</p>
      </div>
    </div>
  );
});

ProductPDF.displayName = 'ProductPDF';