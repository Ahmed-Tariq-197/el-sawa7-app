import { Heart } from "lucide-react";
import Logo from "./Logo";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          
          <div className="flex flex-col items-center md:items-end gap-2">
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
      </div>
    </footer>
  );
};

export default Footer;
