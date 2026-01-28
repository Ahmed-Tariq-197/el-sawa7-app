import { Link } from "react-router-dom";
import { Clock, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const DriverPending = () => {
  const { profile, driverProfile, signOut } = useAuth();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="card-soft p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
            <Clock className="h-10 w-10 text-accent" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            أهلاً {profile?.name} 👋
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            حسابك كسائق في انتظار موافقة الإدارة
          </p>

          {/* Status Steps */}
          <div className="space-y-4 text-right mb-8">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/5">
              <CheckCircle2 className="h-6 w-6 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">تم إنشاء الحساب</p>
                <p className="text-sm text-muted-foreground">
                  تم تسجيل بياناتك بنجاح
                </p>
              </div>
            </div>

            <div
              className={`flex items-start gap-4 p-4 rounded-lg ${
                driverProfile?.license_image_url
                  ? "bg-primary/5"
                  : "bg-accent/10 border border-accent/30"
              }`}
            >
              {driverProfile?.license_image_url ? (
                <CheckCircle2 className="h-6 w-6 text-primary mt-0.5" />
              ) : (
                <AlertCircle className="h-6 w-6 text-accent mt-0.5" />
              )}
              <div>
                <p className="font-medium text-foreground">رفع رخصة القيادة</p>
                <p className="text-sm text-muted-foreground">
                  {driverProfile?.license_image_url
                    ? "تم رفع الرخصة"
                    : "لازم ترفع صورة رخصة القيادة"}
                </p>
                {!driverProfile?.license_image_url && (
                  <Button variant="accent" size="sm" className="mt-2" asChild>
                    <Link to="/driver/upload-license">رفع الرخصة</Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
              <Clock className="h-6 w-6 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-foreground">
                  في انتظار موافقة الإدارة
                </p>
                <p className="text-sm text-muted-foreground">
                  الإدارة بتراجع بياناتك وهتوصلك رسالة لما يتم القبول
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <p className="text-sm text-muted-foreground mb-4">
              لو عندك أي استفسار تواصل معانا
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" asChild>
                <Link to="/contact">تواصل معنا</Link>
              </Button>
              <Button variant="ghost" onClick={signOut}>
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DriverPending;
