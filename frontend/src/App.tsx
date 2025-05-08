import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { SparePartList } from './components/SparePartList';
import { AdminPage } from './components/AdminPage';
import { QRScanner } from './components/QRScanner';
import { SparePart, AppSettings } from './types';
import { Shield, Scan, Menu } from 'lucide-react';
import { getSpareParts, getAppSettings, insertSparePart, updateQuantity, importParts } from './api';

function App() {
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [parts, appSettings] = await Promise.all([
          getSpareParts(),
          getAppSettings()
        ]);
        setSpareParts(parts);
        setSettings(appSettings);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const handleAddPart = async (part: SparePart) => {
    try {
      await insertSparePart(part);
      setSpareParts(prevParts => [...prevParts, part]);
    } catch (error) {
      console.error('Error adding part:', error);
      alert('Ett fel uppstod när reservdelen skulle läggas till');
    }
  };

  const handlePartsUpdate = async (newParts: SparePart[]) => {
    try {
      await importParts(newParts);
      setSpareParts(newParts);
    } catch (error) {
      console.error('Error updating parts:', error);
      alert('Ett fel uppstod när reservdelarna skulle uppdateras');
    }
  };

  const handleUpdateQuantity = async (articleNumber: string, newQuantity: number): Promise<void> => {
    try {
      await updateQuantity(articleNumber, newQuantity);
      setSpareParts(parts =>
        parts.map(part =>
          part.internalArticleNumber === articleNumber
            ? { ...part, quantity: newQuantity }
            : part
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
      throw new Error('Ett fel uppstod när antalet skulle uppdateras');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laddar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-1">
              <img
                src={"logo.png"}
                alt="Suzuki Garphyttan"
                className="h-12 cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => navigate('/')}
              />
              <div className="flex items-center">
                <span className="mx-1 text-black text-2xl">|</span>
                <span className="text-2xl italic font-light tracking-wide font-['Palatino'] text-black">
                  Lagerhantering
                </span>
              </div>
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-expanded={isMenuOpen}
              >
                <span className="sr-only">Öppna meny</span>
                <Menu className="h-6 w-6" />
              </button>
            </div>

            <nav className="hidden md:flex space-x-4">
              <Link to="/" className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === '/' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>Översikt</Link>
              <Link to="/scan" className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${location.pathname === '/scan' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                <Scan className="h-4 w-4 mr-1" /> Skanna QR
              </Link>
              <Link to="/admin" className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${location.pathname === '/admin' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                <Shield className="h-4 w-4 mr-1" /> Admin
              </Link>
            </nav>
          </div>

          <div className={`md:hidden transition-all duration-200 ease-in-out ${isMenuOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200">
              <Link to="/" className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>Översikt</Link>
              <Link to="/scan" className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/scan' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                <Scan className="h-4 w-4 mr-2" /> Skanna QR
              </Link>
              <Link to="/admin" className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/admin' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                <Shield className="h-4 w-4 mr-2" /> Admin
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<SparePartList parts={spareParts} onPartsUpdate={handlePartsUpdate} />} />
          <Route path="/scan" element={<QRScanner parts={spareParts} onUpdateQuantity={handleUpdateQuantity} />} />
          <Route path="/admin" element={<AdminPage onAddPart={handleAddPart} parts={spareParts} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
