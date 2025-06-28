// src/app/dashboard/pos/page.tsx
"use client";

import PosProductGrid from "@/components/pos/PosProductGrid";
import PosInvoice from "@/components/pos/PosInvoice";
import { PosProvider } from "@/contexts/PosContext";

export default function PosPage() {
  return (
    // We wrap this page in its own provider to keep the POS state localized
    <PosProvider> 
      <div className="flex flex-col-reverse md:flex-row gap-6 h-[calc(100vh-8rem)]">
        {/* Main Product Grid */}
        <div className="flex-1 overflow-y-auto">
          <PosProductGrid />
        </div>
        
        {/* Sticky Invoice Sidebar */}
        <aside className="w-full md:w-96 lg:w-[420px] shrink-0">
          <div className="sticky top-0 h-full">
             <PosInvoice />
          </div>
        </aside>
      </div>
    </PosProvider>
  );
}
