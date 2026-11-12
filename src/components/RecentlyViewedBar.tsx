import React from 'react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types/store';
import { Clock } from 'lucide-react';

interface RecentlyViewedBarProps {
  onSelectProduct: (p: Product) => void;
}

export const RecentlyViewedBar: React.FC<RecentlyViewedBarProps> = ({ onSelectProduct }) => {
  const { recentlyViewed, language, formatPrice } = useStore();

  if (!recentlyViewed || recentlyViewed.length === 0) return null;

  return (
    <section className="py-8 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-slate-500" />
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            {language === 'ar' ? 'منتجات شاهدتها مؤخراً' : 'Recently Viewed Products'}
          </h2>
        </div>

        <div className="flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar">
          {recentlyViewed.map((prod) => (
            <div
              key={prod.id}
              onClick={() => onSelectProduct(prod)}
              className="w-36 shrink-0 bg-slate-50 hover:bg-slate-100 p-2 rounded-lg border border-slate-200 cursor-pointer group transition-colors"
            >
              <div className="aspect-3/4 w-full bg-slate-200 rounded overflow-hidden mb-2">
                <img
                  src={prod.mainImage}
                  alt={prod.titleAr}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h3 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-black">
                {language === 'ar' ? prod.titleAr : prod.titleEn}
              </h3>
              <span className="text-xs font-black text-red-600 block mt-0.5">
                {formatPrice(prod.price)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
