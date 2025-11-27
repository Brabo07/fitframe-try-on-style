import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Glasses, Heart, User, LogOut, Menu, X, ShoppingCart, Settings, Camera, Sparkles } from "lucide-react";
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
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-primary shadow-elegant">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <Glasses className="h-6 w-6 text-accent transition-transform group-hover:scale-110" />
          <span className="text-xl font-bold text-primary-foreground">FitFrame</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/browse" className="text-sm font-medium text-primary-foreground/80 hover:text-accent transition-colors">
            Browse
          </Link>
          <Link to="/try-on" className="text-sm font-medium text-primary-foreground/80 hover:text-accent transition-colors flex items-center gap-1">
            <Camera className="h-4 w-4" />
            Try-On
          </Link>
          <Link to="/face-analysis" className="text-sm font-medium text-primary-foreground/80 hover:text-accent transition-colors flex items-center gap-1">
            <Sparkles className="h-4 w-4" />
            Face Analysis
          </Link>
          <Link to="/catalog" className="text-sm font-medium text-primary-foreground/80 hover:text-accent transition-colors">
            Catalog
          </Link>
          {user ? (
            <>
              <Link to="/favorites" className="text-primary-foreground/80 hover:text-accent transition-colors">
                <Heart className="h-5 w-5" />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/cart")}
                className="relative text-primary-foreground/80 hover:text-accent hover:bg-primary-foreground/10 transition-all"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-accent text-accent-foreground"
                    variant="default"
                  >
                    {cartCount}
                  </Badge>
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-primary-foreground/80 hover:text-accent hover:bg-primary-foreground/10">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border/50 shadow-elegant">
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
            <Button asChild variant="premium" className="rounded-xl">
              <Link to="/auth">Get Started</Link>
            </Button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-primary-foreground hover:bg-primary-foreground/10"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-primary-foreground/10 bg-primary p-4 space-y-3 animate-fade-in">
          <Link
            to="/browse"
            className="block py-2 text-sm font-medium text-primary-foreground/80 hover:text-accent transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Browse
          </Link>
          <Link
            to="/try-on"
            className="block py-2 text-sm font-medium text-primary-foreground/80 hover:text-accent transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Virtual Try-On
          </Link>
          <Link
            to="/face-analysis"
            className="block py-2 text-sm font-medium text-primary-foreground/80 hover:text-accent transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Face Analysis
          </Link>
          <Link
            to="/catalog"
            className="block py-2 text-sm font-medium text-primary-foreground/80 hover:text-accent transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Catalog
          </Link>
          {user ? (
            <>
              <Link
                to="/favorites"
                className="block py-2 text-sm font-medium text-primary-foreground/80 hover:text-accent transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Favorites
              </Link>
              <Link
                to="/cart"
                className="block py-2 text-sm font-medium text-primary-foreground/80 hover:text-accent transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cart {cartCount > 0 && `(${cartCount})`}
              </Link>
              <Link
                to="/profile"
                className="block py-2 text-sm font-medium text-primary-foreground/80 hover:text-accent transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="block py-2 text-sm font-medium text-primary-foreground/80 hover:text-accent transition-colors"
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
                className="block w-full text-left py-2 text-sm font-medium text-primary-foreground/80 hover:text-accent transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Button asChild variant="premium" className="w-full rounded-xl" onClick={() => setMobileMenuOpen(false)}>
              <Link to="/auth">Get Started</Link>
            </Button>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
