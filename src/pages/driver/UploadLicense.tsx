import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Upload, FileText, Check, ArrowRight, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const UploadLicense = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "الملف كبير جداً",
        description: "أقصى حجم للملف ١٠ ميجا",
        variant: "destructive",
      });
      return;
    }

    setLicenseFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !licenseFile) {
      toast({
        title: "خطأ",
        description: "لازم ترفع صورة الرخصة",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload to driver-documents bucket
      const fileExt = licenseFile.name.split(".").pop();
      const filePath = `${user.id}/license-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("driver-documents")
        .upload(filePath, licenseFile);

      if (uploadError) throw uploadError;

      // Update driver profile
      const { error: updateError } = await supabase
        .from("driver_profiles")
        .update({ license_image_url: filePath })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      await refreshProfile();

      toast({
        title: "تم رفع الرخصة بنجاح! 🎉",
        description: "هيتم مراجعتها من الإدارة",
      });

      navigate("/driver/pending");
    } catch (error: any) {
      toast({
        title: "فشل رفع الملف",
        description: error.message || "حصل خطأ. حاول تاني.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-xl">
        <Link
          to="/driver/pending"
          className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 transition-smooth"
        >
          <ArrowRight className="h-4 w-4 ml-1" />
          العودة
        </Link>

        <div className="card-soft p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              رفع رخصة القيادة
            </h1>
            <p className="text-muted-foreground">
              ارفع صورة واضحة من رخصة القيادة الخاصة بك
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="license-file"
                className={`
                  flex flex-col items-center justify-center w-full h-48 
                  border-2 border-dashed rounded-xl cursor-pointer
                  transition-smooth
                  ${
                    licenseFile
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }
                `}
              >
                {licenseFile ? (
                  <div className="flex flex-col items-center text-primary">
                    <Check className="h-12 w-12 mb-2" />
                    <span className="font-medium">{licenseFile.name}</span>
                    <span className="text-sm text-muted-foreground mt-1">
                      اضغط لتغيير الملف
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground">
                    <Upload className="h-12 w-12 mb-3" />
                    <span className="font-medium text-foreground">
                      اضغط لرفع صورة الرخصة
                    </span>
                    <span className="text-sm mt-1">
                      PNG, JPG, PDF (أقصى ١٠ ميجا)
                    </span>
                  </div>
                )}
                <input
                  id="license-file"
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-2">
                ⚠️ ملاحظات مهمة
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>الصورة لازم تكون واضحة ومقروءة</li>
                <li>الرخصة لازم تكون سارية</li>
                <li>بياناتك هتكون سرية ومحفوظة</li>
              </ul>
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={!licenseFile || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin ml-2" />
                  جاري الرفع...
                </>
              ) : (
                "رفع الرخصة"
              )}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default UploadLicense;
