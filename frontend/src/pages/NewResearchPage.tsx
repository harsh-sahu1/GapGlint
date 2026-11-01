import React from 'react';
import { Sparkles, GraduationCap, Briefcase, Landmark } from 'lucide-react';
import { ResearchWorkspace } from '../components/ResearchWorkspace';
import { Source } from '../types';

interface NewResearchPageProps {
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

export const NewResearchPage: React.FC<NewResearchPageProps> = (props) => {
  const templates = [
    {
      category: 'Education & Scholarships',
      icon: GraduationCap,
      topic: 'Erasmus Mundus Joint Masters Scholarship 2026/2027',
      question: 'What are the exact monthly stipend amounts, TOEFL minimums, and country of residence eligibility limits?',
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      category: 'Public Services & Visa',
      icon: Landmark,
      topic: 'German Opportunity Card (Chancenkarte) Point Matrix',
      question: 'Are unaccredited foreign vocational degrees accepted, and how much blocked account capital is required?',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    },
    {
      category: 'Career & Industry Grants',
      icon: Briefcase,
      topic: 'EU Horizon Europe Research SME Grant Participation',
      question: 'What is the match-funding percentage required and are private consultants eligible as co-leads?',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header card */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-card">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-electric-600 mb-2">
          <Sparkles className="w-4 h-4" />
          <span>New Investigation Studio</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Initiate Multi-Source Evidence Mining
        </h2>
        <p className="text-slate-500 text-sm mt-2 max-w-2xl">
          Enter your critical decision goal, formulate probing questions, and stage authoritative URLs, PDFs, or manual excerpts.
        </p>

        {/* Templates */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-3">
            Quick-start investigation templates:
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {templates.map((tpl, i) => {
              const Icon = tpl.icon;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    props.setTopic(tpl.topic);
                    props.setQuestion(tpl.question);
                  }}
                  className="p-4 rounded-xl border border-slate-200 hover:border-electric-400 bg-slate-50 hover:bg-white transition-all text-left group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`p-1.5 rounded-lg border text-xs font-semibold ${tpl.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-semibold text-slate-600">{tpl.category}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-electric-600">
                    {tpl.topic}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {tpl.question}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <ResearchWorkspace {...props} />
    </div>
  );
};
