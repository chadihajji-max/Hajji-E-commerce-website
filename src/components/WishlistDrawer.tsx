import React from 'react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types/store';
import { X, Heart, ExternalLink, Trash2 } from 'lucide-react';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (p: Product) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
}) => {
  const { wishlist, products, toggleWishlist, language, formatPrice, trackClick } = useStore();

  if (!isOpen) return null;

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-s border-slate-200">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <Heart className="w-5 h-5 text-red-600 fill-red-600" />
            <h2 className="text-base">
              {language === 'ar' ? 'قائمة المفضلة' : 'My Wishlist'} ({wishlistedProducts.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 text-slate-500 hover:text-black cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {wishlistedProducts.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <Heart className="w-12 h-12 text-slate-200" />
              <p className="text-sm text-slate-500 font-semibold">
                {language === 'ar' ? 'قائمة المفضلة فارغة حالياً' : 'Your wishlist is currently empty'}
              </p>
              <p className="text-xs text-slate-400 max-w-xs">
                {language === 'ar' ? 'اضغط على أيقونة القلب على أي منتج لإضافته هنا.' : 'Click the heart icon on any product to save it here.'}
              </p>
            </div>
          ) : (
            wishlistedProducts.map((prod) => (
              <div
                key={prod.id}
                className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              >
                <img
                  src={prod.mainImage}
                  alt={prod.titleAr}
                  className="w-16 h-20 object-cover rounded bg-slate-200 shrink-0 cursor-pointer"
                  onClick={() => {
                    onSelectProduct(prod);
                    onClose();
                  }}
                  referrerPolicy="no-referrer"
                />

                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <h3
                    onClick={() => {
                      onSelectProduct(prod);
                      onClose();
                    }}
                    className="text-xs font-bold text-slate-900 line-clamp-2 cursor-pointer hover:underline"
                  >
                    {language === 'ar' ? prod.titleAr : prod.titleEn}
                  </h3>
                  <span className="text-sm font-black text-red-600">
                    {formatPrice(prod.price)}
                  </span>
                  
                  <button
                    onClick={() => {
                      trackClick(prod.id);
                      window.open(prod.affiliateUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className="w-fit inline-flex items-center gap-1 text-[11px] font-bold text-black hover:text-slate-700 underline cursor-pointer mt-0.5"
                  >
                    <span>{language === 'ar' ? 'تسوق من SHEIN' : 'Shop on SHEIN'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <button
                  onClick={() => toggleWishlist(prod.id)}
                  className="p-2 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  title="حذف من المفضلة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
