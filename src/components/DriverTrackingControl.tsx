import { useState } from "react";
import { MapPin, Loader2, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useDriverTrackingSession } from "@/hooks/useDriverTracking";

interface DriverTrackingControlProps {
  tripId: string;
}

export function DriverTrackingControl({ tripId }: DriverTrackingControlProps) {
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const {
    isTracking,
    startTracking,
    stopTracking,
    isStarting,
    isStopping,
  } = useDriverTrackingSession(tripId);

  const handleStartClick = () => {
    setShowConsentDialog(true);
  };

  const handleConsent = async () => {
    setShowConsentDialog(false);
    await startTracking();
  };

  if (isTracking) {
    return (
      <Button
        variant="destructive"
        onClick={stopTracking}
        disabled={isStopping}
        className="gap-2"
      >
        {isStopping ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <PowerOff className="h-4 w-4" />
        )}
        إيقاف مشاركة الموقع
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="default"
        onClick={handleStartClick}
        disabled={isStarting}
        className="gap-2"
      >
        {isStarting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}
        بدء مشاركة الموقع
      </Button>

      <Dialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              ابدأ مشاركة الموقع
            </DialogTitle>
            <DialogDescription className="text-right">
              سأقوم بمشاركة موقع السيارة أثناء الرحلة مع الركاب المؤكدين فقط.
              <br />
              <br />
              <span className="text-muted-foreground text-sm">
                ✓ موقعك هيكون مرئي لركاب الرحلة المؤكدين فقط
                <br />
                ✓ لن يتم مشاركة بياناتك الشخصية
                <br />
                ✓ يمكنك إيقاف المشاركة في أي وقت
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowConsentDialog(false)}
            >
              إلغاء
            </Button>
            <Button variant="hero" onClick={handleConsent}>
              <Power className="h-4 w-4 ml-2" />
              موافق، ابدأ المشاركة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
