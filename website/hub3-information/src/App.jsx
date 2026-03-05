import { useState, useRef, useCallback } from 'react';
import Header from './components/Header';
import NJZGrid from './components/NJZGrid';
import DirectorySearch from './components/DirectorySearch';
import MembershipTiers from './components/MembershipTiers';
import CompressionPanel from './components/CompressionPanel';

function App() {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const directorySearchRef = useRef(null);

  // Expose method to open mobile search
  const handleSearchClick = useCallback(() => {
    setIsMobileSearchOpen(true);
  }, []);

  return (
    <div className="info-hub">
      <Header onSearchClick={handleSearchClick} />
      <main className="hub-main">
        <NJZGrid />
        <DirectorySearch 
          ref={directorySearchRef}
          isMobileSearchOpen={isMobileSearchOpen}
          setIsMobileSearchOpen={setIsMobileSearchOpen}
        />
        <MembershipTiers />
        <CompressionPanel />
      </main>
    </div>
  );
}

export default App;