import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { convertQuantity, normalizeStockUnit, normalizeSellingUnit, type ProductUnit } from '@/lib/products';

interface PlaceOrderItem {
    id: string;
    price: number;
    quantityMultiplier: number;
    orderedQuantity: number;
    orderedUnit: ProductUnit;
    selling_unit_value: number;
    selling_unit: ProductUnit;
    stock_quantity: number;
    stock_unit: ProductUnit;
}

interface PlaceOrderBody {
    shopId: string;
    routePath?: string;
    paymentMethod: 'card' | 'cod';
    customer: {
        email: string;
        fullName: string;
        address: string;
        city: string;
        postalCode: string;
    };
    items: PlaceOrderItem[];
}

function toNumber(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as PlaceOrderBody;
        if (!body?.shopId || !Array.isArray(body.items) || body.items.length === 0) {
            return NextResponse.json({ error: 'Invalid order payload.' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Authentication required to place an order.' }, { status: 401 });
        }

        const { data: shop } = await supabase
            .from('shops')
            .select('id')
            .eq('id', body.shopId)
            .maybeSingle<{ id: string }>();

        if (!shop) {
            return NextResponse.json({ error: 'Shop not found.' }, { status: 404 });
        }

        let shopCustomerId: string | null = null;
        const upsertShopCustomer = await supabase
            .from('shop_customers')
            .upsert(
                {
                    shop_id: shop.id,
                    auth_user_id: user.id,
                    email: user.email || body.customer.email,
                    full_name: body.customer.fullName,
                },
                { onConflict: 'shop_id,auth_user_id' }
            )
            .select('id')
            .single<{ id: string }>();

        if (!upsertShopCustomer.error) {
            shopCustomerId = upsertShopCustomer.data?.id ?? null;
        }

        const productIds = body.items.map((i) => i.id);
        const { data: products, error: productError } = await supabase
            .from('products')
            .select('id, title, price, selling_unit_value, selling_unit, stock_quantity, stock_unit')
            .eq('shop_id', body.shopId)
            .in('id', productIds);

        if (productError) {
            return NextResponse.json({ error: productError.message }, { status: 400 });
        }

        const productMap = new Map((products || []).map((p) => [p.id, p]));
        const stockUpdates: Array<{ id: string; nextStock: number }> = [];

        for (const item of body.items) {
            const product = productMap.get(item.id);
            if (!product) {
                return NextResponse.json({ error: 'One or more products are no longer available.' }, { status: 400 });
            }

            const stockUnit = normalizeStockUnit(product.stock_unit as string | undefined);
            const sellingUnitValue = toNumber(product.selling_unit_value, 1);
            const stockQuantity = toNumber(product.stock_quantity, 0);

            const orderedQuantity = toNumber(item.orderedQuantity, sellingUnitValue * toNumber(item.quantityMultiplier, 1));
            const orderedUnit = normalizeSellingUnit((item.orderedUnit || product.selling_unit) as string | undefined);

            const requiredInStockUnit = convertQuantity(orderedQuantity, orderedUnit, stockUnit);
            const remainingStock = stockQuantity - requiredInStockUnit;

            if (remainingStock < -1e-9) {
                return NextResponse.json(
                    { error: `${product.title} is out of stock for the selected quantity.` },
                    { status: 400 }
                );
            }

            stockUpdates.push({
                id: product.id,
                nextStock: Number(Math.max(0, remainingStock).toFixed(3)),
            });
        }

        const totalAmount = body.items.reduce((sum, item) => {
            const product = productMap.get(item.id);
            const unitPrice = toNumber(product?.price, toNumber(item.price));
            return sum + unitPrice * Math.max(1, Math.floor(toNumber(item.quantityMultiplier, 1)));
        }, 0);

        const orderInsertPayload = {
            shop_id: body.shopId,
            customer_auth_id: user.id,
            shop_customer_id: shopCustomerId,
            customer_email: user.email || body.customer.email,
            customer_name: body.customer.fullName,
            customer_address: body.customer.address,
            customer_city: body.customer.city,
            customer_postal: body.customer.postalCode,
            payment_method: body.paymentMethod,
            total_amount: totalAmount,
            status: 'processing',
        };

        let { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert([orderInsertPayload])
            .select('id')
            .single<{ id: string }>();

        if (orderError && /customer_auth_id|shop_customer_id/i.test(orderError.message)) {
            const fallbackInsert = await supabase
                .from('orders')
                .insert([
                    {
                        shop_id: body.shopId,
                        customer_email: user.email || body.customer.email,
                        customer_name: body.customer.fullName,
                        customer_address: body.customer.address,
                        customer_city: body.customer.city,
                        customer_postal: body.customer.postalCode,
                        payment_method: body.paymentMethod,
                        total_amount: totalAmount,
                        status: 'processing',
                    },
                ])
                .select('id')
                .single<{ id: string }>();
            orderData = fallbackInsert.data;
            orderError = fallbackInsert.error;
        }

        if (orderError || !orderData) {
            return NextResponse.json({ error: orderError?.message || 'Could not create order.' }, { status: 400 });
        }

        const orderItems = body.items.map((item) => {
            const product = productMap.get(item.id);
            const multiplier = Math.max(1, Math.floor(toNumber(item.quantityMultiplier, 1)));
            const orderedQuantity = toNumber(item.orderedQuantity, toNumber(product?.selling_unit_value, 1) * multiplier);
            const orderedUnit = normalizeSellingUnit((item.orderedUnit || product?.selling_unit) as string | undefined);
            const unitPrice = toNumber(product?.price, item.price);

            return {
                order_id: orderData.id,
                product_id: item.id,
                quantity: multiplier,
                unit_price: unitPrice,
                total_price: unitPrice * multiplier,
                ordered_quantity: orderedQuantity,
                ordered_unit: orderedUnit,
                selling_unit_value: toNumber(product?.selling_unit_value, 1),
                selling_unit: normalizeSellingUnit(product?.selling_unit as string | undefined),
            };
        });

        let { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError && /ordered_quantity|ordered_unit|selling_unit_value|selling_unit|total_price/i.test(itemsError.message)) {
            const fallbackItems = body.items.map((item) => ({
                order_id: orderData.id,
                product_id: item.id,
                quantity: Math.max(1, Math.floor(toNumber(item.quantityMultiplier, 1))),
                unit_price: toNumber(productMap.get(item.id)?.price, item.price),
            }));

            const fallbackInsert = await supabase.from('order_items').insert(fallbackItems);
            itemsError = fallbackInsert.error;
        }

        if (itemsError) {
            return NextResponse.json({ error: itemsError.message }, { status: 400 });
        }

        for (const stockUpdate of stockUpdates) {
            const { error: updateError } = await supabase
                .from('products')
                .update({ stock_quantity: stockUpdate.nextStock })
                .eq('id', stockUpdate.id)
                .eq('shop_id', body.shopId);

            if (updateError) {
                return NextResponse.json({ error: updateError.message }, { status: 400 });
            }
        }

        return NextResponse.json({ orderId: orderData.id });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected checkout error.';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
