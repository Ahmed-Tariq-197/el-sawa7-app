import { forwardRef } from "react";
import { Heart, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "./Logo";

const Footer = forwardRef<HTMLElement, object>((_, ref) => {
  return (
    <footer ref={ref} className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo & Description */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground text-center md:text-right">
              منصة آمنة وموثوقة لحجز مواصلات طلاب الجامعات
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <h4 className="font-semibold text-foreground">روابط سريعة</h4>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <Link to="/trips" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                الرحلات
              </Link>
              <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                عن المنصة
              </Link>
              <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                تواصل معنا
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <h4 className="font-semibold text-foreground">تواصل معنا</h4>
            <div className="flex flex-col gap-2">
              <a 
                href="tel:+201015556416" 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Phone className="h-4 w-4" />
                01015556416
              </a>
              <a 
                href="mailto:support@el-sawa7.lovable.app" 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-4 w-4" />
                support@el-sawa7.lovable.app
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            صنع بـ
            <Heart className="h-4 w-4 text-destructive fill-destructive" />
            بواسطة: Eng/ Ahmed Tariq
          </p>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ElSawa7. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;
