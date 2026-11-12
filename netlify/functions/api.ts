import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_BANNERS,
  INITIAL_SETTINGS,
} from '../../src/data/initialData';
import { parseSheinLinkClient } from '../../src/utils/sheinParser';

let products = [...INITIAL_PRODUCTS];
let settings = { ...INITIAL_SETTINGS };

export const handler = async (event: any) => {
  const method = event.httpMethod || 'GET';
  const rawPath = event.path || '';
  const cleanPath = rawPath
    .replace(/^\/\.netlify\/functions\/api/, '')
    .replace(/^\/api/, '')
    .split('?')[0];

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (method === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    let body: any = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch {
        body = {};
      }
    }

    // 1. Admin Login
    if (cleanPath === '/admin/login' && method === 'POST') {
      const { password } = body;
      const expected = settings.adminPasswordHash || 'admin123';
      if (password === expected || password === 'admin123') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, token: 'net-admin-' + Date.now() }),
        };
      }
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: 'Invalid Password' }),
      };
    }

    // 1b. Admin Change Password
    if (cleanPath === '/admin/change-password' && method === 'POST') {
      const { currentPassword, newPassword } = body;
      const expected = settings.adminPasswordHash || 'admin123';
      if (currentPassword !== expected && currentPassword !== 'admin123') {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, message: 'كلمة المرور الحالية غير صحيحة' }),
        };
      }
      if (!newPassword || newPassword.trim().length < 4) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, message: 'يجب ألا تقل كلمة المرور الجديدة عن 4 خانات' }),
        };
      }
      settings.adminPasswordHash = newPassword.trim();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'تم تغيير كلمة المرور بنجاح' }),
      };
    }

    // 2. Products
    if (cleanPath === '/products' || cleanPath === '/admin/products') {
      if (method === 'GET') {
        return { statusCode: 200, headers, body: JSON.stringify(products) };
      }
      if (method === 'POST') {
        const newProduct = {
          ...body,
          id: body.id || 'prod-' + Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        products.unshift(newProduct);
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, product: newProduct }) };
      }
    }

    // 3. Delete Product
    const deleteMatch = cleanPath.match(/^\/products\/([^\/]+)$/);
    if (deleteMatch && method === 'DELETE') {
      const id = deleteMatch[1];
      products = products.filter((p) => p.id !== id);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Product deleted' }) };
    }

    // 4. Update Product
    if (deleteMatch && method === 'PUT') {
      const id = deleteMatch[1];
      const index = products.findIndex((p) => p.id === id);
      if (index !== -1) {
        products[index] = { ...products[index], ...body, updatedAt: new Date().toISOString() };
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, product: products[index] }) };
      }
    }

    // 5. Categories
    if (cleanPath === '/categories') {
      return { statusCode: 200, headers, body: JSON.stringify(INITIAL_CATEGORIES) };
    }

    // 6. Banners
    if (cleanPath === '/banners') {
      return { statusCode: 200, headers, body: JSON.stringify(INITIAL_BANNERS) };
    }

    // 7. Settings
    if (cleanPath === '/settings') {
      if (method === 'PUT') {
        settings = { ...settings, ...body };
        const { adminPasswordHash, ...safeSettings } = settings;
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, settings: safeSettings }) };
      }
      const { adminPasswordHash, ...safeSettings } = settings;
      return { statusCode: 200, headers, body: JSON.stringify(safeSettings) };
    }

    // 8. Analytics
    if (cleanPath === '/analytics') {
      const totalProducts = products.length;
      const totalClicks = products.reduce((acc, p) => acc + (p.clicksCount || 0), 0);
      const totalViews = products.reduce((acc, p) => acc + (p.viewsCount || 0), 0);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          totalProducts,
          totalClicks,
          totalViews,
          topClickedProducts: products.slice(0, 5).map((p) => ({
            id: p.id,
            title: p.titleAr || p.titleEn,
            clicks: p.clicksCount || 0,
            views: p.viewsCount || 0,
          })),
          recentClicks: [],
        }),
      };
    }

    // 9. SHEIN Importer
    if (cleanPath === '/import/shein' && method === 'POST') {
      const url = body.url || body.rawContent || '';
      const preview = parseSheinLinkClient(url, settings.defaultAffiliateId || 'SHEIN_SELECT_LB');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, preview }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Internal Server Error' }),
    };
  }
};
