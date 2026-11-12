import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Product,
  Category,
  Banner,
  StoreSettings,
  SheinImportPreview,
  AdminRole,
  AdminUser,
  PermissionKey,
  SallaItem,
} from '../../types/store';
import { parseSheinLinkClient } from '../../utils/sheinParser';
import { INITIAL_PRODUCTS, PERMISSIONS_LIST } from '../../data/initialData';
import {
  X,
  LayoutDashboard,
  Sparkles,
  Package,
  Image as ImageIcon,
  Link2,
  Settings,
  LogOut,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  Eye,
  TrendingUp,
  MousePointer,
  BarChart3,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  KeyRound,
  Users,
  Lock,
  EyeOff,
  UserPlus,
  ShieldAlert,
  Check,
  Shield,
  Key,
  ShoppingBag,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const {
    adminToken,
    setAdminToken,
    language,
    settings,
    products,
    categories,
    banners,
    refreshData,
    formatPrice,
    deleteProduct,
    adminRoles,
    adminUsers,
    updateAdminRoles,
    updateAdminUsers,
    updateAdminPassword,
    sallaItems,
    addSallaItem,
    deleteSallaItem,
  } = useStore();

  const [activeTab, setActiveTab] = useState<
    'analytics' | 'importer' | 'products' | 'banners' | 'marketing' | 'settings' | 'permissions' | 'salla_manager'
  >('analytics');

  // Salla Product Manager Modal / Form State
  const [editingSallaItem, setEditingSallaItem] = useState<Partial<SallaItem> | null>(null);
  const [sallaItemNotice, setSallaItemNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Permissions & Password States
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sub-section filter in permissions tab
  const [permissionsSection, setPermissionsSection] = useState<'all' | 'password' | 'roles' | 'staff'>('all');

  // Add Staff Modal State
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('catalog_manager');
  const [staffNotice, setStaffNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // SHEIN Importer States
  const [sheinUrl, setSheinUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [importPreview, setImportPreview] = useState<SheinImportPreview | null>(null);
  const [importMsg, setImportMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Editing Product Modal State
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  // Deleting Product State & Custom Confirmation Modal
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Admin Products State (includes unpublished)
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [loadingAdminProducts, setLoadingAdminProducts] = useState(false);

  // Store Settings Form State
  const [settingsForm, setSettingsForm] = useState<Partial<StoreSettings>>({});
  const [settingsSaved, setSettingsSaved] = useState(false);

  const fetchAdminProducts = async () => {
    setLoadingAdminProducts(true);
    try {
      const res = await fetch('/api/admin/products');
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAdminProducts(data);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend API unavailable (Netlify static hosting mode), using local data:', err);
    } finally {
      setLoadingAdminProducts(false);
    }

    const local = localStorage.getItem('shein_products');
    const localProds = local ? JSON.parse(local) : (products.length > 0 ? products : INITIAL_PRODUCTS);
    setAdminProducts(localProds);
  };

  // Load analytics or admin products when tab opens
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch('/api/analytics');
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        setAnalyticsData(data);
        return;
      }
    } catch (err) {
      console.warn('Backend analytics unavailable, calculating locally:', err);
    } finally {
      setLoadingAnalytics(false);
    }

    const currentProds = adminProducts.length > 0 ? adminProducts : products;
    const totalProducts = currentProds.length;
    const totalClicks = currentProds.reduce((acc, p) => acc + (p.clicksCount || 0), 0);
    const totalViews = currentProds.reduce((acc, p) => acc + (p.viewsCount || 0), 0);
    const topClickedProducts = [...currentProds]
      .sort((a, b) => (b.clicksCount || 0) - (a.clicksCount || 0))
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        title: p.titleAr || p.titleEn,
        clicks: p.clicksCount || 0,
        views: p.viewsCount || 0,
      }));

    setAnalyticsData({
      totalProducts,
      totalClicks,
      totalViews,
      topClickedProducts,
      recentClicks: [],
    });
  };

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'analytics') {
        fetchAnalytics();
      } else if (activeTab === 'products') {
        fetchAdminProducts();
      }
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (settings) {
      setSettingsForm(settings);
    }
  }, [settings]);

  if (!isOpen || !adminToken) return null;

  // Handle Automated SHEIN Link Import
  const handleSheinImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheinUrl.trim()) return;
    setImporting(true);
    setImportMsg(null);
    setImportPreview(null);

    // 1. Try server-side extractor endpoint if available
    try {
      const res = await fetch('/api/import/shein', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sheinUrl }),
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.success && data.preview) {
          setImportPreview(data.preview);
          setImportMsg({
            type: 'success',
            text:
              language === 'ar'
                ? 'تم جلب بيانات المنتج بنجاح من SHEIN! يمكنك معاينتها وتعديلها أدناه قبل النشر.'
                : 'SHEIN Product details fetched successfully! Review and edit below before publishing.',
          });
          setImporting(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend server import unavailable (Netlify static mode), using client parser:', err);
    }

    // 2. Client-side robust fallback parser for Netlify and static deployments
    try {
      const clientPreview = parseSheinLinkClient(
        sheinUrl,
        settings?.defaultAffiliateId || 'SHEIN_SELECT_LB'
      );
      setImportPreview(clientPreview);
      setImportMsg({
        type: 'success',
        text:
          language === 'ar'
            ? 'تم استخراج بيانات المنتج وتوليد رابط العمولة بنجاح! راجع البيانات أدناه وقم بالتعديل إذا رغبت قبل النشر.'
            : 'Product details extracted and affiliate link generated! Review and customize below before publishing.',
      });
    } catch (parseErr) {
      setImportMsg({
        type: 'error',
        text:
          language === 'ar'
            ? 'حدث خطأ أثناء استخراج بيانات الرابط، يرجى التأكد من الرابط والمحاولة مجدداً.'
            : 'Error parsing link, please verify and try again.',
      });
    } finally {
      setImporting(false);
    }
  };

  // Publish Previewed Product
  const handlePublishImportedProduct = async () => {
    if (!importPreview || isPublishing) return;
    setIsPublishing(true);

    const newProd: Product = {
      id: 'prod-' + Date.now(),
      sku: importPreview.sku || 'SH-' + Math.floor(100000 + Math.random() * 900000),
      titleAr: importPreview.titleAr,
      titleEn: importPreview.titleEn,
      descriptionAr: importPreview.descriptionAr || '',
      descriptionEn: importPreview.descriptionEn || '',
      price: importPreview.price,
      originalPrice: importPreview.originalPrice,
      discountPercent: importPreview.discountPercent || 0,
      mainImage: importPreview.mainImage,
      images: importPreview.images && importPreview.images.length > 0 ? importPreview.images : [importPreview.mainImage],
      categorySlug: importPreview.categorySlug || 'women-dresses',
      colors: importPreview.colors || ['#000000'],
      sizes: importPreview.sizes || ['S', 'M', 'L', 'XL'],
      affiliateUrl: importPreview.affiliateUrl,
      originalSheinUrl: importPreview.originalSheinUrl,
      isFeatured: true,
      isPublished: true,
      viewsCount: 0,
      clicksCount: 0,
      rating: 4.8,
      reviewCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProd),
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.product?.id) {
          newProd.id = data.product.id;
        }
      }
    } catch (err) {
      console.warn('API post unavailable, saved locally:', err);
    }

    // Always update local products state & localStorage!
    setAdminProducts((prev) => {
      const updated = [newProd, ...prev];
      localStorage.setItem('shein_products', JSON.stringify(updated));
      return updated;
    });

    await refreshData();
    setImportPreview(null);
    setSheinUrl('');
    setImportMsg({
      type: 'success',
      text:
        language === 'ar'
          ? '✓ تم حفظ ونشر المنتج بنجاح في متجرك والكتالوج!'
          : '✓ Product published successfully to your store catalog!',
    });
    setIsPublishing(false);
    setTimeout(() => {
      setActiveTab('products');
    }, 600);
  };

  // Delete Product Handler via Modal
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      setAdminProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      await refreshData();
      setDeleteFeedback({
        type: 'success',
        message: language === 'ar' ? 'تم حذف المنتج من الكتالوج بنجاح!' : 'Product deleted successfully from catalog!',
      });
      setTimeout(() => setDeleteFeedback(null), 3500);
      setProductToDelete(null);
    } catch (err) {
      console.error('Delete error:', err);
      setDeleteFeedback({
        type: 'error',
        message: language === 'ar' ? 'حدث خطأ أثناء محاولة الحذف، يرجى المحاولة مرة أخرى.' : 'Error deleting product, please try again.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle Featured / Published state
  const handleToggleProductState = async (product: Product, field: 'isFeatured' | 'isPublished') => {
    try {
      await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [field]: !product[field],
        }),
      });
    } catch (err) {
      console.warn('API toggle unavailable, updating locally:', err);
    }

    setAdminProducts((prev) => {
      const updated = prev.map((p) =>
        p.id === product.id ? { ...p, [field]: !p[field], updatedAt: new Date().toISOString() } : p
      );
      localStorage.setItem('shein_products', JSON.stringify(updated));
      return updated;
    });
    refreshData();
  };

  // Save Edit Product Modal
  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const isNew = !editingProduct.id;
    const finalProduct: Product = {
      id: editingProduct.id || 'prod-' + Date.now(),
      sku: editingProduct.sku || 'SH-' + Math.floor(100000 + Math.random() * 900000),
      titleAr: editingProduct.titleAr || '',
      titleEn: editingProduct.titleEn || '',
      descriptionAr: editingProduct.descriptionAr || '',
      descriptionEn: editingProduct.descriptionEn || '',
      price: editingProduct.price || 25,
      originalPrice: editingProduct.originalPrice,
      discountPercent: editingProduct.discountPercent,
      mainImage: editingProduct.mainImage || '',
      images: editingProduct.images && editingProduct.images.length > 0 ? editingProduct.images : [editingProduct.mainImage || ''],
      categorySlug: editingProduct.categorySlug || 'women-dresses',
      colors: editingProduct.colors || ['#000000'],
      sizes: editingProduct.sizes || ['S', 'M', 'L'],
      affiliateUrl: editingProduct.affiliateUrl || '',
      originalSheinUrl: editingProduct.originalSheinUrl || '',
      isFeatured: editingProduct.isFeatured ?? true,
      isPublished: editingProduct.isPublished ?? true,
      viewsCount: editingProduct.viewsCount || 0,
      clicksCount: editingProduct.clicksCount || 0,
      rating: editingProduct.rating || 4.8,
      reviewCount: editingProduct.reviewCount || 1,
      createdAt: editingProduct.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const url = isNew ? '/api/products' : `/api/products/${finalProduct.id}`;
      const method = isNew ? 'POST' : 'PUT';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalProduct),
      });
    } catch (err) {
      console.warn('API save unavailable, saving locally:', err);
    }

    setAdminProducts((prev) => {
      let updated: Product[];
      if (isNew) {
        updated = [finalProduct, ...prev];
      } else {
        updated = prev.map((p) => (p.id === finalProduct.id ? finalProduct : p));
      }
      localStorage.setItem('shein_products', JSON.stringify(updated));
      return updated;
    });

    setEditingProduct(null);
    refreshData();
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      });
    } catch (err) {
      console.warn('API settings save unavailable, saving locally:', err);
    }

    if (settingsForm.adminPasswordHash) {
      localStorage.setItem('shein_admin_password', settingsForm.adminPasswordHash);
    }

    const updatedSettings = { ...settings, ...settingsForm } as StoreSettings;
    localStorage.setItem('shein_settings', JSON.stringify(updatedSettings));
    setSettingsSaved(true);
    refreshData();
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordNotice(null);

    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordNotice({
        type: 'error',
        message:
          language === 'ar'
            ? 'كلمة المرور الجديدة وتأكيد كلمة المرور غير متطابقين'
            : 'New passwords do not match',
      });
      return;
    }

    if (newPasswordInput.length < 4) {
      setPasswordNotice({
        type: 'error',
        message:
          language === 'ar'
            ? 'يجب ألا تقل كلمة المرور الجديدة عن 4 خانات'
            : 'Password must be at least 4 characters long',
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await updateAdminPassword(currentPasswordInput, newPasswordInput);
      setPasswordNotice({
        type: res.success ? 'success' : 'error',
        message: res.message,
      });
      if (res.success) {
        setCurrentPasswordInput('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
      }
    } catch {
      setPasswordNotice({
        type: 'error',
        message:
          language === 'ar'
            ? 'حدث خطأ غير متوقع أثناء تحديث كلمة المرور'
            : 'An unexpected error occurred while updating password',
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Toggle Role Permission
  const handleToggleRolePermission = (roleId: string, permKey: PermissionKey) => {
    const updated = adminRoles.map((role) => {
      if (role.id !== roleId) return role;
      if (role.isSystem) return role; // Root role stays full access
      const hasPerm = role.permissions.includes(permKey);
      const newPerms = hasPerm
        ? role.permissions.filter((p) => p !== permKey)
        : [...role.permissions, permKey];
      return { ...role, permissions: newPerms };
    });
    updateAdminRoles(updated);
  };

  // Add Staff User
  const handleAddStaffUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim()) return;

    const assignedRole = adminRoles.find((r) => r.id === newStaffRole);
    const newUser: AdminUser = {
      id: 'user-' + Date.now(),
      name: newStaffName.trim(),
      email: newStaffEmail.trim().toLowerCase(),
      roleId: newStaffRole,
      status: 'active',
      lastActive: language === 'ar' ? 'تمت الإضافة حديثاً' : 'Newly added',
      createdAt: new Date().toISOString().split('T')[0],
    };

    updateAdminUsers([...adminUsers, newUser]);
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffRole('catalog_manager');
    setIsAddStaffOpen(false);
    setStaffNotice({
      type: 'success',
      message:
        language === 'ar'
          ? `تمت إضافة المسؤول "${newUser.name}" بصلاحيات ${assignedRole?.nameAr || ''} بنجاح!`
          : `Staff member "${newUser.name}" added successfully!`,
    });
    setTimeout(() => setStaffNotice(null), 4000);
  };

  // Toggle Staff User Status
  const handleToggleStaffStatus = (userId: string) => {
    if (userId === 'user-root') return;
    const updated = adminUsers.map((u) => {
      if (u.id !== userId) return u;
      return {
        ...u,
        status: (u.status === 'active' ? 'suspended' : 'active') as 'active' | 'suspended',
      };
    });
    updateAdminUsers(updated);
  };

  // Save Salla Item
  const handleSaveSallaItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSallaItem) return;

    const item: SallaItem = {
      id: editingSallaItem.id || 'salla-' + Date.now(),
      sku: editingSallaItem.sku || 'SALLA-' + Math.floor(1000 + Math.random() * 9000),
      titleAr: editingSallaItem.titleAr || 'منتج سلة جديد',
      titleEn: editingSallaItem.titleEn || 'New Salla Item',
      descriptionAr: editingSallaItem.descriptionAr || 'وصف المنتج عبر منصة سلة',
      descriptionEn: editingSallaItem.descriptionEn || 'Salla store item description',
      price: Number(editingSallaItem.price) || 49.99,
      originalPrice: editingSallaItem.originalPrice ? Number(editingSallaItem.originalPrice) : undefined,
      mainImage: editingSallaItem.mainImage || 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80',
      images: editingSallaItem.images && editingSallaItem.images.length > 0 ? editingSallaItem.images : ['https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80'],
      categorySlug: editingSallaItem.categorySlug || 'beauty-makeup',
      sizes: editingSallaItem.sizes || ['Standard'],
      colors: editingSallaItem.colors || ['أسود'],
      stockQuantity: Number(editingSallaItem.stockQuantity) || 20,
      isAvailable: editingSallaItem.isAvailable !== false,
      createdAt: editingSallaItem.createdAt || new Date().toISOString(),
    };

    addSallaItem(item);
    setEditingSallaItem(null);
    setSallaItemNotice({
      type: 'success',
      message: language === 'ar' ? 'تم حفظ وإضافة منتج سلة بنجاح!' : 'Salla item saved successfully!',
    });
    setTimeout(() => setSallaItemNotice(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white w-full max-w-6xl h-[94vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Top Navigation Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-400 text-black flex items-center justify-center font-black text-lg">
              S
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                {language === 'ar' ? 'لوحة تحكم المتجر الإدارية' : 'SHEIN Affiliate Admin Dashboard'}
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'ar' ? 'إدارة المنتجات، روابط العمولة، الإحصائيات، والإعدادات' : 'Manage products, affiliate links, analytics & theme'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setAdminToken(null);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-red-400 hover:text-red-300 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-700"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dashboard Sidebar & Content Split */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Sidebar Menu */}
          <div className="w-full md:w-64 bg-slate-900/95 text-slate-300 border-e border-slate-800 p-4 flex flex-row md:flex-col gap-1 overflow-x-auto shrink-0">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-amber-400 text-black'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>{language === 'ar' ? 'الإحصائيات والتقارير' : 'Analytics & Clicks'}</span>
            </button>

            <button
              onClick={() => setActiveTab('importer')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'importer'
                  ? 'bg-amber-400 text-black'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{language === 'ar' ? 'مستورد رابط SHEIN' : 'SHEIN Link Importer'}</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'products'
                  ? 'bg-amber-400 text-black'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>{language === 'ar' ? 'إدارة المنتجات' : 'Products Manager'} ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('marketing')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'marketing'
                  ? 'bg-amber-400 text-black'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Link2 className="w-4 h-4" />
              <span>{language === 'ar' ? 'معرف العمولة Affiliate' : 'Affiliate Tracking'}</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-amber-400 text-black'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>{language === 'ar' ? 'إعدادات المتجر وSEO' : 'Settings & SEO'}</span>
            </button>

            <button
              onClick={() => setActiveTab('permissions')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'permissions'
                  ? 'bg-amber-400 text-black'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{language === 'ar' ? 'الصلاحيات وتغيير كلمة السر' : 'Permissions & Password'}</span>
            </button>

            <button
              onClick={() => setActiveTab('salla_manager')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'salla_manager'
                  ? 'bg-amber-400 text-black'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-amber-500" />
              <span>{language === 'ar' ? 'إدارة منتجات سلة' : 'Salla Store Manager'} ({sallaItems.length})</span>
            </button>
          </div>

          {/* Main Content Viewport */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            
            {/* 1. ANALYTICS TAB */}
            {activeTab === 'analytics' && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {language === 'ar' ? 'تقرير أداء النقرات والمشاهدات' : 'Affiliate Performance Summary'}
                  </h3>
                  <button
                    onClick={fetchAnalytics}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-black cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingAnalytics ? 'animate-spin' : ''}`} />
                    <span>{language === 'ar' ? 'تحديث البيانات' : 'Refresh'}</span>
                  </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-semibold">{language === 'ar' ? 'إجمالي المنتجات' : 'Total Products'}</span>
                      <h4 className="text-2xl font-black text-slate-900">{analyticsData?.totalProducts || products.length}</h4>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <MousePointer className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-semibold">{language === 'ar' ? 'إجمالي نقرات العمولة' : 'Total Affiliate Clicks'}</span>
                      <h4 className="text-2xl font-black text-slate-900">{analyticsData?.totalClicks || 0}</h4>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <Eye className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-semibold">{language === 'ar' ? 'إجمالي مشاهدات الصفحات' : 'Total Product Views'}</span>
                      <h4 className="text-2xl font-black text-slate-900">{analyticsData?.totalViews || 0}</h4>
                    </div>
                  </div>
                </div>

                {/* Recharts Analytics Visualization */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-amber-500" />
                        <span>{language === 'ar' ? 'مخطط مقارنة المشاهدات والنقرات للمنتجات' : 'Product Views & Affiliate Clicks Analytics'}</span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {language === 'ar'
                          ? 'تحليل تفاعلي لأداء تفاعل الزوار مع منتجات المتجر عبر الرسوم البيانية.'
                          : 'Interactive visual breakdown of visitor engagement and conversion rates.'}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
                      {language === 'ar' ? 'أبرز المنتجات نشاطاً' : 'Top Active Products'}
                    </span>
                  </div>

                  {analyticsData?.topClickedProducts && analyticsData.topClickedProducts.length > 0 ? (
                    <div className="w-full h-72 pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analyticsData.topClickedProducts.slice(0, 6).map((p: any) => ({
                            name: p.title.length > 20 ? p.title.substring(0, 20) + '...' : p.title,
                            views: p.views || 0,
                            clicks: p.clicks || 0,
                          }))}
                          margin={{ top: 10, right: 30, left: 0, bottom: 35 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis
                            dataKey="name"
                            angle={-20}
                            textAnchor="end"
                            interval={0}
                            tick={{ fontSize: 10, fill: '#64748b' }}
                          />
                          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              borderColor: '#334155',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '12px',
                            }}
                          />
                          <Bar dataKey="views" name={language === 'ar' ? 'المشاهدات' : 'Views'} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="clicks" name={language === 'ar' ? 'نقرات العمولة' : 'Affiliate Clicks'} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-400 italic">
                      {language === 'ar' ? 'لا توجد بيانات كافية لعرض المخطط البياني حالياً' : 'Insufficient data for chart visualization'}
                    </div>
                  )}
                </div>

                {/* Category Conversion Rate Summary Panel (Clicks vs Views / Impressions) */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-emerald-600" />
                        <span>{language === 'ar' ? 'معدل تحويل التصنيفات (النقرات مقابل المشاهدات)' : 'Category Conversion Rates (Clicks vs Impressions)'}</span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {language === 'ar'
                          ? 'نسبة النقرات إلى المشاهدات لكل تصنيف إداري مع مؤشر تقدم بصري لتحديد التصنيفات الأكثر تفاعلاً.'
                          : 'Conversion percentage (clicks / views) per product category with visual progress bar indicator.'}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded font-bold">
                      {language === 'ar' ? 'تحليل أداء الأقسام' : 'Category Performance'}
                    </span>
                  </div>

                  {(() => {
                    const activeProds = adminProducts.length > 0 ? adminProducts : products;
                    const catStats = categories.map((cat) => {
                      const catProds = activeProds.filter((p) => p.categorySlug === cat.slug);
                      const views = catProds.reduce((sum, p) => sum + (p.viewsCount || 0), 0);
                      const clicks = catProds.reduce((sum, p) => sum + (p.clicksCount || 0), 0);
                      const conversionRate = views > 0 ? Math.min(100, Number(((clicks / views) * 100).toFixed(1))) : 0;
                      return {
                        slug: cat.slug,
                        name: language === 'ar' ? cat.nameAr : cat.nameEn,
                        productCount: catProds.length,
                        views,
                        clicks,
                        conversionRate,
                      };
                    }).sort((a, b) => b.conversionRate - a.conversionRate);

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {catStats.map((stat) => (
                          <div
                            key={stat.slug}
                            className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 flex flex-col gap-2.5"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">{stat.name}</span>
                                <span className="text-[10px] text-slate-500 font-mono">({stat.productCount} {language === 'ar' ? 'منتج' : 'items'})</span>
                              </div>
                              <span className="text-xs font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded font-mono">
                                {stat.conversionRate}% {language === 'ar' ? 'معدل تحويل' : 'Conversion'}
                              </span>
                            </div>

                            {/* Simple Progress Bar Visualization */}
                            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-amber-500 to-emerald-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(4, stat.conversionRate)}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-0.5">
                              <span>{stat.views} {language === 'ar' ? 'مشاهدة (Impressions)' : 'Views'}</span>
                              <span className="font-bold text-slate-800">{stat.clicks} {language === 'ar' ? 'نقرة عمولة (Clicks)' : 'Clicks'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Top Clicked Products */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
                  <h4 className="text-sm font-extrabold text-slate-900 mb-4">
                    {language === 'ar' ? 'المنتجات الأكثر تحويلاً لنقرات العمولة' : 'Top Clicked Affiliate Products'}
                  </h4>
                  {analyticsData?.topClickedProducts && analyticsData.topClickedProducts.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {analyticsData.topClickedProducts.map((p: any, idx: number) => (
                        <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-extrabold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-slate-800 line-clamp-1 max-w-md">{p.title}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-slate-500 font-mono">{p.views} مشاهدة</span>
                            <span className="font-extrabold text-red-600 bg-red-50 px-2.5 py-1 rounded font-mono">
                              {p.clicks} نقرة
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-4">{language === 'ar' ? 'لا توجد نقرات مسجلة بعد.' : 'No click data recorded yet.'}</p>
                  )}
                </div>
              </div>
            )}

            {/* 2. AUTOMATED SHEIN LINK IMPORTER */}
            {activeTab === 'importer' && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 mb-1">
                    {language === 'ar' ? 'إضافة منتج تلقائياً بواسطة رابط SHEIN' : 'Auto Import Product via SHEIN Link'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'ar'
                      ? 'ضع رابط أي منتج من SHEIN ليتم استخراج الصور والأوصاف والأسعار والمقاسات تلقائياً عبر الذكاء الاصطناعي مع إمكانية التعديل.'
                      : 'Paste any SHEIN product URL to parse images, title, description, price, and specs automatically using Gemini AI.'}
                  </p>
                </div>

                {/* URL Input Form */}
                <form onSubmit={handleSheinImport} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={sheinUrl}
                      onChange={(e) => setSheinUrl(e.target.value)}
                      placeholder={
                        language === 'ar'
                          ? 'الصق رابط منتج SHEIN أو رابط shein.top أو رسالة المشاركة من التطبيق...'
                          : 'Paste SHEIN link, shein.top short link, or app share message...'
                      }
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-black"
                      required
                    />
                    <button
                      type="submit"
                      disabled={importing}
                      className="px-6 py-3 bg-black hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>
                        {importing
                          ? language === 'ar'
                            ? 'جاري جلب البيانات والتجهيز...'
                            : 'Fetching & Extracting...'
                          : language === 'ar'
                          ? 'جلب بيانات SHEIN'
                          : 'Fetch Product Data'}
                      </span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    {language === 'ar'
                      ? 'يدعم جميع الروابط المباشرة (ar.shein.com)، الروابط المختصرة (shein.top)، ورسائل المشاركة المنسوخة من تطبيق شي إن للجوال.'
                      : 'Supports full SHEIN links (ar.shein.com), short links (shein.top), and mobile app share texts.'}
                  </p>

                  {importMsg && (
                    <div
                      className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                        importMsg.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}
                    >
                      {importMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
                      <span>{importMsg.text}</span>
                    </div>
                  )}
                </form>

                {/* Import Live Preview */}
                {importPreview && (
                  <div className="bg-white p-6 rounded-xl border-2 border-amber-400 shadow-md flex flex-col gap-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                        <h4 className="text-sm font-black text-slate-900">
                          {language === 'ar' ? 'معاينة البيانات المستخرجة قبل النشر' : 'Imported Product Metadata Preview'}
                        </h4>
                      </div>
                      <button
                        onClick={handlePublishImportedProduct}
                        disabled={isPublishing}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg shadow cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                      >
                        {isPublishing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>{language === 'ar' ? 'جارٍ النشر...' : 'Publishing...'}</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>{language === 'ar' ? 'تأكيد ونشر المنتج في المتجر' : 'Publish Product Now'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-3">
                        <label className="text-xs font-bold text-slate-700">{language === 'ar' ? 'الصورة الرئيسية المستخرجة:' : 'Extracted Main Image:'}</label>
                        <div className="aspect-3/4 w-full bg-slate-100 rounded-lg overflow-hidden border">
                          <img src={importPreview.mainImage} alt="preview" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-600">{language === 'ar' ? 'رابط الصورة (يمكنك تغييره إن أردت):' : 'Image URL (editable):'}</label>
                          <input
                            type="text"
                            value={importPreview.mainImage}
                            onChange={(e) => setImportPreview({ ...importPreview, mainImage: e.target.value, images: [e.target.value] })}
                            className="w-full bg-slate-50 border p-2 rounded text-xs mt-1 font-mono text-slate-600"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700">{language === 'ar' ? 'عنوان المنتج بالعربية:' : 'Arabic Title:'}</label>
                          <input
                            type="text"
                            value={importPreview.titleAr}
                            onChange={(e) => setImportPreview({ ...importPreview, titleAr: e.target.value })}
                            className="w-full bg-slate-50 border p-2 rounded text-xs mt-1 font-bold text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700">{language === 'ar' ? 'عنوان المنتج بالإنجليزية:' : 'English Title:'}</label>
                          <input
                            type="text"
                            value={importPreview.titleEn}
                            onChange={(e) => setImportPreview({ ...importPreview, titleEn: e.target.value })}
                            className="w-full bg-slate-50 border p-2 rounded text-xs mt-1"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-bold text-slate-700">{language === 'ar' ? 'السعر ($ دولار أمريكي):' : 'Price ($ USD):'}</label>
                            <div className="relative mt-1">
                              <span className="absolute start-2.5 top-1/2 -translate-y-1/2 font-bold text-red-600 text-xs select-none">$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={importPreview.price}
                                onChange={(e) => setImportPreview({ ...importPreview, price: Number(e.target.value) })}
                                className="w-full bg-slate-50 border p-2 ps-6 rounded text-xs font-bold text-red-600"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-700">{language === 'ar' ? 'السعر السابق ($ إن وجد):' : 'Original Price ($ if any):'}</label>
                            <div className="relative mt-1">
                              <span className="absolute start-2.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs select-none">$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={importPreview.originalPrice || ''}
                                onChange={(e) => setImportPreview({ ...importPreview, originalPrice: Number(e.target.value) })}
                                className="w-full bg-slate-50 border p-2 ps-6 rounded text-xs mt-1"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-bold text-slate-700">{language === 'ar' ? 'التصنيف المناسب:' : 'Category:'}</label>
                            <select
                              value={importPreview.categorySlug}
                              onChange={(e) => setImportPreview({ ...importPreview, categorySlug: e.target.value })}
                              className="w-full bg-slate-50 border p-2 rounded text-xs mt-1 font-bold"
                            >
                              <option value="women-dresses">{language === 'ar' ? 'فساتين نسائية' : 'Women Dresses'}</option>
                              <option value="men-streetwear">{language === 'ar' ? 'ملابس رجالية' : 'Men Clothing'}</option>
                              <option value="tops-jackets">{language === 'ar' ? 'بلوزات وجاكيتات' : 'Tops & Jackets'}</option>
                              <option value="shoes-footwear">{language === 'ar' ? 'أحذية وصنادل' : 'Shoes & Footwear'}</option>
                              <option value="bags-accessories">{language === 'ar' ? 'حقائب وإكسسوارات' : 'Bags & Accessories'}</option>
                              <option value="beauty-makeup">{language === 'ar' ? 'تجميل وعناية' : 'Beauty & Care'}</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-700">{language === 'ar' ? 'رمز SKU المستخرج:' : 'Extracted SKU:'}</label>
                            <input
                              type="text"
                              value={importPreview.sku || ''}
                              onChange={(e) => setImportPreview({ ...importPreview, sku: e.target.value })}
                              className="w-full bg-slate-50 border p-2 rounded text-xs mt-1 font-mono text-slate-600"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700">{language === 'ar' ? 'رابط العمولة المولد:' : 'Generated Affiliate URL:'}</label>
                          <input
                            type="text"
                            value={importPreview.affiliateUrl}
                            onChange={(e) => setImportPreview({ ...importPreview, affiliateUrl: e.target.value })}
                            className="w-full bg-slate-50 border p-2 rounded text-xs mt-1 font-mono text-slate-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. PRODUCTS MANAGEMENT TAB */}
            {activeTab === 'products' && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {language === 'ar' ? 'إدارة كتالوج المنتجات' : 'Products Manager'} ({adminProducts.length})
                  </h3>
                  <button
                    onClick={() =>
                      setEditingProduct({
                        titleAr: 'منتج جديد',
                        titleEn: 'New Product',
                        price: 99,
                        mainImage: '/src/assets/images/category_women_dresses_1794426499182.jpg',
                        images: ['/src/assets/images/category_women_dresses_1794426499182.jpg'],
                        categorySlug: 'women-dresses',
                        colors: ['#000000', '#FFFFFF'],
                        sizes: ['S', 'M', 'L'],
                        affiliateUrl: 'https://shein.com',
                        originalSheinUrl: 'https://shein.com',
                        isFeatured: true,
                        isPublished: true,
                      })
                    }
                    className="px-4 py-2 bg-black hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{language === 'ar' ? 'إضافة منتج يدوي' : 'Add Manual Product'}</span>
                  </button>
                </div>

                {/* Delete / Action Feedback Banner */}
                {deleteFeedback && (
                  <div
                    className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 ${
                      deleteFeedback.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {deleteFeedback.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{deleteFeedback.message}</span>
                  </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-start text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">{language === 'ar' ? 'المنتج' : 'Product'}</th>
                          <th className="p-3">{language === 'ar' ? 'التصنيف' : 'Category'}</th>
                          <th className="p-3">{language === 'ar' ? 'السعر' : 'Price'}</th>
                          <th className="p-3">{language === 'ar' ? 'النقرات' : 'Clicks'}</th>
                          <th className="p-3">{language === 'ar' ? 'مميز' : 'Featured'}</th>
                          <th className="p-3">{language === 'ar' ? 'منشور' : 'Published'}</th>
                          <th className="p-3 text-end">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {adminProducts.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="p-3 flex items-center gap-3">
                              <img src={p.mainImage} alt="img" className="w-10 h-12 object-cover rounded bg-slate-200" />
                              <div>
                                <span className="font-bold text-slate-900 block line-clamp-1 max-w-xs">{p.titleAr || p.titleEn}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{p.sku}</span>
                              </div>
                            </td>
                            <td className="p-3 text-slate-600 font-semibold">{p.categorySlug}</td>
                            <td className="p-3 font-black text-red-600">{formatPrice(p.price)}</td>
                            <td className="p-3 font-mono text-slate-700">{p.clicksCount || 0}</td>
                            <td className="p-3">
                              <button
                                onClick={() => handleToggleProductState(p, 'isFeatured')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                  p.isFeatured ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {p.isFeatured ? 'نعم' : 'لا'}
                              </button>
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => handleToggleProductState(p, 'isPublished')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                  p.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {p.isPublished ? 'منشور' : 'مسودة'}
                              </button>
                            </td>
                            <td className="p-3 text-end">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingProduct(p)}
                                  className="p-1.5 text-slate-600 hover:text-black hover:bg-slate-200 rounded cursor-pointer transition-colors"
                                  title={language === 'ar' ? 'تعديل المنتج' : 'Edit Product'}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setProductToDelete(p)}
                                  className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer transition-colors border border-red-200 bg-red-50/50"
                                  title={language === 'ar' ? 'حذف هذا المنتج' : 'Delete Product'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 4. MARKETING & AFFILIATE TAB */}
            {activeTab === 'marketing' && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 mb-1">
                    {language === 'ar' ? 'إدارة معرف العمولة Global Affiliate ID' : 'Affiliate Tracking ID Configuration'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'ar'
                      ? 'يتم إلحاق هذا المعرف تلقائياً بجميع روابط SHEIN في المتجر لضمان احتساب أرباحك وعمولاتك.'
                      : 'This ID is automatically attached to all product links on the store to secure your commission.'}
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-4 max-w-xl">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">{language === 'ar' ? 'معرف العمولة الخاص بك (Affiliate Tracking ID):' : 'Default Affiliate Tracking ID:'}</label>
                    <input
                      type="text"
                      value={settingsForm.defaultAffiliateId || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, defaultAffiliateId: e.target.value })}
                      placeholder="e.g. SHEIN_PARTNER_992"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs font-mono font-bold"
                    />
                  </div>

                  <button
                    onClick={handleSaveSettings}
                    className="px-5 py-2.5 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded-lg cursor-pointer w-fit"
                  >
                    {language === 'ar' ? 'حفظ معرف العمولة' : 'Save Tracking ID'}
                  </button>
                </div>
              </div>
            )}

            {/* 5. SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 mb-1">
                    {language === 'ar' ? 'إعدادات الهوية وSEO' : 'Store Settings & SEO'}
                  </h3>
                </div>

                <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-4">
                  {settingsSaved && (
                    <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-lg border border-emerald-200 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{language === 'ar' ? 'تم حفظ الإعدادات بنجاح!' : 'Settings saved successfully!'}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700">{language === 'ar' ? 'اسم المتجر (بالعربية):' : 'Store Name (Arabic):'}</label>
                      <input
                        type="text"
                        value={settingsForm.storeNameAr || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, storeNameAr: e.target.value })}
                        className="w-full bg-slate-50 border p-2.5 rounded text-xs mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700">{language === 'ar' ? 'اسم المتجر (بالإنجليزية):' : 'Store Name (English):'}</label>
                      <input
                        type="text"
                        value={settingsForm.storeNameEn || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, storeNameEn: e.target.value })}
                        className="w-full bg-slate-50 border p-2.5 rounded text-xs mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">{language === 'ar' ? 'عنوان SEO للصفحة الرئيسية:' : 'SEO Meta Title:'}</label>
                    <input
                      type="text"
                      value={settingsForm.seoMetaTitleAr || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, seoMetaTitleAr: e.target.value })}
                      className="w-full bg-slate-50 border p-2.5 rounded text-xs mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">{language === 'ar' ? 'وصف SEO للمتجر:' : 'SEO Meta Description:'}</label>
                    <textarea
                      value={settingsForm.seoMetaDescriptionAr || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, seoMetaDescriptionAr: e.target.value })}
                      rows={2}
                      className="w-full bg-slate-50 border p-2.5 rounded text-xs mt-1"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded-lg cursor-pointer w-fit"
                  >
                    {language === 'ar' ? 'حفظ كافة الإعدادات' : 'Save All Settings'}
                  </button>
                </form>
              </div>
            )}

            {/* 6. PERMISSIONS & SECURITY TAB */}
            {activeTab === 'permissions' && (
              <div className="flex flex-col gap-6 animate-fadeIn pb-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-amber-500" />
                      <span>{language === 'ar' ? 'إدارة الصلاحيات والأمان وكلمة السر' : 'Permissions, Roles & Security'}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {language === 'ar'
                        ? 'تأمين لوحة التحكم بتغيير كلمة المرور الرئيسية، وإدارة أدوار وصلاحيات فريق عمل المتجر.'
                        : 'Secure dashboard credentials with master password change and manage staff roles & access tiers.'}
                    </p>
                  </div>

                  {/* Section Filter Pills */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg self-start">
                    <button
                      type="button"
                      onClick={() => setPermissionsSection('all')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        permissionsSection === 'all'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {language === 'ar' ? 'عرض الكل' : 'All'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPermissionsSection('password')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        permissionsSection === 'password'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'تغيير كلمة السر' : 'Password'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPermissionsSection('roles')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        permissionsSection === 'roles'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'مصفوفة الصلاحيات' : 'Roles'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPermissionsSection('staff')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        permissionsSection === 'staff'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'فريق الإدارة' : 'Staff'}</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Section 1: CHANGE PASSWORD FORM */}
                {(permissionsSection === 'all' || permissionsSection === 'password') && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-amber-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold">
                            {language === 'ar' ? 'قسم تغيير كلمة المرور الرئيسية' : 'Change Master Admin Password'}
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            {language === 'ar'
                              ? 'كلمة المرور الحالية الافتراضية هي admin123 (يمكنك تعيين كلمة مرور قوية جديدة هنا)'
                              : 'Default password is admin123. Update with a secure passphrase here.'}
                          </p>
                        </div>
                      </div>
                      <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 text-[10px] font-bold">
                        <CheckCircle className="w-3 h-3" />
                        <span>{language === 'ar' ? 'نظام الحفظ المزدوج نشط' : 'Dual-Store Active'}</span>
                      </span>
                    </div>

                    <form onSubmit={handleChangePassword} className="p-5 sm:p-6 flex flex-col gap-4">
                      {passwordNotice && (
                        <div
                          className={`p-3.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 ${
                            passwordNotice.type === 'success'
                              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                              : 'bg-red-50 text-red-900 border border-red-200'
                          }`}
                        >
                          {passwordNotice.type === 'success' ? (
                            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                          )}
                          <span>{passwordNotice.message}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Current Password */}
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            {language === 'ar' ? 'كلمة المرور الحالية:' : 'Current Password:'}
                          </label>
                          <div className="relative">
                            <input
                              type={showCurrentPass ? 'text' : 'password'}
                              value={currentPasswordInput}
                              onChange={(e) => setCurrentPasswordInput(e.target.value)}
                              placeholder="••••••••"
                              required
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 pe-10 text-xs font-mono focus:outline-none focus:border-black"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPass(!showCurrentPass)}
                              className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {language === 'ar' ? 'الافتراضية: admin123' : 'Default: admin123'}
                          </span>
                        </div>

                        {/* New Password */}
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            {language === 'ar' ? 'كلمة المرور الجديدة:' : 'New Password:'}
                          </label>
                          <div className="relative">
                            <input
                              type={showNewPass ? 'text' : 'password'}
                              value={newPasswordInput}
                              onChange={(e) => setNewPasswordInput(e.target.value)}
                              placeholder="••••••••"
                              required
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 pe-10 text-xs font-mono focus:outline-none focus:border-black"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPass(!showNewPass)}
                              className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {newPasswordInput && (
                            <div className="mt-1 flex items-center gap-1.5">
                              <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all ${
                                    newPasswordInput.length < 5
                                      ? 'w-1/4 bg-red-500'
                                      : newPasswordInput.length < 8
                                      ? 'w-2/4 bg-amber-500'
                                      : 'w-full bg-emerald-500'
                                  }`}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-slate-500">
                                {newPasswordInput.length < 5
                                  ? language === 'ar'
                                    ? 'ضعيفة'
                                    : 'Weak'
                                  : newPasswordInput.length < 8
                                  ? language === 'ar'
                                    ? 'متوسطة'
                                    : 'Fair'
                                  : language === 'ar'
                                  ? 'قوية'
                                  : 'Strong'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Confirm New Password */}
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            {language === 'ar' ? 'تأكيد كلمة المرور الجديدة:' : 'Confirm New Password:'}
                          </label>
                          <input
                            type="password"
                            value={confirmPasswordInput}
                            onChange={(e) => setConfirmPasswordInput(e.target.value)}
                            placeholder="••••••••"
                            required
                            className={`w-full bg-slate-50 border rounded-lg p-2.5 text-xs font-mono focus:outline-none ${
                              confirmPasswordInput && confirmPasswordInput !== newPasswordInput
                                ? 'border-red-400 bg-red-50/30'
                                : 'border-slate-300 focus:border-black'
                            }`}
                          />
                          {confirmPasswordInput && confirmPasswordInput !== newPasswordInput && (
                            <span className="text-[10px] text-red-600 mt-1 block">
                              {language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            {language === 'ar'
                              ? 'يتم تفعيل كلمة المرور فوراً في المتصفح وتحديثها في ملفات الموقع وعلى Netlify.'
                              : 'Password updates instantly in local browser storage and serverless runtime.'}
                          </span>
                        </div>

                        <button
                          type="submit"
                          disabled={isUpdatingPassword}
                          className="px-6 py-2.5 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isUpdatingPassword ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>{language === 'ar' ? 'جارٍ الحفظ...' : 'Saving...'}</span>
                            </>
                          ) : (
                            <>
                              <Key className="w-3.5 h-3.5 text-amber-400" />
                              <span>{language === 'ar' ? 'تحديث وحفظ كلمة المرور' : 'Update & Save Password'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Sub-Section 2: ROLES & PERMISSIONS MATRIX */}
                {(permissionsSection === 'all' || permissionsSection === 'roles') && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col gap-4 p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-emerald-600" />
                          <span>{language === 'ar' ? 'مصفوفة الصلاحيات والأدوار الإدارية' : 'Roles & Permissions Matrix'}</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {language === 'ar'
                            ? 'حدد الصلاحيات الممنوحة لكل دور إداري. يمكنك النقر على المربعات لتفعيل أو إلغاء أي صلاحية فورياً.'
                            : 'Configure granular permissions per tier. Click checkmarks to toggle permissions dynamically.'}
                        </p>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {adminRoles.length} {language === 'ar' ? 'أدوار محددة' : 'Configured Roles'}
                      </span>
                    </div>

                    {/* Roles Overview Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {adminRoles.map((role) => (
                        <div
                          key={role.id}
                          className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-col gap-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">
                              {language === 'ar' ? role.nameAr : role.nameEn}
                            </span>
                            {role.isSystem && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                {language === 'ar' ? 'جذري' : 'System'}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 line-clamp-2">
                            {language === 'ar' ? role.descriptionAr : role.descriptionEn}
                          </p>
                          <div className="mt-auto pt-2 text-[10px] font-mono text-slate-600 flex items-center justify-between border-t border-slate-200/60">
                            <span>{language === 'ar' ? 'الصلاحيات النشطة:' : 'Active Perms:'}</span>
                            <span className="font-bold text-slate-900">{role.permissions.length} / 7</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Matrix Table */}
                    <div className="border border-slate-200 rounded-lg overflow-x-auto mt-2">
                      <table className="w-full text-start text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-white border-b border-slate-800">
                            <th className="p-3 text-start font-bold">
                              {language === 'ar' ? 'الصلاحية والوظيفة' : 'Permission Function'}
                            </th>
                            {adminRoles.map((role) => (
                              <th key={role.id} className="p-3 text-center font-bold whitespace-nowrap">
                                <span className="block text-[11px]">{language === 'ar' ? role.nameAr : role.nameEn}</span>
                                {role.isSystem && (
                                  <span className="text-[9px] text-amber-400 font-normal">
                                    ({language === 'ar' ? 'كامل الصلاحيات' : 'Unrestricted'})
                                  </span>
                                )}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {PERMISSIONS_LIST.map((perm) => (
                            <tr key={perm.key} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3">
                                <div className="font-bold text-slate-800 text-xs">
                                  {language === 'ar' ? perm.labelAr : perm.labelEn}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {language === 'ar' ? perm.descriptionAr : perm.descriptionEn}
                                </div>
                              </td>
                              {adminRoles.map((role) => {
                                const hasPerm = role.permissions.includes(perm.key);
                                const isLocked = role.isSystem;

                                return (
                                  <td key={role.id} className="p-3 text-center">
                                    <button
                                      type="button"
                                      disabled={isLocked}
                                      onClick={() => handleToggleRolePermission(role.id, perm.key)}
                                      title={
                                        isLocked
                                          ? language === 'ar'
                                            ? 'صلاحيات المدير العام كاملة ومحمية دائماً'
                                            : 'Super Admin permissions are locked to full'
                                          : language === 'ar'
                                          ? 'اضغط للتبديل'
                                          : 'Click to toggle'
                                      }
                                      className={`inline-flex items-center justify-center w-7 h-7 rounded-md transition-all cursor-pointer ${
                                        isLocked
                                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-80'
                                          : hasPerm
                                          ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                                          : 'bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-600 border border-slate-200'
                                      }`}
                                    >
                                      {hasPerm ? <Check className="w-4 h-4 stroke-[2.5]" /> : <X className="w-3.5 h-3.5" />}
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sub-Section 3: STAFF ACCOUNTS */}
                {(permissionsSection === 'all' || permissionsSection === 'staff') && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col gap-4 p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span>{language === 'ar' ? 'حسابات فريق الإدارة والمسؤولين' : 'Staff & Sub-Admin Accounts'}</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {language === 'ar'
                            ? 'إدارة حسابات المسؤولين الذين يملكون حق الدخول للوحة التحكم وتعيين دور وصلاحيات كل منهم.'
                            : 'Manage authorized personnel with access to the store management dashboard.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsAddStaffOpen(true)}
                        className="px-4 py-2 bg-black hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                        <span>{language === 'ar' ? 'إضافة مسؤول جديد' : 'Add New Staff'}</span>
                      </button>
                    </div>

                    {staffNotice && (
                      <div
                        className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                          staffNotice.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>{staffNotice.message}</span>
                      </div>
                    )}

                    {/* Staff Table */}
                    <div className="border border-slate-200 rounded-lg overflow-x-auto">
                      <table className="w-full text-start text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                            <th className="p-3 text-start font-bold">{language === 'ar' ? 'المسؤول' : 'Staff Member'}</th>
                            <th className="p-3 text-start font-bold">{language === 'ar' ? 'الدور المخصص' : 'Assigned Role'}</th>
                            <th className="p-3 text-center font-bold">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                            <th className="p-3 text-start font-bold">{language === 'ar' ? 'آخر نشاط' : 'Last Active'}</th>
                            <th className="p-3 text-center font-bold">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {adminUsers.map((user) => {
                            const roleObj = adminRoles.find((r) => r.id === user.roleId);
                            const isRoot = user.id === 'user-root';

                            return (
                              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0">
                                      {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                        <span>{user.name}</span>
                                        {isRoot && (
                                          <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-200 rounded px-1.5 py-0.2 font-black">
                                            {language === 'ar' ? 'الرئيسي' : 'Master'}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-slate-500 font-mono">{user.email}</div>
                                    </div>
                                  </div>
                                </td>

                                <td className="p-3">
                                  <span
                                    className={`inline-block px-2.5 py-1 rounded text-[11px] font-bold ${
                                      roleObj?.badgeColor || 'bg-slate-200 text-slate-800'
                                    }`}
                                  >
                                    {language === 'ar' ? roleObj?.nameAr || user.roleId : roleObj?.nameEn || user.roleId}
                                  </span>
                                </td>

                                <td className="p-3 text-center">
                                  <button
                                    type="button"
                                    disabled={isRoot}
                                    onClick={() => handleToggleStaffStatus(user.id)}
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                                      user.status === 'active'
                                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                                    } ${isRoot ? 'cursor-not-allowed opacity-90' : ''}`}
                                  >
                                    {user.status === 'active'
                                      ? language === 'ar'
                                        ? 'نشط'
                                        : 'Active'
                                      : language === 'ar'
                                      ? 'معلق'
                                      : 'Suspended'}
                                  </button>
                                </td>

                                <td className="p-3 text-slate-500 text-[11px]">
                                  <div>{user.lastActive}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {language === 'ar' ? 'منذ: ' : 'Since: '}
                                    {user.createdAt}
                                  </div>
                                </td>

                                <td className="p-3 text-center">
                                  {isRoot ? (
                                    <span className="text-[10px] text-slate-400 font-bold">
                                      {language === 'ar' ? 'محمي' : 'Protected'}
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteStaffUser(user.id)}
                                      className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                      title={language === 'ar' ? 'حذف الحساب' : 'Delete Account'}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 7. SALLA STORE MANAGER TAB */}
            {activeTab === 'salla_manager' && (
              <div className="flex flex-col gap-6 animate-fadeIn pb-12">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-amber-600" />
                      <span>{language === 'ar' ? 'إدارة منتجات منصة سلة المستقلة' : 'Salla Store Independent Products'}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {language === 'ar'
                        ? 'إضافة وتعديل المنتجات الخاصة بمتجر سلة (المستقلة عن الإحالة)، والتي تُباع مباشرة عبر طلبات الواتساب.'
                        : 'Manage independent Salla store products sold directly via WhatsApp cart checkout.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingSallaItem({
                        titleAr: 'منتج سلة جديد',
                        titleEn: 'New Salla Item',
                        price: 49.99,
                        originalPrice: 79.99,
                        mainImage: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80',
                        images: ['https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80'],
                        categorySlug: 'beauty-makeup',
                        sizes: ['Standard', 'Large'],
                        colors: ['أسود', 'ذهبي'],
                        stockQuantity: 20,
                        isAvailable: true,
                      })
                    }
                    className="px-4 py-2.5 bg-black hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>{language === 'ar' ? 'إضافة منتج سلة جديد' : 'Add Salla Item'}</span>
                  </button>
                </div>

                {sallaItemNotice && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{sallaItemNotice.message}</span>
                  </div>
                )}

                {/* Salla Items Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-start text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white border-b border-slate-800">
                          <th className="p-3.5 text-start font-bold">{language === 'ar' ? 'المنتج' : 'Product'}</th>
                          <th className="p-3.5 text-start font-bold">{language === 'ar' ? 'التصنيف' : 'Category'}</th>
                          <th className="p-3.5 text-center font-bold">{language === 'ar' ? 'السعر ($)' : 'Price ($)'}</th>
                          <th className="p-3.5 text-center font-bold">{language === 'ar' ? 'المخزون' : 'Stock'}</th>
                          <th className="p-3.5 text-center font-bold">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sallaItems.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3.5">
                              <div className="flex items-center gap-3">
                                <img
                                  src={item.mainImage}
                                  alt={item.titleAr}
                                  className="w-10 h-10 object-cover rounded-lg border shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                                <div>
                                  <div className="font-bold text-slate-900 line-clamp-1">{item.titleAr}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{item.sku}</div>
                                </div>
                              </div>
                            </td>

                            <td className="p-3.5">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                                {item.categorySlug}
                              </span>
                            </td>

                            <td className="p-3.5 text-center font-black text-amber-700 font-mono">
                              {formatPrice(item.price)}
                            </td>

                            <td className="p-3.5 text-center font-bold font-mono text-slate-700">
                              {item.stockQuantity}
                            </td>

                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingSallaItem(item)}
                                  className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                  title={language === 'ar' ? 'تعديل' : 'Edit'}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteSallaItem(item.id)}
                                  className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                                  title={language === 'ar' ? 'حذف' : 'Delete'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Product Sub-Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <form onSubmit={handleSaveProductEdit} className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col gap-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base">
                {editingProduct.id ? 'تعديل المنتج' : 'إضافة منتج جديد'}
              </h3>
              <button type="button" onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">العنوان بالعربية</label>
                <input
                  type="text"
                  value={editingProduct.titleAr || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, titleAr: e.target.value })}
                  className="w-full border p-2 rounded mt-1"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">العنوان بالإنجليزية</label>
                <input
                  type="text"
                  value={editingProduct.titleEn || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, titleEn: e.target.value })}
                  className="w-full border p-2 rounded mt-1"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <span>{language === 'ar' ? 'السعر ($ دولار أمريكي)' : 'Price ($ USD)'}</span>
                </label>
                <div className="relative mt-1">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 font-bold text-emerald-600 text-sm select-none">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.price || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full border p-2 ps-7 rounded font-bold"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <span>{language === 'ar' ? 'السعر الأصلي ($ إن وجد)' : 'Original Price ($ if any)'}</span>
                </label>
                <div className="relative mt-1">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm select-none">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.originalPrice || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: Number(e.target.value) })}
                    className="w-full border p-2 ps-7 rounded"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label className="font-bold text-slate-700">رابط الصورة الرئيسية</label>
                <input
                  type="text"
                  value={editingProduct.mainImage || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, mainImage: e.target.value, images: [e.target.value] })}
                  className="w-full border p-2 rounded mt-1"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="font-bold text-slate-700">رابط العمولة Affiliate URL</label>
                <input
                  type="text"
                  value={editingProduct.affiliateUrl || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, affiliateUrl: e.target.value })}
                  className="w-full border p-2 rounded mt-1 font-mono text-slate-600"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2 text-xs font-bold text-slate-600">
                إلغاء
              </button>
              <button type="submit" className="px-5 py-2 bg-black text-white text-xs font-bold rounded">
                حفظ التغييرات
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal (Custom in-UI confirmation that avoids window.confirm issues) */}
      {productToDelete && (
        <div className="fixed inset-0 z-70 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-5 text-start animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  {language === 'ar' ? 'تأكيد حذف المنتج' : 'Confirm Product Deletion'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {language === 'ar'
                    ? 'هل أنت متأكد من رغبتك في حذف هذا المنتج نهائياً من المتجر؟ لا يمكن التراجع عن هذا الإجراء.'
                    : 'Are you sure you want to permanently delete this product? This action cannot be undone.'}
                </p>
              </div>
            </div>

            {/* Product summary card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
              <img
                src={productToDelete.mainImage}
                alt=""
                className="w-12 h-14 object-cover rounded bg-slate-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {productToDelete.titleAr || productToDelete.titleEn}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {productToDelete.sku}
                  </span>
                  <span className="text-xs font-black text-red-600">
                    {formatPrice(productToDelete.price)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{language === 'ar' ? 'جارٍ الحذف...' : 'Deleting...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'نعم، حذف المنتج' : 'Yes, Delete Product'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Member Modal */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-amber-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    {language === 'ar' ? 'إضافة مسؤول جديد للمتجر' : 'Add New Staff Member'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {language === 'ar' ? 'تعيين دور وصلاحيات الدخول للمسؤول' : 'Assign role & access permissions'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStaffOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaffUser} className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {language === 'ar' ? 'اسم المسؤول:' : 'Full Name:'}
                </label>
                <input
                  type="text"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: سارة أحمد' : 'e.g. Sarah Smith'}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {language === 'ar' ? 'البريد الإلكتروني:' : 'Email Address:'}
                </label>
                <input
                  type="email"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  placeholder="staff@shein-select.com"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {language === 'ar' ? 'الدور والصلاحيات:' : 'Assigned Role:'}
                </label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-bold focus:outline-none focus:border-black"
                >
                  {adminRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {language === 'ar' ? role.nameAr : role.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role explanation */}
              {(() => {
                const selectedRoleObj = adminRoles.find((r) => r.id === newStaffRole);
                if (!selectedRoleObj) return null;
                return (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600">
                    <span className="font-bold text-slate-800 block mb-0.5">
                      {language === 'ar' ? 'موجز صلاحيات الدور:' : 'Role Summary:'}
                    </span>
                    <p>{language === 'ar' ? selectedRoleObj.descriptionAr : selectedRoleObj.descriptionEn}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] font-mono text-slate-500">
                      {selectedRoleObj.permissions.map((p) => (
                        <span key={p} className="bg-slate-200/80 px-1.5 py-0.5 rounded">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-black cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
                >
                  {language === 'ar' ? 'حفظ وتفعيل المسؤول' : 'Save & Activate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit/Add Salla Item Modal */}
      {editingSallaItem && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-black flex items-center justify-center font-bold">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    {editingSallaItem.id ? (language === 'ar' ? 'تعديل منتج سلة' : 'Edit Salla Item') : (language === 'ar' ? 'إضافة منتج سلة جديد' : 'Add Salla Item')}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {language === 'ar' ? 'منتجات مستقلة للبيع المباشر عبر واتساب' : 'Independent products for direct WhatsApp sales'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSallaItem(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSallaItem} className="p-6 flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{language === 'ar' ? 'العنوان بالعربية' : 'Arabic Title'}</label>
                  <input
                    type="text"
                    value={editingSallaItem.titleAr || ''}
                    onChange={(e) => setEditingSallaItem({ ...editingSallaItem, titleAr: e.target.value })}
                    className="w-full bg-slate-50 border p-2.5 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{language === 'ar' ? 'العنوان بالإنجليزية' : 'English Title'}</label>
                  <input
                    type="text"
                    value={editingSallaItem.titleEn || ''}
                    onChange={(e) => setEditingSallaItem({ ...editingSallaItem, titleEn: e.target.value })}
                    className="w-full bg-slate-50 border p-2.5 rounded"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{language === 'ar' ? 'السعر ($ USD)' : 'Price ($ USD)'}</label>
                  <div className="relative">
                    <span className="absolute start-3 top-1/2 -translate-y-1/2 font-bold text-amber-700">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={editingSallaItem.price || 0}
                      onChange={(e) => setEditingSallaItem({ ...editingSallaItem, price: Number(e.target.value) })}
                      className="w-full bg-slate-50 border p-2.5 ps-7 rounded font-bold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">{language === 'ar' ? 'السعر السابق ($ إن وجد)' : 'Original Price ($)'}</label>
                  <div className="relative">
                    <span className="absolute start-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={editingSallaItem.originalPrice || ''}
                      onChange={(e) => setEditingSallaItem({ ...editingSallaItem, originalPrice: Number(e.target.value) })}
                      className="w-full bg-slate-50 border p-2.5 ps-7 rounded"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{language === 'ar' ? 'رابط صورة المنتج' : 'Main Image URL'}</label>
                <input
                  type="text"
                  value={editingSallaItem.mainImage || ''}
                  onChange={(e) => setEditingSallaItem({ ...editingSallaItem, mainImage: e.target.value, images: [e.target.value] })}
                  className="w-full bg-slate-50 border p-2.5 rounded"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{language === 'ar' ? 'التصنيف' : 'Category'}</label>
                  <select
                    value={editingSallaItem.categorySlug || 'beauty-makeup'}
                    onChange={(e) => setEditingSallaItem({ ...editingSallaItem, categorySlug: e.target.value })}
                    className="w-full bg-slate-50 border p-2.5 rounded font-bold"
                  >
                    <option value="beauty-makeup">تجميل وعناية (Beauty)</option>
                    <option value="bags-accessories">حقائب وإكسسوارات (Bags & Accessories)</option>
                    <option value="women-dresses">فساتين نسائية (Dresses)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">{language === 'ar' ? 'كمية المخزون' : 'Stock Quantity'}</label>
                  <input
                    type="number"
                    value={editingSallaItem.stockQuantity || 20}
                    onChange={(e) => setEditingSallaItem({ ...editingSallaItem, stockQuantity: Number(e.target.value) })}
                    className="w-full bg-slate-50 border p-2.5 rounded font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{language === 'ar' ? 'الوصف بالعربية' : 'Arabic Description'}</label>
                <textarea
                  rows={2}
                  value={editingSallaItem.descriptionAr || ''}
                  onChange={(e) => setEditingSallaItem({ ...editingSallaItem, descriptionAr: e.target.value })}
                  className="w-full bg-slate-50 border p-2.5 rounded"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t">
                <button
                  type="button"
                  onClick={() => setEditingSallaItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-black cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-black hover:bg-slate-800 text-white font-bold rounded-lg shadow cursor-pointer"
                >
                  {language === 'ar' ? 'حفظ منتج سلة' : 'Save Salla Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
