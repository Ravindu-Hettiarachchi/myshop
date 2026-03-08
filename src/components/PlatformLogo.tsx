import React from 'react';

interface PlatformLogoProps {
    /** 
     * 'full' uses logo-ver.png (with text)
     * 'icon' uses logo.png (icon only)
     */
    variant?: 'full' | 'icon';
    /**
     * Override class. If provided, replaces the default size completely.
     * Example: className="h-8 w-auto" to set a specific height.
     * If omitted, uses the defaults below.
     */
    className?: string;
}

export default function PlatformLogo({ variant = 'full', className }: PlatformLogoProps) {

    // --- 🛠️ ADJUST GLOBAL LOGO SIZES HERE 🛠️ ---
    const defaultFullClass = 'h-10 w-auto object-contain';
    const defaultIconClass = 'h-8 w-auto object-contain';

    const src = variant === 'full' ? '/logo-ver.png' : '/logo.png';

    // When caller passes className, use it exclusively so no h-XX conflict occurs.
    const finalClass = className
        ? `w-auto object-contain ${className}`  // ensure aspect-ratio is always preserved
        : (variant === 'full' ? defaultFullClass : defaultIconClass);

    return (
        <img src={src} alt="MyShop Platform" className={finalClass} />
    );
}
