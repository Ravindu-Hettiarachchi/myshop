import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { productUpsertSchema } from '@/lib/products';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = productUpsertSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request payload.' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
        }

        // Must provide shop_id or fetch it
        const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).maybeSingle();
        if (!shop) {
            return NextResponse.json({ error: 'Shop not found.' }, { status: 404 });
        }

        const payload = {
            shop_id: shop.id,
            title: parsed.data.title,
            description: parsed.data.description,
            price: parsed.data.price,
            compare_at_price: parsed.data.compare_at_price,
            selling_unit_value: parsed.data.selling_unit_value,
            selling_unit: parsed.data.selling_unit,
            stock_quantity: parsed.data.has_variants 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ? parsed.data.variants.reduce((sum: number, v: any) => sum + Number(v.stock_quantity || 0), 0)
                : parsed.data.stock_quantity,
            stock_unit: parsed.data.stock_unit,
            low_stock_threshold: parsed.data.low_stock_threshold,
            image_urls: parsed.data.image_urls,
            has_variants: parsed.data.has_variants,
            variation_options: parsed.data.variation_options,
        };

        const productId = body.id; // if editing
        let finalProduct;

        if (productId) {
            // Check ownership
            const { data: existing } = await supabase.from('products').select('id').eq('id', productId).eq('shop_id', shop.id).maybeSingle();
            if (!existing) return NextResponse.json({ error: 'Product not found or unauthorized.' }, { status: 403 });

            const { data: updatedProduct, error: updateError } = await supabase
                .from('products')
                .update(payload)
                .eq('id', productId)
                .select()
                .single();
            if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
            finalProduct = updatedProduct;
        } else {
            const { data: insertedProduct, error: insertError } = await supabase
                .from('products')
                .insert([payload])
                .select()
                .single();
            if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
            finalProduct = insertedProduct;
        }

        // Handle variations
        if (parsed.data.has_variants && parsed.data.variants.length > 0) {
            // Simple approach: Delete existing and re-insert to handle schema changes or removals.
            if (productId) {
                await supabase.from('product_variants').delete().eq('product_id', finalProduct.id);
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const variantsToInsert = parsed.data.variants.map((v: any) => ({
                product_id: finalProduct.id,
                sku: v.sku || null,
                options: v.options,
                price_override: v.price_override,
                compare_at_price: v.compare_at_price,
                stock_quantity: v.stock_quantity,
                image_url: v.image_url || null
            }));

            const { error: variantsError } = await supabase.from('product_variants').insert(variantsToInsert);
            if (variantsError) {
                return NextResponse.json({ error: 'Product saved, but failed to save variations: ' + variantsError.message }, { status: 500 });
            }
        } else if (productId) {
            // Clean up variants if they disabled variants entirely
            await supabase.from('product_variants').delete().eq('product_id', finalProduct.id);
        }

        return NextResponse.json({ success: true, product: finalProduct }, { status: 200 });
    } catch {
        return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
    }
}
