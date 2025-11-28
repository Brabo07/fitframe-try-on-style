import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, Package, Truck, Home } from "lucide-react";
import { toast } from "sonner";
import { useAnalytics } from "@/hooks/useAnalytics";
import { formatNaira } from "@/utils/formatCurrency";
import { addDays, format } from "date-fns";

type CheckoutStep = "form" | "processing" | "success" | "delivery";

const Checkout = () => {
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("form");
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    address: "",
    city: "",
    zipCode: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  const deliveryDate = addDays(new Date(), 2);

  useEffect(() => {
    fetchCartData();
  }, []);

  const fetchCartData = async () => {
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
            image_url
          )
        `)
        .eq("user_id", user.id);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        navigate("/cart");
        return;
      }

      setCartItems(data);
    } catch (error) {
      console.error("Error fetching cart:", error);
      toast.error("Failed to load checkout data");
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + (item.product.price * item.quantity),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep("processing");

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: totalPrice * 1.1,
          status: "completed",
          shipping_address: `${formData.address}, ${formData.city}, ${formData.zipCode}`,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      const { error: clearError } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);

      if (clearError) throw clearError;

      // Track successful purchase
      trackEvent("purchase_completed", {
        order_id: order.id,
        total_amount: order.total_amount,
        items_count: cartItems.length,
      });

      // Show processing for 3 seconds
      setTimeout(() => {
        setCurrentStep("success");
        // After 1 second, move to delivery screen
        setTimeout(() => {
          setCurrentStep("delivery");
        }, 1500);
      }, 3000);

    } catch (error) {
      console.error("Error processing order:", error);
      toast.error("Failed to process order");
      setCurrentStep("form");
    }
  };

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

  // Processing Payment Screen
  if (currentStep === "processing") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12 px-4">
          <div className="max-w-md mx-auto text-center animate-fade-in">
            <div className="relative w-24 h-24 mx-auto mb-8">
              {/* Animated rings */}
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border-4 border-primary/40 animate-ping" style={{ animationDelay: "0.2s" }} />
              <div className="absolute inset-4 rounded-full border-4 border-primary/60 animate-ping" style={{ animationDelay: "0.4s" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-4 text-foreground">Processing Payment...</h1>
            <p className="text-muted-foreground">
              Please wait while we securely process your payment.
            </p>
            <div className="mt-8 h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-[progress_3s_ease-in-out]" style={{ 
                animation: "progress 3s ease-in-out forwards"
              }} />
            </div>
          </div>
        </main>
        <style>{`
          @keyframes progress {
            from { width: 0%; }
            to { width: 100%; }
          }
        `}</style>
      </div>
    );
  }

  // Payment Success Screen
  if (currentStep === "success") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12 px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="relative w-24 h-24 mx-auto mb-8 animate-scale-in">
              <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-green-500">
                <CheckCircle2 className="h-14 w-14 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-4 text-foreground animate-fade-in">
              Payment Successful 🎉
            </h1>
            <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Your order has been confirmed!
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Delivery ETA Screen
  if (currentStep === "delivery") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12 px-4">
          <div className="max-w-md mx-auto text-center">
            {/* Animated delivery truck */}
            <div className="relative h-32 mb-8 overflow-hidden">
              <div className="absolute inset-x-0 bottom-4 h-1 bg-primary/20 rounded-full" />
              <div className="animate-[truck_2s_ease-in-out_infinite] relative">
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <Truck className="h-16 w-16 text-primary animate-bounce" style={{ animationDuration: "2s" }} />
                    <Package className="absolute -top-2 -right-2 h-6 w-6 text-accent animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            <h1 className="text-3xl font-bold mb-2 text-foreground animate-fade-in">
              Order Confirmed!
            </h1>
            
            <p className="text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Your glasses will arrive in 2 days.
            </p>

            <Card className="mb-8 shadow-elegant animate-scale-in" style={{ animationDelay: "0.2s" }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground">Expected Arrival</p>
                    <p className="text-2xl font-bold text-foreground">
                      {format(deliveryDate, "EEEE, MMM d")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(deliveryDate, "yyyy")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery timeline */}
            <div className="flex justify-between items-center px-4 mb-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mb-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">Confirmed</span>
              </div>
              <div className="flex-1 h-1 bg-primary mx-2" />
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary/50 flex items-center justify-center mb-2 animate-pulse">
                  <Package className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">Shipped</span>
              </div>
              <div className="flex-1 h-1 bg-secondary mx-2" />
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center mb-2">
                  <Home className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">Delivered</span>
              </div>
            </div>

            <Button
              onClick={() => navigate("/")}
              size="lg"
              className="w-full animate-fade-in"
              style={{ animationDelay: "0.4s" }}
            >
              <Home className="mr-2 h-5 w-5" />
              Go Home
            </Button>
          </div>
        </main>
        <style>{`
          @keyframes truck {
            0%, 100% { transform: translateX(-10px); }
            50% { transform: translateX(10px); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 px-4 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 animate-fade-in">Checkout</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="animate-slide-up">
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
                  
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          required
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="zipCode">ZIP Code</Label>
                        <Input
                          id="zipCode"
                          required
                          value={formData.zipCode}
                          onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
                  
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        required
                        value={formData.cardNumber}
                        onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input
                          id="expiryDate"
                          placeholder="MM/YY"
                          required
                          value={formData.expiryDate}
                          onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          required
                          value={formData.cvv}
                          onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24 shadow-elegant animate-scale-in">
                <CardContent className="p-6 space-y-6">
                  <h2 className="text-xl font-bold">Order Summary</h2>
                  
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.product.name} x{item.quantity}
                        </span>
                        <span className="font-medium">
                          {formatNaira(item.product.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 pt-4 border-t">
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

                  <div className="flex justify-between items-center text-lg font-bold pt-4 border-t">
                    <span>Total</span>
                    <span>{formatNaira(totalPrice * 1.1)}</span>
                  </div>

                  <Button
                    type="submit" 
                    className="w-full" 
                    size="lg"
                  >
                    Place Order
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Checkout;
