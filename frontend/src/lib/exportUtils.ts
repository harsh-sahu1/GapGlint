import { AnalysisResponse } from '../types';

export function downloadJsonReport(data: AnalysisResponse) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const filename = `GapGlint_${sanitizeFilename(data.topic)}_${Date.now()}.json`;
  triggerDownload(blob, filename);
}

export function downloadMarkdownReport(data: AnalysisResponse) {
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let md = `# GapGlint Evidence Intelligence Dossier\n\n`;
  md += `> **Tagline:** See the Gaps. Trace the Claims. Decide with Evidence.\n`;
  md += `> **Generated on:** ${dateStr} | **Session ID:** \`${data.session_id}\`\n\n`;
  md += `---\n\n`;

  // Research Scope
  md += `## 1. Research Scope & Inquiry\n\n`;
  md += `- **Topic / Goal:** ${data.topic}\n`;
  if (data.question) {
    md += `- **Decision Question:** ${data.question}\n`;
  }
  md += `- **Total Sources Ingested:** ${data.sources.length} (${data.metrics.sources_analysed} verified, ${data.extraction_failures?.length || 0} failed)\n\n`;

  // Decision Readiness Indicator
  md += `## 2. Decision Readiness Assessment\n\n`;
  md += `| Metric | Assessment |\n`;
  md += `|---|---|\n`;
  md += `| **Overall Readiness Score** | **${data.decision_readiness.score}/100 (${data.decision_readiness.level})** |\n`;
  md += `| **Available Grounded Claims** | ${data.decision_readiness.available_info_count} verifiable propositions |\n`;
  md += `| **Identified Information Gaps** | ${data.decision_readiness.missing_info_count} unaddressed questions |\n`;
  md += `| **Unresolved Potential Conflicts** | ${data.decision_readiness.unresolved_conflicts_count} cross-document contradictions |\n`;
  md += `| **Completed Verifications** | ${data.decision_readiness.completed_verifications_count} of ${data.checklist.length} actions |\n\n`;
  md += `**Scoring Calculation & Methodology:**\n${data.decision_readiness.explanation}\n\n`;
  md += `> *Disclaimer: ${data.decision_readiness.disclaimer}*\n\n`;

  // Executive Summary
  md += `## 3. Executive Evidence Synthesis\n\n`;
  md += `${data.synthesis_summary}\n\n`;
  md += `---\n\n`;

  // Extracted Claims
  md += `## 4. Grounded Claims Ledger (${data.claims.length})\n\n`;
  if (data.claims.length === 0) {
    md += `*No atomic claims extracted from reviewed sources.*\n\n`;
  } else {
    md += `| ID | Topic | Verifiable Statement | Source Citation | Excerpt |\n`;
    md += `|---|---|---|---|---|\n`;
    data.claims.forEach((c) => {
      const sourceLink = c.source_url ? `[${c.source_title}](${c.source_url})` : c.source_title;
      const cleanStmt = c.claim_text.replace(/\|/g, '\\|');
      const cleanExcerpt = c.evidence_excerpt.replace(/\|/g, '\\|');
      md += `| \`${c.claim_id}\` | ${c.topic} | **${cleanStmt}** | ${sourceLink} (${c.publication_date || 'Undated'}) | "${cleanExcerpt}" |\n`;
    });
    md += `\n`;
  }

  // Potential Contradictions
  md += `## 5. Potential Contradictions & Discrepancies (${data.conflicts.length})\n\n`;
  if (data.conflicts.length === 0) {
    md += `*No conflicting claims identified across ingested sources.*\n\n`;
  } else {
    data.conflicts.forEach((conf, idx) => {
      md += `### Conflict ${idx + 1}: ${conf.topic} [Severity: ${conf.severity.toUpperCase()}]\n\n`;
      md += `- **Source A (${conf.source_a.source_title}):** ${conf.source_a.claim_text}\n`;
      md += `  - *Verbatim Excerpt:* "${conf.source_a.evidence_excerpt}"\n`;
      if (conf.source_a.source_url) md += `  - *Reference URL:* ${conf.source_a.source_url}\n`;
      if (conf.source_a.publication_date) md += `  - *Date:* ${conf.source_a.publication_date}\n`;
      md += `- **Source B (${conf.source_b.source_title}):** ${conf.source_b.claim_text}\n`;
      md += `  - *Verbatim Excerpt:* "${conf.source_b.evidence_excerpt}"\n`;
      if (conf.source_b.source_url) md += `  - *Reference URL:* ${conf.source_b.source_url}\n`;
      if (conf.source_b.publication_date) md += `  - *Date:* ${conf.source_b.publication_date}\n`;
      md += `- **Why They May Conflict:** ${conf.conflict_reason}\n`;
      md += `- **Resolution Guidance:** ${conf.resolution_hint}\n\n`;
    });
  }

  // Information Gaps
  md += `## 6. Information Gaps & Unanswered Questions (${data.gaps.length})\n\n`;
  if (data.gaps.length === 0) {
    md += `*All primary decision requirements were addressed in the provided sources.*\n\n`;
  } else {
    data.gaps.forEach((gap, idx) => {
      md += `### Gap ${idx + 1}: ${gap.title} [Importance: ${gap.importance.toUpperCase()} | Category: ${gap.category}]\n\n`;
      md += `- **Unanswered Question:** ${gap.unanswered_question}\n`;
      md += `- **Why It Matters:** ${gap.why_it_matters}\n`;
      md += `- **Recommended Verification Action:** ${gap.suggested_verification}\n\n`;
    });
  }

  // Source Freshness & Outdated Warnings
  md += `## 7. Source Freshness & Temporal Warnings\n\n`;
  if (data.outdated_warnings.length > 0) {
    md += `### Outdated / Expired Guidelines Warnings\n\n`;
    data.outdated_warnings.forEach((ow) => {
      md += `- **${ow.source_title}** (Dated reference: \`${ow.dated_reference}\`)\n`;
      md += `  - *Potential Concern:* ${ow.potential_concern}\n`;
      md += `  - *Recommendation:* ${ow.recommendation}\n\n`;
    });
  } else {
    md += `*No explicitly outdated guidelines or expired cycle references were detected.*\n\n`;
  }

  if (data.undated_sources && data.undated_sources.length > 0) {
    md += `### Undated Source Warnings\n\n`;
    data.undated_sources.forEach((us) => {
      md += `- **${us.source_title}**: ${us.message}\n`;
    });
    md += `\n`;
  }

  // Extraction Failures (if any)
  if (data.extraction_failures && data.extraction_failures.length > 0) {
    md += `## 8. Inaccessible / Failed Extraction Sources (${data.extraction_failures.length})\n\n`;
    data.extraction_failures.forEach((f) => {
      md += `- **${f.title}** (\`${f.url_or_filename}\`): ${f.error_message || 'Extraction failed'}\n`;
    });
    md += `\n`;
  }

  // Verification Checklist
  md += `## 9. Prioritized Verification Checklist (${data.checklist.length} Actions)\n\n`;
  data.checklist.forEach((item, idx) => {
    const statusBox = item.completed ? '[x]' : '[ ]';
    md += `${idx + 1}. ${statusBox} **[${item.priority.toUpperCase()} PRIORITY]** ${item.action_required}\n`;
    md += `   - **Why It Matters:** ${item.why_it_matters || item.rationale}\n`;
    md += `   - **Consult Authority:** ${item.recommended_authority}\n`;
    if (item.supporting_sources && item.supporting_sources.length > 0) {
      md += `   - **Supporting Source References:** ${item.supporting_sources.join(', ')}\n`;
    }
    md += `\n`;
  });

  // Source Ledger
  md += `## 10. Complete Provenance Ledger\n\n`;
  data.sources.forEach((s) => {
    md += `- **${s.title}** (${s.type.toUpperCase()})\n`;
    md += `  - URI / Filename: \`${s.url_or_filename}\`\n`;
    md += `  - Status: \`${s.status}\` | Characters: ${s.character_count} | Publication Date: ${s.publication_date || 'Undated'}\n`;
  });
  md += `\n---\n*End of GapGlint Evidence Intelligence Dossier.*\n`;

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const filename = `GapGlint_Report_${sanitizeFilename(data.topic)}_${Date.now()}.md`;
  triggerDownload(blob, filename);
}

function sanitizeFilename(text: string): string {
  return text.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40) || 'Dossier';
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

