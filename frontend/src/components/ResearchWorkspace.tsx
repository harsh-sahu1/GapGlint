import React, { useState, useRef } from 'react';
import { 
  Search, 
  Link2, 
  Upload, 
  Plus, 
  ArrowRight, 
  Loader2, 
  FileUp, 
  AlignLeft,
  AlertCircle
} from 'lucide-react';
import { Source } from '../types';
import { SourceList } from './SourceList';

interface ResearchWorkspaceProps {
  topic: string;
  setTopic: (v: string) => void;
  question: string;
  setQuestion: (v: string) => void;
  currentUrl: string;
  setCurrentUrl: (v: string) => void;
  manualText: string;
  setManualText: (v: string) => void;
  sources: Source[];
  onAddUrl: (url?: string) => boolean;
  onAddPdf: (file: File) => boolean;
  onAddManualText: () => boolean;
  onRemoveSource: (id: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  notification: string | null;
}

export const ResearchWorkspace: React.FC<ResearchWorkspaceProps> = ({
  topic,
  setTopic,
  question,
  setQuestion,
  currentUrl,
  setCurrentUrl,
  manualText,
  setManualText,
  sources,
  onAddUrl,
  onAddPdf,
  onAddManualText,
  onRemoveSource,
  onAnalyze,
  isAnalyzing,
  notification
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'pdf' | 'text'>('url');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAddUrl();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        onAddPdf(files[i]);
      }
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        onAddPdf(e.dataTransfer.files[i]);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 md:p-7">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 mb-6 border-b border-slate-100 gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-electric-600"></span>
            Investigation Scope & Sources
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Provide the domain or goal, target questions, and multi-source evidence references.
          </p>
        </div>

        {notification && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700 animate-fadeIn">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{notification}</span>
          </div>
        )}
      </div>

      <div className="space-y-5">
        {/* Topic Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Research Topic or Domain <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., DAAD Doctoral Scholarship Eligibility & Funding Stipulations (2025/2026)"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-electric-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Question Textarea */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Specific Research Questions or Critical Decision Criteria
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            placeholder="e.g., What are the mandatory minimum GRE scores, annual renewal constraints, and official exclusions for concurrent funding?"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-electric-500 focus:border-transparent transition-all resize-y"
          />
        </div>

        {/* Source Ingestion Tabs */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Add Evidence Sources
            </span>
            <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setActiveTab('url')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'url' ? 'bg-white text-electric-600 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                URL Web Link
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pdf')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'pdf' ? 'bg-white text-electric-600 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                <FileUp className="w-3.5 h-3.5" />
                PDF Document
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'text' ? 'bg-white text-electric-600 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
                Manual Excerpt
              </button>
            </div>
          </div>

          {/* URL Tab */}
          {activeTab === 'url' && (
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Link2 className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  value={currentUrl}
                  onChange={(e) => setCurrentUrl(e.target.value)}
                  onKeyDown={handleUrlKeyDown}
                  placeholder="https://official-portal.org/scholarships/guidelines.html"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-electric-500 focus:border-transparent transition-all"
                />
              </div>
              <button
                type="button"
                onClick={() => onAddUrl()}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add Source
              </button>
            </div>
          )}

          {/* PDF Tab */}
          {activeTab === 'pdf' && (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf,.pdf"
                multiple
                className="hidden"
              />
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-electric-500 bg-electric-50/50'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/60 hover:border-slate-300'
                }`}
              >
                <div className="mx-auto w-10 h-10 rounded-full bg-electric-50 text-electric-600 flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  Drop official PDF guidelines here, or <span className="text-electric-600 underline">browse</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports multi-page policy manuals, notices, brochures (up to 4MB each for serverless processing)
                </p>
              </div>
            </div>
          )}

          {/* Manual Text Tab */}
          {activeTab === 'text' && (
            <div className="space-y-2">
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                rows={3}
                placeholder="Paste press release quote, meeting minutes excerpt, email response, or unformatted notes..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-electric-500 focus:border-transparent transition-all resize-y"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onAddManualText}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Stage Text Note
                </button>
              </div>
            </div>
          )}

          {/* Staged Sources List */}
          <SourceList sources={sources} onRemoveSource={onRemoveSource} />
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="font-semibold text-slate-700">{sources.length} sources staged</span>
            <span>• Cross-validation matrix ready</span>
          </div>

          <button
            type="button"
            onClick={onAnalyze}
            disabled={isAnalyzing || (!topic.trim() && sources.length === 0)}
            className="w-full sm:w-auto px-6 py-3 bg-electric-600 hover:bg-electric-700 disabled:bg-slate-300 text-white font-semibold text-sm rounded-xl transition-all shadow-card hover:shadow-glow flex items-center justify-center gap-2 disabled:cursor-not-allowed cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Ingesting & Mapping Sources...</span>
              </>
            ) : (
              <>
                <span>Analyse Evidence Gaps</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
