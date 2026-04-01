import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    // The previous default 'next' logic is overridden. OAuth needs dynamic routing.
    let targetRoute = '/'

    if (code) {
        const supabase = await createClient()
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data?.user) {

            // Replicate the login decision tree internally
            const { data: ownerData } = await supabase
                .from('owners')
                .select('role')
                .eq('id', data.user.id)
                .maybeSingle()

            const role = ownerData?.role || 'customer'

            if (role === 'admin') {
                targetRoute = '/admin'
            } else if (role === 'shop_owner') {
                const { data: shop } = await supabase
                    .from('shops')
                    .select('route_path')
                    .eq('owner_id', data.user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()

                if (!shop?.route_path) {
                    targetRoute = '/setup'
                } else {
                    targetRoute = `/dashboard/${shop.route_path}`
                }
            }

            const forwardedHost = request.headers.get('x-forwarded-host')
            const isLocalEnv = process.env.NODE_ENV === 'development'

            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${targetRoute}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${targetRoute}`)
            } else {
                return NextResponse.redirect(`${origin}${targetRoute}`)
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth-failure`)
}
