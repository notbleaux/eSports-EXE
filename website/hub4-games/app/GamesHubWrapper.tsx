'use client';

import dynamic from 'next/dynamic';
import { Header } from '@/components/Header';
import ErrorBoundary from './ErrorBoundaryWrapper';

// Dynamic import for better performance (Next.js code splitting)
const TorusFlowHero = dynamic(() => import('@/components/TorusFlowHero').then(mod => ({ default: mod.TorusFlowHero })), {
  loading: () => <SectionLoader />,
  ssr: false
});

const DownloadSection = dynamic(() => import('@/components/DownloadSection').then(mod => ({ default: mod.DownloadSection })), {
  loading: () => <SectionLoader />,
  ssr: false
});

const KnowledgeBase = dynamic(() => import('@/components/KnowledgeBase').then(mod => ({ default: mod.KnowledgeBase })), {
  loading: () => <SectionLoader />,
  ssr: false
});

const LivePlatformCTA = dynamic(() => import('@/components/LivePlatformCTA').then(mod => ({ default: mod.LivePlatformCTA })), {
  loading: () => <SectionLoader />,
  ssr: false
});

// Loading fallback component
function SectionLoader() {
  return (
    <div style={{ 
      minHeight: '300px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'rgba(255, 255, 255, 0.02)'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(255, 255, 255, 0.1)',
        borderTop: '3px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function GamesHub() {
  return (
    <ErrorBoundary>
      <main className="games-hub">
        <Header />
        <TorusFlowHero />
        <DownloadSection />
        <KnowledgeBase />
        <LivePlatformCTA />
      </main>
    </ErrorBoundary>
  );
}
