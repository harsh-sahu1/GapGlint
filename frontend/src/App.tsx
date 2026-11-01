import React, { useState } from 'react';
import { DashboardLayout } from './layouts/DashboardLayout';
import { OverviewPage } from './pages/OverviewPage';
import { NewResearchPage } from './pages/NewResearchPage';
import { HistoryPage } from './pages/HistoryPage';
import { AboutPage } from './pages/AboutPage';
import { useResearch } from './hooks/useResearch';
import { NavSection } from './types';

export const App: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<NavSection>('overview');
  
  const research = useResearch();

  const renderContent = () => {
    switch (currentSection) {
      case 'overview':
        return (
          <OverviewPage
            topic={research.topic}
            setTopic={research.setTopic}
            question={research.question}
            setQuestion={research.setQuestion}
            currentUrl={research.currentUrl}
            setCurrentUrl={research.setCurrentUrl}
            manualText={research.manualText}
            setManualText={research.setManualText}
            sources={research.sources}
            onAddUrl={research.addUrlSource}
            onAddPdf={research.addPdfSource}
            onAddManualText={research.addManualTextSource}
            onRemoveSource={research.removeSource}
            onAnalyze={research.handleAnalyze}
            isAnalyzing={research.isAnalyzing}
            notification={research.notification}
            errorMessage={research.errorMessage}
            onDismissError={() => research.setErrorMessage(null)}
            analysisResult={research.analysisResult}
            onToggleChecklistItem={research.toggleChecklistItem}
          />
        );
      case 'new-research':
        return (
          <NewResearchPage
            topic={research.topic}
            setTopic={research.setTopic}
            question={research.question}
            setQuestion={research.setQuestion}
            currentUrl={research.currentUrl}
            setCurrentUrl={research.setCurrentUrl}
            manualText={research.manualText}
            setManualText={research.setManualText}
            sources={research.sources}
            onAddUrl={research.addUrlSource}
            onAddPdf={research.addPdfSource}
            onAddManualText={research.addManualTextSource}
            onRemoveSource={research.removeSource}
            onAnalyze={research.handleAnalyze}
            isAnalyzing={research.isAnalyzing}
            notification={research.notification}
          />
        );
      case 'history':
        return (
          <HistoryPage
            onStartNew={() => setCurrentSection('overview')}
            activeTopic={research.topic}
            sourceCount={research.sources.length}
          />
        );
      case 'about':
        return <AboutPage />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      currentSection={currentSection}
      onSelectSection={setCurrentSection}
      sourceCount={research.sources.length}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default App;
