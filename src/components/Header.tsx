import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, Car, Shield } from "lucide-react";
import Logo from "./Logo";
import { Button } from "./ui/button";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: "/", label: "الرئيسية" },
    { path: "/trips", label: "الرحلات" },
    { path: "/about", label: "عن المنصة" },
    { path: "/faq", label: "الأسئلة الشائعة" },
    { path: "/contact", label: "تواصل معنا" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <Logo size="sm" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-smooth hover:text-primary ${
                  isActive(item.path) ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">
                <User className="h-4 w-4 ml-2" />
                تسجيل الدخول
              </Link>
            </Button>
            <Button variant="accent" size="sm" asChild>
              <Link to="/register">إنشاء حساب</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-accent/20 rounded-lg transition-smooth"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            <nav className="flex flex-col gap-3">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-sm font-medium py-2 px-4 rounded-lg transition-smooth ${
                    isActive(item.path)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent/20"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border/50">
                <Button variant="ghost" className="justify-start" asChild>
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <User className="h-4 w-4 ml-2" />
                    تسجيل الدخول
                  </Link>
                </Button>
                <Button variant="accent" asChild>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                    إنشاء حساب
                  </Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
