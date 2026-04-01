import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/utils/supabase/server'
import { resolvePostLoginRedirect } from '@/lib/auth/redirects'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const preferredPath = searchParams.get('next')

    // The previous default 'next' logic is overridden. OAuth needs dynamic routing.
    let targetRoute = '/'

    if (code) {
        const supabase = await createClient()
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data?.user) {
            const { target } = await resolvePostLoginRedirect({
                supabase,
                userId: data.user.id,
                preferredPath,
            })

            targetRoute = target

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
