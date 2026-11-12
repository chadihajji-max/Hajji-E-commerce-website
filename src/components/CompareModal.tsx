import React from 'react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types/store';
import {
  X,
  ExternalLink,
  Star,
  Trash2,
  Sparkles,
  ArrowLeftRight,
  Eye,
  Plus,
  ShoppingBag,
} from 'lucide-react';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (p: Product) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
}) => {
  const {
    compareList,
    removeFromCompare,
    clearCompare,
    products,
    language,
    formatPrice,
    trackClick,
  } = useStore();

  if (!isOpen) return null;

  const comparedProducts = products.filter((p) => compareList.includes(p.id));

  const handleAffiliateClick = (p: Product) => {
    trackClick(p.id);
    window.open(p.affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-black text-amber-400 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                {language === 'ar' ? 'مقارنة المنتجات جنباً إلى جنب' : 'Side-by-Side Product Comparison'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {language === 'ar'
                  ? `مقارنة المواصفات والأسعار والمقاسات (${comparedProducts.length} من 3)`
                  : `Compare specs, prices, and sizes (${comparedProducts.length} of 3)`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {comparedProducts.length > 0 && (
              <button
                onClick={clearCompare}
                className="text-xs text-slate-500 hover:text-red-600 font-semibold transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'مسح الكل' : 'Clear All'}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-black transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {comparedProducts.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <ArrowLeftRight className="w-12 h-12 text-slate-200" />
              <h3 className="text-base font-bold text-slate-800">
                {language === 'ar' ? 'لم تقم بإضافة أي منتجات للمقارنة بعد' : 'No products added to compare yet'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                {language === 'ar'
                  ? 'اضغط على زر المقارنة على أي منتج في المتجر لإضافته ومقارنة الأسعار والمواصفات حتى 3 منتجات.'
                  : 'Click the compare icon on any product in the store to compare up to 3 products side-by-side.'}
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2.5 bg-black text-white text-xs font-bold rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'تصفح المنتجات' : 'Browse Products'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {comparedProducts.map((p) => {
                const title = language === 'ar' ? p.titleAr : p.titleEn;
                const desc = language === 'ar' ? p.descriptionAr : p.descriptionEn;

                return (
                  <div
                    key={p.id}
                    className="relative bg-slate-50/70 rounded-xl p-4 border border-slate-200 flex flex-col justify-between gap-5 group"
                  >
                    {/* Top Remove Button */}
                    <button
                      onClick={() => removeFromCompare(p.id)}
                      className="absolute top-3 end-3 p-1.5 rounded-full bg-white/90 hover:bg-red-50 text-slate-400 hover:text-red-600 shadow-xs transition-colors cursor-pointer z-10"
                      title={language === 'ar' ? 'إزالة من المقارنة' : 'Remove from compare'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex flex-col gap-4">
                      {/* Product Image */}
                      <div
                        onClick={() => {
                          onSelectProduct(p);
                          onClose();
                        }}
                        className="relative aspect-3/4 w-full bg-slate-200 rounded-lg overflow-hidden cursor-pointer"
                      >
                        <img
                          src={p.mainImage}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        {p.discountPercent && (
                          <span className="absolute top-2 start-2 bg-red-600 text-white font-black text-xs px-2 py-0.5 rounded-xs">
                            -{p.discountPercent}%
                          </span>
                        )}
                      </div>

                      {/* Title & SKU */}
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                          {p.sku} · {p.categorySlug}
                        </span>
                        <h3
                          onClick={() => {
                            onSelectProduct(p);
                            onClose();
                          }}
                          className="text-sm font-bold text-slate-900 line-clamp-2 hover:underline cursor-pointer leading-snug"
                        >
                          {title}
                        </h3>
                      </div>

                      {/* Price Section */}
                      <div className="p-3 bg-white rounded-lg border border-slate-100 flex items-baseline justify-between">
                        <span className="text-xs text-slate-500 font-semibold">
                          {language === 'ar' ? 'السعر الحالي:' : 'Price:'}
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-black text-red-600">
                            {formatPrice(p.price)}
                          </span>
                          {p.originalPrice && p.originalPrice > p.price && (
                            <span className="text-xs text-slate-400 line-through">
                              {formatPrice(p.originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200">
                        <span className="text-slate-500 font-medium">
                          {language === 'ar' ? 'التقييم:' : 'Rating:'}
                        </span>
                        <div className="flex items-center gap-1 font-bold text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{p.rating || 4.8}</span>
                          <span className="text-slate-400 font-normal">({p.reviewCount || 42})</span>
                        </div>
                      </div>

                      {/* Available Colors */}
                      <div className="flex flex-col gap-1.5 py-1 border-b border-slate-200">
                        <span className="text-xs text-slate-500 font-medium">
                          {language === 'ar' ? 'الألوان المتاحة:' : 'Available Colors:'}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {p.colors && p.colors.length > 0 ? (
                            p.colors.map((color, idx) => (
                              <span
                                key={idx}
                                className="w-5 h-5 rounded-full border border-slate-300 shadow-2xs"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">
                              {language === 'ar' ? 'متعدد الألوان' : 'Standard'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Available Sizes */}
                      <div className="flex flex-col gap-1.5 py-1 border-b border-slate-200">
                        <span className="text-xs text-slate-500 font-medium">
                          {language === 'ar' ? 'المقاسات:' : 'Sizes:'}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {p.sizes && p.sizes.length > 0 ? (
                            p.sizes.map((sz, idx) => (
                              <span
                                key={idx}
                                className="text-[11px] font-bold px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700"
                              >
                                {sz}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">One Size</span>
                          )}
                        </div>
                      </div>

                      {/* Description Summary */}
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500 font-medium">
                          {language === 'ar' ? 'نبذة عن الخامة والمظهر:' : 'Description:'}
                        </span>
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                          {desc}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 pt-2">
                      <button
                        onClick={() => handleAffiliateClick(p)}
                        className="w-full py-2.5 px-3 bg-black hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>{language === 'ar' ? 'تسوق من SHEIN' : 'Shop on SHEIN'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          onSelectProduct(p);
                          onClose();
                        }}
                        className="w-full py-2 text-xs font-bold text-slate-600 hover:text-black bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{language === 'ar' ? 'عرض التفاصيل الكاملة' : 'View Full Details'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Empty placeholder slot if < 3 products */}
              {comparedProducts.length < 3 && (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[350px]">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-700">
                      {language === 'ar' ? 'أضف منتجاً آخر للمقارنة' : 'Add another product'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      {language === 'ar'
                        ? 'يمكنك مقارنة حتى 3 قطع لمساعدتك في اتخاذ القرار الشرائي الأفضل.'
                        : 'Compare up to 3 pieces side by side to make the best decision.'}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {language === 'ar' ? 'اختر من المنتجات' : 'Select from Products'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
