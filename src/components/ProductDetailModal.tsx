import React, { useState } from 'react';
import { Product } from '../types/store';
import { useStore } from '../context/StoreContext';
import {
  X,
  ExternalLink,
  Heart,
  Star,
  ShieldCheck,
  Share2,
  Check,
  Sparkles,
  ArrowLeftRight,
  Copy,
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onSelectProduct: (p: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onSelectProduct,
}) => {
  const {
    language,
    formatPrice,
    wishlist,
    toggleWishlist,
    compareList,
    toggleCompare,
    setIsCompareOpen,
    trackClick,
    products,
    settings,
  } = useStore();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  if (!product) return null;

  const isWishlisted = wishlist.includes(product.id);
  const isCompared = compareList.includes(product.id);
  const title = language === 'ar' ? product.titleAr : product.titleEn;
  const description = language === 'ar' ? product.descriptionAr : product.descriptionEn;

  // Build canonical share URL containing product query param
  const shareUrl = `${window.location.origin}${window.location.pathname}?product=${product.id}`;
  const shareText = language === 'ar'
    ? `اكتشف هذا المنتج المميز من شي إن: ${title} بسعر ${formatPrice(product.price)}`
    : `Check out this SHEIN product: ${title} for ${formatPrice(product.price)}`;

  const handleAffiliateClick = () => {
    trackClick(product.id);
    window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const shareToWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Related items in same category
  const related = products
    .filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id)
    .slice(0, 4);

  const imagesList = product.images && product.images.length > 0 ? product.images : [product.mainImage];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col border border-slate-200">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
              SKU: {product.sku}
            </span>
            {product.discountPercent && (
              <span className="text-xs font-bold bg-red-600 text-white px-2 py-0.5 rounded">
                -{product.discountPercent}%
              </span>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-black transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Gallery Left Column */}
            <div className="flex flex-col gap-3">
              <div className="relative aspect-3/4 w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                <img
                  src={imagesList[activeImageIndex] || product.mainImage}
                  alt={title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />

                {/* Top Action Floating Buttons (Wishlist & Compare) */}
                <div className="absolute top-3 end-3 flex flex-col gap-2 z-10">
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className={`p-2.5 rounded-full shadow-md transition-all cursor-pointer ${
                      isWishlisted ? 'bg-red-50 text-red-600 scale-110' : 'bg-white/90 text-slate-700 hover:text-black hover:bg-white'
                    }`}
                    title={language === 'ar' ? 'إضافة للمفضلة' : 'Add to Wishlist'}
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-600' : ''}`} />
                  </button>

                  <button
                    onClick={() => toggleCompare(product.id)}
                    className={`p-2.5 rounded-full shadow-md transition-all cursor-pointer ${
                      isCompared ? 'bg-black text-amber-400 scale-110' : 'bg-white/90 text-slate-700 hover:text-black hover:bg-white'
                    }`}
                    title={language === 'ar' ? 'مقارنة هذا المنتج' : 'Compare Product'}
                  >
                    <ArrowLeftRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Thumbnails */}
              {imagesList.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {imagesList.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-20 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                        activeImageIndex === idx ? 'border-black scale-95 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="thumb" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details Right Column */}
            <div className="flex flex-col justify-between gap-6">
              <div className="flex flex-col gap-4">
                
                {/* Title */}
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                  {title}
                </h1>

                {/* Rating & Action Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span>{product.rating || 4.8}</span>
                    <span className="text-slate-400 font-normal">({product.reviewCount || 42} {language === 'ar' ? 'تقييم' : 'reviews'})</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Compare Button */}
                    <button
                      onClick={() => toggleCompare(product.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        isCompared
                          ? 'bg-black text-amber-400'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>
                        {isCompared
                          ? (language === 'ar' ? 'في المقارنة' : 'In Compare')
                          : (language === 'ar' ? 'قارن' : 'Compare')}
                      </span>
                    </button>

                    {/* Share Button Toggle */}
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="flex items-center gap-1 text-slate-600 hover:text-black transition-colors cursor-pointer font-medium"
                    >
                      <Share2 className="w-4 h-4 text-slate-600" />
                      <span>{language === 'ar' ? 'مشاركة' : 'Share'}</span>
                    </button>
                  </div>
                </div>

                {/* Social Media Sharing Section */}
                {showShareMenu && (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col gap-2.5 animate-fadeIn">
                    <span className="text-xs font-bold text-slate-800">
                      {language === 'ar' ? 'مشاركة المنتج عبر شبكات التواصل:' : 'Share product on social media:'}
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* WhatsApp Button */}
                      <button
                        onClick={shareToWhatsApp}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                        title="Share on WhatsApp"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                        </svg>
                        <span>واتساب</span>
                      </button>

                      {/* X / Twitter Button */}
                      <button
                        onClick={shareToTwitter}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                        title="Share on X"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        <span>X (تويتر)</span>
                      </button>

                      {/* Facebook Button */}
                      <button
                        onClick={shareToFacebook}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                        title="Share on Facebook"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        <span>فيسبوك</span>
                      </button>

                      {/* Copy Link Button */}
                      <button
                        onClick={handleCopyLink}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        title="Copy direct link"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? (language === 'ar' ? 'تم النسخ!' : 'Copied!') : (language === 'ar' ? 'نسخ الرابط' : 'Copy Link')}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Price Display */}
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-black text-red-600">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-base text-slate-400 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                  {product.discountPercent && (
                    <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded">
                      {language === 'ar' ? `وفّر ${product.discountPercent}%` : `Save ${product.discountPercent}%`}
                    </span>
                  )}
                </div>

                {/* Colors Preview */}
                {product.colors && product.colors.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-700">
                      {language === 'ar' ? 'الألوان المتاحة:' : 'Available Colors:'}
                    </span>
                    <div className="flex items-center gap-2">
                      {product.colors.map((color, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedColor(color)}
                          className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                            selectedColor === color ? 'border-black scale-110 shadow-sm' : 'border-slate-300 hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Sizes Selector Preview */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-700">
                      {language === 'ar' ? 'المقاسات المتاحة:' : 'Available Sizes:'}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((sz, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedSize(sz)}
                          className={`px-3 py-1.5 rounded text-xs font-bold border transition-colors cursor-pointer ${
                            selectedSize === sz
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-slate-800 border-slate-300 hover:border-black'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="flex flex-col gap-1.5 pt-2">
                  <span className="text-xs font-bold text-slate-700">
                    {language === 'ar' ? 'وصف المنتج والمعلومات:' : 'Product Description:'}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {description}
                  </p>
                </div>

                {/* Affiliate Legal Notice Banner */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900 text-xs flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    {language === 'ar'
                      ? settings?.affiliateNoticeAr || 'تنبيه: هذا المنتج يتم شراؤه مباشرة من موقع SHEIN الرسمي عبر رابط العمولة المعتمد، مما يضمن الأصالة والتوصيل الأسرع.'
                      : settings?.affiliateNoticeEn || 'Notice: Purchasing redirects directly to the official SHEIN website via our verified partner link.'}
                  </p>
                </div>
              </div>

              {/* Big Primary Affiliate Action Button */}
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                <button
                  onClick={handleAffiliateClick}
                  className="w-full py-4 px-6 bg-black hover:bg-slate-800 text-white font-extrabold text-base rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>
                    {language === 'ar' ? 'تسوق الآن من SHEIN' : 'Shop Now on SHEIN'}
                  </span>
                  <ExternalLink className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Related Products Grid */}
          {related.length > 0 && (
            <div className="mt-10 pt-6 border-t border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-4">
                {language === 'ar' ? 'منتجات ذات صلة قد تعجبك' : 'Related Products You May Like'}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {related.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => {
                      onSelectProduct(rel);
                      setActiveImageIndex(0);
                    }}
                    className="group cursor-pointer bg-slate-50 rounded-lg p-2 border border-slate-200 hover:border-slate-400 transition-colors"
                  >
                    <div className="aspect-3/4 w-full bg-slate-200 rounded overflow-hidden mb-2">
                      <img src={rel.mainImage} alt={rel.titleAr} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                      {language === 'ar' ? rel.titleAr : rel.titleEn}
                    </h4>
                    <span className="text-xs font-black text-red-600 mt-1 block">
                      {formatPrice(rel.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
