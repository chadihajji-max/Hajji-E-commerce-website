import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';
import { Product } from '../types/store';
import { SlidersHorizontal, ArrowUpDown, SearchX, Tag } from 'lucide-react';

interface ProductGridProps {
  onQuickView: (product: Product) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ onQuickView }) => {
  const {
    products,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    language,
    isLoading,
    currency,
  } = useStore();

  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(100);
  const [selectedBudgetPreset, setSelectedBudgetPreset] = useState<string>('all');

  // Filter products by search, category, budget (in USD base), and sorting
  let filtered = products.filter((p) => p.isPublished !== false);

  if (selectedCategory !== 'all') {
    filtered = filtered.filter((p) => p.categorySlug === selectedCategory);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (p) =>
        p.titleAr.toLowerCase().includes(q) ||
        p.titleEn.toLowerCase().includes(q) ||
        p.descriptionAr.toLowerCase().includes(q) ||
        p.categorySlug.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
    );
  }

  // Budget / Range Filter (prices are stored in USD)
  if (selectedBudgetPreset === 'under30') {
    filtered = filtered.filter((p) => p.price <= 30);
  } else if (selectedBudgetPreset === '30-50') {
    filtered = filtered.filter((p) => p.price > 30 && p.price <= 50);
  } else if (selectedBudgetPreset === '50plus') {
    filtered = filtered.filter((p) => p.price > 50);
  } else {
    filtered = filtered.filter((p) => p.price <= maxPriceFilter);
  }

  if (sortOption === 'price-low') {
    filtered.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
  } else if (sortOption === 'price-high') {
    filtered.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
  } else if (sortOption === 'popular') {
    filtered.sort((a, b) => (b.clicksCount || 0) + (b.viewsCount || 0) - ((a.clicksCount || 0) + (a.viewsCount || 0)));
  } else {
    // Default newest arrival
    filtered.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  }

  const activeCategoryObj = categories.find((c) => c.slug === selectedCategory);
  const activeCategoryName = activeCategoryObj
    ? language === 'ar'
      ? activeCategoryObj.nameAr
      : activeCategoryObj.nameEn
    : language === 'ar'
    ? 'جميع المنتجات'
    : 'All Products';

  return (
    <section id="catalog" className="py-10 bg-slate-50 min-h-[600px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header & Filter Controls Bar */}
        <div className="bg-white rounded-xl p-4 sm:p-6 mb-6 shadow-xs border border-slate-200 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {activeCategoryName}
              </h2>
              <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold">
                {filtered.length} {language === 'ar' ? 'منتج' : 'items'}
              </span>
            </div>

            {/* Sort Controls Dropdown */}
            <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
              <label htmlFor="product-sort-select" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 whitespace-nowrap">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                <span>{language === 'ar' ? 'الترتيب حسب:' : 'Sort by:'}</span>
              </label>

              <select
                id="product-sort-select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold py-2 px-3 text-slate-800 focus:outline-none focus:ring-1 focus:ring-black focus:border-black cursor-pointer transition-colors shadow-2xs"
              >
                <option value="newest">
                  {language === 'ar' ? 'الأحدث وصولاً (Newest Arrivals)' : 'Newest Arrivals'}
                </option>
                <option value="price-low">
                  {language === 'ar' ? 'السعر: من الأقل للأعلى (Price: Low to High)' : 'Price: Low to High'}
                </option>
                <option value="price-high">
                  {language === 'ar' ? 'السعر: من الأعلى للأقل (Price: High to Low)' : 'Price: High to Low'}
                </option>
                <option value="popular">
                  {language === 'ar' ? 'الأكثر رواجاً وطلباً (Most Popular)' : 'Most Popular'}
                </option>
              </select>
            </div>
          </div>

          {/* Range-Based Price Filter Bar */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 w-full sm:w-auto">
              <Tag className="w-4 h-4 text-amber-600" />
              <span>{language === 'ar' ? 'تصفية حسب الميزانية ($):' : 'Filter by Budget ($):'}</span>
            </div>

            {/* Budget Presets */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setSelectedBudgetPreset('all');
                  setMaxPriceFilter(100);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                  selectedBudgetPreset === 'all' ? 'bg-black text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {language === 'ar' ? 'الكل' : 'All Budgets'}
              </button>

              <button
                onClick={() => setSelectedBudgetPreset('under30')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                  selectedBudgetPreset === 'under30' ? 'bg-black text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {language === 'ar' ? 'أقل من $30' : 'Under $30'}
              </button>

              <button
                onClick={() => setSelectedBudgetPreset('30-50')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                  selectedBudgetPreset === '30-50' ? 'bg-black text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {language === 'ar' ? '$30 - $50' : '$30 - $50'}
              </button>

              <button
                onClick={() => setSelectedBudgetPreset('50plus')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                  selectedBudgetPreset === '50plus' ? 'bg-black text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {language === 'ar' ? 'أكثر من $50' : '$50+'}
              </button>
            </div>

            {/* Price Range Slider */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-mono">
                {language === 'ar' ? 'الحد الأقصى:' : 'Max:'} <strong className="text-slate-900">${maxPriceFilter}</strong>
              </span>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={maxPriceFilter}
                onChange={(e) => {
                  setSelectedBudgetPreset('custom');
                  setMaxPriceFilter(Number(e.target.value));
                }}
                className="w-32 accent-black cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-slate-500">
              {language === 'ar' ? 'جاري تحميل تشكيلة SHEIN...' : 'Loading SHEIN Collection...'}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200 max-w-md mx-auto my-8">
            <SearchX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              {language === 'ar' ? 'لم نجد أي منتجات تطابق ميزانية البحث' : 'No Products Match This Price Range'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {language === 'ar'
                ? 'جرب توسيع نطاق السعر أو اختيار ميزانية أخرى.'
                : 'Try expanding your price range or selecting another budget filter.'}
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setSelectedBudgetPreset('all');
                setMaxPriceFilter(100);
              }}
              className="px-5 py-2 bg-black text-white text-xs font-bold rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {language === 'ar' ? 'إعادة ضبط كافة الفلاتر' : 'Reset All Filters'}
            </button>
          </div>
        ) : (
          /* Product Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filtered.map((prod) => (
              <ProductCard key={prod.id} product={prod} onQuickView={onQuickView} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
