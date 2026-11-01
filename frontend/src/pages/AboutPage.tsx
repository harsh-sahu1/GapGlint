import React, { useState } from 'react';
import { 
  Compass, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  ShieldCheck, 
  Sparkles,
  FileCheck,
  Linkedin,
  Mail,
  Send,
  Copy,
  Check,
  MessageSquare,
  ExternalLink
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSendFeedback = () => {
    const trimmed = feedbackText.trim();
    if (!trimmed) {
      setFeedbackError('Please enter your feedback before sending.');
      return;
    }

    setFeedbackError(null);
    const recipient = 'harshsahu280413@gmail.com';
    const subject = encodeURIComponent('GapGlint - User Feedback');
    const body = encodeURIComponent(trimmed);
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
  };

  const handleCopyFeedback = async () => {
    const trimmed = feedbackText.trim();
    if (!trimmed) {
      setFeedbackError('Please enter your feedback before copying.');
      return;
    }

    try {
      await navigator.clipboard.writeText(trimmed);
      setCopied(true);
      setFeedbackError(null);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setFeedbackError('Could not copy automatically. Please select and copy manually.');
    }
  };

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

      {/* Developer Profile Section */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-card relative overflow-hidden">
        {/* Subtle decorative glow in top right */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-electric-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 md:gap-8 relative z-10">
          {/* Left Side: Photograph */}
          <div className="flex-shrink-0 relative group">
            <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 rounded-2xl overflow-hidden border-2 border-electric-500/40 shadow-lg shadow-electric-600/10 ring-4 ring-electric-500/10 bg-navy-950 flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.02]">
              <img 
                src="/harsh-sahu.jpg" 
                alt="Harsh Sahu - Founder & Developer of GapGlint" 
                className="w-full h-full object-cover object-top"
                loading="eager"
              />
            </div>
            {/* Status indicator pill */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-navy-950 text-white text-[10px] font-semibold border border-navy-800 shadow-sm whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Lead Architect</span>
            </div>
          </div>

          {/* Right Side: Information & Action Buttons */}
          <div className="flex-1 flex flex-col justify-between text-center sm:text-left pt-1">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-electric-50 text-electric-700 text-xs font-semibold mb-2.5 border border-electric-200/60">
                <Sparkles className="w-3.5 h-3.5 text-electric-600" />
                <span>Founder &amp; Developer of GapGlint</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Harsh Sahu
              </h3>

              <p className="text-xs sm:text-sm font-semibold text-electric-600 mt-1">
                Built with curiosity. Driven by innovation.
              </p>

              <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed max-w-2xl">
                &ldquo;Building technology that makes information more transparent, accessible and reliable.&rdquo;
              </p>
            </div>

            {/* Contact Action Buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <a
                href="https://www.linkedin.com/in/harshsahu01/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-700 text-white text-xs font-semibold shadow-sm hover:shadow transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-electric-500 focus:ring-offset-2"
              >
                <Linkedin className="w-4 h-4" />
                <span>CONNECT ON LINKEDIN</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <a
                href="mailto:harshsahu280413@gmail.com"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 text-xs font-semibold shadow-xs transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              >
                <Mail className="w-4 h-4 text-electric-600" />
                <span>CONTACT VIA EMAIL</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback & Suggestions Section */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-card">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-electric-50 border border-electric-200/80 flex items-center justify-center text-electric-600 flex-shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Have an idea to make GapGlint better?
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Every suggestion matters. Share your ideas, report an issue, or suggest a feature that could make GapGlint more useful.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <textarea
            value={feedbackText}
            onChange={(e) => {
              setFeedbackText(e.target.value);
              if (feedbackError) setFeedbackError(null);
            }}
            placeholder="Share your suggestions, ideas or feedback..."
            rows={4}
            className="w-full rounded-2xl border border-slate-200 p-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20 outline-none transition-all resize-y shadow-inner"
          />

          {feedbackError && (
            <p className="text-xs text-rose-600 font-medium animate-fadeIn">
              {feedbackError}
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-slate-400">
              Direct recipient: <span className="text-slate-600 font-medium">harshsahu280413@gmail.com</span>
            </p>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleCopyFeedback}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200 transition-colors"
                title="Copy feedback text to clipboard if default email client is unavailable"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSendFeedback}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-electric-600 hover:bg-electric-700 text-white text-xs font-semibold shadow-sm hover:shadow transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-electric-500 focus:ring-offset-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Feedback</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
