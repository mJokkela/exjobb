import React, { useRef, useState } from 'react';
import { SparePart, HistoryEntry, FieldHistoryEntry } from '../types';
import { Package, Search, Filter, FileText, Download, QrCode, Edit, Trash, MoreVertical, Image as ImageIcon, X, MinusCircle, CheckCircle, MessageSquare, ChevronDown, ChevronUp, SortAsc, History, MapPin, Printer, CheckSquare, Square } from 'lucide-react';
import { utils, writeFile, read } from 'xlsx';
import ReactToPrint from 'react-to-print';
import { ProductPDF } from './ProductPDF';
import { QRPrintPage } from './QRPrintPage';
import { MultiQRPrintPage } from './MultiQRPrintPage';
import { SparePartForm } from './SparePartForm';
import { ImageModal } from './ImageModal';
// import { HistoryList } from './HistoryList';
// import { FieldHistoryList } from './FieldHistoryList';
import { HistoryOverview } from './HistoryOverview';
import { getPartHistory, uploadImage, deletePart, updateQuantity } from '../api';
import TakeOutModal from './TakeOutModal';



interface SparePartListProps {
  parts: SparePart[];
  onPartsUpdate?: (parts: SparePart[]) => void;
}

type SortField = 'name' | 'date' | 'price';


export function SparePartList({ parts, onPartsUpdate }: SparePartListProps) {
  const qrPrintRef = useRef<HTMLDivElement>(null);
  const productPrintRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfPrintRef = useRef<HTMLDivElement>(null);
  const multiPrintRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [showQRPrint, setShowQRPrint] = useState(false);
  const [showPDFPrint, setShowPDFPrint] = useState(false);
  const [showProductInfo, setShowProductInfo] = useState(false);
  const [importError, setImportError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<{ url: string; alt: string } | null>(null);
  const [showTakeOutModal, setShowTakeOutModal] = useState(false);
  const [quantityToRemove, setQuantityToRemove] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [withdrawalInfo, setWithdrawalInfo] = useState<{ part: SparePart; removed: number; remaining: number } | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [quantityHistory, setQuantityHistory] = useState<HistoryEntry[]>([]);
  const [fieldHistory, setFieldHistory] = useState<FieldHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showHistoryOverview, setShowHistoryOverview] = useState(false);
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Sort parts alphabetically by name
  const sortedParts = [...parts].sort((a, b) => {
    switch (sortField) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'date':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'price':
        return a.price - b.price;
      default:
        return 0;
    }
  });

  const PLACEHOLDER_IMAGE = 'data:image/svg+xml;utf8,' +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="#f3f4f6"/>
        <path d="M40 140 L80 100 L120 140 L160 80" stroke="#cbd5e0" stroke-width="10" fill="none"/>
        <circle cx="60" cy="60" r="12" fill="#cbd5e0"/>
      </svg>
    `);
  // const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;



  const filteredParts = sortedParts.filter(part =>
    Object.values(part).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );


  const togglePartSelection = (articleNumber: string) => {
    const newSelection = new Set(selectedParts);
    if (newSelection.has(articleNumber)) {
      newSelection.delete(articleNumber);
    } else {
      newSelection.add(articleNumber);
    }
    setSelectedParts(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedParts.size === filteredParts.length) {
      setSelectedParts(new Set());
    } else {
      setSelectedParts(new Set(filteredParts.map(p => p.internalArticleNumber)));
    }
  };

  const exportSelectedToExcel = () => {
    const selectedPartsData = parts.filter(part =>
      selectedParts.has(part.internalArticleNumber)
    );
    const worksheet = utils.json_to_sheet(selectedPartsData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Reservdelar');
    writeFile(workbook, 'valda_reservdelar.xlsx');
  };

  const loadHistory = async (articleNumber: string) => {
    setIsLoadingHistory(true);
    try {
      const [qHistory] = await Promise.all([
        getPartHistory(articleNumber),
        // getFieldHistory(articleNumber)
      ]);
      setQuantityHistory(qHistory);
      // setFieldHistory(fHistory);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const toggleComment = (articleNumber: string) => {
    const newExpandedComments = new Set(expandedComments);
    if (newExpandedComments.has(articleNumber)) {
      newExpandedComments.delete(articleNumber);
    } else {
      newExpandedComments.add(articleNumber);
    }
    setExpandedComments(newExpandedComments);
  };

  const formatComment = (comment: string, articleNumber: string) => {
    const isExpanded = expandedComments.has(articleNumber);
    const shouldTruncate = comment.length > 30 && !isExpanded;

    if (shouldTruncate) {
      return (
        <div className="group">
          <p className="text-sm">
            {comment.slice(0, 30)}...{' '}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleComment(articleNumber);
              }}
              className="text-gray-900 hover:text-gray-600 inline-flex items-center"
            >
              Visa mer
              <ChevronDown className="h-4 w-4 ml-1" />
            </button>
          </p>
        </div>
      );
    }

    if (isExpanded) {
      return (
        <div>
          <p className="text-sm whitespace-pre-wrap">{comment}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleComment(articleNumber);
            }}
            className="text-gray-900 hover:text-gray-600 inline-flex items-center mt-1"
          >
            Visa mindre
            <ChevronUp className="h-4 w-4 ml-1" />
          </button>
        </div>
      );
    }

    return <p className="text-sm">{comment}</p>;
  };

  // const handleEditPart = async (updatedPart: SparePart) => {
  //   try {
  //     await insertSparePart(updatedPart);
  //     if (onPartsUpdate) {
  //       const updatedParts = parts.map(part => 
  //         part.internalArticleNumber === updatedPart.internalArticleNumber ? updatedPart : part
  //       );
  //       onPartsUpdate(updatedParts);
  //     }
  //     setIsEditing(false);
  //     setSelectedPart(null);
  //     setShowProductInfo(false);
  //   } catch (error) {
  //     console.error('Error updating part:', error);
  //     alert('Ett fel uppstod när reservdelen skulle uppdateras');
  //   }
  // };

  const handleEditPart = async (updatedPart: SparePart) => {
    try {


      // 1) Uppdatera bara kvantiteten via PUT (endast en del)
      await updateQuantity(
        updatedPart.internalArticleNumber,
        updatedPart.quantity,
        'Manual update',
        'Quantity updated through edit modal'
      );

      // 2) Hämta just den här delens nya historikposter
      const newEvents = await getPartHistory(
        updatedPart.internalArticleNumber
      );

      // 3) Mixa in dem i quantityHistory‐state
      setQuantityHistory(prev =>
        [...newEvents, ...prev].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );

      // 4) Uppdatera local state för listan
      if (onPartsUpdate) {
        const updatedParts = parts.map(part =>
          part.internalArticleNumber === updatedPart.internalArticleNumber
            ? updatedPart
            : part
        );
        onPartsUpdate(updatedParts);
      }
    }
    finally {
      setIsEditing(false);
      setSelectedPart(null);
      setShowProductInfo(false);
    }
  };

  const handleDeletePart = async (articleNumber: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna reservdel?')) {
      return;
    }

    try {
      await deletePart(articleNumber);
      if (onPartsUpdate) {
        const updatedParts = parts.filter(part => part.internalArticleNumber !== articleNumber);
        onPartsUpdate(updatedParts);
      }
    } catch (error) {
      console.error('Error deleting part:', error);
      alert('Ett fel uppstod när reservdelen skulle tas bort');
    }
  };

  const handleTakeOut = async () => {
    if (selectedPart) {
      const newQuantity = Math.max(0, selectedPart.quantity - quantityToRemove);
      try {
        await updateQuantity(
          selectedPart.internalArticleNumber,
          newQuantity,
          'Manual withdrawal',
          'Quantity updated through take-out modal'
        );

        const newEvents = await getPartHistory(selectedPart.internalArticleNumber);

        setQuantityHistory(prev =>
          [...newEvents, ...prev].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );

        if (onPartsUpdate) {
          const updatedParts = parts.map(part =>
            part.internalArticleNumber === selectedPart.internalArticleNumber
              ? { ...part, quantity: newQuantity }
              : part
          );
          onPartsUpdate(updatedParts);
        }
        setWithdrawalInfo({
          part: selectedPart,
          removed: quantityToRemove,
          remaining: newQuantity
        });
        setShowSuccess(true);
        setShowTakeOutModal(false);
      } catch (error) {
        console.error('Error updating quantity:', error);
        alert('Ett fel uppstod när antalet skulle uppdateras');
      }
    }
  };

  const handleStartNew = () => {
    setShowSuccess(false);
    setWithdrawalInfo(null);
    setSelectedPart(null);
    setQuantityToRemove(1);
  };

  const exportToExcel = () => {
    const worksheet = utils.json_to_sheet(parts);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Reservdelar');
    writeFile(workbook, 'reservdelar.xlsx');
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setImportError('');

    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet);

      if (onPartsUpdate) {
        onPartsUpdate(jsonData as SparePart[]);
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportError('Ett fel uppstod vid import av filen. Kontrollera filformatet och försök igen.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId && !(event.target as Element).closest('.dropdown-menu')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdownId]);

  if (showSuccess && withdrawalInfo) {
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
                {withdrawalInfo.removed} st {withdrawalInfo.part.name}
              </p>
              <p className="text-gray-600">
                Kvar i lager: {withdrawalInfo.remaining} st
              </p>
              <p className="text-sm text-gray-500">
                Lagerplats: {withdrawalInfo.part.location}
              </p>
            </div>
            <button
              onClick={handleStartNew}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Tillbaka till översikten
            </button>
          </div>
        </div>
      </div>
    );
  }




  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-md">
        {/* Search and Actions Bar */}
        <div className="flex flex-col space-y-4 mb-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Sök..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="border rounded px-2 py-1 shadow-sm text-sm"
            >
              <option value="name">Sortera: Namn</option>
              <option value="date">Sortera: Datum</option>
              <option value="price">Sortera: Pris</option>
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleSelectAll}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                {selectedParts.size === filteredParts.length ? (
                  <CheckSquare className="h-4 w-4 mr-2" />
                ) : (
                  <Square className="h-4 w-4 mr-2" />
                )}
                {selectedParts.size > 0 ? `Valda (${selectedParts.size})` : 'Välj alla'}
              </button>

              {selectedParts.size > 0 && (
                <>
                  <button
                    onClick={() => {
                      setShowQRPrint(true);
                      setSelectedPart(parts.find(p => p.internalArticleNumber === Array.from(selectedParts)[0]) || null);
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Skriv ut QR-koder
                  </button>
                  <button
                    onClick={() => setShowPDFPrint(true)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Skriv ut PDF
                  </button>
                  <button
                    onClick={exportSelectedToExcel}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportera valda
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => setShowHistoryOverview(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <History className="h-4 w-4 mr-2" />
              Visa historik
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center">
              <Filter className="h-5 w-5 text-gray-400 mr-2" />
              <span>Visar {filteredParts.length} av {parts.length}</span>
            </div>
          </div>
        </div>

        {/* Parts List */}
        <div className="space-y-4">
          {filteredParts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">Inga reservdelar hittades</p>
            </div>
          ) : (

            filteredParts.map((part) => {
              const imageUrl = part.imageUrl || PLACEHOLDER_IMAGE;

              return (

                <div key={part.internalArticleNumber} className="bg-white border rounded-lg shadow-sm p-4">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        {/* Selection checkbox */}
                        <button
                          onClick={() => togglePartSelection(part.internalArticleNumber)}
                          className="mt-1"
                        >
                          {selectedParts.has(part.internalArticleNumber) ? (
                            <CheckSquare className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Square className="h-5 w-5 text-gray-400" />
                          )}
                        </button>

                        {/* Image */}
                        <div
                          className="h-16 w-16 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 cursor-pointer transition-transform hover:scale-105"
                          onClick={() => imageUrl && setZoomedImage({ url: imageUrl, alt: part.name })}
                        >

                          {imageUrl ? (
                            <>
                              {/* {console.log('Image URL:', imageUrl)} */}
                              <img
                                src={imageUrl}
                                alt={part.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                                }}
                              />
                            </>
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}

                        </div>

                        {/* Basic Info */}
                        <div>
                          <h3 className="text-sm font-medium text-blue-600 flex items-center gap-1 cursor-pointer"
                            onClick={() => {
                              setSelectedPart(part);
                              setShowProductInfo(true);
                              loadHistory(part.internalArticleNumber);
                            }}>
                            <FileText className="h-4 w-4" />
                            {part.internalArticleNumber}
                          </h3>
                          <p className="text-sm font-medium text-gray-900 mt-1">{part.name}</p>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-500">
                            <div>
                              <span className="font-medium">Typ:</span> {part.type || '-'}
                            </div>
                            <div>
                              <span className="font-medium">Antal:</span> {part.quantity}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions Dropdown */}
                      <div className="relative dropdown-menu">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(openDropdownId === part.internalArticleNumber ? null : part.internalArticleNumber);
                          }}
                          className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        {openDropdownId === part.internalArticleNumber && (
                          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                            <div className="py-1" role="menu">
                              <button
                                onClick={async () => {
                                  setSelectedPart(part);
                                  setShowTakeOutModal(true);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              >
                                <MinusCircle className="h-4 w-4 mr-2" />
                                Ta ut
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPart(part);
                                  setIsEditing(true);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Redigera
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPart(part);
                                  setShowQRPrint(true);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              >
                                <QrCode className="h-4 w-4 mr-2" />
                                Skriv ut QR-kod
                              </button>
                              <button
                                onClick={() => {
                                  handleDeletePart(part.internalArticleNumber);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Ta bort
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Location Info Row */}
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">Plats:</span>
                      </div>
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div className="bg-green-50 px-2 py-1 rounded">
                          <span className="text-green-700">{part.location || 'Linslageriet'}</span>
                        </div>
                        <div className="bg-blue-50 px-2 py-1 rounded">
                          <span className="text-blue-700">{part.storageRack || '-'}</span>
                        </div>
                        <div className="bg-yellow-50 px-2 py-1 rounded">
                          <span className="text-yellow-700">{part.building || '-'}</span>
                        </div>
                        <div className="bg-red-50 px-2 py-1 rounded">
                          <span className="text-red-700">{part.shelfLevel || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Comment Section */}
                    {part.comment && (
                      <div className="flex items-start gap-1 text-gray-600">
                        <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {formatComment(part.comment, part.internalArticleNumber)}
                      </div>
                    )}
                  </div>
                </div>
              );
            }))}
        </div>
      </div>

      {/* Hidden print container for multiple parts */}
      <div style={{ display: 'none' }}>
        <div ref={multiPrintRef}>
          {Array.from(selectedParts).map(articleNumber => {
            const part = parts.find(p => p.internalArticleNumber === articleNumber);
            return part ? (
              <div key={part.internalArticleNumber} className="page-break">
                <ProductPDF part={part} />
              </div>
            ) : null;
          })}
        </div>
      </div>

      {/* QR Print Modal */}
      {selectedPart && showQRPrint && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-4 md:p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Skriv ut QR-kod{selectedParts.size > 1 ? 'er' : ''}
              </h2>
              <button
                onClick={() => {
                  setSelectedPart(null);
                  setShowQRPrint(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="preview-content">
              {selectedParts.size > 1 ? (
                <MultiQRPrintPage
                  ref={qrPrintRef}
                  parts={parts.filter(p => selectedParts.has(p.internalArticleNumber))}
                />
              ) : (
                <QRPrintPage ref={qrPrintRef} part={selectedPart} />
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <ReactToPrint
                trigger={() => (
                  <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <QrCode className="h-4 w-4 mr-2" />
                    Skriv ut QR-kod{selectedParts.size > 1 ? 'er' : ''}
                  </button>
                )}
                content={() => qrPrintRef.current}
                onAfterPrint={() => {
                  setShowQRPrint(false);
                  setSelectedPart(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* PDF Print Modal */}
      {showPDFPrint && selectedParts.size > 0 && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-4 md:p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Skriv ut produktinformation ({selectedParts.size} {selectedParts.size === 1 ? 'artikel' : 'artiklar'})
              </h2>
              <button
                onClick={() => setShowPDFPrint(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="preview-content max-h-[calc(100vh-300px)] overflow-y-auto">
              <div ref={pdfPrintRef}>
                {Array.from(selectedParts).map(articleNumber => {
                  const part = parts.find(p => p.internalArticleNumber === articleNumber);
                  return part ? (
                    <div key={part.internalArticleNumber} className="page-break">
                      <ProductPDF part={part} />
                    </div>
                  ) : null;
                })}
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <ReactToPrint
                trigger={() => (
                  <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <Printer className="h-4 w-4 mr-2" />
                    Skriv ut PDF
                  </button>
                )}
                content={() => pdfPrintRef.current}
                onAfterPrint={() => setShowPDFPrint(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Product Info Modal */}
      {selectedPart && showProductInfo && !isEditing && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-4 md:p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Produktinformation
              </h2>
              <button
                onClick={() => {
                  setSelectedPart(null);
                  setShowProductInfo(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
              <ProductPDF ref={productPrintRef} part={selectedPart} />
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsEditing(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Edit className="h-4 w-4 mr-2" />
                Redigera
              </button>
              <ReactToPrint
                trigger={() => (
                  <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                    <FileText className="h-4 w-4 mr-2" />
                    Skriv ut
                  </button>
                )}
                content={() => productPrintRef.current}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && selectedPart && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-4 md:p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Redigera Reservdel
              </h2>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedPart(null);
                  setShowProductInfo(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ladda upp ny bild</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => setImageFile(e.target.files?.[0] || null)}
                className="block w-full mb-2"
              />
              <button
                disabled={!imageFile || isUploading}
                onClick={async () => {
                  if (!imageFile || !selectedPart) return;
                  setIsUploading(true);
                  setUploadError('');
                  try {
                    const { imageUrl } = await uploadImage(imageFile, selectedPart.internalArticleNumber);
                    // Uppdatera selectedPart med nya url
                    setSelectedPart({ ...selectedPart, imageUrl });
                    // Nollställ file input
                    setImageFile(null);
                  } catch (err) {
                    setUploadError('Kunde inte ladda upp bild');
                  } finally {
                    setIsUploading(false);
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm"
              >
                {isUploading ? 'Laddar upp...' : 'Ladda upp bild'}
              </button>
              {uploadError && <div className="text-red-600 mt-1">{uploadError}</div>}
              {selectedPart.imageUrl && (
                <img src={selectedPart.imageUrl} alt="Uppladdad bild" className="h-20 mt-2 rounded shadow" />
              )}
            </div>
            <SparePartForm
              onAdd={handleEditPart}
              initialData={selectedPart}
            />
          </div>
        </div>
      )}

      {/* History Overview Modal */}
      {showHistoryOverview && (
        <HistoryOverview
          parts={parts}
          onClose={() => setShowHistoryOverview(false)}
        />
      )}

      {/* Image Modal */}
      {zoomedImage && (
        <ImageModal
          imageUrl={zoomedImage.url}
          alt={zoomedImage.alt}
          onClose={() => setZoomedImage(null)}
        />
      )}

      {showTakeOutModal && selectedPart && (
        <TakeOutModal
          selectedPart={selectedPart}
          onClose={() => setShowTakeOutModal(false)}
          quantityToRemove={quantityToRemove}
          setQuantityToRemove={setQuantityToRemove}
          onConfirm={handleTakeOut}
        />
      )}

    </div>
  );
}