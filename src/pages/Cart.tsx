import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { formatNaira } from "@/utils/formatCurrency";

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    brand: string;
    price: number;
    image_url: string | null;
    frame_color: string;
  };
}

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);

      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          id,
          quantity,
          product:glasses_products (
            id,
            name,
            brand,
            price,
            image_url,
            frame_color
          )
        `)
        .eq("user_id", user.id);

      if (error) throw error;
      setCartItems(data as any || []);
    } catch (error) {
      console.error("Error fetching cart:", error);
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: newQuantity })
        .eq("id", itemId);

      if (error) throw error;

      setCartItems(cartItems.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
      toast.success("Cart updated");
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update quantity");
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setCartItems(cartItems.filter(item => item.id !== itemId));
      toast.success("Item removed from cart");
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
    }
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + (item.product.price * item.quantity),
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12 px-4">
          <div className="max-w-2xl mx-auto text-center animate-fade-in">
            <ShoppingBag className="h-20 w-20 mx-auto mb-6 text-muted-foreground" />
            <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">
              Discover our collection of premium eyewear
            </p>
            <Button onClick={() => navigate("/browse")} size="lg">
              Browse Products
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 px-4 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 animate-fade-in">Shopping Cart</h1>
        
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item, index) => (
              <Card 
                key={item.id} 
                className="overflow-hidden hover:shadow-hover transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <img
                      src={item.product.image_url || "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=200&h=200&fit=crop"}
                      alt={item.product.name}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{item.product.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.product.brand}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Color: {item.product.frame_color}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex justify-between items-end mt-4">
                        <div className="flex items-center gap-3 border rounded-lg p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xl font-bold">
                          {formatNaira(item.product.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-elegant animate-scale-in">
              <CardContent className="p-6 space-y-6">
                <h2 className="text-xl font-bold">Order Summary</h2>
                
                <div className="space-y-3 pb-4 border-b">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatNaira(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">Free</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">{formatNaira(totalPrice * 0.1)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span>{formatNaira(totalPrice * 1.1)}</span>
                </div>

                <Button
                  className="w-full" 
                  size="lg"
                  onClick={() => navigate("/checkout")}
                >
                  Proceed to Checkout
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/browse")}
                >
                  Continue Shopping
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Cart;
