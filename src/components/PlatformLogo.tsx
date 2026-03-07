import React from 'react';

interface PlatformLogoProps {
    /** 
     * 'full' uses logo-ver.png (larger, with text)
     * 'icon' uses logo.png (smaller, just the icon)
     */
    variant?: 'full' | 'icon';
    /**
     * Additional Tailwind classes (e.g. for grayscale or margins)
     */
    className?: string;
}

export default function PlatformLogo({ variant = 'full', className }: PlatformLogoProps) {

    // --- 🛠️ ADJUST GLOBAL LOGO SIZES HERE 🛠️ ---
    // Change the "h-XX" values below to adjust the logo size everywhere at once!
    const defaultFullSize = "h-32 w-auto"; // Used on Landing page, Login, Signup (Increased from h-24 to h-32)
    const defaultIconSize = "h-14 w-auto"; // Used on Dashboard & Admin sidebars (Increased from h-10 to h-14)

    const src = variant === 'full' ? '/logo-ver.png' : '/logo.png';
    const baseClass = variant === 'full' ? defaultFullSize : defaultIconSize;

    const finalClassName = className ? `${baseClass} ${className}` : baseClass;

    return (
        <img src={src} alt="MyShop Platform" className={finalClassName} />
    );
}
