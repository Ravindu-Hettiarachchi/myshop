'use client';

import { Download } from 'lucide-react';

export default function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
        >
            <Download className="w-4 h-4" /> Download / Print PDF
        </button>
    );
}
