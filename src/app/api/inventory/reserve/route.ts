import { NextRequest, NextResponse } from 'next/server';
import { createCustomerServerClient } from '@/utils/supabase/customer-server';

/**
 * Inventory Reservation API — Soft Hold System
 * POST /api/inventory/reserve   → Reserve items for 15 minutes
 * DELETE /api/inventory/reserve → Release reservation early
 */

const RESERVATION_MINUTES = 15;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      shopId: string;
      items: Array<{ productId: string; quantity: number; variantId?: string }>;
    };

    if (!body?.shopId || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'Invalid reservation payload.' }, { status: 400 });
    }

    const supabase = await createCustomerServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000).toISOString();

    // Check if stock_reservations table exists, gracefully skip if not
    const { error: tableCheckError } = await supabase
      .from('stock_reservations')
      .select('id')
      .limit(1);

    if (tableCheckError && tableCheckError.code === '42P01') {
      // Table doesn't exist yet — reservation silently skipped (not blocking checkout)
      return NextResponse.json({
        success: true,
        reservationId: null,
        expiresAt,
        note: 'Reservation table not initialized. Run migration to enable inventory holds.',
      });
    }

    // Release any existing reservations by this user in this shop
    await supabase
      .from('stock_reservations')
      .delete()
      .eq('user_id', user.id)
      .eq('shop_id', body.shopId);

    // Validate stock for each item before reserving
    const productIds = body.items.map(i => i.productId);
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, title, stock_quantity')
      .in('id', productIds)
      .eq('shop_id', body.shopId);

    if (productError) {
      return NextResponse.json({ error: productError.message }, { status: 400 });
    }

    const productMap = new Map((products || []).map(p => [p.id, p]));

    for (const item of body.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }

      // Check if enough stock exists (ignoring existing reservations for simplicity)
      const available = Number(product.stock_quantity ?? 0);
      if (available < item.quantity) {
        return NextResponse.json(
          { error: `${product.title} is out of stock. Only ${available} unit(s) available.` },
          { status: 409 }
        );
      }
    }

    // Create reservation records
    const reservations = body.items.map(item => ({
      user_id: user.id,
      shop_id: body.shopId,
      product_id: item.productId,
      variant_id: item.variantId ?? null,
      quantity: item.quantity,
      expires_at: expiresAt,
    }));

    const { data: reservationData, error: reservationError } = await supabase
      .from('stock_reservations')
      .insert(reservations)
      .select('id');

    if (reservationError) {
      return NextResponse.json({ error: reservationError.message }, { status: 400 });
    }

    const reservationIds = (reservationData || []).map((r: { id: string }) => r.id);

    return NextResponse.json({
      success: true,
      reservationIds,
      expiresAt,
      expiresInMinutes: RESERVATION_MINUTES,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Reservation error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json() as { shopId: string };
    if (!body?.shopId) {
      return NextResponse.json({ error: 'shopId is required.' }, { status: 400 });
    }

    const supabase = await createCustomerServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    // Check table exists before attempting delete
    const { error: tableCheckError } = await supabase
      .from('stock_reservations')
      .select('id')
      .limit(1);

    if (tableCheckError && tableCheckError.code === '42P01') {
      return NextResponse.json({ success: true, released: 0 });
    }

    const { count } = await supabase
      .from('stock_reservations')
      .delete({ count: 'exact' })
      .eq('user_id', user.id)
      .eq('shop_id', body.shopId);

    return NextResponse.json({ success: true, released: count ?? 0 });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Release error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
