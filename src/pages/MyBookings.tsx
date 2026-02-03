import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bus,
  MapPin,
  Clock,
  Calendar,
  Ticket,
  Check,
  X,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Star,
  Navigation,
} from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMyReservations, useCancelReservation, Reservation } from "@/hooks/useTrips";
import { useAuth } from "@/hooks/useAuth";
import { useHasRatedReservation } from "@/hooks/useDriverRating";
import { DriverRatingModal } from "@/components/DriverRatingModal";
import { PassengerTrackingMap } from "@/components/PassengerTrackingMap";
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

const MyBookings = () => {
  const { user } = useAuth();
  const { data: reservations, isLoading } = useMyReservations();
  const cancelReservation = useCancelReservation();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("ar-EG", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const period = hour >= 12 ? "م" : "ص";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };

  const getStatusBadge = (reservation: Reservation) => {
    const statusMap = {
      pending: { label: "في الانتظار", variant: "secondary" as const, icon: Clock },
      confirmed: { label: "مؤكد", variant: "default" as const, icon: Check },
      completed: { label: "مكتمل", variant: "outline" as const, icon: Check },
      cancelled: { label: "ملغي", variant: "destructive" as const, icon: X },
    };

    const status = statusMap[reservation.status as keyof typeof statusMap] || statusMap.pending;
    const StatusIcon = status.icon;

    return (
      <Badge variant={status.variant} className="gap-1">
        <StatusIcon className="h-3 w-3" />
        {status.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const statusMap = {
      pending: { label: "في انتظار التأكيد", color: "bg-accent/20 text-accent-foreground" },
      confirmed: { label: "تم التأكيد", color: "bg-primary/20 text-primary" },
      rejected: { label: "مرفوض", color: "bg-destructive/20 text-destructive" },
    };

    const status = statusMap[paymentStatus as keyof typeof statusMap] || statusMap.pending;

    return (
      <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
        {status.label}
      </span>
    );
  };

  const activeReservations = reservations?.filter(
    (r) => r.status === "pending" || r.status === "confirmed"
  );
  const pastReservations = reservations?.filter(
    (r) => r.status === "completed" || r.status === "cancelled"
  );

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <Ticket className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            سجّل دخولك أولاً
          </h2>
          <p className="text-muted-foreground mb-6">
            لازم تسجل دخولك عشان تشوف حجوزاتك
          </p>
          <Button variant="hero" asChild>
            <Link to="/login">تسجيل الدخول</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            حجوزاتي 🎫
          </h1>
          <p className="text-muted-foreground">
            تابع حجوزاتك الحالية والسابقة
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">جاري تحميل الحجوزات...</p>
          </div>
        ) : !reservations || reservations.length === 0 ? (
          <div className="card-soft p-12 text-center">
            <Ticket className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              مفيش حجوزات لسه
            </h3>
            <p className="text-muted-foreground mb-6">
              ابدأ احجز رحلتك الأولى دلوقتي!
            </p>
            <Button variant="hero" asChild>
              <Link to="/trips">
                استعرض الرحلات
                <ArrowLeft className="h-4 w-4 mr-2" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Reservations */}
            {activeReservations && activeReservations.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  الحجوزات الحالية
                </h2>
                <div className="space-y-4">
                  {activeReservations.map((reservation) => (
                    <ReservationCard
                      key={reservation.id}
                      reservation={reservation}
                      formatDate={formatDate}
                      formatTime={formatTime}
                      getStatusBadge={getStatusBadge}
                      getPaymentStatusBadge={getPaymentStatusBadge}
                      onCancel={() => cancelReservation.mutate(reservation.id)}
                      isCancelling={cancelReservation.isPending}
                      userId={user?.id}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Past Reservations */}
            {pastReservations && pastReservations.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Check className="h-5 w-5 text-muted-foreground" />
                  الحجوزات السابقة
                </h2>
                <div className="space-y-4">
                  {pastReservations.map((reservation) => (
                    <ReservationCard
                      key={reservation.id}
                      reservation={reservation}
                      formatDate={formatDate}
                      formatTime={formatTime}
                      getStatusBadge={getStatusBadge}
                      getPaymentStatusBadge={getPaymentStatusBadge}
                      isPast
                      userId={user?.id}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

interface ReservationCardProps {
  reservation: Reservation;
  formatDate: (date: string) => string;
  formatTime: (time: string) => string;
  getStatusBadge: (reservation: Reservation) => JSX.Element;
  getPaymentStatusBadge: (status: string) => JSX.Element;
  onCancel?: () => void;
  isCancelling?: boolean;
  isPast?: boolean;
  userId?: string;
}

function ReservationCard({
  reservation,
  formatDate,
  formatTime,
  getStatusBadge,
  getPaymentStatusBadge,
  onCancel,
  isCancelling,
  isPast,
  userId,
}: ReservationCardProps) {
  const trip = reservation.trips;
  const [showRatingModal, setShowRatingModal] = useState(false);
  const { data: hasRated } = useHasRatedReservation(reservation.id);
  
  const canRate = reservation.status === "completed" && trip?.driver_id && !hasRated;

  return (
    <div
      className={`card-soft overflow-hidden ${
        isPast ? "opacity-70" : ""
      }`}
    >
      <div className="flex flex-col md:flex-row">
        {/* Left side - Trip Info */}
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {trip?.cars?.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  رقم الطابور: #{reservation.queue_position}
                </p>
              </div>
            </div>
            {getStatusBadge(reservation)}
          </div>

          {/* Route */}
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-medium">{trip?.origin}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-medium">{trip?.destination}</span>
          </div>

          {/* Date & Time */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {trip?.trip_date && formatDate(trip.trip_date)}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {trip?.departure_time && formatTime(trip.departure_time)}
            </div>
            <div className="flex items-center gap-1">
              <Ticket className="h-4 w-4" />
              {reservation.seats_count} مقعد
            </div>
          </div>
        </div>

        {/* Right side - Payment & Actions */}
        <div className="border-t md:border-t-0 md:border-r border-border p-5 md:w-48 flex flex-col justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">الدفع</p>
            {getPaymentStatusBadge(reservation.payment_status)}
          </div>

          <div className="mt-4">
            <p className="text-2xl font-bold text-primary">
              {trip?.price ? trip.price * reservation.seats_count : 0} ج.م
            </p>
          </div>

          {/* Driver Tracking for Confirmed Reservations */}
          {reservation.status === "confirmed" && trip && (
            <div className="mt-4 w-full">
              <PassengerTrackingMap tripId={trip.id} />
            </div>
          )}

          {/* Rating Button for Completed Trips */}
          {canRate && userId && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 text-accent border-accent hover:bg-accent/10"
                onClick={() => setShowRatingModal(true)}
              >
                <Star className="h-4 w-4 ml-1" />
                قيّم السائق
              </Button>
              <DriverRatingModal
                isOpen={showRatingModal}
                onClose={() => setShowRatingModal(false)}
                reservationId={reservation.id}
                driverId={trip.driver_id!}
                passengerId={userId}
              />
            </>
          )}

          {hasRated && (
            <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              <Star className="h-3 w-3 fill-accent text-accent" />
              تم التقييم
            </p>
          )}

          {!isPast && reservation.status === "pending" && onCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="h-4 w-4 ml-1" />
                  إلغاء الحجز
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>إلغاء الحجز؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    هل أنت متأكد من إلغاء الحجز؟ لن تتمكن من التراجع عن هذا الإجراء.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>لا، ارجع</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onCancel}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isCancelling ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "نعم، إلغاء"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyBookings;
