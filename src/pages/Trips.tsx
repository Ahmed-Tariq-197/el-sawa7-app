import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bus,
  MapPin,
  Clock,
  Users,
  Calendar,
  Filter,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAvailableTripsWithFallback, Trip } from "@/hooks/useTripsFallback";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const LOCATIONS = [
  "القاهرة",
  "الجيزة",
  "الإسكندرية",
  "المنصورة",
  "طنطا",
  "الزقازيق",
  "دمياط",
  "بورسعيد",
  "أسيوط",
  "الفيوم",
  "كفر الشيخ",
  "دسوق",
  "كفر الدوار",
  "دمنهور",
  "أبو حمص",
];

const Trips = () => {
  const [origin, setOrigin] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const { data, isLoading, error, refetch } = useAvailableTripsWithFallback(
    origin || undefined,
    destination || undefined
  );

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("trips-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trips" },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("ar-EG", {
      weekday: "long",
      year: "numeric",
      month: "long",
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

  const trips = data?.trips || [];
  const isSeedData = data?.isSeedData || false;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            الرحلات المتاحة 🚌
          </h1>
          <p className="text-muted-foreground">
            اختار رحلتك واحجز مكانك دلوقتي
          </p>
        </div>

        {/* Seed Data Notice */}
        {isSeedData && (
          <Alert className="mb-6 border-accent/50 bg-accent/10">
            <AlertTriangle className="h-4 w-4 text-accent" />
            <AlertDescription className="text-accent-foreground">
              هذه بيانات اختبار — ستظهر الرحلات الحقيقية بعد تفعيل لوحة السوّاح
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <div className="card-soft p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <MapPin className="inline h-4 w-4 ml-1" />
                من
              </label>
              <Select value={origin || "all"} onValueChange={(val) => setOrigin(val === "all" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نقطة الانطلاق" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {LOCATIONS.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <MapPin className="inline h-4 w-4 ml-1" />
                إلى
              </label>
              <Select value={destination || "all"} onValueChange={(val) => setDestination(val === "all" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الوجهة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {LOCATIONS.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setOrigin("");
                  setDestination("");
                }}
              >
                <Filter className="h-4 w-4 ml-2" />
                مسح الفلتر
              </Button>
            </div>
          </div>
        </div>

        {/* Trips List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">جاري تحميل الرحلات...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">حصل خطأ في تحميل الرحلات</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-4">
              حاول تاني
            </Button>
          </div>
        ) : trips.length === 0 ? (
          <div className="card-soft p-12 text-center">
            <Bus className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              مفيش رحلات متاحة حالياً
            </h3>
            <p className="text-muted-foreground mb-6">
              جرب تغير الفلتر أو تابعنا لمعرفة الرحلات الجديدة
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <TripCard 
                key={trip.id} 
                trip={trip} 
                formatDate={formatDate} 
                formatTime={formatTime}
                isSeedData={trip.isSeedData || false}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

interface TripCardProps {
  trip: Trip;
  formatDate: (date: string) => string;
  formatTime: (time: string) => string;
  isSeedData: boolean;
}

function TripCard({ trip, formatDate, formatTime, isSeedData }: TripCardProps) {
  return (
    <div className="card-soft overflow-hidden hover:shadow-glow transition-smooth group">
      <div className="bg-gradient-primary p-4">
        <div className="flex items-center justify-between text-primary-foreground">
          <div className="flex items-center gap-2">
            <Bus className="h-5 w-5" />
            <span className="font-medium">{trip.cars?.name}</span>
          </div>
          <Badge variant="secondary" className="bg-accent text-accent-foreground">
            {trip.price} ج.م
          </Badge>
        </div>
      </div>

      <div className="p-5">
        {/* Route */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <div className="w-0.5 h-8 bg-border" />
            <div className="w-3 h-3 rounded-full bg-accent" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">{trip.origin}</p>
            <p className="text-xs text-muted-foreground my-1">↓</p>
            <p className="font-medium text-foreground">{trip.destination}</p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(trip.trip_date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatTime(trip.departure_time)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span
              className={
                trip.available_seats > 3
                  ? "text-primary"
                  : trip.available_seats > 0
                  ? "text-accent"
                  : "text-destructive"
              }
            >
              {trip.available_seats} مقعد متاح
            </span>
          </div>
        </div>

        {/* Action */}
        {isSeedData ? (
          <Button
            variant="outline"
            className="w-full"
            disabled
          >
            بيانات تجريبية
          </Button>
        ) : (
          <Button
            variant={trip.available_seats > 0 ? "hero" : "outline"}
            className="w-full"
            asChild
            disabled={trip.available_seats === 0}
          >
            <Link to={`/book/${trip.id}`}>
              {trip.available_seats > 0 ? (
                <>
                  احجز الآن
                  <ArrowLeft className="h-4 w-4 mr-2" />
                </>
              ) : (
                "الحجز خلص"
              )}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export default Trips;
