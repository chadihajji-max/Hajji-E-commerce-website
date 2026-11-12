import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { PromoBar } from './components/PromoBar';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { CategoryCircles } from './components/CategoryCircles';
import { ProductGrid } from './components/ProductGrid';
import { ProductDetailModal } from './components/ProductDetailModal';
import { WishlistDrawer } from './components/WishlistDrawer';
import { CompareModal } from './components/CompareModal';
import { CompareDock } from './components/CompareDock';
import { RecentlyViewedBar } from './components/RecentlyViewedBar';
import { Footer } from './components/Footer';
import { SallaStorefront } from './components/SallaStorefront';
import { SallaCartDrawer } from './components/SallaCartDrawer';
import { AdminLoginModal } from './components/Admin/AdminLoginModal';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { Product } from './types/store';

function MainApp() {
  const {
    activeProductModal,
    setActiveProductModal,
    isCompareOpen,
    setIsCompareOpen,
    adminToken,
    isAdminOpen,
    setIsAdminOpen,
    isSallaCartOpen,
    setIsSallaCartOpen,
  } = useStore();

  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 relative">
      {/* Top Announcement & Settings Bar */}
      <PromoBar />

      {/* Main Header Nav */}
      <Header onOpenWishlist={() => setIsWishlistOpen(true)} />

      <main className="flex-1">
        {/* Hero Banner Carousel */}
        <HeroBanner />

        {/* Visual Category Circles */}
        <CategoryCircles />

        {/* Store Catalog & Grid (Affiliate SHEIN Products) */}
        <ProductGrid onQuickView={(p: Product) => setActiveProductModal(p)} />

        {/* Independent Salla Storefront Section */}
        <SallaStorefront onOpenSallaCart={() => setIsSallaCartOpen(true)} />

        {/* Recently Viewed Bar */}
        <RecentlyViewedBar onSelectProduct={(p: Product) => setActiveProductModal(p)} />
      </main>

      {/* Salla Cart Drawer & WhatsApp Checkout with Whish Money Step */}
      <SallaCartDrawer
        isOpen={isSallaCartOpen}
        onClose={() => setIsSallaCartOpen(false)}
      />

      {/* Footer */}
      <Footer />

      {/* Floating Compare Dock Bar (appears when items are selected) */}
      <CompareDock />

      {/* Side-by-Side Product Comparison Modal */}
      <CompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        onSelectProduct={(p: Product) => setActiveProductModal(p)}
      />

      {/* PDP Product Detail View Modal */}
      {activeProductModal && (
        <ProductDetailModal
          product={activeProductModal}
          onClose={() => setActiveProductModal(null)}
          onSelectProduct={(p: Product) => setActiveProductModal(p)}
        />
      )}

      {/* Wishlist Drawer */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        onSelectProduct={(p: Product) => setActiveProductModal(p)}
      />

      {/* Admin Login Modal (If not authenticated) */}
      {!adminToken && (
        <AdminLoginModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
      )}

      {/* Admin Dashboard (If authenticated) */}
      {adminToken && (
        <AdminDashboard isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <MainApp />
    </StoreProvider>
  );
}
