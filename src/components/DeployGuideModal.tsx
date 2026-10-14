import React, { useState } from 'react';
import {
  X,
  Globe,
  Download,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Zap,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  FileArchive,
  ArrowRight
} from 'lucide-react';
import { useToast } from './ui/Toast';

interface DeployGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeployGuideModal({ isOpen, onClose }: DeployGuideModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'cloudflare' | 'tiiny' | 'netlify' | 'vercel' | 'downloads'>('cloudflare');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    toast({
      title: `تم نسخ ${label} إلى الحافظة`,
      variant: 'success',
    });
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* HEADER */}
        <div className="bg-gradient-to-l from-emerald-900 via-teal-900 to-emerald-800 p-5 sm:p-6 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-300 shadow-inner shrink-0">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">دليل النشر الدائم مدى الحياة</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-emerald-950 text-[11px] font-black">
                  مجاني 100%
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-1 leading-relaxed">
                طرق سريعة ومجانية للحصول على رابط دائم لا ينتهي أبداً وبدون أي مشاكل في التسجيل.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PHONE ISSUE NOTICE BANNER */}
        <div className="bg-amber-50 border-b border-amber-200 p-3 sm:p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-950 leading-relaxed">
            <span className="font-black text-amber-900">واجهت مشكلة طلب رقم الجوال في Vercel؟ </span>
            نظام Vercel يواجه مشكلة في قبول أرقام الجوال من السعودية والشرق الأوسط (Phone verification unavailable).{' '}
            <strong className="underline">لا داعي للقلق إطلاقاً!</strong> لقد جهزنا لك البدائل أدناه{' '}
            <strong>(لا تطلب أي رقم هاتف نهائياً)</strong>، وتعمل بالسحب والإفلات في دقيقة واحدة.
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-3 pt-2 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('cloudflare')}
            className={`px-3 py-2 rounded-t-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'cloudflare'
                ? 'bg-white text-emerald-900 border-t-2 border-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cloudflare Pages (الموصى به - بدون رقم)</span>
          </button>

          <button
            onClick={() => setActiveTab('tiiny')}
            className={`px-3 py-2 rounded-t-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'tiiny'
                ? 'bg-white text-emerald-900 border-t-2 border-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Tiiny Host (في 30 ثانية)</span>
          </button>

          <button
            onClick={() => setActiveTab('netlify')}
            className={`px-3 py-2 rounded-t-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'netlify'
                ? 'bg-white text-emerald-900 border-t-2 border-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-teal-600" />
            <span>Netlify Drop</span>
          </button>

          <button
            onClick={() => setActiveTab('downloads')}
            className={`px-3 py-2 rounded-t-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'downloads'
                ? 'bg-white text-emerald-900 border-t-2 border-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileArchive className="w-3.5 h-3.5 text-blue-600" />
            <span>ملفات التحميل</span>
          </button>
        </div>

        {/* CONTENT BODY */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-slate-700 text-xs sm:text-sm leading-relaxed flex-1">
          {/* CLOUDFLARE PAGES */}
          {activeTab === 'cloudflare' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-emerald-900 mb-1">لماذا Cloudflare Pages هو الأفضل لك؟</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    منصة عالمية عملاقة، <strong>لا تطلب رقم هاتف إطلاقاً</strong> (فقط إيميل وباسورد)، مجانية مدى الحياة، وتملك أسرع سيرفرات داخل السعودية (في الرياض وجدة).
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-black shrink-0">1</span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">حمّل ملف الموقع الجاهز للنشر المباشر</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      هذا الملف جاهز ومترجم مسبقاً، لا يحتاج أي أوامر برمجية.
                    </p>
                    <a
                      href="/api/download-ready-website"
                      download="school-sources-ready-website.zip"
                      className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل الموقع الجاهز (school-sources-ready-website.zip)</span>
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-black shrink-0">2</span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">فك ضغط الملف على جهازك</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      اضغط بالزر الأيمن على الملف واختر "استخراج الكل" (Extract All) ليصبح مجلداً عادياً.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-black shrink-0">3</span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">سجل في Cloudflare بدون رقم هاتف</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      افتح الموقع واضغط Sign Up. يطلب فقط إيميلك وكلمة مرور (بدون رقم هاتف نهائياً).
                    </p>
                    <a
                      href="https://pages.cloudflare.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all"
                    >
                      <span>فتح موقع Cloudflare Pages</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-black shrink-0">4</span>
                  <div>
                    <p className="font-bold text-slate-800">رفع المجلد والحصول على الرابط الدائم</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      من لوحة Cloudflare اختر: <strong>Workers & Pages</strong> ثم <strong>Create application</strong> ثم <strong>Pages</strong> ثم <strong>Upload assets</strong>.
                      اسحب المجلد واضغط <strong>Deploy site</strong>. ستحصل فوراً على رابط دائم مثل <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-800 font-mono">https://school-sources.pages.dev</code>!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TIINY HOST */}
          {activeTab === 'tiiny' && (
            <div className="space-y-4">
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-amber-900 mb-1">Tiiny Host (أسرع حل في 30 ثانية بدون أي تعقيد)</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    لا يحتاج خطوات معقدة! فقط تسحب ملف الـ ZIP وتكتب اسم الموقع وإيميلك ويشتغل فوراً.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-amber-800 text-white flex items-center justify-center text-xs font-black shrink-0">1</span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">حمّل ملف الـ ZIP الجاهز مباشرة</p>
                    <a
                      href="/api/download-ready-website"
                      download="school-sources-ready-website.zip"
                      className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition-all shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل school-sources-ready-website.zip</span>
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-amber-800 text-white flex items-center justify-center text-xs font-black shrink-0">2</span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">افتح موقع Tiiny Host</p>
                    <a
                      href="https://tiiny.host"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all"
                    >
                      <span>فتح tiiny.host في نافذة جديدة</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-amber-800 text-white flex items-center justify-center text-xs font-black shrink-0">3</span>
                  <div>
                    <p className="font-bold text-slate-800">اسحب الملف واضغط Publish</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      اسحب الملف المضغوط وضعه في الصفحة الرئيسية، اكتب اسم الرابط وبريدك، واضغط <strong>Publish</strong>. ستحصل على رابط فوري يعمل مباشرة!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NETLIFY */}
          {activeTab === 'netlify' && (
            <div className="space-y-4">
              <div className="bg-teal-50 rounded-2xl p-4 border border-teal-200 flex items-start gap-3">
                <Globe className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-teal-900 mb-1">Netlify Drop (سحب وإفلات مجاني)</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    منصة Netlify تتيح سحب المجلد وإفلاته بالماوس عبر صفحة Drop.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-teal-800 text-white flex items-center justify-center text-xs font-black shrink-0">1</span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">حمّل الموقع الجاهز وفك الضغط</p>
                    <a
                      href="/api/download-ready-website"
                      download="school-sources-ready-website.zip"
                      className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition-all shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل ملف الموقع الجاهز</span>
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-teal-800 text-white flex items-center justify-center text-xs font-black shrink-0">2</span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">افتح صفحة Netlify Drop</p>
                    <a
                      href="https://app.netlify.com/drop"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all"
                    >
                      <span>فتح app.netlify.com/drop</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-teal-800 text-white flex items-center justify-center text-xs font-black shrink-0">3</span>
                  <div>
                    <p className="font-bold text-slate-800">اسحب المجلد وأفلته</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      اسحب المجلد المفكوك وضعه في المستطيل المخصص على الشاشة، وسيقوم الموقع ببناء الرابط الدائم فوراً.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DOWNLOADS TAB */}
          {activeTab === 'downloads' && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200 flex items-start gap-3">
                <FileArchive className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-blue-900 mb-1">حزم ملفات النظام الجاهزة</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    اختر الحزمة المناسبة لاحتياجك. كلاهما يحتوي على كامل المميزات والتحديثات المطبقة.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Ready Website */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                        موصى به
                      </span>
                      <h4 className="font-bold text-slate-800 text-sm">الموقع الجاهز للنشر المباشر</h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-3">
                      ملفات HTML و CSS و JS المترجمة مسبقاً. تسحبها فوراً إلى Cloudflare Pages أو Tiiny Host بدون الحاجة لأي برمجة.
                    </p>
                  </div>
                  <a
                    href="/api/download-ready-website"
                    download="school-sources-ready-website.zip"
                    className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs text-center flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل الموقع الجاهز (8.3 MB)</span>
                  </a>
                </div>

                {/* Full Source Code */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black">
                        كود المصدر
                      </span>
                      <h4 className="font-bold text-slate-800 text-sm">المشروع البرمجي الكامل</h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-3">
                      يحتوي على كافة ملفات TypeScript و React وخادم Express وإعدادات Vercel و Docker لمن يريد التعديل البرمجي.
                    </p>
                  </div>
                  <a
                    href="/api/download-zip"
                    download="school-sources-system.zip"
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs text-center flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل الكود المصدري (5.5 MB)</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href="/api/download-ready-website"
              download="school-sources-ready-website.zip"
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>تحميل الموقع الجاهز للنشر (ZIP)</span>
            </a>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs transition-all cursor-pointer text-center"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
