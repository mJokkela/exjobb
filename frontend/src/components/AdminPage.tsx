import React, { useRef, useState } from 'react';
import { SparePartForm } from './SparePartForm';
import { SparePart } from '../types';
import { Shield, Upload, Image as ImageIcon, Package, Archive, PenTool as Tool } from 'lucide-react';
import { read, utils } from 'xlsx';
import { uploadImage, uploadLogo, updateAppSettings } from '../api';

interface AdminPageProps {
  onAddPart: (part: SparePart) => void;
  parts: SparePart[];
}

export function AdminPage({ onAddPart, parts }: AdminPageProps) {
  const [importedPart, setImportedPart] = useState<SparePart | null>(null);
  const [importError, setImportError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Calculate statistics safely with default values
  const totalParts = parts.length;
  const totalInStock = parts.reduce((sum, part) => sum + (part.quantity || 0), 0);
  
  // Calculate type statistics
  const typeStats = parts.reduce((acc, part) => {
    const type = part.type || 'Ospecificerad';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sort types by count
  const sortedTypes = Object.entries(typeStats)
    .sort(([, a], [, b]) => b - a);

  const getTypeColor = (index: number) => {
    const colors = [
      'bg-blue-50 text-blue-700',
      'bg-green-50 text-green-700',
      'bg-yellow-50 text-yellow-700',
      'bg-purple-50 text-purple-700',
      'bg-pink-50 text-pink-700',
      'bg-indigo-50 text-indigo-700'
    ];
    return colors[index % colors.length];
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setImportError('');
      const file = event.target.files?.[0];
      if (!file) return;

      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        setImportError('Filen innehåller ingen data.');
        return;
      }

      // Take the first row of data
      const row = jsonData[0] as any;

      const importedData: SparePart = {
        internalArticleNumber: row['Art. Nr In.']?.toString() || '',
        supplierArticleNumber: row['Art. Nr Lev.']?.toString() || '',
        name: row['Benämning']?.toString() || '',
        type: row['Typ/Till']?.toString() || '',
        department: row['Avdelning']?.toString() || '',
        roomSection: row['Rum/Sektion']?.toString() || '',
        machineNumber: row['Maskin Nr']?.toString() || '',
        dimensions: {
          length: Number(row['Längd']) || 0,
          height: Number(row['Höjd']) || 0,
          width: Number(row['Bredd']) || 0,
        },
        weight: Number(row['Vikt']) || 0,
        manufacturer: row['Tillverkare']?.toString() || '',
        supplier: row['Leverantör']?.toString() || '',
        supplierOrgId: row['Lev. ORG.ID']?.toString() || '',
        price: Number(row['Pris Tkr']) || 0,
        location: row['Lagerplats']?.toString() || '',
        quantity: Number(row['Antal']) || 0,
        date: row['Datum']?.toString() || '',
        storagePriority: Number(row['Lagerprioritering']) || 3,
        addedBy: row['Inlagd av']?.toString() || 'Andreas Milton',
        ordererName: row['Beställares Namn']?.toString() || '',
        building: row['Byggnad']?.toString() || '',
        storageRack: row['Lagringsställ']?.toString() || '',
        shelfLevel: row['Hyllplan']?.toString() || '',

      };

      setImportedPart(importedData);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportError('Ett fel uppstod vid import av data. Kontrollera att filen har rätt format.');
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');

    try {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Bilden får inte vara större än 5MB');
      }

      const logoUrl = await uploadLogo(file);
      await updateAppSettings({ logoUrl });
      
      // Refresh to show new logo
      window.location.reload();
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      setUploadError(error.message || 'Ett fel uppstod vid uppladdning av logotypen');
    } finally {
      setIsUploading(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const handleSparePartImageUpload = async () => {
    if (!imageFile || !importedPart) return;
    try {
      const { imageUrl } = await uploadImage(imageFile, importedPart.internalArticleNumber);
      setImportedPart({ ...importedPart, imageUrl });
    } catch (error) {
      console.error('Image upload failed', error);
      alert('Uppladdning av reservdelsbild misslyckades');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 shadow rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Administrera Reservdelar
            </h2>
          </div>
          <div className="flex space-x-2">
            <label className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Importera Excel
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <label className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isUploading ? 'bg-green-500 cursor-wait' : 'bg-green-600 hover:bg-green-700 cursor-pointer'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}>
              <ImageIcon className="h-4 w-4 mr-2" />
              {isUploading ? 'Laddar upp...' : 'Ändra logotyp'}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif"
                onChange={handleLogoUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>
        </div>

        {importError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{importError}</p>
          </div>
        )}

        {uploadError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{uploadError}</p>
          </div>
        )}

        <p className="text-gray-600 mb-6">
          Här kan du lägga till nya reservdelar i systemet. Alla fält markerade med * är obligatoriska.
          Du kan också importera data från en Excel-fil för att fylla i formuläret automatiskt.
        </p>
        <SparePartForm onAdd={onAddPart} initialData={importedPart} />

        {importedPart && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Ladda upp bild för reservdelen</h4>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="mb-2"
            />
            <button
              onClick={handleSparePartImageUpload}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm"
            >
              Ladda upp bild
            </button>
  </div>
)}

      </div>

      <div className="bg-white p-4 shadow rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Statistik
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <p className="text-sm text-blue-600 font-medium">Totalt antal artiklar</p>
            </div>
            <p className="text-2xl font-bold text-blue-800 mt-1">{totalParts}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Archive className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-600 font-medium">Totalt i lager</p>
            </div>
            <p className="text-2xl font-bold text-green-800 mt-1">{totalInStock}</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center space-x-2 mb-4">
            <Tool className="h-5 w-5 text-gray-600" />
            <h4 className="text-lg font-medium text-gray-900">Fördelning per typ</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {sortedTypes.map(([type, count], index) => (
              <div key={type} className={`${getTypeColor(index)} p-4 rounded-lg`}>
                <div className="flex items-center justify-between">
                  <p className="font-medium">{type}</p>
                  <p className="text-sm opacity-75">
                    {Math.round((count / totalParts) * 100)}%
                  </p>
                </div>
                <p className="text-2xl font-bold mt-2">{count}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}