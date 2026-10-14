import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, X, Eye, EyeOff } from 'lucide-react';
import { loginAdmin, getAdminPin, setAdminPin } from '../lib/auth';
import { useToast } from './ui/Toast';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminLoginModal({ isOpen, onClose, onSuccess }: AdminLoginModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginAdmin(pin)) {
      setError('');
      toast({
        title: 'تم تسجيل دخول المشرف بنجاح',
        description: 'مرحباً بك في لوحة تحكم وإشراف غرفة مصادر التعلم.',
        variant: 'success',
      });
      onSuccess();
      onClose();
    } else {
      setError('رمز المرور غير صحيح.');
      toast({
        title: 'فشل تسجيل الدخول',
        description: 'رمز PIN غير صحيح.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in" dir="rtl">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-7 h-7 text-emerald-400" />
          </div>
          <h2 className="text-xl font-black text-slate-900">دخول أمين مصادر التعلم</h2>
          <p className="text-xs text-slate-500">
            هذه اللوحة مخصصة للمعلم والمشرف فقط للتحكم في الحجوزات وإصدار الباركود.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              أدخل رمز PIN للمشرف:
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                autoFocus
                required
                maxLength={8}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="••••"
                className="w-full h-12 px-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-mono tracking-widest text-slate-900 focus:bg-white focus:outline-emerald-600"
                dir="ltr"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="text-xs text-rose-600 mt-1.5 font-bold">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer"
          >
            تسجيل الدخول للوحة التحكم
          </button>
        </form>
      </div>
    </div>
  );
}
