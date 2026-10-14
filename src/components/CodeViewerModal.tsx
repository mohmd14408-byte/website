import React, { useState } from 'react';
import { CODE_SNIPPETS, CodeSnippet } from '../lib/codeSnippets';
import {
  Copy,
  Check,
  Code2,
  FileCode,
  Download,
  Terminal,
  Layers,
  BookOpen,
  FolderTree,
  ExternalLink,
} from 'lucide-react';
import { useToast } from './ui/Toast';

export default function CodeViewerModal() {
  const [activeSnippetId, setActiveSnippetId] = useState<string>(CODE_SNIPPETS[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const activeSnippet = CODE_SNIPPETS.find((s) => s.id === activeSnippetId) || CODE_SNIPPETS[0];

  const handleCopyCode = (snippet: CodeSnippet) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(snippet.code);
      setCopiedId(snippet.id);
      toast({
        title: `تم نسخ ملف ${snippet.filePath}`,
        description: 'الكود البرمجي جاهز الآن في الحافظة للصقه في مشروعك مباشرة.',
        variant: 'success',
      });
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleDownloadFile = (snippet: CodeSnippet) => {
    const blob = new Blob([snippet.code], { type: 'text/typescript;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = snippet.filePath.split('/').pop() || 'code.ts';
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: `تم تنزيل ملف ${fileName}`,
      description: 'تم تحميل الملف إلى جهازك بنجاح.',
      variant: 'success',
    });
  };

  const handleCopyAll = () => {
    const allText = CODE_SNIPPETS.map(
      (s) => `// ==========================================\n// الملف: ${s.filePath}\n// ${s.description}\n// ==========================================\n\n${s.code}\n\n`
    ).join('\n');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(allText);
      toast({
        title: 'تم نسخ جميع الملفات الأربعة معاً!',
        description: 'تم جمع الأكواد الكاملة لقاعدة البيانات، السيرفر، والواجهة والتوجيه في الحافظة.',
        variant: 'success',
      });
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header explanation banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <Code2 className="w-3.5 h-3.5" />
              <span>أكواد المشروع الجاهزة للنسخ واللصق المباشر</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">
              ملفات React + tRPC + Drizzle ORM (SQLite)
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              تمت كتابة هذه الأكواد وفق أحدث معايير TypeScript و Drizzle ORM مع SQLite لتعمل بتوافق كامل مع مشروعك فور لصقها في المسارات المحددة أدناه.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCopyAll}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>نسخ جميع الملفات دفعة واحدة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Code Workspace */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col lg:flex-row min-h-[600px]">
        {/* Sidebar: File List */}
        <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-l border-slate-200 bg-slate-50/70 p-4 space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-500">
            <FolderTree className="w-4 h-4 text-emerald-600" />
            <span>الملفات المطلوبة (4 ملفات):</span>
          </div>

          {CODE_SNIPPETS.map((snippet, idx) => {
            const isActive = snippet.id === activeSnippetId;
            return (
              <button
                key={snippet.id}
                onClick={() => setActiveSnippetId(snippet.id)}
                className={`w-full p-3.5 rounded-2xl text-right transition-all flex items-start gap-3 cursor-pointer ${
                  isActive
                    ? 'bg-white text-emerald-950 font-bold border border-emerald-300 shadow-md ring-2 ring-emerald-500/10'
                    : 'text-slate-700 hover:bg-white hover:text-slate-900 border border-transparent'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                    isActive ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs truncate font-mono font-semibold" dir="ltr">
                    {snippet.filePath}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    {snippet.title}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Quick Terminal command helper */}
          <div className="mt-6 p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 text-xs text-emerald-950 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <Terminal className="w-4 h-4 text-emerald-700" />
              <span>الحزم المطلوبة لمشروعك:</span>
            </div>
            <p className="text-[11px] text-emerald-800">
              تأكد من تثبيت الحزم التالية في بيئة المشروع إذا لم تكن موجودة:
            </p>
            <div
              className="bg-slate-900 text-emerald-300 p-2.5 rounded-xl font-mono text-[11px] overflow-x-auto select-all"
              dir="ltr"
            >
              npm i @trpc/server @trpc/client drizzle-orm better-sqlite3 zod
            </div>
          </div>
        </div>

        {/* Content Area: Active Code */}
        <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-w-0">
          {/* Top Bar with file path and copy/download */}
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <div className="mr-2 flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold" dir="ltr">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span>{activeSnippet.filePath}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownloadFile(activeSnippet)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="تنزيل الملف"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تنزيل</span>
              </button>

              <button
                onClick={() => handleCopyCode(activeSnippet)}
                className={`px-4 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  copiedId === activeSnippet.id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                {copiedId === activeSnippet.id ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ الكود</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Description banner */}
          <div className="px-5 py-3 bg-slate-900/60 border-b border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <span>{activeSnippet.description}</span>
            <span className="font-mono text-[11px] text-emerald-400/80 uppercase">
              {activeSnippet.language}
            </span>
          </div>

          {/* Code Body */}
          <div className="p-5 overflow-auto flex-1 max-h-[620px]" dir="ltr">
            <pre className="font-mono text-xs sm:text-[13px] leading-relaxed text-slate-200">
              <code>{activeSnippet.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
