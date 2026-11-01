import { useState, useCallback } from 'react';
import { Source, AnalysisResponse } from '../types';

export function useResearch() {
  const [topic, setTopic] = useState('');
  const [question, setQuestion] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [currentUrl, setCurrentUrl] = useState('');
  const [manualText, setManualText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisCompleted, setAnalysisCompleted] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const addUrlSource = useCallback((urlToAdd?: string) => {
    const targetUrl = (urlToAdd || currentUrl).trim();
    if (!targetUrl) return false;

    // Validate URL format
    try {
      new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
    } catch {
      showNotification('Please enter a valid URL (e.g., https://example.com/guidelines)');
      return false;
    }

    const formattedUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;

    // Check if already exists
    if (sources.some(s => s.url === formattedUrl)) {
      showNotification('This URL has already been added to your source list.');
      return false;
    }

    const newSource: Source = {
      id: `url-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: 'url',
      title: formattedUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || formattedUrl,
      url: formattedUrl,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'ready'
    };

    setSources(prev => [...prev, newSource]);
    setCurrentUrl('');
    showNotification('Source URL added successfully');
    return true;
  }, [currentUrl, sources]);

  const addPdfSource = useCallback((file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showNotification('Only PDF documents are supported for upload.');
      return false;
    }

    // Limit to 25MB
    if (file.size > 25 * 1024 * 1024) {
      showNotification('File exceeds maximum size limit of 25MB.');
      return false;
    }

    const newSource: Source = {
      id: `pdf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: 'pdf',
      title: file.name,
      fileName: file.name,
      fileSize: file.size,
      file: file,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'ready'
    };

    setSources(prev => [...prev, newSource]);
    showNotification(`Uploaded PDF: ${file.name}`);
    return true;
  }, []);

  const addManualTextSource = useCallback(() => {
    const trimmed = manualText.trim();
    if (!trimmed) {
      showNotification('Please enter text content before adding.');
      return false;
    }

    const previewTitle = trimmed.slice(0, 40) + (trimmed.length > 40 ? '...' : '');

    const newSource: Source = {
      id: `text-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: 'text',
      title: previewTitle,
      textContent: trimmed,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'ready'
    };

    setSources(prev => [...prev, newSource]);
    setManualText('');
    showNotification('Manual text source added');
    return true;
  }, [manualText]);

  const removeSource = useCallback((id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
  }, []);

  const toggleChecklistItem = useCallback((itemId: string) => {
    setAnalysisResult(prev => {
      if (!prev) return null;
      return {
        ...prev,
        checklist: prev.checklist.map(item =>
          item.item_id === itemId ? { ...item, completed: !item.completed } : item
        )
      };
    });
  }, []);

  const handleAnalyze = async () => {
    if (!topic.trim()) {
      showNotification('Please enter a research topic before starting analysis.');
      return;
    }

    // Auto-add any pending inputs in input fields
    let updatedSources = [...sources];
    if (currentUrl.trim()) {
      const formattedUrl = currentUrl.startsWith('http') ? currentUrl : `https://${currentUrl}`;
      if (!updatedSources.some(s => s.url === formattedUrl)) {
        const s: Source = {
          id: `url-${Date.now()}`,
          type: 'url',
          title: formattedUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || formattedUrl,
          url: formattedUrl,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'ready'
        };
        updatedSources.push(s);
        setSources(updatedSources);
        setCurrentUrl('');
      }
    }

    if (manualText.trim()) {
      const s: Source = {
        id: `text-${Date.now()}`,
        type: 'text',
        title: manualText.slice(0, 40) + '...',
        textContent: manualText.trim(),
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'ready'
      };
      updatedSources.push(s);
      setSources(updatedSources);
      setManualText('');
    }

    if (updatedSources.length === 0) {
      showNotification('Please add at least one source (URL, PDF, or text note) to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('topic', topic.trim());
      if (question.trim()) {
        formData.append('question', question.trim());
      }

      // Collect URLs
      const urlList = updatedSources.filter(s => s.type === 'url' && s.url).map(s => s.url as string);
      if (urlList.length > 0) {
        formData.append('urls_json', JSON.stringify(urlList));
      }

      // Collect Manual Texts
      const manualTexts = updatedSources
        .filter(s => s.type === 'text' && s.textContent)
        .map(s => s.textContent as string)
        .join('\n\n--- Next Manual Excerpt ---\n\n');
      if (manualTexts) {
        formData.append('manual_text', manualTexts);
      }

      // Collect PDFs
      const pdfSources = updatedSources.filter(s => s.type === 'pdf' && s.file);
      for (const pdf of pdfSources) {
        if (pdf.file) {
          formData.append('pdf_files', pdf.file);
        }
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorDetail = `Analysis failed with HTTP status ${response.status}`;
        try {
          const errData = await response.json();
          if (errData && errData.detail) {
            errorDetail = errData.detail;
          }
        } catch {
          // ignore json parse error
        }
        throw new Error(errorDetail);
      }

      const data: AnalysisResponse = await response.json();
      setAnalysisResult(data);
      setAnalysisCompleted(true);
      showNotification('Analysis successfully synthesized from sources!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred during analysis.';
      setErrorMessage(msg);
      showNotification('Evidence analysis could not complete. See alert for details.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetWorkspace = () => {
    setTopic('');
    setQuestion('');
    setSources([]);
    setCurrentUrl('');
    setManualText('');
    setAnalysisCompleted(false);
    setAnalysisResult(null);
    setErrorMessage(null);
  };

  return {
    topic,
    setTopic,
    question,
    setQuestion,
    sources,
    currentUrl,
    setCurrentUrl,
    manualText,
    setManualText,
    isAnalyzing,
    analysisCompleted,
    notification,
    errorMessage,
    setErrorMessage,
    analysisResult,
    addUrlSource,
    addPdfSource,
    addManualTextSource,
    removeSource,
    handleAnalyze,
    resetWorkspace,
    toggleChecklistItem,
    showNotification
  };
}
