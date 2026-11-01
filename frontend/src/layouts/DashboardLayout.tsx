import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { NavSection } from '../types';

interface DashboardLayoutProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  sourceCount: number;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentSection,
  onSelectSection,
  sourceCount,
  children
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* Collapsible Deep Navy Sidebar */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={onSelectSection}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(prev => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        <Header 
          currentSection={currentSection} 
          sourceCount={sourceCount} 
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

