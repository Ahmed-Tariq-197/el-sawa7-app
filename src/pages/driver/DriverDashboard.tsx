import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Bus, 
  Users, 
  Phone, 
  CheckCircle, 
  Clock, 
  Star,
  Calendar,
  MapPin,
  LogOut,
  Bell,
  User
} from "lucide-react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useDriverTrips, useDriverTripQueue, useMarkPassengerComplete, useRatePassenger } from "@/hooks/useDriver";
import { useDriverRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const DriverDashboard = () => {
  const { profile, driverProfile, signOut, isLoading: authLoading } = useAuth();
  const { data: trips, isLoading: tripsLoading } = useDriverTrips();
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const { data: queue } = useDriverTripQueue(selectedTripId || "");
  const markComplete = useMarkPassengerComplete();
  const ratePassenger = useRatePassenger();
  const [ratingDialog, setRatingDialog] = useState<{
    open: boolean;
    reservationId: string;
    passengerId: string;
  } | null>(null);
  
  // Enable driver realtime notifications
  useDriverRealtimeNotifications();

  if (authLoading || tripsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!driverProfile?.is_approved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <Clock className="h-16 w-16 mx-auto text-accent mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            في انتظار الموافقة
          </h1>
          <p className="text-muted-foreground mb-6">
            حسابك كسائق لسه في مرحلة المراجعة. هيتم إبلاغك لما يتم الموافقة عليه.
          </p>
          <Button variant="outline" asChild>
            <Link to="/driver/upload-license">رفع الرخصة</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleMarkComplete = async (reservationId: string, passengerId: string) => {
    await markComplete.mutateAsync(reservationId);
    setRatingDialog({ open: true, reservationId, passengerId });
  };

  const handleRate = async (rating: number) => {
    if (!ratingDialog) return;
    await ratePassenger.mutateAsync({
      reservationId: ratingDialog.reservationId,
      passengerId: ratingDialog.passengerId,
      rating,
    });
    setRatingDialog(null);
    toast({
      title: "تم التقييم",
      description: "شكراً على تقييمك للراكب",
    });
  };

  const activeTrips = trips?.filter(t => t.status === "scheduled" || t.status === "in_progress") || [];
  const completedTrips = trips?.filter(t => t.status === "completed") || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/">
              <Logo size="sm" />
            </Link>

            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-accent/20 rounded-lg transition-smooth">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-foreground">{profile?.name}</p>
                  <p className="text-xs text-muted-foreground">سائق معتمد ✓</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card-soft p-4 text-center">
            <p className="text-2xl font-bold text-primary">{driverProfile?.total_trips || 0}</p>
            <p className="text-xs text-muted-foreground">رحلات مكتملة</p>
          </div>
          <div className="card-soft p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="h-5 w-5 text-accent fill-accent" />
              <p className="text-2xl font-bold text-primary">
                {driverProfile?.rating?.toFixed(1) || "-"}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">تقييمك</p>
          </div>
          <div className="card-soft p-4 text-center">
            <p className="text-2xl font-bold text-primary">{activeTrips.length}</p>
            <p className="text-xs text-muted-foreground">رحلات قادمة</p>
          </div>
          <div className="card-soft p-4 text-center">
            <p className="text-2xl font-bold text-primary">{completedTrips.length}</p>
            <p className="text-xs text-muted-foreground">هذا الشهر</p>
          </div>
        </div>

        {/* Active Trips */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Bus className="h-5 w-5 text-primary" />
            رحلاتك المُسندة
          </h2>

          {activeTrips.length === 0 ? (
            <div className="card-soft p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                مفيش رحلات مُسندة ليك حالياً
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTrips.map((trip) => (
                <div
                  key={trip.id}
                  className={`card-soft p-4 cursor-pointer transition-smooth ${
                    selectedTripId === trip.id ? "ring-2 ring-primary" : "hover:shadow-glow"
                  }`}
                  onClick={() => setSelectedTripId(trip.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground">
                          {trip.origin} → {trip.destination}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(trip.trip_date), "EEEE d MMMM", { locale: ar })} | {trip.departure_time.slice(0, 5)}
                      </p>
                    </div>
                    <Badge variant={trip.status === "in_progress" ? "default" : "secondary"}>
                      {trip.status === "in_progress" ? "جارية" : "مجدولة"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {trip.available_seats} مقاعد متاحة
                    </span>
                    <span>{trip.cars?.name} - {trip.cars?.plate_number}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Passenger Queue */}
        {selectedTripId && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              قائمة الركاب
            </h2>

            {!queue || queue.length === 0 ? (
              <div className="card-soft p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">مفيش ركاب في القائمة</p>
              </div>
            ) : (
              <div className="space-y-3">
                {queue.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="card-soft p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                        {reservation.queue_position}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`tel:${reservation.profiles?.phone}`}
                            className="text-primary hover:underline font-medium"
                          >
                            {reservation.profiles?.phone || "غير متوفر"}
                          </a>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {reservation.seats_count} مقعد/مقاعد
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {reservation.status === "completed" ? (
                        <Badge className="bg-elsawa7-success text-primary-foreground">
                          <CheckCircle className="h-3 w-3 ml-1" />
                          مكتمل
                        </Badge>
                      ) : reservation.status === "confirmed" ? (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkComplete(reservation.id, reservation.user_id);
                          }}
                          disabled={markComplete.isPending}
                        >
                          <CheckCircle className="h-4 w-4 ml-1" />
                          تم التوصيل
                        </Button>
                      ) : (
                        <Badge variant="secondary">
                          في الانتظار
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Logout */}
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={signOut}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </main>

      {/* Rating Dialog */}
      <Dialog open={ratingDialog?.open} onOpenChange={() => setRatingDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>قيّم الراكب</DialogTitle>
            <DialogDescription>
              قيمتك بتساعدنا نحسن الخدمة
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center gap-2 py-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRate(star)}
                className="p-2 hover:scale-110 transition-smooth"
              >
                <Star className="h-8 w-8 text-accent hover:fill-accent" />
              </button>
            ))}
          </div>
          <Button variant="ghost" onClick={() => setRatingDialog(null)} className="w-full">
            تخطي
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DriverDashboard;
