import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle, Eye, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useConfirmPayment, useRejectPayment } from "@/hooks/useAdmin";

interface SuspiciousReservation {
  id: string;
  user_id: string;
  payment_proof_url: string | null;
  created_at: string;
  seats_count: number;
  payment_status: string;
  profile?: { name: string; phone: string };
  trip?: { origin: string; destination: string; trip_date: string };
  reason: string;
  riskLevel: "high" | "medium" | "low";
  duplicates?: number;
}

const AdminQReport = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const confirmPayment = useConfirmPayment();
  const rejectPayment = useRejectPayment();

  const { data: suspiciousReservations, isLoading } = useQuery({
    queryKey: ["admin", "q-report"],
    queryFn: async () => {
      // Get all reservations with payment proofs
      const { data: reservations, error } = await supabase
        .from("reservations")
        .select("*")
        .not("payment_proof_url", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get related data
      const userIds = [...new Set(reservations?.map((r) => r.user_id) || [])];
      const tripIds = [...new Set(reservations?.map((r) => r.trip_id) || [])];

      const [profilesRes, tripsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, name, phone")
          .in("id", userIds.length > 0 ? userIds : ["none"]),
        supabase
          .from("trips")
          .select("id, origin, destination, trip_date")
          .in("id", tripIds.length > 0 ? tripIds : ["none"]),
      ]);

      const profileMap = new Map(profilesRes.data?.map((p) => [p.id, p]) || []);
      const tripMap = new Map(tripsRes.data?.map((t) => [t.id, t]) || []);

      // Detect suspicious patterns
      const suspicious: SuspiciousReservation[] = [];

      // Pattern 1: Duplicate payment proofs
      const paymentProofCounts: Record<string, string[]> = {};
      reservations?.forEach((r) => {
        if (r.payment_proof_url) {
          if (!paymentProofCounts[r.payment_proof_url]) {
            paymentProofCounts[r.payment_proof_url] = [];
          }
          paymentProofCounts[r.payment_proof_url].push(r.id);
        }
      });

      // Pattern 2: Multiple bookings same user same trip
      const userTripCounts: Record<string, string[]> = {};
      reservations?.forEach((r) => {
        const key = `${r.user_id}-${r.trip_id}`;
        if (!userTripCounts[key]) {
          userTripCounts[key] = [];
        }
        userTripCounts[key].push(r.id);
      });

      // Pattern 3: Rapid successive bookings (within 5 minutes)
      const userBookings: Record<string, { id: string; time: Date }[]> = {};
      reservations?.forEach((r) => {
        if (!userBookings[r.user_id]) {
          userBookings[r.user_id] = [];
        }
        userBookings[r.user_id].push({
          id: r.id,
          time: new Date(r.created_at),
        });
      });

      reservations?.forEach((r) => {
        const reasons: string[] = [];
        let highestRisk: "high" | "medium" | "low" = "low";
        let duplicateCount = 0;

        // Check duplicate payment proof
        if (r.payment_proof_url && paymentProofCounts[r.payment_proof_url].length > 1) {
          reasons.push(`إيصال مكرر (${paymentProofCounts[r.payment_proof_url].length} مرات)`);
          highestRisk = "high";
          duplicateCount = paymentProofCounts[r.payment_proof_url].length;
        }

        // Check multiple bookings same trip
        const userTripKey = `${r.user_id}-${r.trip_id}`;
        if (userTripCounts[userTripKey].length > 1) {
          reasons.push(`حجوزات متعددة لنفس الرحلة (${userTripCounts[userTripKey].length})`);
          if (highestRisk !== "high") highestRisk = "medium";
        }

        // Check rapid bookings
        const userBooks = userBookings[r.user_id] || [];
        const currentTime = new Date(r.created_at).getTime();
        const rapidBookings = userBooks.filter((b) => {
          const timeDiff = Math.abs(currentTime - b.time.getTime());
          return timeDiff < 5 * 60 * 1000 && b.id !== r.id; // 5 minutes
        });
        if (rapidBookings.length > 0) {
          reasons.push(`حجوزات سريعة متتالية (${rapidBookings.length + 1} في 5 دقائق)`);
          if (highestRisk === "low") highestRisk = "medium";
        }

        // Only add if suspicious
        if (reasons.length > 0) {
          suspicious.push({
            ...r,
            profile: profileMap.get(r.user_id),
            trip: tripMap.get(r.trip_id),
            reason: reasons.join(" • "),
            riskLevel: highestRisk,
            duplicates: duplicateCount,
          });
        }
      });

      // Sort by risk level (high first)
      return suspicious.sort((a, b) => {
        const riskOrder = { high: 0, medium: 1, low: 2 };
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      });
    },
  });

  const handleViewProof = async (url: string) => {
    // Get signed URL for private bucket
    const path = url.split("payment-proofs/")[1];
    if (path) {
      const { data } = await supabase.storage
        .from("payment-proofs")
        .createSignedUrl(path, 3600);
      if (data?.signedUrl) {
        setSelectedImage(data.signedUrl);
      }
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "high":
        return <Badge variant="destructive">خطر عالي</Badge>;
      case "medium":
        return <Badge className="bg-accent text-accent-foreground">خطر متوسط</Badge>;
      default:
        return <Badge variant="secondary">خطر منخفض</Badge>;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          تقرير Q - الحجوزات المشبوهة ⚠️
        </h1>
        <p className="text-muted-foreground">
          كشف تلقائي للأنماط المشبوهة في الحجوزات
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card-soft p-4 border-l-4 border-destructive">
          <p className="text-sm text-muted-foreground">خطر عالي</p>
          <p className="text-2xl font-bold text-destructive">
            {suspiciousReservations?.filter((r) => r.riskLevel === "high").length || 0}
          </p>
        </div>
        <div className="card-soft p-4 border-l-4 border-accent">
          <p className="text-sm text-muted-foreground">خطر متوسط</p>
          <p className="text-2xl font-bold text-accent-foreground">
            {suspiciousReservations?.filter((r) => r.riskLevel === "medium").length || 0}
          </p>
        </div>
        <div className="card-soft p-4 border-l-4 border-primary">
          <p className="text-sm text-muted-foreground">إجمالي المشبوه</p>
          <p className="text-2xl font-bold text-primary">
            {suspiciousReservations?.length || 0}
          </p>
        </div>
      </div>

      {/* Suspicious List */}
      {suspiciousReservations && suspiciousReservations.length > 0 ? (
        <div className="space-y-4">
          {suspiciousReservations.map((reservation) => (
            <div
              key={reservation.id}
              className="card-soft p-5 border-r-4"
              style={{
                borderRightColor:
                  reservation.riskLevel === "high"
                    ? "hsl(var(--destructive))"
                    : reservation.riskLevel === "medium"
                    ? "hsl(var(--accent))"
                    : "hsl(var(--primary))",
              }}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    {getRiskBadge(reservation.riskLevel)}
                    <Badge variant="outline">{reservation.payment_status}</Badge>
                  </div>

                  <h3 className="font-bold text-foreground mb-1">
                    {reservation.profile?.name || "مستخدم"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    📞 {reservation.profile?.phone || "غير متوفر"}
                  </p>

                  <p className="text-sm text-foreground mb-2">
                    {reservation.trip?.origin} ← {reservation.trip?.destination}
                    <span className="text-muted-foreground mr-2">
                      ({reservation.trip?.trip_date})
                    </span>
                  </p>

                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <p className="text-sm text-destructive font-medium">
                      ⚠️ {reservation.reason}
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    تاريخ الحجز:{" "}
                    {format(new Date(reservation.created_at), "dd MMM yyyy HH:mm", {
                      locale: ar,
                    })}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {reservation.payment_proof_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewProof(reservation.payment_proof_url!)}
                    >
                      <Eye className="h-4 w-4 ml-1" />
                      عرض الإيصال
                    </Button>
                  )}

                  {reservation.payment_status === "pending" && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => confirmPayment.mutate(reservation.id)}
                        disabled={confirmPayment.isPending}
                      >
                        <CheckCircle className="h-4 w-4 ml-1" />
                        تأكيد
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => rejectPayment.mutate(reservation.id)}
                        disabled={rejectPayment.isPending}
                      >
                        <XCircle className="h-4 w-4 ml-1" />
                        رفض
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-soft p-12 text-center">
          <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">
            لا توجد حجوزات مشبوهة 🎉
          </h3>
          <p className="text-muted-foreground">
            كل الحجوزات تبدو طبيعية
          </p>
        </div>
      )}

      {/* Image Preview Dialog */}
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

export default AdminQReport;
