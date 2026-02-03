import { usePassengerTracking, calculateETA } from "@/hooks/useDriverTracking";
import { MapPin, Navigation, Clock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PassengerTrackingMapProps {
  tripId: string;
  destinationLat?: number;
  destinationLng?: number;
}

export function PassengerTrackingMap({
  tripId,
  destinationLat,
  destinationLng,
}: PassengerTrackingMapProps) {
  const { isActive, lastPosition, isLoading } = usePassengerTracking(tripId);

  if (isLoading) {
    return (
      <div className="card-soft p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="card-soft p-6 text-center">
        <Navigation className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground text-sm">
          السائق لم يبدأ مشاركة الموقع بعد
        </p>
      </div>
    );
  }

  const eta =
    lastPosition && destinationLat && destinationLng
      ? calculateETA(
          lastPosition.lat,
          lastPosition.lng,
          destinationLat,
          destinationLng,
          lastPosition.speed_m_s
        )
      : null;

  // Simple map display using OpenStreetMap static image
  const mapUrl = lastPosition
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lastPosition.lng - 0.01}%2C${lastPosition.lat - 0.01}%2C${lastPosition.lng + 0.01}%2C${lastPosition.lat + 0.01}&layer=mapnik&marker=${lastPosition.lat}%2C${lastPosition.lng}`
    : null;

  return (
    <div className="card-soft overflow-hidden">
      <div className="bg-gradient-primary p-4">
        <div className="flex items-center justify-between text-primary-foreground">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            <span className="font-medium">السواق دلوقتي 📍</span>
          </div>
          <Badge variant="secondary" className="bg-accent text-accent-foreground">
            مباشر
          </Badge>
        </div>
      </div>

      {/* Map */}
      <div className="h-48 bg-muted relative">
        {mapUrl ? (
          <iframe
            src={mapUrl}
            className="w-full h-full border-0"
            title="Driver location"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <MapPin className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        {lastPosition && (
          <p className="text-xs text-muted-foreground">
            آخر تحديث:{" "}
            {new Date(lastPosition.sent_at).toLocaleTimeString("ar-EG")}
          </p>
        )}

        {eta !== null && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-medium">
              متوقع توصيل خلال ~ {eta} دقيقة
            </span>
          </div>
        )}

        {lastPosition?.speed_m_s && lastPosition.speed_m_s > 0 && (
          <p className="text-xs text-muted-foreground">
            السرعة: {Math.round(lastPosition.speed_m_s * 3.6)} كم/س
          </p>
        )}
      </div>
    </div>
  );
}
