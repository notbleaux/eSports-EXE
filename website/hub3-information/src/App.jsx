import Header from './components/Header';
import NJZGrid from './components/NJZGrid';
import DirectorySearch from './components/DirectorySearch';
import MembershipTiers from './components/MembershipTiers';
import CompressionPanel from './components/CompressionPanel';

function App() {
  return (
    <div className="info-hub">
      <Header />
      <main className="hub-main">
        <NJZGrid />
        <DirectorySearch />
        <MembershipTiers />
        <CompressionPanel />
      </main>
    </div>
  );
}

export default App;