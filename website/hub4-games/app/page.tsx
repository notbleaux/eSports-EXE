import { Header } from '@/components/Header';
import { TorusFlowHero } from '@/components/TorusFlowHero';
import { DownloadSection } from '@/components/DownloadSection';
import { KnowledgeBase } from '@/components/KnowledgeBase';
import { LivePlatformCTA } from '@/components/LivePlatformCTA';

export default function GamesHub() {
  return (
    <main className="games-hub">
      <Header />
      <TorusFlowHero />
      <DownloadSection />
      <KnowledgeBase />
      <LivePlatformCTA />
    </main>
  );
}
