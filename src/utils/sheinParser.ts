import { SheinImportPreview } from '../types/store';

// Extract any URL embedded in text (handles mobile app share messages with Arabic/English text)
export function extractCleanUrlFromInput(rawInput: string): string {
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
export function unwrapSheinUrl(inputUrl: string): string {
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

// Detect accurate category from title/URL keywords
export function detectFashionCategory(text: string): string {
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
export function translateFashionTitleToAr(enTitle: string): string {
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

// Fallback category images
export const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  'women-dresses': '/src/assets/images/category_women_dresses_1794426499182.jpg',
  'men-streetwear': '/src/assets/images/category_men_streetwear_1794426499892.jpg',
  'tops-jackets': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
  'shoes-footwear': 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80',
  'bags-accessories': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
  'beauty-makeup': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
};

// Client-side parser for SHEIN links (works offline and on static Netlify)
export function parseSheinLinkClient(input: string, affiliateId: string = 'SHEIN_SELECT_LB'): SheinImportPreview {
  const cleanedUrl = extractCleanUrlFromInput(input);
  const unwrappedUrl = unwrapSheinUrl(cleanedUrl);

  let cleanTitle = '';
  let productId = '';

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

  if (urlObj) {
    const pathname = urlObj.pathname;
    const pMatch = pathname.match(/\/([^\/]+)-p-(\d+)/i);
    if (pMatch) {
      cleanTitle = pMatch[1].replace(/[-_]+/g, ' ').trim();
      productId = pMatch[2];
    } else {
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

    cleanTitle = cleanTitle
      .replace(/^([a-z]{2,3})\s+/i, '')
      .replace(/\s+p\s+\d+.*$/i, '')
      .trim();
  }

  if (!cleanTitle) {
    cleanTitle = input.replace(/https?:\/\/[^\s]+/gi, '').trim() || 'SHEIN Fashion Product';
  }

  const effectiveTitleEn = cleanTitle;
  const effectiveTitleAr = translateFashionTitleToAr(effectiveTitleEn);
  const categorySlug = detectFashionCategory(effectiveTitleEn + ' ' + unwrappedUrl);

  const defaultPrices: Record<string, number> = {
    'women-dresses': 28,
    'men-streetwear': 32,
    'tops-jackets': 45,
    'shoes-footwear': 36,
    'bags-accessories': 24,
    'beauty-makeup': 18,
  };
  const price = defaultPrices[categorySlug] || 25;
  const originalPrice = Math.round(price * 1.38);

  const directUrl = unwrappedUrl.startsWith('http') ? unwrappedUrl : `https://${unwrappedUrl}`;
  const sep = directUrl.includes('?') ? '&' : '?';
  const affiliateUrl = directUrl.includes('aff_id=')
    ? directUrl
    : `${directUrl}${sep}aff_id=${encodeURIComponent(affiliateId)}`;

  const sku = productId ? `SH-${productId}` : `SH-${Math.floor(100000 + Math.random() * 900000)}`;
  const mainImage = CATEGORY_DEFAULT_IMAGES[categorySlug] || CATEGORY_DEFAULT_IMAGES['women-dresses'];

  return {
    titleAr: effectiveTitleAr,
    titleEn: effectiveTitleEn,
    descriptionAr: 'قطعة أنيقة وعصرية تم اختيارها بعناية من تشكيلة SHEIN بمواصفات ممتازة وجودة عالية.',
    descriptionEn: 'Carefully curated fashion item from SHEIN featuring premium material, stylish design, and comfortable fit.',
    price,
    originalPrice,
    discountPercent: Math.round(((originalPrice - price) / originalPrice) * 100),
    mainImage,
    images: [mainImage],
    categorySlug,
    colors: ['#000000', '#FFFFFF', '#C0C0C0'],
    sizes: ['S', 'M', 'L', 'XL'],
    originalSheinUrl: directUrl,
    affiliateUrl,
    sku,
  };
}
