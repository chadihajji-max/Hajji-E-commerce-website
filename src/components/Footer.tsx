import React from 'react';
import { useStore } from '../context/StoreContext';
import { ShieldCheck, Sparkles, Heart, FileText, Globe } from 'lucide-react';

export const Footer: React.FC = () => {
  const { language, settings, categories, setSelectedCategory } = useStore();

  const storeName = language === 'ar'
    ? settings?.storeNameAr || 'شي إن سيلكت'
    : settings?.storeNameEn || 'SHEIN Select';

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 pb-10 border-b border-slate-800">
          
          {/* Brand Info */}
          <div className="flex flex-col gap-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-black text-lg rounded-xs">
                S
              </div>
              <span className="font-extrabold text-xl text-white uppercase tracking-tight">
                {storeName}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              {language === 'ar'
                ? 'دليلك المتكامل لاستكشاف أحدث أزياء وعروض موقع SHEIN مع روابط تسويق بالعمولة رسمية ومضمونة.'
                : 'Your premier guide to curated SHEIN fashion, collections and verified affiliate deals.'}
            </p>

            <div className="flex items-center gap-2 text-xs text-amber-400 mt-1 font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>{language === 'ar' ? 'تحديث يومي للمنتجات' : 'Daily Product Updates'}</span>
            </div>
          </div>

          {/* Categories Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">
              {language === 'ar' ? 'أقسام المتجر' : 'Store Categories'}
            </h4>
            <ul className="flex flex-col gap-2 text-xs">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => setSelectedCategory(cat.slug)}
                    className="hover:text-white transition-colors cursor-pointer text-slate-400"
                  >
                    {language === 'ar' ? cat.nameAr : cat.nameEn}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Affiliate Legal Notice */}
          <div className="flex flex-col gap-3 md:col-span-2 bg-slate-900/80 p-5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span>{language === 'ar' ? 'إخلاء مسؤولية وروابط العمولة' : 'Affiliate Legal Disclaimer'}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {language === 'ar'
                ? settings?.affiliateNoticeAr || 'هذا الموقع مستقل ويعرض منتجات مختارة من SHEIN بنظام التسويق بالعمولة (Affiliate). عند الضغط على أزرار "تسوق الآن"، يتم تحويلك إلى موقع SHEIN الرسمي لمتابعة عملية الشراء والدفع بأمان تام.'
                : settings?.affiliateNoticeEn || 'This independent website presents curated SHEIN items via official affiliate programs. Clicking "Shop Now" redirects securely to the official SHEIN site to finalize transactions.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-800 text-[11px] text-slate-500">
              <a href="/sitemap.xml" target="_blank" className="hover:text-slate-300 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Sitemap XML</span>
              </a>
              <a href="/robots.txt" target="_blank" className="hover:text-slate-300 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                <span>Robots.txt</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <p>
            © {new Date().getFullYear()} {storeName}. {language === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </p>

          <p className="flex items-center gap-1">
            <span>{language === 'ar' ? 'صُمم بعناية لعشاق أزياء' : 'Crafted for fashion lovers of'}</span>
            <span className="font-bold text-white">SHEIN</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
