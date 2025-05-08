import React from 'react';
import { FieldHistoryEntry, fieldLabels } from '../types';
import { History, Edit, User } from 'lucide-react';

interface FieldHistoryListProps {
  history: FieldHistoryEntry[];
}

export function FieldHistoryList({ history }: FieldHistoryListProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <History className="h-12 w-12 mx-auto mb-2" />
        <p>Ingen ändringshistorik tillgänglig</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((entry) => (
        <div
          key={entry.id}
          className="bg-white p-4 rounded-lg shadow border border-gray-200"
        >
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Edit className="h-4 w-4 text-blue-600" />
              <span className="font-medium">
                {fieldLabels[entry.fieldName as keyof typeof fieldLabels] || entry.fieldName}
              </span>
              <span className="text-sm text-gray-500">
                {new Date(entry.createdAt).toLocaleDateString('sv-SE', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>

            <div className="text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">Från:</span>
                <span>{entry.oldValue || '-'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">Till:</span>
                <span>{entry.newValue || '-'}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{entry.performedBy}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}