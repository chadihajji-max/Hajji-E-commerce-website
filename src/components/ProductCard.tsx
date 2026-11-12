import React, { useState } from 'react';
import { Product } from '../types/store';
import { useStore } from '../context/StoreContext';
import { Heart, Eye, ExternalLink, Star, Flame, ArrowLeftRight } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const {
    language,
    formatPrice,
    wishlist,
    toggleWishlist,
    compareList,
    toggleCompare,
    trackClick,
    addRecentlyViewed,
  } = useStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isWishlisted = wishlist.includes(product.id);
  const isCompared = compareList.includes(product.id);
  const title = language === 'ar' ? product.titleAr : product.titleEn;

  const handleAffiliateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackClick(product.id);
    addRecentlyViewed(product);
    window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCardClick = () => {
    addRecentlyViewed(product);
    onQuickView(product);
  };

  const hasMultipleImages = product.images && product.images.length > 1;

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white rounded-lg border border-slate-200/80 overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Image Container */}
      <div
        className="relative aspect-3/4 w-full bg-slate-100 overflow-hidden"
        onMouseEnter={() => hasMultipleImages && setCurrentImageIndex(1)}
        onMouseLeave={() => setCurrentImageIndex(0)}
      >
        <img
          src={product.images[currentImageIndex] || product.mainImage}
          alt={title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />

        {/* Top Badges */}
        <div className="absolute top-2 start-2 flex flex-col gap-1 z-10">
          {product.discountPercent && product.discountPercent > 0 && (
            <span className="bg-red-600 text-white font-black text-xs px-2 py-0.5 rounded-xs uppercase shadow-xs">
              -{product.discountPercent}%
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-amber-400 text-black font-extrabold text-[10px] px-2 py-0.5 rounded-xs flex items-center gap-1 shadow-xs">
              <Flame className="w-3 h-3 fill-black" />
              <span>{language === 'ar' ? 'مميز' : 'HOT'}</span>
            </span>
          )}
        </div>

        {/* Top Actions (Wishlist & Compare) */}
        <div className="absolute top-2 end-2 flex flex-col gap-1.5 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            className={`p-2 rounded-full backdrop-blur-md transition-all cursor-pointer ${
              isWishlisted
                ? 'bg-red-50 text-red-600 shadow-md scale-105'
                : 'bg-white/85 hover:bg-white text-slate-700 hover:text-black shadow-2xs'
            }`}
            title={language === 'ar' ? 'إضافة للمفضلة' : 'Add to Wishlist'}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-600' : ''}`} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleCompare(product.id);
            }}
            className={`p-2 rounded-full backdrop-blur-md transition-all cursor-pointer ${
              isCompared
                ? 'bg-black text-amber-400 shadow-md scale-105'
                : 'bg-white/85 hover:bg-white text-slate-700 hover:text-black shadow-2xs'
            }`}
            title={language === 'ar' ? 'مقارنة هذا المنتج (حتى 3)' : 'Compare product (up to 3)'}
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick View Button Hover Overlay */}
        <div className="absolute inset-x-0 bottom-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="flex-1 py-2 bg-white/95 hover:bg-white text-slate-900 text-xs font-bold rounded shadow-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'نظرة سريعة' : 'Quick View'}</span>
          </button>
        </div>
      </div>

      {/* Content Info */}
      <div className="p-3.5 flex-1 flex flex-col justify-between gap-2">
        <div>
          {/* Rating & Views */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <div className="flex items-center gap-1 text-amber-500 font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{product.rating || 4.8}</span>
              <span className="text-slate-400 font-normal">({product.reviewCount || 42})</span>
            </div>
            {product.clicksCount > 0 && (
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                {product.clicksCount} {language === 'ar' ? 'نقرة' : 'clicks'}
              </span>
            )}
          </div>

          {/* Product Title */}
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-black line-clamp-2 leading-snug">
            {title}
          </h3>
        </div>

        {/* Pricing & CTA */}
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5">
          <div className="flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-black text-red-600">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-slate-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Primary Affiliate Button */}
          <button
            onClick={handleAffiliateClick}
            className="w-full py-2.5 px-3 bg-black hover:bg-slate-800 text-white text-xs font-bold rounded flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
          >
            <span>{language === 'ar' ? 'تسوق الآن من SHEIN' : 'Shop Now on SHEIN'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
