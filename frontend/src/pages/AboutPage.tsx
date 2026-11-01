import React from 'react';
import { 
  Compass, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  ShieldCheck, 
  Sparkles,
  FileCheck
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      {/* Hero */}
      <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-850 text-white rounded-3xl p-8 md:p-10 border border-navy-800 shadow-xl">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/20 text-electric-300 text-xs font-semibold w-max mb-4 border border-electric-400/30">
          <Compass className="w-3.5 h-3.5" />
          <span>Evidence Intelligence Platform</span>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          GapGlint: The Evidence Intelligence Platform
        </h1>

        <p className="text-electric-400 font-semibold text-base mt-2">
          See the Gaps. Trace the Claims. Decide with Evidence.
        </p>

        <p className="text-slate-300 text-sm mt-4 leading-relaxed max-w-3xl">
          Most modern search engines index what exists, and summarization engines condense whatever text is fed to them. 
          Neither tells you what is missing, what is contradictory, or whether the gathered evidence is sufficient to make 
          a high-stakes decision. GapGlint solves this fundamental blind spot.
        </p>
      </div>

      {/* The Problem & The Solution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-sm mb-3">
            <AlertTriangle className="w-4 h-4" />
            <span>The Real-World Problem</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            People rely on online information for life-altering decisions regarding education, scholarships, visa policies, 
            research grants, and business ventures. However:
          </p>
          <ul className="mt-4 space-y-2.5 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold">•</span>
              <span><strong>Scattered Sources:</strong> Information is fragmented across disparate portals, brochures, and forums.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold">•</span>
              <span><strong>Outdated Guidance:</strong> Superseded policies remain indexed online without clear invalidation warnings.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold">•</span>
              <span><strong>Conflicting Stipulations:</strong> Different official documents frequently state inconsistent deadlines and criteria.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold">•</span>
              <span><strong>Silent Omissions:</strong> Vital requirements (hidden renewal conditions, exclusions, processing fees) go unmentioned.</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card">
          <div className="flex items-center gap-2 text-electric-600 font-bold text-sm mb-3">
            <ShieldCheck className="w-4 h-4" />
            <span>The GapGlint Solution</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            GapGlint shifts from passive summarization to proactive evidence intelligence:
          </p>
          <ul className="mt-4 space-y-2.5 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span><strong>Atomic Claim Extraction:</strong> Deconstructs multiple sources into verifiable factual claims with exact citations.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span><strong>Contradiction Mapping:</strong> Cross-checks statements across sources to highlight direct discrepancies.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span><strong>Negative Space Discovery:</strong> Identifies unaddressed prerequisites and critical decision gaps.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span><strong>Verification Action Checklist:</strong> Generates prioritized inquiries for users to take directly to primary authorities.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Architecture Highlights */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-card">
        <h3 className="text-base font-bold text-slate-900 tracking-tight mb-4">
          Core Architectural Principles
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="p-2 w-max rounded-lg bg-blue-100 text-electric-600 mb-3">
              <Layers className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">Grounding Over Hallucination</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Strictly distinguishes sourced information from AI reasoning, maintaining complete traceability back to original document excerpts.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="p-2 w-max rounded-lg bg-indigo-100 text-indigo-600 mb-3">
              <FileCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">Multi-Modal Ingestion</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Handles online URLs, PDF manuals, and manual note excerpts to synthesize unified evidence pools.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="p-2 w-max rounded-lg bg-emerald-100 text-emerald-600 mb-3">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">Actionable Diligence</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Outputs practical, structured next steps rather than overwhelming walls of unverified text.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
