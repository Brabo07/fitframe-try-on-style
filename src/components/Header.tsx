import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Glasses, Heart, User, LogOut, Menu, X, ShoppingCart, Settings, Camera } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useAdminCheck } from "@/hooks/useAdminCheck";

const Header = () => {
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const { data: isAdmin } = useAdminCheck();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchCartCount(session.user.id);
      else setCartCount(0);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchCartCount(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchCartCount = async (userId: string) => {
    const { data, error } = await supabase
      .from("cart_items")
      .select("quantity")
      .eq("user_id", userId);

    if (!error && data) {
      const total = data.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(total);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Glasses className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">FitFrame</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/browse" className="text-sm font-medium hover:text-primary transition-colors">
            Browse
          </Link>
          <Link to="/try-on" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
            <Camera className="h-4 w-4" />
            Try-On
          </Link>
          <Link to="/catalog" className="text-sm font-medium hover:text-primary transition-colors">
            Catalog
          </Link>
          {user ? (
            <>
              <Link to="/favorites" className="text-sm font-medium hover:text-primary transition-colors">
                <Heart className="h-5 w-5" />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/cart")}
                className="relative hover:scale-105 transition-transform"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    variant="default"
                  >
                    {cartCount}
                  </Badge>
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background p-4 space-y-3">
          <Link
            to="/browse"
            className="block py-2 text-sm font-medium hover:text-primary transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Browse
          </Link>
          <Link
            to="/try-on"
            className="block py-2 text-sm font-medium hover:text-primary transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Virtual Try-On
          </Link>
          <Link
            to="/catalog"
            className="block py-2 text-sm font-medium hover:text-primary transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Catalog
          </Link>
          {user ? (
            <>
              <Link
                to="/favorites"
                className="block py-2 text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Favorites
              </Link>
              <Link
                to="/cart"
                className="block py-2 text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cart {cartCount > 0 && `(${cartCount})`}
              </Link>
              <Link
                to="/profile"
                className="block py-2 text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="block py-2 text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={() => {
                  handleSignOut();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-sm font-medium hover:text-primary transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Button asChild className="w-full" onClick={() => setMobileMenuOpen(false)}>
              <Link to="/auth">Get Started</Link>
            </Button>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
