import React from 'react';
import { useStore } from '../context/StoreContext';
import { ArrowLeftRight, X, Sparkles, AlertCircle } from 'lucide-react';

export const CompareDock: React.FC = () => {
  const {
    compareList,
    removeFromCompare,
    clearCompare,
    setIsCompareOpen,
    compareNotice,
    products,
    language,
  } = useStore();

  const comparedProducts = products.filter((p) => compareList.includes(p.id));

  if (compareList.length === 0 && !compareNotice) return null;

  return (
    <aside
      aria-label={language === 'ar' ? 'شريط مقارنة المنتجات' : 'Product comparison bar'}
      className="fixed bottom-4 inset-x-4 max-w-2xl mx-auto z-40 flex flex-col gap-2 animate-slideUp"
    >
      {/* Toast Notice (e.g. Max 3 products limit reached) */}
      {compareNotice && (
        <div className="bg-slate-900 text-amber-300 text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center justify-between gap-3 border border-amber-400/30 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold">{compareNotice}</span>
          </div>
        </div>
      )}

      {/* Floating Compare Action Bar */}
      {comparedProducts.length > 0 && (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 shadow-2xl border border-slate-200/90 flex items-center justify-between gap-3">
          {/* Products Thumbnails */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {comparedProducts.map((p) => (
              <div
                key={p.id}
                className="relative w-12 h-14 sm:w-14 sm:h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 group"
              >
                <img
                  src={p.mainImage}
                  alt={p.titleAr}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button
                  onClick={() => removeFromCompare(p.id)}
                  className="absolute -top-1 -end-1 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity cursor-pointer shadow"
                  title={language === 'ar' ? 'إزالة' : 'Remove'}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Empty Slots Indicator */}
            {[...Array(3 - comparedProducts.length)].map((_, i) => (
              <div
                key={i}
                className="w-12 h-14 sm:w-14 sm:h-16 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 shrink-0 text-[10px] font-bold"
              >
                +{i + 1}
              </div>
            ))}
          </div>

          {/* Info and Compare CTA */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:flex flex-col text-start">
              <span className="text-xs font-black text-slate-900">
                {language === 'ar' ? 'مقارنة المنتجات' : 'Compare Items'}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">
                {comparedProducts.length} / 3 {language === 'ar' ? 'مختارة' : 'selected'}
              </span>
            </div>

            <button
              onClick={() => setIsCompareOpen(true)}
              className="px-4 py-2 sm:py-2.5 bg-black hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-98"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {language === 'ar'
                  ? `قارن الآن (${comparedProducts.length})`
                  : `Compare (${comparedProducts.length})`}
              </span>
            </button>

            <button
              onClick={clearCompare}
              className="p-2 text-slate-400 hover:text-red-600 transition-colors cursor-pointer text-xs font-semibold"
              title={language === 'ar' ? 'إلغاء الكل' : 'Clear'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
