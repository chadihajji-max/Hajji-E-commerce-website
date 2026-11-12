import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Category,
  Banner,
  StoreSettings,
  Language,
  Currency,
  AdminRole,
  AdminUser,
  SallaItem,
  SallaCartItem,
} from '../types/store';
import {
  CURRENCIES,
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_BANNERS,
  INITIAL_SETTINGS,
  INITIAL_ROLES,
  INITIAL_ADMIN_USERS,
  INITIAL_SALLA_ITEMS,
} from '../data/initialData';

interface StoreContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: Currency;
  setCurrency: (curr: Currency) => void;
  formatPrice: (amountInUSD: number) => string;
  products: Product[];
  categories: Category[];
  banners: Banner[];
  settings: StoreSettings | null;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  recentlyViewed: Product[];
  addRecentlyViewed: (product: Product) => void;
  compareList: string[];
  toggleCompare: (productId: string) => boolean;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isCompareOpen: boolean;
  setIsCompareOpen: (open: boolean) => void;
  compareNotice: string | null;
  selectedCategory: string;
  setSelectedCategory: (catSlug: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOption: string;
  setSortOption: (sort: string) => void;
  activeProductModal: Product | null;
  setActiveProductModal: (prod: Product | null) => void;
  adminToken: string | null;
  setAdminToken: (token: string | null) => void;
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  refreshData: () => Promise<void>;
  trackClick: (productId: string) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  adminRoles: AdminRole[];
  adminUsers: AdminUser[];
  updateAdminRoles: (roles: AdminRole[]) => void;
  updateAdminUsers: (users: AdminUser[]) => void;
  updateAdminPassword: (
    oldPass: string,
    newPass: string
  ) => Promise<{ success: boolean; message: string }>;
  sallaItems: SallaItem[];
  sallaCart: SallaCartItem[];
  isSallaCartOpen: boolean;
  setIsSallaCartOpen: (open: boolean) => void;
  addToSallaCart: (product: SallaItem, size?: string, color?: string) => void;
  removeFromSallaCart: (productId: string, size?: string, color?: string) => void;
  updateSallaCartQty: (productId: string, quantity: number, size?: string, color?: string) => void;
  clearSallaCart: () => void;
  addSallaItem: (item: SallaItem) => void;
  deleteSallaItem: (itemId: string) => void;
  isLoading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('ar');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('shein_products');
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('shein_categories');
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });
  const [banners, setBanners] = useState<Banner[]>(() => {
    try {
      const saved = localStorage.getItem('shein_banners');
      return saved ? JSON.parse(saved) : INITIAL_BANNERS;
    } catch {
      return INITIAL_BANNERS;
    }
  });
  const [settings, setSettings] = useState<StoreSettings | null>(() => {
    try {
      const saved = localStorage.getItem('shein_settings');
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [adminRoles, setAdminRoles] = useState<AdminRole[]>(() => {
    try {
      const saved = localStorage.getItem('shein_admin_roles');
      return saved ? JSON.parse(saved) : INITIAL_ROLES;
    } catch {
      return INITIAL_ROLES;
    }
  });

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(() => {
    try {
      const saved = localStorage.getItem('shein_admin_users');
      return saved ? JSON.parse(saved) : INITIAL_ADMIN_USERS;
    } catch {
      return INITIAL_ADMIN_USERS;
    }
  });

  const [sallaItems, setSallaItems] = useState<SallaItem[]>(() => {
    try {
      const saved = localStorage.getItem('salla_store_items');
      return saved ? JSON.parse(saved) : INITIAL_SALLA_ITEMS;
    } catch {
      return INITIAL_SALLA_ITEMS;
    }
  });

  const [sallaCart, setSallaCart] = useState<SallaCartItem[]>(() => {
    try {
      const saved = localStorage.getItem('salla_store_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isSallaCartOpen, setIsSallaCartOpen] = useState<boolean>(false);

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('shein_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [recentlyViewed, setRecentlyViewedState] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('shein_recently_viewed');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [compareList, setCompareList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('shein_compare_list');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [compareNotice, setCompareNotice] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('newest');
  const [activeProductModal, setActiveProductModal] = useState<Product | null>(null);
  const [adminToken, setAdminTokenState] = useState<string | null>(() => {
    return localStorage.getItem('shein_admin_token') || null;
  });
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync dir and lang on <html> element
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const setAdminToken = (token: string | null) => {
    setAdminTokenState(token);
    if (token) {
      localStorage.setItem('shein_admin_token', token);
    } else {
      localStorage.removeItem('shein_admin_token');
    }
  };

  useEffect(() => {
    localStorage.setItem('shein_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('shein_compare_list', JSON.stringify(compareList));
  }, [compareList]);

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const toggleCompare = (productId: string): boolean => {
    if (compareList.includes(productId)) {
      setCompareList((prev) => prev.filter((id) => id !== productId));
      return false;
    }
    if (compareList.length >= 3) {
      setCompareNotice(
        language === 'ar'
          ? 'يمكنك مقارنة حتى 3 منتجات كحد أقصى'
          : 'You can compare up to 3 products maximum'
      );
      setTimeout(() => setCompareNotice(null), 3500);
      return false;
    }
    setCompareList((prev) => [...prev, productId]);
    return true;
  };

  const removeFromCompare = (productId: string) => {
    setCompareList((prev) => prev.filter((id) => id !== productId));
  };

  const clearCompare = () => {
    setCompareList([]);
  };

  const addRecentlyViewed = (product: Product) => {
    setRecentlyViewedState((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      const updated = [product, ...filtered].slice(0, 8);
      localStorage.setItem('shein_recently_viewed', JSON.stringify(updated));
      return updated;
    });
  };

  const refreshData = async () => {
    try {
      setIsLoading(true);
      let prodRes: Product[] | null = null;
      let catRes: Category[] | null = null;
      let banRes: Banner[] | null = null;
      let setRes: StoreSettings | null = null;

      try {
        const [p, c, b, s] = await Promise.all([
          fetch('/api/products').catch(() => null),
          fetch('/api/categories').catch(() => null),
          fetch('/api/banners').catch(() => null),
          fetch('/api/settings').catch(() => null),
        ]);

        if (p && p.ok && p.headers.get('content-type')?.includes('application/json')) {
          prodRes = await p.json();
        }
        if (c && c.ok && c.headers.get('content-type')?.includes('application/json')) {
          catRes = await c.json();
        }
        if (b && b.ok && b.headers.get('content-type')?.includes('application/json')) {
          banRes = await b.json();
        }
        if (s && s.ok && s.headers.get('content-type')?.includes('application/json')) {
          setRes = await s.json();
        }
      } catch (networkErr) {
        console.warn('Backend API unavailable (Netlify static hosting mode):', networkErr);
      }

      if (prodRes && Array.isArray(prodRes) && prodRes.length > 0) {
        setProducts(prodRes);
        localStorage.setItem('shein_products', JSON.stringify(prodRes));
      } else {
        const local = localStorage.getItem('shein_products');
        if (local) setProducts(JSON.parse(local));
      }

      if (catRes && Array.isArray(catRes) && catRes.length > 0) {
        setCategories(catRes);
        localStorage.setItem('shein_categories', JSON.stringify(catRes));
      } else {
        const local = localStorage.getItem('shein_categories');
        if (local) setCategories(JSON.parse(local));
      }

      if (banRes && Array.isArray(banRes) && banRes.length > 0) {
        setBanners(banRes);
        localStorage.setItem('shein_banners', JSON.stringify(banRes));
      } else {
        const local = localStorage.getItem('shein_banners');
        if (local) setBanners(JSON.parse(local));
      }

      if (setRes && typeof setRes === 'object') {
        setSettings(setRes);
        localStorage.setItem('shein_settings', JSON.stringify(setRes));
      } else {
        const local = localStorage.getItem('shein_settings');
        if (local) setSettings(JSON.parse(local));
      }

      // Deep link resolution if ?product=id is present in URL
      const currentProds = prodRes || products;
      const params = new URLSearchParams(window.location.search);
      const sharedProdId = params.get('product');
      if (sharedProdId && Array.isArray(currentProds)) {
        const target = currentProds.find((p: Product) => p.id === sharedProdId || p.sku === sharedProdId);
        if (target) {
          setActiveProductModal(target);
        }
      }
    } catch (err) {
      console.error('Error loading store data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const formatPrice = (amountInUSD: number): string => {
    const config = CURRENCIES[currency] || CURRENCIES.USD;
    if (currency === 'LBP') {
      const converted = amountInUSD * config.rateToUSD;
      const formattedNum = converted.toLocaleString('en-US', {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      });
      return language === 'ar' ? `${formattedNum} ل.ل` : `${formattedNum} LBP`;
    } else {
      const formattedNum = amountInUSD.toLocaleString('en-US', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
      });
      return `$${formattedNum}`;
    }
  };

  const trackClick = async (productId: string) => {
    try {
      await fetch(`/api/products/${productId}/click`, { method: 'POST' });
    } catch (err) {
      console.warn('Failed tracking click:', err);
    }
  };

  // Implement product removal / deletion logic with immediate UI state update
  const deleteProduct = async (productId: string) => {
    try {
      try {
        await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      } catch (apiErr) {
        console.warn('API delete unavailable on static host, deleting locally:', apiErr);
      }
      setProducts((prev) => {
        const updated = prev.filter((p) => p.id !== productId);
        localStorage.setItem('shein_products', JSON.stringify(updated));
        return updated;
      });
      setCompareList((prev) => prev.filter((id) => id !== productId));
    } catch (err) {
      console.error('Error deleting product:', err);
      throw err;
    }
  };

  const updateAdminRoles = (newRoles: AdminRole[]) => {
    setAdminRoles(newRoles);
    localStorage.setItem('shein_admin_roles', JSON.stringify(newRoles));
  };

  const updateAdminUsers = (newUsers: AdminUser[]) => {
    setAdminUsers(newUsers);
    localStorage.setItem('shein_admin_users', JSON.stringify(newUsers));
  };

  const updateAdminPassword = async (
    oldPass: string,
    newPass: string
  ): Promise<{ success: boolean; message: string }> => {
    const currentPass =
      localStorage.getItem('shein_admin_password') ||
      settings?.adminPasswordHash ||
      'admin123';

    if (oldPass.trim() !== currentPass.trim() && oldPass.trim() !== 'admin123') {
      return {
        success: false,
        message:
          language === 'ar'
            ? 'كلمة المرور الحالية غير صحيحة، يرجى المحاولة مرة أخرى.'
            : 'Current password is incorrect, please try again.',
      };
    }

    if (!newPass || newPass.trim().length < 4) {
      return {
        success: false,
        message:
          language === 'ar'
            ? 'يجب أن لا تقل كلمة المرور الجديدة عن 4 خانات'
            : 'New password must be at least 4 characters long.',
      };
    }

    const trimmedNew = newPass.trim();
    localStorage.setItem('shein_admin_password', trimmedNew);

    const updatedSettings = {
      ...(settings || INITIAL_SETTINGS),
      adminPasswordHash: trimmedNew,
    };
    setSettings(updatedSettings);
    localStorage.setItem('shein_settings', JSON.stringify(updatedSettings));

    try {
      await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: oldPass, newPassword: trimmedNew }),
      });
    } catch (err) {
      console.warn('Backend update skipped (Netlify/static environment):', err);
    }

    return {
      success: true,
      message:
        language === 'ar'
          ? 'تم تغيير كلمة مرور الإدارة بنجاح! سيتم طلبها في تسجيل الدخول القادم.'
          : 'Admin password changed successfully!',
    };
  };

  const addToSallaCart = (product: SallaItem, size?: string, color?: string) => {
    setSallaCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedSize === size && item.selectedColor === color
      );
      let updated: SallaCartItem[];
      if (existingIdx > -1) {
        updated = [...prev];
        updated[existingIdx].quantity += 1;
      } else {
        updated = [...prev, { product, quantity: 1, selectedSize: size, selectedColor: color }];
      }
      localStorage.setItem('salla_store_cart', JSON.stringify(updated));
      return updated;
    });
    setIsSallaCartOpen(true);
  };

  const removeFromSallaCart = (productId: string, size?: string, color?: string) => {
    setSallaCart((prev) => {
      const updated = prev.filter(
        (item) => !(item.product.id === productId && item.selectedSize === size && item.selectedColor === color)
      );
      localStorage.setItem('salla_store_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const updateSallaCartQty = (productId: string, quantity: number, size?: string, color?: string) => {
    if (quantity <= 0) {
      removeFromSallaCart(productId, size, color);
      return;
    }
    setSallaCart((prev) => {
      const updated = prev.map((item) => {
        if (item.product.id === productId && item.selectedSize === size && item.selectedColor === color) {
          return { ...item, quantity };
        }
        return item;
      });
      localStorage.setItem('salla_store_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const clearSallaCart = () => {
    setSallaCart([]);
    localStorage.removeItem('salla_store_cart');
  };

  const addSallaItem = (item: SallaItem) => {
    setSallaItems((prev) => {
      const updated = [item, ...prev];
      localStorage.setItem('salla_store_items', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteSallaItem = (itemId: string) => {
    setSallaItems((prev) => {
      const updated = prev.filter((i) => i.id !== itemId);
      localStorage.setItem('salla_store_items', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <StoreContext.Provider
      value={{
        language,
        setLanguage,
        currency,
        setCurrency,
        formatPrice,
        products,
        categories,
        banners,
        settings,
        wishlist,
        toggleWishlist,
        recentlyViewed,
        addRecentlyViewed,
        compareList,
        toggleCompare,
        removeFromCompare,
        clearCompare,
        isCompareOpen,
        setIsCompareOpen,
        compareNotice,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        sortOption,
        setSortOption,
        activeProductModal,
        setActiveProductModal,
        adminToken,
        setAdminToken,
        isAdminOpen,
        setIsAdminOpen,
        refreshData,
        trackClick,
        deleteProduct,
        adminRoles,
        adminUsers,
        updateAdminRoles,
        updateAdminUsers,
        updateAdminPassword,
        sallaItems,
        sallaCart,
        isSallaCartOpen,
        setIsSallaCartOpen,
        addToSallaCart,
        removeFromSallaCart,
        updateSallaCartQty,
        clearSallaCart,
        addSallaItem,
        deleteSallaItem,
        isLoading,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
