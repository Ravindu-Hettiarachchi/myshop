import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    // The previous default 'next' logic is overridden. OAuth needs dynamic routing.
    let targetRoute = '/dashboard'

    if (code) {
        const supabase = await createClient()
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data?.user) {

            // Replicate the login decision tree internally
            const { data: ownerData } = await supabase
                .from('owners')
                .select('role')
                .eq('id', data.user.id)
                .single()

            const role = ownerData?.role || 'shop_owner'

            if (role === 'admin') {
                // Verify if the user already has a shop or needs onboarding
                const { data: shops } = await supabase
                    .from('shops')
                    .select('id')
                    .eq('owner_id', data.user.id) // Changed from user.id to data.user.id for consistency
                    .limit(1);

                if (!shops || shops.length === 0) {
                    targetRoute = '/setup'
                } else {
                    targetRoute = '/dashboard'
                }
            } else {
                const { data: shops } = await supabase
                    .from('shops')
                    .select('id')
                    .eq('owner_id', data.user.id)
                    .limit(1)

                if (!shops || shops.length === 0) {
                    targetRoute = '/setup'
                } else {
                    targetRoute = '/dashboard'
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
