import React, { useState, useEffect, useRef } from 'react';
import { Plus, Image as ImageIcon, X } from 'lucide-react';
import { SparePart } from '../types';
import { uploadImage, deleteImage } from '../api';

interface SparePartFormProps {
  onAdd: (part: SparePart) => void;
  initialData?: SparePart | null;
}

const users = [
  'Andreas Milton',
  'Mikael Gilén',
  'Janne Kummelås',
  'Fredrik Holgersson',
  'Andreas Sandberg',
  'Annan'
];


const defaultFormValues: SparePart = {
  internalArticleNumber: '',
  supplierArticleNumber: '',
  name: '',
  type: '',
  department: '',
  roomSection: '',
  machineNumber: '',
  dimensions: {
    length: 0,
    height: 0,
    width: 0,
  },
  weight: 0,
  manufacturer: '',
  supplier: '',
  supplierOrgId: '',
  price: 0,
  location: '',
  building: '',
  storageRack: '',
  shelfLevel: '',
  quantity: 0,
  date: '',
  storagePriority: 3,
  addedBy: 'Andreas Milton',
  ordererName: '',
  imageUrl: '',
  comment: ''
};

export function SparePartForm({ onAdd, initialData }: SparePartFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formValues, setFormValues] = useState<SparePart>(initialData || defaultFormValues);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormValues({
        ...defaultFormValues,
        ...initialData,
        dimensions: {
          length: initialData.dimensions?.length || 0,
          height: initialData.dimensions?.height || 0,
          width: initialData.dimensions?.width || 0,
        }
      });
      if (initialData.imageUrl) {
        setPreviewUrl(initialData.imageUrl);
      }
    }
  }, [initialData]);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Define allowed MIME types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

    // Validate file type
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setUploadError('Endast JPG, PNG och GIF-filer är tillåtna');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Bilden får inte vara större än 5MB');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    try {
      setIsUploading(true);
      setUploadError('');

      // skapa prew url
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // ladda upp bild och ta emot url
      if (!formValues.internalArticleNumber) {
        alert("Fyll i 'Internt artikelnummer' innan du laddar upp bild.");
        return;
      }

      const { imageUrl } = await uploadImage(file, formValues.internalArticleNumber);

      setFormValues({ ...formValues, imageUrl });

      // städa upp prew url
      URL.revokeObjectURL(preview);
      setPreviewUrl(imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadError('Ett fel uppstod vid uppladdning av bilden');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    if (formValues.imageUrl) {
      try {
        await deleteImage(formValues.imageUrl);
        setFormValues({ ...formValues, imageUrl: '' });
        setPreviewUrl(null);
      } catch (error) {
        console.error('Error removing image:', error);
        setUploadError('Ett fel uppstod när bilden skulle tas bort');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const newPart: SparePart = {
      internalArticleNumber: formData.get('internalArticleNumber') as string || '',
      supplierArticleNumber: formData.get('supplierArticleNumber') as string || '',
      name: formData.get('name') as string || '',
      type: formData.get('type') as string || '',
      department: formData.get('department') as string || '',
      roomSection: formData.get('roomSection') as string || '',
      machineNumber: formData.get('machineNumber') as string || '',
      dimensions: {
        length: Number(formData.get('length')) || 0,
        height: Number(formData.get('height')) || 0,
        width: Number(formData.get('width')) || 0,
      },
      weight: Number(formData.get('weight')) || 0,
      manufacturer: formData.get('manufacturer') as string || '',
      supplier: formData.get('supplier') as string || '',
      supplierOrgId: formData.get('supplierOrgId') as string || '',
      price: Number(formData.get('price')) || 0,
      location: formData.get('location') as string || '',
      building: formData.get('building') as string || '',
      storageRack: formData.get('storageRack') as string || '',
      shelfLevel: formData.get('shelfLevel') as string || '',
      quantity: Number(formData.get('quantity')) || 0,
      date: formData.get('date') as string || '',
      storagePriority: Number(formData.get('storagePriority')) || 3,
      addedBy: (formData.get('addedBy') as string) || 'Andreas Milton',
      ordererName: formData.get('ordererName') as string || '',
      imageUrl: formValues.imageUrl || '',
      comment: formData.get('comment') as string || ''
    };

      // console.log('Ska spara reservdel:', newPart);
      
    onAdd(newPart);
    e.currentTarget.reset();
    setFormValues(defaultFormValues);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Grundinformation</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700">Internt artikelnummer *</label>
            <input
              required
              type="text"
              name="internalArticleNumber"
              value={formValues.internalArticleNumber}
              onChange={(e) => setFormValues({ ...formValues, internalArticleNumber: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Leverantörens artikelnummer</label>
            <input
              type="text"
              name="supplierArticleNumber"
              value={formValues.supplierArticleNumber}
              onChange={(e) => setFormValues({ ...formValues, supplierArticleNumber: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Benämning *</label>
            <input
              required
              type="text"
              name="name"
              value={formValues.name}
              onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Typ</label>
            <input
              type="text"
              name="type"
              value={formValues.type}
              onChange={(e) => setFormValues({ ...formValues, type: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Ange typ..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Produktbild</label>
            <div className="mt-1 space-y-2">
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Produktbild"
                    className="h-32 w-32 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 p-1 bg-red-100 rounded-full text-red-600 hover:bg-red-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handleImageChange}
                    disabled={isUploading}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ImageIcon className="h-5 w-5 mr-2 text-gray-400" />
                    {isUploading ? 'Laddar upp...' : 'Välj bild'}
                  </button>
                </div>
              )}
              {uploadError && (
                <p className="text-sm text-red-600">{uploadError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Platsinfo</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700">Lagerplats *</label>
            <input
              required
              type="text"
              name="location"
              value={formValues.location}
              onChange={(e) => setFormValues({ ...formValues, location: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Lagerbyggnad</label>
            <input
              type="text"
              name="building"
              value={formValues.building}
              onChange={(e) => setFormValues({ ...formValues, building: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Pallställage/Skåp</label>
            <input
              type="text"
              name="storageRack"
              value={formValues.storageRack}
              onChange={(e) => setFormValues({ ...formValues, storageRack: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Hyllplan</label>
            <input
              type="text"
              name="shelfLevel"
              value={formValues.shelfLevel}
              onChange={(e) => setFormValues({ ...formValues, shelfLevel: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Dimensions */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Dimensioner</h3>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Längd (mm)</label>
              <input
                type="number"
                name="length"
                value={formValues.dimensions.length}
                onChange={(e) => setFormValues({
                  ...formValues,
                  dimensions: { ...formValues.dimensions, length: Number(e.target.value) }
                })}
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Höjd (mm)</label>
              <input
                type="number"
                name="height"
                value={formValues.dimensions.height}
                onChange={(e) => setFormValues({
                  ...formValues,
                  dimensions: { ...formValues.dimensions, height: Number(e.target.value) }
                })}
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Bredd (mm)</label>
              <input
                type="number"
                name="width"
                value={formValues.dimensions.width}
                onChange={(e) => setFormValues({
                  ...formValues,
                  dimensions: { ...formValues.dimensions, width: Number(e.target.value) }
                })}
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Vikt (kg)</label>
            <input
              type="number"
              name="weight"
              value={formValues.weight}
              onChange={(e) => setFormValues({ ...formValues, weight: Number(e.target.value) })}
              min="0"
              step="0.1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Supplier Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Leverantörsinformation</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tillverkare</label>
            <input
              type="text"
              name="manufacturer"
              value={formValues.manufacturer}
              onChange={(e) => setFormValues({ ...formValues, manufacturer: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Leverantör</label>
            <input
              type="text"
              name="supplier"
              value={formValues.supplier}
              onChange={(e) => setFormValues({ ...formValues, supplier: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Leverantör ORG.ID</label>
            <input
              type="text"
              name="supplierOrgId"
              value={formValues.supplierOrgId}
              onChange={(e) => setFormValues({ ...formValues, supplierOrgId: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Stock Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Lagerinformation</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700">Pris (tkr)</label>
            <input
              type="number"
              name="price"
              value={formValues.price}
              onChange={(e) => setFormValues({ ...formValues, price: Number(e.target.value) })}
              min="0"
              step="0.1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Antal *</label>
            <input
              required
              type="number"
              name="quantity"
              value={formValues.quantity}
              onChange={(e) => setFormValues({ ...formValues, quantity: Number(e.target.value) })}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Övrig information</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700">Datum</label>
            <input
              type="date"
              name="date"
              value={formValues.date}
              onChange={(e) => setFormValues({ ...formValues, date: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Lagerprioritering</label>
            <select
              name="storagePriority"
              value={formValues.storagePriority}
              onChange={(e) => setFormValues({ ...formValues, storagePriority: Number(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5].map(level => (
                <option key={level} value={level}>
                  {level} - {level === 1 ? 'Högst' : level === 5 ? 'Lägst' : 'Medium'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Inlagd Av</label>
            <select
              name="addedBy"
              value={formValues.addedBy}
              onChange={(e) =>
                setFormValues({ ...formValues, addedBy: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {users.map(name => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Beställarens namn</label>
        <input
          type="text"
          name="ordererName"
          value={formValues.ordererName}
          onChange={(e) => setFormValues({ ...formValues, ordererName: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Kommentar</label>
        <textarea
          name="comment"
          value={formValues.comment}
          onChange={(e) => setFormValues({ ...formValues, comment: e.target.value })}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Lägg till en kommentar om beställningen..."
        />
      </div>

      <div className="mt-6">
        <button
          type="submit"
          disabled={isUploading}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4 mr-2" />
          {initialData ? 'Uppdatera reservdel' : 'Lägg till reservdel'}
        </button>
      </div>
    </form>
  );
}