import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Search, Heart, Sparkles, X, ShoppingBag, ArrowLeftRight } from 'lucide-react';

interface HeaderProps {
  onOpenWishlist: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenWishlist }) => {
  const {
    language,
    settings,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    wishlist,
    compareList,
    setIsCompareOpen,
  } = useStore();

  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const storeName = language === 'ar'
    ? settings?.storeNameAr || 'شي إن سيلكت'
    : settings?.storeNameEn || 'SHEIN Select';

  const tagline = language === 'ar'
    ? settings?.storeTaglineAr || 'متجر العروض والعمولة الرسمي'
    : settings?.storeTaglineEn || 'Curated Affiliate Fashion';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4 md:gap-8">
          
          {/* 1. Brand Logo */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="flex items-center gap-2 group shrink-0"
          >
            <div className="w-9 h-9 bg-black text-white flex items-center justify-center rounded-xs font-black text-xl tracking-tighter shadow-xs group-hover:bg-slate-800 transition-colors">
              S
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-black transition-colors uppercase">
                {storeName}
              </span>
              <span className="text-[10px] text-slate-500 tracking-wider font-medium">
                {tagline}
              </span>
            </div>
          </a>

          {/* 2. Search Bar */}
          <div className="flex-1 max-w-xl relative hidden sm:block">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                placeholder={
                  language === 'ar'
                    ? 'ابحث عن فساتين، جاكيتات، أحذية، حقائب من SHEIN...'
                    : 'Search dresses, jackets, shoes, bags on SHEIN...'
                }
                className="w-full bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-slate-900 text-sm rounded-full py-2.5 px-10 border border-transparent focus:border-black focus:outline-none transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-3" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute end-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 3. Actions (Wishlist & Affiliate Info Badge) */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Affiliate Tag Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 rounded-full border border-amber-200 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{language === 'ar' ? 'روابط عمولة معتمدة' : 'Verified Affiliate'}</span>
            </div>

            {/* Compare Button */}
            <button
              onClick={() => setIsCompareOpen(true)}
              className="relative p-2 text-slate-700 hover:text-black hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              title={language === 'ar' ? 'مقارنة المنتجات' : 'Compare Products'}
            >
              <ArrowLeftRight className="w-5 h-5" />
              {compareList.length > 0 && (
                <span className="absolute -top-1 -end-1 w-5 h-5 bg-amber-400 text-black text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {compareList.length}
                </span>
              )}
            </button>

            {/* Wishlist Button */}
            <button
              onClick={onOpenWishlist}
              className="relative p-2 text-slate-700 hover:text-black hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              title={language === 'ar' ? 'المفضلة' : 'Wishlist'}
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -end-1 w-5 h-5 bg-black text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {wishlist.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="mt-2 sm:hidden relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ar' ? 'ابحث في المتجر...' : 'Search items...'}
            className="w-full bg-slate-100 text-slate-900 text-sm rounded-full py-2 px-9 border border-transparent focus:border-black focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
        </div>
      </div>

      {/* Category Nav Links Strip */}
      <nav className="border-t border-slate-100 bg-slate-50/50 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 sm:gap-2 text-xs font-semibold py-1.5 whitespace-nowrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-black text-white'
                : 'text-slate-600 hover:text-black hover:bg-slate-200/60'
            }`}
          >
            {language === 'ar' ? 'الكل' : 'All Products'}
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                selectedCategory === cat.slug
                  ? 'bg-black text-white'
                  : 'text-slate-600 hover:text-black hover:bg-slate-200/60'
              }`}
            >
              {language === 'ar' ? cat.nameAr : cat.nameEn}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
};
