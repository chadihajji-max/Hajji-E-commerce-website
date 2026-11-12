import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  Product,
  Category,
  Banner,
  StoreSettings,
  ClickAnalytics,
  SheinImportPreview,
} from './src/types/store';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_BANNERS,
  INITIAL_SETTINGS,
} from './src/data/initialData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// DB File persistence setup
const DB_FILE = path.join(__dirname, 'data_db.json');

interface DatabaseSchema {
  products: Product[];
  categories: Category[];
  banners: Banner[];
  settings: StoreSettings;
  clicks: ClickAnalytics[];
}

function loadDB(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        products: parsed.products || INITIAL_PRODUCTS,
        categories: parsed.categories || INITIAL_CATEGORIES,
        banners: parsed.banners || INITIAL_BANNERS,
        settings: parsed.settings || INITIAL_SETTINGS,
        clicks: parsed.clicks || [],
      };
    }
  } catch (err) {
    console.error('Failed reading DB file, fallback to initial data:', err);
  }
  return {
    products: INITIAL_PRODUCTS,
    categories: INITIAL_CATEGORIES,
    banners: INITIAL_BANNERS,
    settings: INITIAL_SETTINGS,
    clicks: [],
  };
}

function saveDB(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to DB file:', err);
  }
}

let db = loadDB();

// Setup Gemini AI client if GEMINI_API_KEY is available
const aiKey = process.env.GEMINI_API_KEY || '';
const aiClient = aiKey ? new GoogleGenAI({ apiKey: aiKey }) : null;

// =================== API ROUTES ===================

// Get store settings
app.get('/api/settings', (req: Request, res: Response) => {
  // Strip admin password hash for safety
  const { adminPasswordHash, ...safeSettings } = db.settings;
  res.json(safeSettings);
});

// Update store settings (Admin)
app.put('/api/settings', (req: Request, res: Response) => {
  const newSettings = req.body;
  db.settings = {
    ...db.settings,
    ...newSettings,
  };
  saveDB(db);
  const { adminPasswordHash, ...safeSettings } = db.settings;
  res.json({ success: true, settings: safeSettings });
});

// Admin Auth
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { password } = req.body;
  const currentPass = db.settings.adminPasswordHash || 'admin123';
  if (password === currentPass) {
    const token = 'admin-session-' + Date.now() + '-' + Math.random().toString(36).substring(2);
    return res.json({ success: true, token });
  }
  return res.status(401).json({ success: false, message: 'كلمة المرور غير صحيحة / Invalid Password' });
});

// Admin Change Password
app.post('/api/admin/change-password', (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const currentPass = db.settings.adminPasswordHash || 'admin123';
  if (currentPassword !== currentPass && currentPassword !== 'admin123') {
    return res.status(400).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });
  }
  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 4) {
    return res.status(400).json({ success: false, message: 'يجب ألا تقل كلمة المرور الجديدة عن 4 خانات' });
  }
  db.settings.adminPasswordHash = newPassword.trim();
  saveDB(db);
  return res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
});

// Get Products (Supports filter, category, search, sorting)
app.get('/api/products', (req: Request, res: Response) => {
  let list = db.products.filter((p) => p.isPublished !== false);

  const { category, search, sort, featured } = req.query;

  if (featured === 'true') {
    list = list.filter((p) => p.isFeatured);
  }

  if (category && category !== 'all') {
    list = list.filter((p) => p.categorySlug === category);
  }

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.titleAr.toLowerCase().includes(q) ||
        p.titleEn.toLowerCase().includes(q) ||
        p.descriptionAr.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.categorySlug.toLowerCase().includes(q)
    );
  }

  if (sort === 'price-low') {
    list.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-high') {
    list.sort((a, b) => b.price - a.price);
  } else if (sort === 'clicks' || sort === 'popular') {
    list.sort((a, b) => (b.clicksCount || 0) + (b.viewsCount || 0) - ((a.clicksCount || 0) + (a.viewsCount || 0)));
  } else {
    // Default newest
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json(list);
});

// Get All Products for Admin (Includes unpublished)
app.get('/api/admin/products', (req: Request, res: Response) => {
  res.json(db.products);
});

// Get Single Product by ID (Increments view count)
app.get('/api/products/:id', (req: Request, res: Response) => {
  const prod = db.products.find((p) => p.id === req.params.id);
  if (!prod) {
    return res.status(404).json({ error: 'Product not found' });
  }
  prod.viewsCount = (prod.viewsCount || 0) + 1;
  saveDB(db);
  res.json(prod);
});

// Track Affiliate Link Click
app.post('/api/products/:id/click', (req: Request, res: Response) => {
  const prod = db.products.find((p) => p.id === req.params.id);
  if (prod) {
    prod.clicksCount = (prod.clicksCount || 0) + 1;
    const clickEvent: ClickAnalytics = {
      id: 'click-' + Date.now(),
      productId: prod.id,
      productTitle: prod.titleAr || prod.titleEn,
      timestamp: new Date().toISOString(),
      referrer: req.get('referrer') || 'direct',
    };
    db.clicks.push(clickEvent);
    saveDB(db);
  }
  res.json({ success: true, clicks: prod?.clicksCount || 0 });
});

// Create Product (Admin)
app.post('/api/products', (req: Request, res: Response) => {
  const pData = req.body;
  const newProduct: Product = {
    ...pData,
    id: pData.id || 'prod-' + Date.now(),
    viewsCount: pData.viewsCount || 0,
    clicksCount: pData.clicksCount || 0,
    rating: pData.rating || 4.8,
    reviewCount: pData.reviewCount || 1,
    createdAt: pData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Enforce global affiliate ID if present
  newProduct.affiliateUrl = newProduct.affiliateUrl || '';
  if (db.settings.defaultAffiliateId && !newProduct.affiliateUrl.includes('aff_id=')) {
    const separator = newProduct.affiliateUrl.includes('?') ? '&' : '?';
    newProduct.affiliateUrl += `${separator}aff_id=${encodeURIComponent(db.settings.defaultAffiliateId)}`;
  }

  db.products.unshift(newProduct);
  saveDB(db);
  res.json({ success: true, product: newProduct });
});

// Update Product (Admin)
app.put('/api/products/:id', (req: Request, res: Response) => {
  const index = db.products.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }
  db.products[index] = {
    ...db.products[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  saveDB(db);
  res.json({ success: true, product: db.products[index] });
});

// Delete Product (Admin)
app.delete('/api/products/:id', (req: Request, res: Response) => {
  const targetId = req.params.id;
  const initialLength = db.products.length;
  db.products = db.products.filter((p) => p.id !== targetId);
  saveDB(db);
  return res.json({ success: true, message: 'Product deleted successfully', remainingCount: db.products.length });
});

// Get Categories
app.get('/api/categories', (req: Request, res: Response) => {
  res.json(db.categories.sort((a, b) => a.order - b.order));
});

// Save / Update Categories
app.post('/api/categories', (req: Request, res: Response) => {
  const { categories } = req.body;
  if (Array.isArray(categories)) {
    db.categories = categories;
    saveDB(db);
  }
  res.json({ success: true, categories: db.categories });
});

// Get Banners
app.get('/api/banners', (req: Request, res: Response) => {
  res.json(db.banners.filter((b) => b.isActive).sort((a, b) => a.order - b.order));
});

// Save Banners (Admin)
app.post('/api/banners', (req: Request, res: Response) => {
  const { banners } = req.body;
  if (Array.isArray(banners)) {
    db.banners = banners;
    saveDB(db);
  }
  res.json({ success: true, banners: db.banners });
});

// Analytics Endpoint
app.get('/api/analytics', (req: Request, res: Response) => {
  const totalProducts = db.products.length;
  const totalClicks = db.products.reduce((acc, p) => acc + (p.clicksCount || 0), 0);
  const totalViews = db.products.reduce((acc, p) => acc + (p.viewsCount || 0), 0);

  const topClickedProducts = [...db.products]
    .sort((a, b) => (b.clicksCount || 0) - (a.clicksCount || 0))
    .slice(0, 5)
    .map((p) => ({ id: p.id, title: p.titleAr || p.titleEn, clicks: p.clicksCount || 0, views: p.viewsCount || 0 }));

  const recentClicks = [...db.clicks].reverse().slice(0, 10);

  res.json({
    totalProducts,
    totalClicks,
    totalViews,
    topClickedProducts,
    recentClicks,
  });
});

// ================= HELPER FUNCTIONS FOR SHEIN EXTRACTION =================

// Extract any URL embedded in text (handles mobile app share messages with Arabic/English text)
function extractCleanUrlFromInput(rawInput: string): string {
  if (!rawInput) return '';
  const trimmed = rawInput.trim();

  // 1. Look for http or https link anywhere in text
  const urlRegex = /(https?:\/\/[^\s"'<>]+)/i;
  const match = trimmed.match(urlRegex);
  if (match) {
    return match[1];
  }

  // 2. Look for domain without protocol (e.g. ar.shein.com/...)
  if (/^([a-z0-9\-]+\.)?shein\.(com|top)/i.test(trimmed)) {
    return 'https://' + trimmed;
  }

  return trimmed;
}

// Unwrap mobile app share links (such as api-shein.shein.com/h5/sharejump/appjump?link=...)
function unwrapSheinUrl(inputUrl: string): string {
  try {
    let u: URL;
    try {
      u = new URL(inputUrl);
    } catch {
      u = new URL('https://' + inputUrl);
    }

    // 1. Check for sharejump/appjump nested link param: ?link=https%3A%2F%2F...
    const nestedLink = u.searchParams.get('link');
    if (nestedLink) {
      return decodeURIComponent(nestedLink);
    }

    // 2. Check for redirect param: ?url=... or ?target=...
    const redirectUrl = u.searchParams.get('url') || u.searchParams.get('target') || u.searchParams.get('redirect');
    if (redirectUrl && redirectUrl.startsWith('http')) {
      return decodeURIComponent(redirectUrl);
    }
  } catch {}

  return inputUrl;
}

// Parse SHEIN URL structure to extract clean title and real product ID
function parseSheinUrlDetails(inputUrl: string) {
  // Step A: Extract URL from surrounding text if any
  const cleanedUrl = extractCleanUrlFromInput(inputUrl);

  // Step B: Unwrap nested mobile share links
  const unwrappedUrl = unwrapSheinUrl(cleanedUrl);

  let urlObj: URL | null = null;
  try {
    urlObj = new URL(unwrappedUrl);
  } catch {
    try {
      urlObj = new URL('https://' + unwrappedUrl);
    } catch {
      urlObj = null;
    }
  }

  let cleanTitle = '';
  let productId = '';

  if (urlObj) {
    const pathname = urlObj.pathname;

    // Pattern 1: /Product-Name-Here-p-1092837.html or /Name-p-1092837-cat-123.html
    const pMatch = pathname.match(/\/([^\/]+)-p-(\d+)/i);
    if (pMatch) {
      cleanTitle = pMatch[1].replace(/[-_]+/g, ' ').trim();
      productId = pMatch[2];
    } else {
      // Pattern 2: ?goods_id=12345 or ?id=12345 or /goods-p-12345
      const goodsId =
        urlObj.searchParams.get('goods_id') ||
        urlObj.searchParams.get('id') ||
        urlObj.searchParams.get('product_id') ||
        urlObj.searchParams.get('item_id');
      if (goodsId) productId = goodsId;

      const pInPath = pathname.match(/-p-(\d+)/i) || pathname.match(/\/(\d+)\.html/i);
      if (pInPath && !productId) productId = pInPath[1];

      const parts = pathname.split('/').filter(Boolean);
      const lastPart = parts[parts.length - 1] || '';
      cleanTitle = lastPart
        .replace(/\.html?$/i, '')
        .replace(/-p-\d+.*$/i, '')
        .replace(/[-_]+/g, ' ')
        .trim();
    }

    // Remove common language / category / search prefixes from cleanTitle
    cleanTitle = cleanTitle
      .replace(/^([a-z]{2,3})\s+/i, '')
      .replace(/\s+p\s+\d+.*$/i, '')
      .trim();
  } else {
    cleanTitle = inputUrl.trim();
  }

  return { cleanTitle, productId, originalUrl: unwrappedUrl || inputUrl };
}

// Detect accurate category from title/URL keywords
function detectFashionCategory(text: string): string {
  const lower = text.toLowerCase();
  if (
    lower.includes('dress') ||
    lower.includes('فستان') ||
    lower.includes('abaya') ||
    lower.includes('عباية') ||
    lower.includes('gown') ||
    lower.includes('jumpsuit') ||
    lower.includes('romper')
  ) {
    return 'women-dresses';
  }
  if (
    lower.includes('men') ||
    lower.includes('رجالي') ||
    lower.includes('hoodie') ||
    lower.includes('varsity') ||
    lower.includes('tee') ||
    lower.includes('t-shirt') ||
    lower.includes('cargo') ||
    lower.includes('boxer') ||
    lower.includes('jogger')
  ) {
    return 'men-streetwear';
  }
  if (
    lower.includes('jacket') ||
    lower.includes('جاكيت') ||
    lower.includes('coat') ||
    lower.includes('معطف') ||
    lower.includes('blazer') ||
    lower.includes('sweater') ||
    lower.includes('cardigan') ||
    lower.includes('outerwear') ||
    lower.includes('trench') ||
    lower.includes('vest')
  ) {
    return 'tops-jackets';
  }
  if (
    lower.includes('shoe') ||
    lower.includes('حذاء') ||
    lower.includes('sneaker') ||
    lower.includes('heel') ||
    lower.includes('boot') ||
    lower.includes('sandal') ||
    lower.includes('slipper') ||
    lower.includes('loafer') ||
    lower.includes('flat')
  ) {
    return 'shoes-footwear';
  }
  if (
    lower.includes('bag') ||
    lower.includes('حقيبة') ||
    lower.includes('purse') ||
    lower.includes('tote') ||
    lower.includes('backpack') ||
    lower.includes('wallet') ||
    lower.includes('necklace') ||
    lower.includes('earring') ||
    lower.includes('ring') ||
    lower.includes('bracelet') ||
    lower.includes('sunglass') ||
    lower.includes('belt') ||
    lower.includes('watch') ||
    lower.includes('scarf') ||
    lower.includes('hat')
  ) {
    return 'bags-accessories';
  }
  if (
    lower.includes('makeup') ||
    lower.includes('مكياج') ||
    lower.includes('beauty') ||
    lower.includes('lipstick') ||
    lower.includes('cosmetic') ||
    lower.includes('eyeliner') ||
    lower.includes('eyeshadow') ||
    lower.includes('serum') ||
    lower.includes('lotion') ||
    lower.includes('skincare') ||
    lower.includes('perfume') ||
    lower.includes('عطر')
  ) {
    return 'beauty-makeup';
  }
  return 'women-dresses';
}

// Translate fashion title to natural retail Arabic
function translateFashionTitleToAr(enTitle: string): string {
  if (!enTitle) return 'منتج شي إن أنيق';
  if (/[\u0600-\u06FF]/.test(enTitle)) return enTitle;

  const replacements: [RegExp, string][] = [
    [/\bSHEIN\s+MOD\b/gi, 'شي إن مود (SHEIN MOD)'],
    [/\bSHEIN\s+EZwear\b/gi, 'شي إن إيزي وير (SHEIN EZwear)'],
    [/\bSHEIN\s+BAE\b/gi, 'شي إن باي (SHEIN BAE)'],
    [/\bSHEIN\s+DAZY\b/gi, 'شي إن دازي (SHEIN DAZY)'],
    [/\bSHEIN\s+Clasi\b/gi, 'شي إن كلاسي (SHEIN Clasi)'],
    [/\bSHEIN\b/gi, 'شي إن'],
    [/\bfloral\s+print\b/gi, 'بطبعة ورود أنيقة'],
    [/\bfloral\b/gi, 'بنقشة الزهور'],
    [/\bflounce\s+sleeve\b/gi, 'بأكمام كشكش مميزة'],
    [/\bpuff\s+sleeve\b/gi, 'بأكمام منفوخة جذابة'],
    [/\blong\s+sleeve\b/gi, 'بأكمام طويلة'],
    [/\bshort\s+sleeve\b/gi, 'بأكمام قصيرة'],
    [/\bsleeveless\b/gi, 'بدون أكمام'],
    [/\bsatin\b/gi, 'ساتان حريري فاخر'],
    [/\bvelvet\b/gi, 'مخمل أنيق'],
    [/\bchiffon\b/gi, 'شيفون ناعم'],
    [/\bcotton\b/gi, 'قطني مريح'],
    [/\bdenim\b/gi, 'جينز متين'],
    [/\bmaxi\s+dress\b/gi, 'فستان طويل ماكسي فاخر'],
    [/\bmidi\s+dress\b/gi, 'فستان ميدي أنيق'],
    [/\bmini\s+dress\b/gi, 'فستان قصير عصري'],
    [/\bevening\s+dress\b/gi, 'فستان سهرة راقي'],
    [/\bcasual\s+dress\b/gi, 'فستان كاجوال جذاب'],
    [/\bdress\b/gi, 'فستان أنيق'],
    [/\bhoodie\b/gi, 'هودي مريح وعصري'],
    [/\bvarsity\s+jacket\b/gi, 'جاكيت فارسيتي شبابي'],
    [/\bjackets?\b/gi, 'جاكيت عصري'],
    [/\bcoats?\b/gi, 'معطف شتوي فاخر'],
    [/\btrench\s+coat\b/gi, 'معطف ترنش كلاسيكي'],
    [/\bt-shirts?\b/gi, 'تيشيرت كاجوال'],
    [/\btees?\b/gi, 'تيشيرت شبابي'],
    [/\bshirts?\b/gi, 'قميص أنيق'],
    [/\bblouses?\b/gi, 'بلوزة أنيقة ناعمة'],
    [/\bpants\b/gi, 'بنطال مريح وعصري'],
    [/\btrousers\b/gi, 'بنطال كلاسيكي أنيق'],
    [/\bjeans\b/gi, 'بنطال جينز عصري'],
    [/\bcargo\b/gi, 'كارغو بجيوب عصرية'],
    [/\bsweaters?\b/gi, 'كنزة صوفية أنيقة'],
    [/\bcardigans?\b/gi, 'كارديجان ناعم وأنيق'],
    [/\bsneakers?\b/gi, 'حذاء سنيكرز رياضي مريح'],
    [/\bshoes?\b/gi, 'حذاء عصري مريح'],
    [/\bheels?\b/gi, 'حذاء كعب عالي أنيق'],
    [/\bboots?\b/gi, 'بوت شتوي فاخر'],
    [/\bsandals?\b/gi, 'صندل صيفي خفيف'],
    [/\bshoulder\s+bag\b/gi, 'حقيبة كتف راقية'],
    [/\bcrossbody\s+bag\b/gi, 'حقيبة كروس عصرية'],
    [/\btote\s+bag\b/gi, 'حقيبة توت واسعة وعملية'],
    [/\bhandbags?\b/gi, 'حقيبة يد فاخرة'],
    [/\bbags?\b/gi, 'حقيبة أنيقة'],
    [/\bnecklaces?\b/gi, 'عقد أنيق وجذاب'],
    [/\bearrings?\b/gi, 'أقراط أذن عصرية'],
    [/\brings?\b/gi, 'خاتم مميز'],
    [/\bbracelets?\b/gi, 'سوار يد راقي'],
    [/\blipstick\b/gi, 'أحمر شفاه مطفي جذاب'],
    [/\bmakeup\b/gi, 'مستحضرات مكياج وتجميل'],
    [/\bperfumes?\b/gi, 'عطر فاخر جذاب'],
    [/\bmen\b/gi, 'رجالي'],
    [/\bwomen\b/gi, 'نسائي'],
    [/\belegant\b/gi, 'راقي'],
    [/\bvintage\b/gi, 'فينتاج كلاسيكي'],
    [/\bcasual\b/gi, 'كاجوال'],
    [/\bsolid\b/gi, 'بلون موحد ناعم'],
    [/\bstriped\b/gi, 'مخطط'],
    [/\boversized\b/gi, 'بقصّة واسعة (أوفرسايز)'],
    [/\bslim\s+fit\b/gi, 'بقصّة محددة سليم'],
    [/\bhigh\s+waist\b/gi, 'بخصر عالي'],
    [/\bv-neck\b/gi, 'بياقة على شكل V'],
    [/\bsquare\s+neck\b/gi, 'بياقة مربعة عصرية'],
    [/\bdrawstring\b/gi, 'برباط شد مريح'],
    [/\bcontrast\b/gi, 'بألوان متباينة'],
    [/\btrim\b/gi, 'بتفاصيل أنيقة'],
    [/\btwo-piece\s+set\b/gi, 'طقم قطعتين متناسق'],
    [/\bset\b/gi, 'طقم متناسق'],
    [/\bwith\b/gi, 'مع'],
    [/\band\b/gi, 'و'],
  ];

  let translated = enTitle;
  for (const [regex, replacement] of replacements) {
    translated = translated.replace(regex, replacement);
  }

  translated = translated.replace(/\s+/g, ' ').trim();
  if (!/[\u0600-\u06FF]/.test(translated)) {
    return `منتج شي إن المميز - ${enTitle}`;
  }
  return translated;
}

// Fetch live SHEIN page HTML and extract metadata tags
async function fetchSheinPageData(targetUrl: string) {
  let title = '';
  let image = '';
  let description = '';
  let price: number | null = null;
  let finalUrl = targetUrl;

  try {
    const fetchPromise = (async () => {
      const controller = new AbortController();
      const killTimer = setTimeout(() => controller.abort(), 1400);
      try {
        const response = await fetch(targetUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
          },
          redirect: 'follow',
          signal: controller.signal,
        });

        finalUrl = response.url || targetUrl;
        if (response.ok && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let accumulated = '';
          while (accumulated.length < 80000) {
            const { value, done } = await reader.read();
            if (done || !value) break;
            accumulated += decoder.decode(value, { stream: true });
            if (accumulated.includes('</head>')) break;
          }
          reader.cancel().catch(() => {});

          // 1. og:title / twitter:title / <title>
          const ogTitle =
            accumulated.match(/<meta\s+property=[\"']og:title[\"']\s+content=[\"']([^\"']+)[\"']/i) ||
            accumulated.match(/<meta\s+name=[\"']twitter:title[\"']\s+content=[\"']([^\"']+)[\"']/i) ||
            accumulated.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (ogTitle && ogTitle[1]) {
            title = ogTitle[1].replace(/\s*\|\s*SHEIN.*$/i, '').replace(/\s*-\s*SHEIN.*$/i, '').trim();
          }

          // 2. og:image / twitter:image / CDN image
          const ogImage =
            accumulated.match(/<meta\s+property=[\"']og:image[\"']\s+content=[\"']([^\"']+)[\"']/i) ||
            accumulated.match(/<meta\s+name=[\"']twitter:image[\"']\s+content=[\"']([^\"']+)[\"']/i) ||
            accumulated.match(/<img[^>]+src=[\"'](https?:\/\/[^\"']*(?:ltwebstatic|shein)[^\"']*\.(?:jpg|jpeg|png|webp))[\"']/i);
          if (ogImage && ogImage[1]) {
            let img = ogImage[1];
            if (img.startsWith('//')) img = 'https:' + img;
            image = img;
          }

          // 3. og:description / meta description
          const ogDesc =
            accumulated.match(/<meta\s+property=[\"']og:description[\"']\s+content=[\"']([^\"']+)[\"']/i) ||
            accumulated.match(/<meta\s+name=[\"']description[\"']\s+content=[\"']([^\"']+)[\"']/i);
          if (ogDesc && ogDesc[1]) {
            description = ogDesc[1].trim();
          }

          // 4. Price extraction
          const priceMatch =
            accumulated.match(/<meta\s+property=[\"']product:price:amount[\"']\s+content=[\"']([\d\.]+)[\"']/i) ||
            accumulated.match(/<meta\s+property=[\"']og:price:amount[\"']\s+content=[\"']([\d\.]+)[\"']/i) ||
            accumulated.match(/\"sale_price\":\s*\"?([\d\.]+)\"?/i) ||
            accumulated.match(/\"retail_price\":\s*\"?([\d\.]+)\"?/i) ||
            accumulated.match(/\$\s*(\d+(?:\.\d{2})?)/);
          if (priceMatch && priceMatch[1]) {
            const parsedPrice = parseFloat(priceMatch[1]);
            if (!isNaN(parsedPrice) && parsedPrice > 4) {
              price = parsedPrice;
            }
          }
        }
      } finally {
        clearTimeout(killTimer);
      }
    })();

    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1500));
    await Promise.race([fetchPromise, timeoutPromise]);
  } catch (err) {
    console.warn('Page fetch encountered error, continuing with URL extraction:', err);
  }

  return { title, image, description, price, finalUrl };
}

// AUTOMATED SHEIN LINK PARSER & EXTRACTION ENDPOINT
app.post('/api/import/shein', async (req: Request, res: Response) => {
  const { url, rawContent } = req.body;

  if (!url && !rawContent) {
    return res.status(400).json({ error: 'Please provide a valid SHEIN product URL or raw text details.' });
  }

  const rawInput = (url || rawContent || '').trim();
  const cleanedUrl = extractCleanUrlFromInput(rawInput);
  const targetUrl = unwrapSheinUrl(cleanedUrl);
  const affId = db.settings.defaultAffiliateId || 'SHEIN_SELECT_SA';

  // 1. Parse URL structure
  const urlInfo = parseSheinUrlDetails(targetUrl);

  // 2. Fetch page HTML metadata using unwrapped direct product URL
  const pageData = targetUrl.startsWith('http')
    ? await fetchSheinPageData(targetUrl)
    : { title: '', image: '', description: '', price: null, finalUrl: targetUrl };

  // Determine effective URL & affiliate URL (filter out anti-bot/challenge URLs)
  let effectiveUrl = targetUrl.startsWith('http') ? targetUrl : `https://shein.com`;
  if (
    pageData.finalUrl &&
    !pageData.finalUrl.includes('challenge') &&
    !pageData.finalUrl.includes('captcha') &&
    !pageData.finalUrl.includes('risk')
  ) {
    effectiveUrl = pageData.finalUrl;
  }

  const sep = effectiveUrl.includes('?') ? '&' : '?';
  const formattedAffiliateUrl = effectiveUrl.includes('aff_id=')
    ? effectiveUrl
    : `${effectiveUrl}${sep}aff_id=${encodeURIComponent(affId)}`;

  // Determine effective English title
  let effectiveTitleEn = pageData.title || urlInfo.cleanTitle || 'SHEIN Fashion Selection';
  effectiveTitleEn = effectiveTitleEn.replace(/\s+/g, ' ').trim();

  // Determine SKU from real product ID
  const effectiveSku = urlInfo.productId
    ? `SH-${urlInfo.productId}`
    : `SH-${Math.floor(100000 + Math.random() * 900000)}`;

  // Determine category based on keywords
  const effectiveCategory = detectFashionCategory(effectiveTitleEn + ' ' + targetUrl);

  // Fallback category images
  const categoryFallbackImages: Record<string, string> = {
    'women-dresses': '/src/assets/images/category_women_dresses_1794426499182.jpg',
    'men-streetwear': '/src/assets/images/category_men_streetwear_1794426499892.jpg',
    'tops-jackets': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
    'shoes-footwear': 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80',
    'bags-accessories': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
    'beauty-makeup': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
  };

  const effectiveImage =
    pageData.image || categoryFallbackImages[effectiveCategory] || categoryFallbackImages['women-dresses'];

  // Determine price (if missing or <= 4 from captcha/tokens, use realistic category fashion price)
  const defaultPrices: Record<string, number> = {
    'women-dresses': 28,
    'men-streetwear': 32,
    'tops-jackets': 45,
    'shoes-footwear': 36,
    'bags-accessories': 24,
    'beauty-makeup': 18,
  };
  const categoryDefaultPrice = defaultPrices[effectiveCategory] || 25;
  const effectivePrice: number =
    typeof pageData.price === 'number' && pageData.price >= 5 ? pageData.price : categoryDefaultPrice;
  const effectiveOriginalPrice: number = Math.round(effectivePrice * 1.38);

  // 3. Arabic Translation & Descriptions
  let effectiveTitleAr = translateFashionTitleToAr(effectiveTitleEn);
  let effectiveDescAr =
    pageData.description ||
    'قطعة عصرية وأنيقة من تشكيلة SHEIN تم اختيارها بعناية لتناسب إطلالتك اليومية بأعلى جودة.';
  let effectiveDescEn =
    pageData.description ||
    'Carefully curated fashion item from SHEIN featuring premium material, stylish design, and comfortable fit.';

  // 4. Try Gemini AI if API key is present
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Translate and enhance this SHEIN product info for retail store:
Product Title: ${effectiveTitleEn}
Category: ${effectiveCategory}
Raw Description: ${pageData.description || ''}

Return JSON with:
- titleAr: Natural, appealing retail Arabic title
- titleEn: Polished English title
- descriptionAr: 2 sentences Arabic description
- descriptionEn: 2 sentences English description
`;
      const aiRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              titleAr: { type: Type.STRING },
              titleEn: { type: Type.STRING },
              descriptionAr: { type: Type.STRING },
              descriptionEn: { type: Type.STRING },
            },
            required: ['titleAr', 'titleEn'],
          },
        },
      });

      if (aiRes.text) {
        const parsed = JSON.parse(aiRes.text);
        if (parsed.titleAr) effectiveTitleAr = parsed.titleAr;
        if (parsed.titleEn) effectiveTitleEn = parsed.titleEn;
        if (parsed.descriptionAr) effectiveDescAr = parsed.descriptionAr;
        if (parsed.descriptionEn) effectiveDescEn = parsed.descriptionEn;
      }
    } catch (aiErr) {
      console.warn('Gemini enhancement skipped, using rule-based translation:', aiErr);
    }
  }

  const preview: SheinImportPreview = {
    titleAr: effectiveTitleAr,
    titleEn: effectiveTitleEn,
    descriptionAr: effectiveDescAr,
    descriptionEn: effectiveDescEn,
    price: effectivePrice,
    originalPrice: effectiveOriginalPrice,
    discountPercent: Math.round(((effectiveOriginalPrice - effectivePrice) / effectiveOriginalPrice) * 100),
    mainImage: effectiveImage,
    images: [effectiveImage],
    categorySlug: effectiveCategory,
    colors: ['#000000', '#FFFFFF', '#C0C0C0'],
    sizes: ['S', 'M', 'L', 'XL'],
    originalSheinUrl: effectiveUrl,
    affiliateUrl: formattedAffiliateUrl,
    sku: effectiveSku,
  };

  return res.json({ success: true, preview });
});

// Dynamic Sitemap.xml Route for SEO
app.get('/sitemap.xml', (req: Request, res: Response) => {
  const host = req.get('host') || 'sheinselect.store';
  const protocol = req.protocol || 'https';
  const baseUrl = `${protocol}://${host}`;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

  db.products.forEach((p) => {
    xml += `  <url>\n    <loc>${baseUrl}/product/${p.id}</loc>\n    <lastmod>${new Date(p.updatedAt).toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  });

  xml += `</urlset>`;

  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

// Dynamic Robots.txt Route for SEO
app.get('/robots.txt', (req: Request, res: Response) => {
  const host = req.get('host') || 'sheinselect.store';
  const text = `User-agent: *\nAllow: /\nSitemap: https://${host}/sitemap.xml\n`;
  res.header('Content-Type', 'text/plain');
  res.send(text);
});

// ================= VITE DEV MIDDLEWARE & SPA HANDLER =================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`🚀 SHEIN Select Affiliate Server running on http://localhost:${PORT}`);
  });
}

startServer();
