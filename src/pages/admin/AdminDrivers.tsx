import { useState } from "react";
import {
  Check,
  X,
  Eye,
  Clock,
  Loader2,
  FileText,
  User,
} from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminDrivers, useApproveDriver } from "@/hooks/useAdmin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

const AdminDrivers = () => {
  const { data: drivers, isLoading } = useAdminDrivers();
  const approveDriver = useApproveDriver();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(dateStr));
  };

  const getSignedUrl = async (path: string) => {
    const { data } = await supabase.storage
      .from("driver-documents")
      .createSignedUrl(path, 300);
    return data?.signedUrl;
  };

  const handleViewLicense = async (path: string) => {
    const url = await getSignedUrl(path);
    if (url) setSelectedImage(url);
  };

  const pendingDrivers = drivers?.filter((d: any) => !d.is_approved) || [];
  const approvedDrivers = drivers?.filter((d: any) => d.is_approved) || [];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          إدارة السائقين 🚗
        </h1>
        <p className="text-muted-foreground">
          راجع وأكد طلبات السائقين الجدد
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pending Drivers */}
          {pendingDrivers.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent" />
                في انتظار الموافقة ({pendingDrivers.length})
              </h2>
              <div className="space-y-4">
                {pendingDrivers.map((driver: any) => (
                  <DriverCard
                    key={driver.id}
                    driver={driver}
                    formatDate={formatDate}
                    onViewLicense={handleViewLicense}
                    onApprove={() => approveDriver.mutate(driver.id)}
                    isApproving={approveDriver.isPending}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Approved Drivers */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              السائقين النشطين ({approvedDrivers.length})
            </h2>
            {approvedDrivers.length === 0 ? (
              <div className="card-soft p-8 text-center">
                <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">مفيش سائقين نشطين</p>
              </div>
            ) : (
              <div className="space-y-4">
                {approvedDrivers.map((driver: any) => (
                  <DriverCard
                    key={driver.id}
                    driver={driver}
                    formatDate={formatDate}
                    onViewLicense={handleViewLicense}
                    isApproved
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Image Viewer Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>رخصة القيادة</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Driver license"
              className="w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

interface DriverCardProps {
  driver: any;
  formatDate: (date: string) => string;
  onViewLicense: (path: string) => void;
  onApprove?: () => void;
  isApproving?: boolean;
  isApproved?: boolean;
}

function DriverCard({
  driver,
  formatDate,
  onViewLicense,
  onApprove,
  isApproving,
  isApproved,
}: DriverCardProps) {
  return (
    <div className="card-soft p-5 flex flex-col md:flex-row md:items-center gap-4">
      {/* Driver Info */}
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {driver.profile?.name || "غير معروف"}
            </h3>
            <p className="text-sm text-muted-foreground">
              📞 {driver.profile?.phone || "غير متوفر"}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          تاريخ التسجيل: {formatDate(driver.created_at)}
        </p>
        {isApproved && driver.approved_at && (
          <p className="text-xs text-primary">
            ✅ تم القبول: {formatDate(driver.approved_at)}
          </p>
        )}
      </div>

      {/* Stats */}
      {isApproved && (
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">
              {driver.total_trips}
            </p>
            <p className="text-xs text-muted-foreground">رحلة</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">
              {driver.rating ? driver.rating.toFixed(1) : "-"}
            </p>
            <p className="text-xs text-muted-foreground">التقييم</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {driver.license_image_url && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewLicense(driver.license_image_url)}
          >
            <FileText className="h-4 w-4 ml-1" />
            عرض الرخصة
          </Button>
        )}

        {!isApproved && onApprove && (
          <Button
            variant="default"
            size="sm"
            onClick={onApprove}
            disabled={isApproving || !driver.license_image_url}
          >
            {isApproving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4 ml-1" />
                قبول
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export default AdminDrivers;
