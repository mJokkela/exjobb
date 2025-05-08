export interface SparePart {
  internalArticleNumber: string;  // Art. Nr In.
  supplierArticleNumber: string;  // Art. Nr Lev.
  name: string;                   // Benämn.
  type: string;                   // Typ/Till
  department: string;             // Avd.
  roomSection: string;            // Rum/Sek
  machineNumber: string;          // Maskin Nr
  dimensions: {
    length: number;              // Längd
    height: number;              // Höjd
    width: number;               // Bredd
  };
  weight: number;                // Vikt
  manufacturer: string;          // Tillverkare
  supplier: string;              // Leverantör
  supplierOrgId: string;         // Lev. ORG.ID
  price: number;                 // Pris. Tkr
  location: string;              // Lag. Plats
  building: string;              // Lagerbyggnad
  storageRack: string;          // Pallställage/Skåp
  shelfLevel: string;           // Hyllplan
  quantity: number;              // Antal
  date: string;                  // Datum
  storagePriority: number;       // Lag. Prio
  addedBy: string;          // Inlagd Av
  ordererName: string;           // Beställares Namn
  imageUrl?: string;             // Bild URL
  comment?: string;              // Kommentar
}

export interface AppSettings {
  logoUrl: string;
}

export interface HistoryEntry {
  id: string;
  partNumber: string;
  actionType: 'WITHDRAWAL' | 'ADDITION';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  performedBy: string;
  comment?: string;
  createdAt: string;
}

export interface FieldHistoryEntry {
  id: string;
  partNumber: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  performedBy: string;
  createdAt: string;
}

export type Category = 'PUMP' | 'MOTOR' | 'FILTER' | 'VALVE' | 'OTHER';

export const categories: Category[] = ['PUMP', 'MOTOR', 'FILTER', 'VALVE', 'OTHER'];

export const pumpTypes = ['Centrifugal', 'Diafragma', 'Kolvpump', 'Kugghjulspump'];
export const motorTypes = ['AC', 'DC', 'Stegmotor', 'Servomotor'];
export const filterTypes = ['Luftfilter', 'Oljefilter', 'Hydraulikfilter'];
export const valveTypes = ['Kulventil', 'Backventil', 'Magnetventil'];

export const priorityLevels = [1, 2, 3, 4, 5];  // 1 = Highest, 5 = Lowest

export const fieldLabels: Record<keyof Omit<SparePart, 'dimensions'>, string> = {
  internalArticleNumber: 'Internt artikelnummer',
  supplierArticleNumber: 'Leverantörens artikelnummer',
  name: 'Benämning',
  type: 'Typ',
  department: 'Avdelning',
  roomSection: 'Rum/Sektion',
  machineNumber: 'Maskinnummer',
  weight: 'Vikt',
  manufacturer: 'Tillverkare',
  supplier: 'Leverantör',
  supplierOrgId: 'Leverantör ORG.ID',
  price: 'Pris',
  location: 'Lagerplats',
  building: 'Lagerbyggnad',
  storageRack: 'Pallställage/Skåp',
  shelfLevel: 'Hyllplan',
  quantity: 'Antal',
  date: 'Datum',
  storagePriority: 'Lagerprioritering',
  addedBy: 'Inlagd av',
  ordererName: 'Beställares namn',
  imageUrl: 'Produktbild',
  comment: 'Kommentar'
};