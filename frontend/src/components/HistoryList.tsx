import React from 'react';
import { HistoryEntry } from '../types';
import { History, ArrowUpRight, ArrowDownRight, User, MessageSquare } from 'lucide-react';

interface HistoryListProps {
  history: HistoryEntry[];
}

export function HistoryList({ history }: HistoryListProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <History className="h-12 w-12 mx-auto mb-2" />
        <p>Ingen historik tillgänglig</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((entry, idx) => (
        <div key={entry.id ?? idx} className="bg-white p-4 rounded-lg shadow border border-gray-200">
          
          {/* 1. Artikelnummer + namn */}
          <div className="mb-2 text-sm font-medium text-gray-700">
            {entry.partNumber}
          </div>

          {/* 2. Typ + datum */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {entry.actionType === 'ADDITION' ? (
                <div className="flex items-center text-green-600">
                  <ArrowUpRight className="h-5 w-5" />
                  <span className="font-medium">Tillagt</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <ArrowDownRight className="h-5 w-5" />
                  <span className="font-medium">Uttag</span>
                </div>
              )}
            </div>
            <span className="text-sm text-gray-500">
              {new Date(entry.createdAt).toLocaleString('sv-SE', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>

          {/* 3. Antal före → efter */}
          <div className="text-sm mb-2">
            <span className="font-medium">Antal:</span>{' '}
            <span className="text-gray-900">{entry.previousQuantity}</span>{' '}
            <span className="text-gray-500 mx-2">→</span>{' '}
            <span className="text-gray-900">{entry.newQuantity}</span>
          </div>

          {/* 4. Användare */}
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
            <User className="h-4 w-4" />
            <span>{entry.performedBy}</span>
          </div>

          {/* 5. Kommentar, om den finns */}
          {entry.comment && (
            <div className="flex items-start space-x-2 text-sm text-gray-600">
              <MessageSquare className="h-4 w-4 mt-0.5" />
              <p className="whitespace-pre-wrap">{entry.comment}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}