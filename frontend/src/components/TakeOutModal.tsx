
import React from 'react';

interface TakeOutModalProps {
  selectedPart: any;
  quantityToRemove: number;
  setQuantityToRemove: (value: number) => void;
  onClose: () => void;
  onConfirm: () => void;
}

const TakeOutModal: React.FC<TakeOutModalProps> = ({
  selectedPart,
  quantityToRemove,
  setQuantityToRemove,
  onClose,
  onConfirm,
}) => {
  if (!selectedPart) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96">
        <h2 className="text-xl font-semibold mb-4">
          Ta ut reservdel: {selectedPart.name}
        </h2>
        <label className="block mb-2">Antal att ta ut:</label>
        <input
          type="number"
          min={0}
          max={selectedPart.quantity}
          value={quantityToRemove}
          onChange={(e) => setQuantityToRemove(Number(e.target.value))}
          className="w-full border rounded px-2 py-1 mb-4"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Avbryt</button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Ta ut
          </button>
        </div>
      </div>
    </div>
  );
};

export default TakeOutModal;
