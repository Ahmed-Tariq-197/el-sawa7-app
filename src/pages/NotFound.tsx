import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

const NotFound = () => {
  return (
    <Layout showFooter={false}>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-8xl font-bold text-primary/20 mb-4">٤٠٤</div>
          <h1 className="text-3xl font-bold text-foreground mb-4">
            الصفحة مش موجودة
          </h1>
          <p className="text-muted-foreground mb-8">
            يبدو إنك تاهت! الصفحة اللي بتدور عليها مش موجودة أو اتنقلت.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" asChild>
              <Link to="/">
                <Home className="h-4 w-4 ml-2" />
                الصفحة الرئيسية
              </Link>
            </Button>
            <Button variant="hero-outline" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 ml-2" />
              رجوع
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
