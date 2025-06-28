// src/components/pos/PosInvoice.tsx
"use client";

import { usePos } from '@/contexts/PosContext';
import { useSales } from '@/contexts/SalesContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, MinusCircle, XCircle, HandCoins, CreditCard, ShoppingCart } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PosInvoice() {
  const { cartItems, updateItemQuantity, removeItemFromCart, clearCart, cartTotal } = usePos();
  const { addSale, currentDiscount, setCurrentDiscount } = useSales();
  const { settings } = useAppSettings();

  const handleFinalizeSale = async (paymentMethod: string) => {
    if (cartItems.length === 0) return;
    const saleResult = await addSale(cartItems, paymentMethod);
    if (saleResult) {
      clearCart();
    }
  };
  
  const finalTotal = Math.max(0, cartTotal - currentDiscount);

  return (
    <Card className="flex flex-col h-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart />
          الفاتورة الحالية
        </CardTitle>
        <CardDescription>
          أضف المنتجات من القائمة لبدء عملية البيع.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1">
          <div className="p-6 pt-0">
            {cartItems.length > 0 ? (
              <div className="space-y-4">
                {cartItems.map(item => (
                  <div key={item.productId} className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-sm truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">{item.pricePerUnit} LYD</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}>
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                      <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}>
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItemFromCart(item.productId)}>
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-10">
                <p>سلة المبيعات فارغة.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 p-4 border-t">
        <div className="w-full space-y-2">
          <div className="flex justify-between text-sm">
            <span>الإجمالي الفرعي</span>
            <span>{cartTotal.toFixed(2)} LYD</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span>الخصم</span>
            <Input 
              type="number"
              className="h-8 w-24 text-left" 
              placeholder="0.00"
              value={currentDiscount === 0 ? '' : String(currentDiscount)}
              onChange={(e) => setCurrentDiscount(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
        
        <Separator />
        
        <div className="w-full flex justify-between font-bold text-xl text-primary">
          <span>الإجمالي النهائي</span>
          <span>{finalTotal.toFixed(2)} LYD</span>
        </div>
        
        <div className="w-full grid grid-cols-2 gap-2">
          <Button size="lg" className="h-12" onClick={() => handleFinalizeSale('نقدي')} disabled={cartItems.length === 0}>
            <HandCoins className="ml-2 h-5 w-5" /> نقدي
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="lg" variant="secondary" className="h-12" disabled={cartItems.length === 0 || !settings.bankServices || settings.bankServices.length === 0}>
                <CreditCard className="ml-2 h-5 w-5" /> خدمات مصرفية
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {(settings.bankServices || []).filter(s => s.name.toLowerCase() !== 'نقدي').map(service => (
                <DropdownMenuItem key={service.name} onSelect={() => handleFinalizeSale(service.name)}>
                  {service.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardFooter>
    </Card>
  );
}
