import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const { orderId, shopRoute } = await req.json();
        if (!orderId || !shopRoute) {
            return NextResponse.json({ error: 'orderId and shopRoute are required' }, { status: 400 });
        }

        const supabase = await createClient();

        // Fetch order + shop
        const { data: shop } = await supabase
            .from('shops')
            .select('id, shop_name, logo_url, primary_color, route_path')
            .eq('route_path', shopRoute)
            .single();

        if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

        const { data: order } = await supabase
            .from('orders')
            .select('*, order_items(quantity, unit_price, products(title))')
            .eq('id', orderId)
            .eq('shop_id', shop.id)
            .single();

        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        if (!order.customer_email) return NextResponse.json({ error: 'No customer email on this order' }, { status: 400 });

        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        if (!RESEND_API_KEY) {
            return NextResponse.json({ error: 'Email not configured. Add RESEND_API_KEY to .env.local' }, { status: 503 });
        }

        const accent = shop.primary_color || '#2563EB';
        const invoiceUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/shop/${shopRoute}/invoice/${orderId}`;
        const trackingUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/shop/${shopRoute}/order/${orderId}`;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const itemRows = (order.order_items || []).map((item: any) => `
            <tr>
                <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#374151;">${item.products?.title || 'Product'}</td>
                <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#6B7280;text-align:center;">${item.quantity}</td>
                <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#374151;text-align:right;font-family:monospace;">Rs. ${(item.unit_price * item.quantity).toFixed(2)}</td>
            </tr>
        `).join('');

        const trackingSection = order.tracking_number ? `
            <div style="background:#EFF6FF;border-radius:12px;padding:16px 20px;margin:24px 0;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#1E40AF;text-transform:uppercase;letter-spacing:0.05em;">Tracking Info</p>
                ${order.tracking_carrier ? `<p style="margin:0 0 4px;font-size:14px;color:#374151;">Carrier: <strong>${order.tracking_carrier}</strong></p>` : ''}
                <p style="margin:0 0 4px;font-size:14px;color:#374151;">Tracking #: <strong style="font-family:monospace;">${order.tracking_number}</strong></p>
                ${order.tracking_url ? `<a href="${order.tracking_url}" style="color:${accent};font-size:13px;font-weight:600;">Track on carrier website →</a>` : ''}
            </div>
        ` : '';

        const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:600px;margin:32px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

    <!-- Header -->
    <div style="background:${accent};padding:28px 32px;">
        <h1 style="margin:0;color:white;font-size:22px;font-weight:800;">${shop.shop_name}</h1>
        <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Order Confirmation & Tracking</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
        <h2 style="font-size:18px;font-weight:700;color:#111827;margin:0 0 4px;">Hi ${order.customer_name || 'there'},</h2>
        <p style="color:#6B7280;font-size:15px;margin:0 0 24px;">Your order has been ${order.status === 'delivered' ? 'delivered' : order.status === 'shipped' ? 'shipped' : 'confirmed'}. Here are your order details:</p>

        <!-- Status Badge -->
        <div style="display:inline-block;background:${accent}18;color:${accent};font-size:13px;font-weight:700;padding:6px 16px;border-radius:100px;border:1px solid ${accent}30;margin-bottom:24px;">
            Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </div>

        <!-- Order Info -->
        <p style="font-size:13px;color:#9CA3AF;margin:0 0 4px;">Order Reference</p>
        <p style="font-size:20px;font-weight:800;color:#111827;font-family:monospace;margin:0 0 24px;">#${orderId.split('-')[0].toUpperCase()}</p>

        ${trackingSection}

        <!-- Items Table -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            <thead>
                <tr style="background:#F9FAFB;">
                    <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.05em;">Product</th>
                    <th style="padding:10px 16px;text-align:center;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.05em;">Qty</th>
                    <th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.05em;">Total</th>
                </tr>
            </thead>
            <tbody>${itemRows}</tbody>
        </table>

        <!-- Grand Total -->
        <div style="border-top:2px solid ${accent};padding-top:16px;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:16px;font-weight:700;color:#111827;">Total Paid</span>
            <span style="font-size:20px;font-weight:800;color:${accent};font-family:monospace;">Rs. ${Number(order.total_amount).toFixed(2)}</span>
        </div>

        <!-- CTA Buttons -->
        <div style="margin-top:32px;display:flex;gap:12px;flex-wrap:wrap;">
            <a href="${trackingUrl}" style="background:${accent};color:white;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:700;font-size:14px;">Track My Order</a>
            <a href="${invoiceUrl}" style="background:#F3F4F6;color:#374151;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:700;font-size:14px;">View Invoice</a>
        </div>
    </div>

    <!-- Footer -->
    <div style="background:#F9FAFB;padding:20px 32px;border-top:1px solid #F0F0F0;">
        <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;">
            This email was sent by <strong>${shop.shop_name}</strong> · Powered by MyShop Platform
        </p>
    </div>
</div>
</body>
</html>`;

        // Send via Resend
        const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: `${shop.shop_name} <onboarding@resend.dev>`,
                to: [order.customer_email],
                subject: `Order #${orderId.split('-')[0].toUpperCase()} — ${order.status === 'shipped' ? 'Your order is on the way!' : 'Order Update from ' + shop.shop_name}`,
                html: htmlBody,
            }),
        });

        if (!resendRes.ok) {
            const err = await resendRes.json();
            return NextResponse.json({ error: err.message || 'Failed to send email' }, { status: 500 });
        }

        // Record that email was sent
        await supabase.from('orders').update({ email_sent_at: new Date().toISOString() }).eq('id', orderId);

        return NextResponse.json({ success: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}
