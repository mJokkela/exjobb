import React, { useState, useEffect } from 'react';
import { HistoryEntry, FieldHistoryEntry, SparePart } from '../types';
import { HistoryList } from './HistoryList';
import { FieldHistoryList } from './FieldHistoryList';
import { History, Edit, X, Search } from 'lucide-react';
import { getPartHistory, getFieldHistory } from '../api';

interface HistoryOverviewProps {
  onClose: () => void;
  parts: SparePart[];
}

export function HistoryOverview({ onClose, parts }: HistoryOverviewProps) {
  const [quantityHistory, setQuantityHistory] = useState<HistoryEntry[]>([]);
  const [fieldHistory, setFieldHistory] = useState<FieldHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'quantity' | 'fields'>('quantity');

  useEffect(() => {
    console.log('🔍 Parts to fetch history for:', parts);
    const loadAllHistory = async () => {
      setIsLoading(true);
      try {
        // 1) Hämta historik för varenda part parallellt
        const quantityResults = await Promise.all(
          parts.map(p => getPartHistory(p.internalArticleNumber))
        );
        const fieldResults = await Promise.all(
          parts.map(p => getFieldHistory(p.internalArticleNumber))
        );

        console.log('🔍 quantityResults per part:', quantityResults);
        console.log('🔍 fieldResults per part:   ', fieldResults);
  
        // 2) Platta ut till två enkla arrayer
        const allQuantity = quantityResults
          .flat()
          .map(item => ({
            ...item,
            actionType:
              item.newQuantity < item.previousQuantity
                ? 'WITHDRAWAL'
                : 'ADDITION'
          }));
        const allField    = fieldResults.flat();
  
        
  
        // 3) Sortera så det nyaste kommer först, och ersätt state med HELA arrayen
        setQuantityHistory(
           allQuantity.sort((a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
        );

        setFieldHistory(
          allField.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );

      } catch (err) {
        console.error('Misslyckades hämta historik för alla delar', err);
      } finally {
        setIsLoading(false);
      }
    };
  
    loadAllHistory();
  }, []);  // ← effekt körs när “parts” ändras eller komponenten mountas
  

  const getPartName = (articleNumber: string) => {
    const part = parts.find(p => p.internalArticleNumber === articleNumber);
    return part ? part.name : articleNumber;
  };

  const filteredQuantityHistory = quantityHistory.filter(entry => {
    // Hämta partName och se till att det alltid är en sträng
    const partName = getPartName(entry.partNumber) ?? '';
    // Gör söktermen säker
    const searchLower = (searchTerm ?? '').toLowerCase();
  
    return (
      // Skydda entry.partNumber
      (entry.partNumber ?? '').toLowerCase().includes(searchLower) ||
      // Skydda partName
      partName.toLowerCase().includes(searchLower) ||
      // Skydda entry.performedBy
      (entry.performedBy ?? '').toLowerCase().includes(searchLower)
    );
  });
  

  const filteredFieldHistory = fieldHistory.filter(entry => {
    const partName = getPartName(entry.partNumber);
    const searchLower = searchTerm.toLowerCase();
    return (
      entry.partNumber.toLowerCase().includes(searchLower) ||
      partName.toLowerCase().includes(searchLower) ||
      entry.performedBy.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Historik</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Sök på artikelnummer, namn eller användare..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mb-4 border-b border-gray-200">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('quantity')}
              className={`py-2 px-3 border-b-2 font-medium text-sm ${
                activeTab === 'quantity'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <History className="h-4 w-4" />
                <span>Lagerhistorik</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('fields')}
              className={`py-2 px-3 border-b-2 font-medium text-sm ${
                activeTab === 'fields'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Edit className="h-4 w-4" />
                <span>Ändringshistorik</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Laddar historik...</p>
            </div>
            ) : activeTab === 'quantity' ? (
                  <HistoryList
                      history={quantityHistory.map(entry => ({
                        ...entry,    // id, partNumber, actionType, previousQuantity, newQuantity, performedBy, comment, createdAt
                        partNumber: `${entry.partNumber} – ${getPartName(entry.partNumber)}`
                      }))}
                  />
          ) : (
                  <FieldHistoryList
                      history={fieldHistory.map(entry => ({
                        ...entry,
                        partNumber: `${entry.partNumber} – ${getPartName(entry.partNumber)}`
                      }))}
                  />
          )}
        </div>
      </div>
    </div>
  );
}