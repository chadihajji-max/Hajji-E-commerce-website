import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { ArrowLeft, ArrowRight, Sparkles, ShoppingBag } from 'lucide-react';

export const HeroBanner: React.FC = () => {
  const { banners, language, setSelectedCategory } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeBanners = banners.filter((b) => b.isActive);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  if (activeBanners.length === 0) return null;

  const current = activeBanners[currentIndex];

  const handleCtaClick = () => {
    if (current.linkUrl.startsWith('/#')) {
      const categorySlug = current.linkUrl.replace('/#', '');
      setSelectedCategory(categorySlug);
    } else {
      setSelectedCategory('all');
    }
  };

  return (
    <section className="relative w-full bg-slate-900 text-white overflow-hidden shadow-sm">
      <div className="relative min-h-[360px] sm:min-h-[440px] lg:min-h-[480px] flex items-center">
        {/* Background Banner Image */}
        <div className="absolute inset-0">
          <img
            src={current.image}
            alt={language === 'ar' ? current.titleAr : current.titleEn}
            className="w-full h-full object-cover object-center transition-all duration-700 ease-out transform scale-100"
            referrerPolicy="no-referrer"
          />
          {/* Gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent rtl:bg-gradient-to-l" />
        </div>

        {/* Hero Content */}
        <div className="relative max-w-7xl mx-auto px-6 sm:px-12 py-12 z-10 w-full">
          <div className="max-w-xl flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-semibold text-amber-300 w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'عروض حصرية من SHEIN' : 'Exclusive SHEIN Offers'}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {language === 'ar' ? current.titleAr : current.titleEn}
            </h1>

            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
              {language === 'ar' ? current.subtitleAr : current.subtitleEn}
            </p>

            <div className="pt-2">
              <button
                onClick={handleCtaClick}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-black font-bold text-sm rounded-full shadow-lg hover:bg-amber-400 hover:text-black transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{language === 'ar' ? current.ctaTextAr : current.ctaTextEn}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Prev/Next Buttons */}
        {activeBanners.length > 1 && (
          <div className="absolute bottom-6 end-6 z-20 flex items-center gap-2">
            <button
              onClick={() =>
                setCurrentIndex(
                  (prev) => (prev - 1 + activeBanners.length) % activeBanners.length
                )
              }
              className="p-2.5 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % activeBanners.length)}
              className="p-2.5 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        )}

        {/* Carousel Indicators */}
        {activeBanners.length > 1 && (
          <div className="absolute bottom-6 start-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentIndex === idx ? 'w-8 bg-amber-400' : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
