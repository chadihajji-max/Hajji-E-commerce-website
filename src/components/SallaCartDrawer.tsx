import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ExternalLink, ShieldCheck, CheckCircle } from 'lucide-react';

interface SallaCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  whatsappNumber?: string;
  whishMoneyLink?: string;
}

export const SallaCartDrawer: React.FC<SallaCartDrawerProps> = ({
  isOpen,
  onClose,
  whatsappNumber = '+96176123456', // Default store WhatsApp
  whishMoneyLink = 'https://whish.money/pay/shein-lebanon-shipping', // Default Whish Money payment link
}) => {
  const { sallaCart, removeFromSallaCart, updateSallaCartQty, clearSallaCart, formatPrice, language, currency } = useStore();
  
  // Checkout Steps: 'cart' -> 'shipping_notice' -> 'whatsapp_redirect'
  const [step, setStep] = useState<'cart' | 'shipping_notice' | 'whatsapp_redirect'>('cart');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [whishPaidConfirmed, setWhishPaidConfirmed] = useState(false);

  if (!isOpen) return null;

  const subtotalUSD = sallaCart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleProceedToNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (sallaCart.length === 0) return;
    setStep('shipping_notice');
  };

  const handleOpenWhishMoney = () => {
    window.open(whishMoneyLink, '_blank');
    setWhishPaidConfirmed(true);
  };

  const handleSendToWhatsApp = () => {
    const itemsList = sallaCart
      .map(
        (i, idx) =>
          `${idx + 1}. *${i.product.titleAr}* | الكمية: ${i.quantity} | السعر: ${formatPrice(i.product.price)}${
            i.selectedSize ? ` | المقاس: ${i.selectedSize}` : ''
          }${i.selectedColor ? ` | اللون: ${i.selectedColor}` : ''}`
      )
      .join('\n');

    const message = `🛍️ *طلب جديد من متجر سلة المستقل*
----------------------------------
👤 اسم العميل: ${customerName}
📞 رقم الهاتف: ${customerPhone}
🏙️ المدينة: ${customerCity}
📍 العنوان: ${customerAddress}
----------------------------------
📦 *تفاصيل المنتجات:*
${itemsList}
----------------------------------
💰 *المجموع الإجمالي:* ${formatPrice(subtotalUSD)}
💳 *رسوم الشحن:* تم سدادها عبر Whish Money (${whishPaidConfirmed ? '✅ مؤكد' : '⏳ قيد التأكيد'})
----------------------------------
يرجى تأكيد الطلب وتجهيز الشحن وشكراً لكم!`;

    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encoded}`;
    window.open(waUrl, '_blank');
    clearSallaCart();
    setStep('cart');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-end animate-fadeIn">
      <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">
                {language === 'ar' ? 'سلة منتجات سلة الخاصة' : 'Salla Store Cart'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {sallaCart.length} {language === 'ar' ? 'منتجات في السلة' : 'items in cart'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white cursor-pointer p-1"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50 flex flex-col gap-4">
          
          {/* STEP 1: CART ITEMS & CUSTOMER FORM */}
          {step === 'cart' && (
            <>
              {sallaCart.length > 0 ? (
                <div className="flex flex-col gap-4">
                  <div className="divide-y divide-slate-200 bg-white rounded-xl border border-slate-200 overflow-hidden">
                    {sallaCart.map((item, idx) => (
                      <div key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}-${idx}`} className="p-4 flex items-center gap-3">
                        <img
                          src={item.product.mainImage}
                          alt={item.product.titleAr}
                          className="w-16 h-16 object-cover rounded-lg border shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs truncate">{item.product.titleAr}</h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            {item.selectedSize && <span>مقاس: {item.selectedSize}</span>}
                            {item.selectedColor && <span>لون: {item.selectedColor}</span>}
                          </div>
                          <span className="text-xs font-black text-amber-700 font-mono block mt-1">
                            {formatPrice(item.product.price)}
                          </span>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => updateSallaCartQty(item.product.id, item.quantity - 1, item.selectedSize, item.selectedColor)}
                            className="w-6 h-6 rounded bg-white shadow-2xs flex items-center justify-center text-slate-700 hover:bg-slate-200 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold font-mono">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateSallaCartQty(item.product.id, item.quantity + 1, item.selectedSize, item.selectedColor)}
                            className="w-6 h-6 rounded bg-white shadow-2xs flex items-center justify-center text-slate-700 hover:bg-slate-200 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromSallaCart(item.product.id, item.selectedSize, item.selectedColor)}
                          className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Customer Details Form */}
                  <form onSubmit={handleProceedToNotice} id="salla-checkout-form" className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col gap-3">
                    <h4 className="font-extrabold text-xs text-slate-900 border-b pb-2">
                      {language === 'ar' ? 'معلومات التوصيل والاستلام' : 'Delivery Information'}
                    </h4>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        {language === 'ar' ? 'الاسم الكامل:' : 'Full Name:'}
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="أحمد محمد"
                        required
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-black"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          {language === 'ar' ? 'رقم الهاتف (واتساب):' : 'Phone Number:'}
                        </label>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="+961 76 000 000"
                          required
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-black"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          {language === 'ar' ? 'المدينة / المنطقة:' : 'City / Area:'}
                        </label>
                        <input
                          type="text"
                          value={customerCity}
                          onChange={(e) => setCustomerCity(e.target.value)}
                          placeholder="بيروت، صيدا..."
                          required
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-black"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        {language === 'ar' ? 'العنوان التفصيلي:' : 'Detailed Address:'}
                      </label>
                      <input
                        type="text"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        placeholder="الشارع، البناية، الطابق..."
                        required
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-black"
                      />
                    </div>
                  </form>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white rounded-xl border">
                  <ShoppingBag className="w-12 h-12 text-slate-300 mb-3" />
                  <h4 className="font-bold text-slate-800 text-sm">
                    {language === 'ar' ? 'سلة المشتريات فارغة' : 'Your Salla cart is empty'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {language === 'ar' ? 'أضف بعض منتجات سلة الخاصة لبدء التسوق.' : 'Add independent Salla products to start.'}
                  </p>
                </div>
              )}
            </>
          )}

          {/* STEP 2: SHIPPING NOTICE & WHISH MONEY PAYMENT GATEWAY */}
          {step === 'shipping_notice' && (
            <div className="bg-white rounded-xl border border-amber-300 p-5 flex flex-col gap-4 shadow-md animate-fadeIn">
              <div className="flex items-center gap-3 bg-amber-50 text-amber-900 p-3.5 rounded-xl border border-amber-200">
                <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0" />
                <div>
                  <h4 className="font-extrabold text-xs">
                    {language === 'ar' ? 'خطوة إجبارية: تأكيد جدية الطلب وسداد الشحن' : 'Mandatory Step: Shipping Fee Confirmation'}
                  </h4>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    {language === 'ar'
                      ? 'شحن الطلبات عبر سلة مشروط بإتمام عملية التحويل وسداد رسوم الشحن مسبقاً.'
                      : 'Order shipping is conditional upon prior payment of shipping fees.'}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2.5 text-xs text-slate-700">
                <p className="font-bold text-slate-900">
                  {language === 'ar' ? '💳 سداد رسوم الشحن عبر Whish Money:' : '💳 Pay Shipping via Whish Money:'}
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {language === 'ar'
                    ? 'لتأكيد جدية الطلب وحجز المنتجات، يرجى الضغط على زر الدفع أدناه لتحويل رسوم الشحن عبر تطبيق أو وكيل Whish Money، ثم العودة لتأكيد الإرسال عبر الواتساب.'
                    : 'To confirm seriousness, click below to remit shipping fees via Whish Money before submitting your order to WhatsApp.'}
                </p>

                <button
                  type="button"
                  onClick={handleOpenWhishMoney}
                  className="mt-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{language === 'ar' ? 'فتح رابط الدفع السريع (Whish Money)' : 'Open Whish Money Payment Link'}</span>
                </button>

                {whishPaidConfirmed && (
                  <div className="mt-2 flex items-center gap-2 text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 text-xs font-bold">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{language === 'ar' ? 'تم النقر على رابط الدفع وفتح بوابة Whish بنجاح!' : 'Whish Money payment link opened!'}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-black cursor-pointer"
                >
                  {language === 'ar' ? '← رجوع لتعديل السلة' : '← Back to Cart'}
                </button>

                <button
                  type="button"
                  disabled={!whishPaidConfirmed}
                  onClick={() => setStep('whatsapp_redirect')}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                >
                  <span>{language === 'ar' ? 'متابعة إلى إرسال الواتساب' : 'Proceed to WhatsApp'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: WHATSAPP FINAL SUBMISSION */}
          {step === 'whatsapp_redirect' && (
            <div className="bg-white rounded-xl border border-emerald-300 p-6 flex flex-col items-center text-center gap-4 shadow-lg animate-fadeIn">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div>
                <h4 className="font-black text-slate-900 text-base">
                  {language === 'ar' ? 'أنت جاهز لإرسال الطلب عبر الواتساب!' : 'Ready to Send Order via WhatsApp!'}
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  {language === 'ar'
                    ? 'تم تجهيز رسالة الطلب وتضمين بيانات التوصيل وإثبات الشحن. انقر أدناه لفتح الواتساب وإرسال الطلب فوراً.'
                    : 'Order message and shipping confirmation are ready. Click below to open WhatsApp.'}
                </p>
              </div>

              <div className="w-full bg-slate-50 p-4 rounded-xl border text-start text-xs font-mono text-slate-700 space-y-1">
                <div>👤 العميل: {customerName}</div>
                <div>📞 الهاتف: {customerPhone}</div>
                <div>🏙️ المدينة: {customerCity}</div>
                <div>💰 المجموع: {formatPrice(subtotalUSD)}</div>
                <div className="text-emerald-700 font-bold">💳 رسوم الشحن: مسددة عبر Whish Money</div>
              </div>

              <div className="flex items-center gap-3 w-full pt-2">
                <button
                  type="button"
                  onClick={() => setStep('shipping_notice')}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  {language === 'ar' ? 'رجوع' : 'Back'}
                </button>
                <button
                  type="button"
                  onClick={handleSendToWhatsApp}
                  className="flex-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{language === 'ar' ? 'إرسال الطلب الآن عبر الواتساب 💬' : 'Send Order to WhatsApp 💬'}</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer / Checkout Bar */}
        {sallaCart.length > 0 && step === 'cart' && (
          <div className="bg-white p-5 border-t border-slate-200 shrink-0 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-bold">{language === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
              <span className="font-black text-slate-900 text-base font-mono">{formatPrice(subtotalUSD)}</span>
            </div>

            <button
              type="submit"
              form="salla-checkout-form"
              className="w-full py-3.5 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span>{language === 'ar' ? 'إتمام الطلب والدفع (Whish Money)' : 'Complete Order & Pay (Whish Money)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
