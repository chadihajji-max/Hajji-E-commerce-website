import React from 'react';
import { useStore } from '../context/StoreContext';
import { Currency, Language } from '../types/store';
import { CURRENCIES } from '../data/initialData';
import { Globe, ShieldCheck, UserCheck } from 'lucide-react';

export const PromoBar: React.FC = () => {
  const { language, setLanguage, currency, setCurrency, settings, setIsAdminOpen, adminToken } = useStore();

  const text = language === 'ar' 
    ? settings?.promoBarTextAr || '🔥 خصم حقيقي يصل إلى 50% | تصفح المنتجات برابط العمولة المعتمد من SHEIN'
    : settings?.promoBarTextEn || '🔥 Up to 50% Off | View and shop verified products via official SHEIN affiliate links';

  return (
    <div className="bg-slate-900 text-white text-xs py-2 px-4 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        {/* Announcement ticker */}
        <div className="flex items-center gap-2 overflow-hidden text-center md:text-start">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
          <p className="font-medium truncate max-w-xl">{text}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 shrink-0 text-slate-300">
          {/* Currency Switcher */}
          <div className="flex items-center gap-1">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="bg-slate-800 text-white text-xs px-2 py-0.5 rounded border border-slate-700 focus:outline-none cursor-pointer hover:border-slate-500 transition-colors"
            >
              {Object.keys(CURRENCIES).map((code) => (
                <option key={code} value={code}>
                  {code} ({language === 'ar' ? CURRENCIES[code].symbolAr : CURRENCIES[code].symbolEn})
                </option>
              ))}
            </select>
          </div>

          <span className="text-slate-700">|</span>

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer font-medium"
            title="تغيير اللغة / Change Language"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>{language === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          <span className="text-slate-700">|</span>

          {/* Admin Dashboard Portal Link */}
          <button
            onClick={() => setIsAdminOpen(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 px-2.5 py-1 rounded transition-colors text-xs font-semibold cursor-pointer border border-slate-700"
          >
            {adminToken ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'لوحة التحكم' : 'Admin Panel'}</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'دخول الأدمن' : 'Admin Login'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
