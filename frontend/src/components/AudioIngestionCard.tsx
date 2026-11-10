import React, { useState, useRef } from 'react';
import { 
  Mic, 
  FileAudio, 
  Loader2, 
  AlertCircle, 
  Check, 
  Copy, 
  Plus, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Globe2,
  Cpu
} from 'lucide-react';
import { AudioTranscriptionResult, Source } from '../types';
import { apiUrl } from '../lib/api';
import { formatBytes } from '../lib/utils';

interface AudioIngestionCardProps {
  onAddAudioSource: (
    filename: string,
    transcript: string,
    fileSize?: number,
    metadata?: Source['audioMetadata']
  ) => boolean;
  onNotification?: (msg: string) => void;
}

const SUPPORTED_AUDIO_EXTENSIONS = ['.wav', '.mp3', '.ogg', '.flac', '.aac', '.m4a'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

export const AudioIngestionCard: React.FC<AudioIngestionCardProps> = ({
  onAddAudioSource,
  onNotification
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [result, setResult] = useState<AudioTranscriptionResult | null>(null);
  const [isAddedToWorkspace, setIsAddedToWorkspace] = useState(false);
  const [copied, setCopied] = useState(false);

  // Transcription configuration options
  const [languageCode, setLanguageCode] = useState('indic-auto');
  const [model, setModel] = useState('prisma-v3.0');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
    setTranscriptionError(null);
    setResult(null);
    setIsAddedToWorkspace(false);

    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (!SUPPORTED_AUDIO_EXTENSIONS.includes(ext)) {
      setTranscriptionError(
        `Unsupported audio format '${ext}'. Please upload an audio file in one of: ${SUPPORTED_AUDIO_EXTENSIONS.join(', ')}`
      );
      return false;
    }

    if (file.size === 0) {
      setTranscriptionError('Selected audio file is empty (0 bytes).');
      return false;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setTranscriptionError(
        `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds maximum limit of 10 MB. Gnani REST STT is designed for clips up to 30 seconds.`
      );
      return false;
    }

    setSelectedFile(file);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
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
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setResult(null);
    setTranscriptionError(null);
    setIsAddedToWorkspace(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTranscribe = async () => {
    if (!selectedFile) return;

    setIsTranscribing(true);
    setTranscriptionError(null);

    try {
      const formData = new FormData();
      // Exact field name expected by backend: "file"
      formData.append('file', selectedFile);
      formData.append('model', model);
      formData.append('language_code', languageCode);

      // Do NOT manually set Content-Type header so browser generates multipart boundary
      const response = await fetch(apiUrl('/api/audio/transcribe'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errMessage = `Transcription failed (HTTP ${response.status})`;
        try {
          const errData = await response.json();
          if (errData && errData.detail) {
            errMessage = errData.detail;
          }
        } catch {
          // ignore json parse error
        }
        throw new Error(errMessage);
      }

      const data: AudioTranscriptionResult = await response.json();
      setResult(data);
      if (onNotification) {
        onNotification('Audio transcribed successfully with Gnani Prisma v3!');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Audio transcription failed. Please try again.';
      setTranscriptionError(msg);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleAddToWorkspace = () => {
    if (!result || !result.transcript || !selectedFile) return;

    const metadata: Source['audioMetadata'] = {
      requestId: result.request_id,
      model: result.model,
      detectedLanguageCode: result.detected_language_code,
      processingTime: result.processing_time,
      endToEndLatency: result.end_to_end_latency,
      originalFileName: selectedFile.name
    };

    const success = onAddAudioSource(
      selectedFile.name,
      result.transcript,
      selectedFile.size,
      metadata
    );

    if (success) {
      setIsAddedToWorkspace(true);
    }
  };

  const handleCopyTranscript = async () => {
    if (!result?.transcript) return;
    try {
      await navigator.clipboard.writeText(result.transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".wav,.mp3,.ogg,.flac,.aac,.m4a,audio/*"
        className="hidden"
      />

      {/* Upload Zone (when no file is selected) */}
      {!selectedFile && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-purple-500 bg-purple-50/50'
              : 'border-slate-200 bg-slate-50 hover:bg-slate-100/60 hover:border-slate-300'
          }`}
        >
          <div className="mx-auto w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
            <Mic className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            Drop voice recording or audio interview here, or <span className="text-purple-600 underline">browse</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Supports WAV, MP3, OGG, FLAC, AAC, M4A clips up to 30s (max 10MB) powered by Gnani Prisma v3
          </p>
        </div>
      )}

      {/* Selected File Card */}
      {selectedFile && (
        <div className="p-4 rounded-xl border border-purple-200/80 bg-purple-50/40 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-lg bg-purple-100 text-purple-700 flex-shrink-0">
                <FileAudio className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {selectedFile.name}
                </h4>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="font-medium">{formatBytes(selectedFile.size)}</span>
                  <span>•</span>
                  <span className="uppercase text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                    Audio Clip
                  </span>
                  <span>•</span>
                  <span className="text-slate-400">REST (max 30s)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={handleRemoveFile}
                disabled={isTranscribing}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                title="Remove selected audio"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Configuration Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-purple-100/80 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Language Detection
              </label>
              <select
                value={languageCode}
                onChange={(e) => setLanguageCode(e.target.value)}
                disabled={isTranscribing}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="indic-auto">Automatic Language Detection (indic-auto)</option>
                <option value="en-IN">English (India) [en-IN]</option>
                <option value="hi-IN">Hindi [hi-IN]</option>
                <option value="bn-IN">Bengali [bn-IN]</option>
                <option value="ta-IN">Tamil [ta-IN]</option>
                <option value="te-IN">Telugu [te-IN]</option>
                <option value="mr-IN">Marathi [mr-IN]</option>
                <option value="gu-IN">Gujarati [gu-IN]</option>
                <option value="kn-IN">Kannada [kn-IN]</option>
                <option value="ml-IN">Malayalam [ml-IN]</option>
                <option value="pa-IN">Punjabi [pa-IN]</option>
                <option value="or-IN">Odia [or-IN]</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                STT Model Engine
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={isTranscribing}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="prisma-v3.0">Gnani Prisma v3.0 (Multilingual)</option>
                <option value="prisma-v2.5">Gnani Prisma v2.5</option>
              </select>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleTranscribe}
              disabled={isTranscribing}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isTranscribing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Transcribing with Gnani Prisma v3...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Transcribe Audio with Gnani AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {transcriptionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <span className="font-bold block text-rose-900">Transcription Notice</span>
            <span>{transcriptionError}</span>
          </div>
        </div>
      )}

      {/* Transcript Viewer Card */}
      {result && result.transcript && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-card space-y-4 animate-fadeIn">
          {/* Viewer Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                <Mic className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Audio Transcript
                </h4>
                <p className="text-[11px] text-slate-400">
                  Transcribed from <span className="font-semibold text-slate-600">{result.filename || selectedFile?.name}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyTranscript}
                className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
            </div>
          </div>

          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            {result.detected_language_code && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                <Globe2 className="w-3 h-3" />
                Detected: {result.detected_language_code}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
              <Cpu className="w-3 h-3 text-slate-500" />
              {result.model}
            </span>
            {result.processing_time !== undefined && result.processing_time !== null && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                <Clock className="w-3 h-3" />
                {result.processing_time.toFixed(2)}s processing
              </span>
            )}
            {result.request_id && (
              <span className="text-slate-400 font-mono text-[10px]">
                ID: {result.request_id.slice(0, 8)}...
              </span>
            )}
          </div>

          {/* Transcript Content Block */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm leading-relaxed font-normal whitespace-pre-wrap select-text">
            "{result.transcript}"
          </div>

          {/* Add to Evidence Workspace CTA */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Add this voice testimony or interview as an evidence source to extract claims and cross-examine against documents.
            </div>

            <button
              type="button"
              onClick={handleAddToWorkspace}
              disabled={isAddedToWorkspace}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer flex-shrink-0 ${
                isAddedToWorkspace
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 cursor-default'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {isAddedToWorkspace ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Staged in Evidence Workspace</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Evidence Workspace</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
