import { useState } from "react";
import {
  Check,
  X,
  Eye,
  Clock,
  Loader2,
  Image,
  CreditCard,
} from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useAdminReservations,
  useConfirmPayment,
  useRejectPayment,
} from "@/hooks/useAdmin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";

const AdminReservations = () => {
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get("status") || undefined;
  
  const { data: reservations, isLoading } = useAdminReservations(statusFilter);
  const confirmPayment = useConfirmPayment();
  const rejectPayment = useRejectPayment();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("ar-EG", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "في الانتظار", variant: "secondary" as const },
      confirmed: { label: "مؤكد", variant: "default" as const },
      rejected: { label: "مرفوض", variant: "destructive" as const },
    };
    const s = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const getSignedUrl = async (path: string) => {
    const { data } = await supabase.storage
      .from("payment-proofs")
      .createSignedUrl(path, 300);
    return data?.signedUrl;
  };

  const handleViewImage = async (path: string) => {
    const url = await getSignedUrl(path);
    if (url) setSelectedImage(url);
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          إدارة الحجوزات 🎫
        </h1>
        <p className="text-muted-foreground">
          راجع وأكد حجوزات الركاب
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={!statusFilter ? "default" : "outline"}
          size="sm"
          onClick={() => window.history.pushState({}, "", "/admin/reservations")}
        >
          الكل
        </Button>
        <Button
          variant={statusFilter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            window.history.pushState({}, "", "/admin/reservations?status=pending")
          }
        >
          <Clock className="h-4 w-4 ml-1" />
          في الانتظار
        </Button>
        <Button
          variant={statusFilter === "confirmed" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            window.history.pushState({}, "", "/admin/reservations?status=confirmed")
          }
        >
          <Check className="h-4 w-4 ml-1" />
          مؤكد
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !reservations || reservations.length === 0 ? (
        <div className="card-soft p-12 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">مفيش حجوزات</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((reservation: any) => (
            <div
              key={reservation.id}
              className="card-soft p-5 flex flex-col md:flex-row md:items-center gap-4"
            >
              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-foreground">
                    {reservation.profile?.name || "غير معروف"}
                  </h3>
                  {getStatusBadge(reservation.payment_status)}
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  📞 {reservation.profile?.phone || "غير متوفر"}
                </p>
                <p className="text-sm text-muted-foreground">
                  🚌 {reservation.trip?.cars?.name} | {reservation.trip?.origin} →{" "}
                  {reservation.trip?.destination}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(reservation.created_at)}
                </p>
              </div>

              {/* Payment Info */}
              <div className="flex flex-col items-start md:items-end gap-2">
                <p className="text-lg font-bold text-primary">
                  {reservation.seats_count} مقعد
                </p>

                {reservation.payment_transaction_id && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    TX: {reservation.payment_transaction_id}
                  </p>
                )}

                {reservation.payment_proof_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewImage(reservation.payment_proof_url)}
                  >
                    <Image className="h-4 w-4 ml-1" />
                    عرض الإيصال
                  </Button>
                )}
              </div>

              {/* Actions */}
              {reservation.payment_status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => confirmPayment.mutate(reservation.id)}
                    disabled={confirmPayment.isPending}
                  >
                    {confirmPayment.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 ml-1" />
                        تأكيد
                      </>
                    )}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <X className="h-4 w-4 ml-1" />
                        رفض
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>رفض الحجز؟</AlertDialogTitle>
                        <AlertDialogDescription>
                          هل أنت متأكد من رفض هذا الحجز؟ سيتم إلغاء الحجز نهائياً.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => rejectPayment.mutate(reservation.id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          رفض
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image Viewer Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إيصال الدفع</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Payment proof"
              className="w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminReservations;
