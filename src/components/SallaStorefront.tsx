import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { SallaItem } from '../types/store';
import { ShoppingBag, Eye, Star, Check, Plus, ExternalLink } from 'lucide-react';

interface SallaStorefrontProps {
  onOpenSallaCart: () => void;
}

export const SallaStorefront: React.FC<SallaStorefrontProps> = ({ onOpenSallaCart }) => {
  const { sallaItems, addToSallaCart, formatPrice, language } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeItemModal, setActiveItemModal] = useState<SallaItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  const categories = [
    { slug: 'all', nameAr: 'جميع منتجات سلة', nameEn: 'All Salla Products' },
    { slug: 'beauty-makeup', nameAr: 'تجميل وعناية', nameEn: 'Beauty & Care' },
    { slug: 'bags-accessories', nameAr: 'حقائب وإكسسوارات', nameEn: 'Bags & Accessories' },
  ];

  const filteredItems = selectedCategory === 'all'
    ? sallaItems
    : sallaItems.filter((i) => i.categorySlug === selectedCategory);

  const handleOpenModal = (item: SallaItem) => {
    setActiveItemModal(item);
    setSelectedSize(item.sizes && item.sizes.length > 0 ? item.sizes[0] : '');
    setSelectedColor(item.colors && item.colors.length > 0 ? item.colors[0] : '');
  };

  const handleAddToCart = (item: SallaItem) => {
    addToSallaCart(item, selectedSize, selectedColor);
    setAddedNotice(item.id);
    setTimeout(() => setAddedNotice(null), 2500);
  };

  return (
    <section id="salla-store" className="py-12 bg-gradient-to-b from-amber-50/50 via-white to-slate-50 border-t border-b border-amber-200/60 my-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider mb-2 border border-amber-300">
              <ShoppingBag className="w-3.5 h-3.5 text-amber-700" />
              <span>{language === 'ar' ? 'منصة سلة المستقلة' : 'Independent Salla Store'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {language === 'ar' ? 'متجر سلة الخاص (طلبات مباشرة وعبر الواتساب)' : 'Salla Direct Store & WhatsApp Checkout'}
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              {language === 'ar'
                ? 'منتجاتنا الخاصة المستقلة عن الإحالة. اختر ما يناسبك وأضفه إلى سلة التسوق؛ وعند إتمام الطلب سيتم إرساله مباشرة إلى الواتساب مع شرط سداد رسوم الشحن عبر Whish Money.'
                : 'Exclusive direct products independent of affiliate items. Add to cart & checkout directly via WhatsApp with Whish Money shipping confirmation.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenSallaCart}
            className="px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all self-start md:self-auto shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{language === 'ar' ? 'عرض سلة المشتريات الخاصة' : 'View Salla Cart'}</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.slug
                  ? 'bg-black text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {language === 'ar' ? cat.nameAr : cat.nameEn}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const isAdded = addedNotice === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group"
                >
                  {/* Image Container */}
                  <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                    <img
                      src={item.mainImage}
                      alt={language === 'ar' ? item.titleAr : item.titleEn}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 start-3">
                      <span className="bg-amber-500 text-black font-black text-[10px] px-2.5 py-1 rounded-full shadow">
                        {language === 'ar' ? 'منتج سلة خاص' : 'Salla Exclusive'}
                      </span>
                    </div>

                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenModal(item)}
                        className="w-10 h-10 rounded-full bg-white text-slate-900 shadow-md flex items-center justify-center hover:bg-black hover:text-white transition-colors cursor-pointer"
                        title={language === 'ar' ? 'معاينة سريعة' : 'Quick View'}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 flex flex-col flex-1 gap-3">
                    <div className="flex items-center gap-1 text-amber-500 text-xs">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="font-bold text-slate-700">5.0</span>
                      <span className="text-slate-400 text-[11px]">(سلة معتمد)</span>
                    </div>

                    <h3
                      onClick={() => handleOpenModal(item)}
                      className="font-extrabold text-slate-900 text-sm line-clamp-2 hover:text-amber-600 transition-colors cursor-pointer"
                    >
                      {language === 'ar' ? item.titleAr : item.titleEn}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2">
                      {language === 'ar' ? item.descriptionAr : item.descriptionEn}
                    </p>

                    <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-black text-amber-700 font-mono">
                          {formatPrice(item.price)}
                        </span>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="text-xs text-slate-400 line-through font-mono">
                            {formatPrice(item.originalPrice)}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddToCart(item)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-black hover:bg-amber-600 text-white'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>{language === 'ar' ? 'تمت الإضافة!' : 'Added!'}</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>{language === 'ar' ? 'أضف للسلة' : 'Add to Cart'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <p className="text-sm text-slate-500">
              {language === 'ar' ? 'لا توجد منتجات متاحة في هذا القسم حالياً.' : 'No Salla products available in this category.'}
            </p>
          </div>
        )}

        {/* Quick View / Options Modal */}
        {activeItemModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 flex flex-col md:flex-row">
              <div className="w-full md:w-1/2 bg-slate-100 relative aspect-square">
                <img
                  src={activeItemModal.mainImage}
                  alt={activeItemModal.titleAr}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="w-full md:w-1/2 p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded">
                    {language === 'ar' ? 'منتج سلة مستقل' : 'Salla Store Item'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveItemModal(null)}
                    className="text-slate-400 hover:text-black cursor-pointer text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base">
                  {language === 'ar' ? activeItemModal.titleAr : activeItemModal.titleEn}
                </h3>

                <p className="text-xs text-slate-600">
                  {language === 'ar' ? activeItemModal.descriptionAr : activeItemModal.descriptionEn}
                </p>

                {/* Size options */}
                {activeItemModal.sizes && activeItemModal.sizes.length > 0 && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      {language === 'ar' ? 'اختر المقاس:' : 'Select Size:'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {activeItemModal.sizes.map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedSize(sz)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            selectedSize === sz
                              ? 'bg-black text-white border-black'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color options */}
                {activeItemModal.colors && activeItemModal.colors.length > 0 && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      {language === 'ar' ? 'اختر اللون:' : 'Select Color:'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {activeItemModal.colors.map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setSelectedColor(col)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            selectedColor === col
                              ? 'bg-black text-white border-black'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {col}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-4 border-t flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">{language === 'ar' ? 'السعر:' : 'Price:'}</span>
                    <span className="text-lg font-black text-amber-700 font-mono">
                      {formatPrice(activeItemModal.price)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      addToSallaCart(activeItemModal, selectedSize, selectedColor);
                      setActiveItemModal(null);
                    }}
                    className="px-6 py-3 bg-black hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
                  >
                    {language === 'ar' ? 'إضافة إلى سلة الشراء' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
