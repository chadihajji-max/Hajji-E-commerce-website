import React from 'react';
import { useStore } from '../context/StoreContext';

export const CategoryCircles: React.FC = () => {
  const { categories, selectedCategory, setSelectedCategory, language } = useStore();

  if (categories.length === 0) return null;

  return (
    <section className="py-8 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
            {language === 'ar' ? 'التصنيفات الرئيسية' : 'Featured Categories'}
          </h2>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-xs font-semibold text-slate-600 hover:text-black hover:underline cursor-pointer"
            >
              {language === 'ar' ? 'عرض كافة المنتجات' : 'View All Products'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 sm:gap-6">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className="group flex flex-col items-center gap-2.5 text-center cursor-pointer"
              >
                <div
                  className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden p-1 transition-all duration-300 ${
                    isSelected
                      ? 'ring-2 ring-black ring-offset-2 scale-105 shadow-md'
                      : 'ring-1 ring-slate-200 group-hover:ring-slate-400 group-hover:scale-105'
                  }`}
                >
                  <img
                    src={cat.image || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80'}
                    alt={language === 'ar' ? cat.nameAr : cat.nameEn}
                    className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span
                  className={`text-xs font-bold transition-colors ${
                    isSelected ? 'text-black font-extrabold' : 'text-slate-700 group-hover:text-black'
                  }`}
                >
                  {language === 'ar' ? cat.nameAr : cat.nameEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
