// src/app/dashboard/pos/page.tsx
"use client";

import PosProductGrid from "@/components/pos/PosProductGrid";
import PosInvoice from "@/components/pos/PosInvoice";

export default function PosPage() {
  return (
      // For mobile: flex-col, grid takes remaining space, invoice has a max height.
      // For desktop: flex-row, side-by-side. The whole container is fixed height.
      <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-8rem)]">
        {/* Main Product Grid */}
        <div className="flex-1 overflow-y-auto">
          <PosProductGrid />
        </div>
        
        {/* Invoice Sidebar */}
        <aside className="w-full md:w-96 lg:w-[420px] shrink-0 flex flex-col md:h-full max-h-[60vh] md:max-h-full">
             <PosInvoice />
        </aside>
      </div>
  );
}
