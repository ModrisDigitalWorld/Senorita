import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = process.env.FROM_EMAIL
  ? `Senorita Store <${process.env.FROM_EMAIL}>`
  : "Senorita Store <onboarding@resend.dev>";

function emailEnabled() {
  return !!process.env.RESEND_API_KEY;
}

export async function sendOrderConfirmation(opts: {
  to: string;
  name: string;
  orderId: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  address: any;
  paymentMethod?: string;
}) {
  if (!emailEnabled()) return;

  const itemRows = opts.items
    .map(i => `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0">${i.name}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:center">${i.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right">₹${i.price}</td>
    </tr>`)
    .join("");

  const addr = opts.address;
  const shortId = opts.orderId.slice(0, 8).toUpperCase();

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
    <div style="background:#e91e8c;padding:24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px;font-style:italic;font-family:Georgia,serif">Senorita</h1>
    </div>
    <div style="padding:28px 24px">
      <h2 style="color:#232323;font-size:20px">Order Confirmed! 🎉</h2>
      <p style="color:#555">Hi ${opts.name}, thank you for your order! We're getting it ready for you.</p>
      <div style="background:#fafafa;border-radius:8px;padding:16px;margin:20px 0">
        <p style="margin:0 0 4px;color:#888;font-size:12px">ORDER ID</p>
        <p style="margin:0;font-weight:bold;color:#232323;font-size:18px">#${shortId}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <thead>
          <tr style="border-bottom:2px solid #e91e8c">
            <th style="text-align:left;padding:8px 0;font-size:12px;color:#888">ITEM</th>
            <th style="text-align:center;padding:8px 0;font-size:12px;color:#888">QTY</th>
            <th style="text-align:right;padding:8px 0;font-size:12px;color:#888">PRICE</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:12px 0;font-weight:bold;color:#232323">Total</td>
            <td style="padding:12px 0;font-weight:bold;color:#e91e8c;text-align:right;font-size:18px">₹${opts.total}</td>
          </tr>
        </tfoot>
      </table>
      <div style="background:#fafafa;border-radius:8px;padding:16px;margin:20px 0">
        <p style="margin:0 0 8px;color:#888;font-size:12px;font-weight:bold">DELIVERY ADDRESS</p>
        <p style="margin:0;color:#232323">${addr?.name || opts.name}</p>
        <p style="margin:4px 0 0;color:#555;font-size:14px">${addr?.line1}${addr?.line2 ? ", " + addr.line2 : ""}, ${addr?.city}, ${addr?.state} - ${addr?.pincode}</p>
        <p style="margin:4px 0 0;color:#555;font-size:14px">📞 ${addr?.phone || ""}</p>
      </div>
      ${opts.paymentMethod === "cod" ? `<div style="background:#fff9e6;border:1px solid #f5c842;border-radius:8px;padding:14px;margin-bottom:20px">
        <p style="margin:0;color:#b45309;font-size:14px">💰 <strong>Cash on Delivery</strong> — Please keep ₹${opts.total} ready at the time of delivery.</p>
      </div>` : ""}
      <p style="color:#555;font-size:14px">We'll send you another email when your order ships. If you have any questions, reply to this email or contact us at <a href="mailto:senorita.store.karnal@gmail.com" style="color:#e91e8c">senorita.store.karnal@gmail.com</a>.</p>
    </div>
    <div style="background:#232323;padding:20px;text-align:center">
      <p style="color:#888;margin:0;font-size:12px">© 2026 Senorita Store · Karnal, Haryana</p>
    </div>
  </div>`;

  const { error } = await getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: `Order Confirmed #${shortId} — Senorita`,
    html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
}

export async function sendOrderStatusUpdate(opts: {
  to: string;
  name: string;
  orderId: string;
  status: string;
  trackingNumber?: string | null;
}) {
  if (!emailEnabled()) return;

  const shortId = opts.orderId.slice(0, 8).toUpperCase();

  const statusMessages: Record<string, { emoji: string; title: string; body: string }> = {
    confirmed:  { emoji: "✅", title: "Order Confirmed",  body: "Great news! Your order has been confirmed and is being prepared." },
    processing: { emoji: "🔄", title: "Order Processing", body: "Your order is being processed and packed by our team." },
    shipped:    { emoji: "🚚", title: "Order Shipped",     body: "Your order is on its way! " + (opts.trackingNumber ? `Tracking: <strong>${opts.trackingNumber}</strong>` : "Tracking details will be updated soon.") },
    delivered:  { emoji: "🎉", title: "Order Delivered",  body: "Your order has been delivered! We hope you love it." },
    cancelled:  { emoji: "❌", title: "Order Cancelled",  body: "Your order has been cancelled. If you have any questions, please contact us." },
  };

  const info = statusMessages[opts.status] || { emoji: "📦", title: "Order Update", body: `Your order status has been updated to: ${opts.status}` };

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
    <div style="background:#e91e8c;padding:24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px;font-style:italic;font-family:Georgia,serif">Senorita</h1>
    </div>
    <div style="padding:28px 24px;text-align:center">
      <div style="font-size:48px;margin-bottom:16px">${info.emoji}</div>
      <h2 style="color:#232323;font-size:22px;margin:0 0 12px">${info.title}</h2>
      <p style="color:#555;font-size:15px;margin:0 0 20px">Hi ${opts.name}, ${info.body}</p>
      <div style="background:#fafafa;border-radius:8px;padding:16px;margin:20px auto;display:inline-block">
        <p style="margin:0 0 4px;color:#888;font-size:12px">ORDER ID</p>
        <p style="margin:0;font-weight:bold;color:#232323;font-size:18px">#${shortId}</p>
      </div>
      <p style="color:#888;font-size:13px">Questions? Contact us at <a href="mailto:senorita.store.karnal@gmail.com" style="color:#e91e8c">senorita.store.karnal@gmail.com</a> or call <a href="tel:+917626040000" style="color:#e91e8c">+91 7626 040 000</a></p>
    </div>
    <div style="background:#232323;padding:20px;text-align:center">
      <p style="color:#888;margin:0;font-size:12px">© 2026 Senorita Store · Karnal, Haryana</p>
    </div>
  </div>`;

  const { error } = await getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: `${info.emoji} ${info.title} #${shortId} — Senorita`,
    html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
}
