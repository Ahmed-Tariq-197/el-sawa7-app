import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export function NotificationToggle() {
  const { isSupported, permission, requestPermission } = usePushNotifications();

  if (!isSupported) {
    return null;
  }

  if (permission === "granted") {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-primary"
        disabled
      >
        <Bell className="h-4 w-4 ml-1" />
        الإشعارات مفعّلة
      </Button>
    );
  }

  if (permission === "denied") {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        disabled
      >
        <BellOff className="h-4 w-4 ml-1" />
        الإشعارات مرفوضة
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={requestPermission}
    >
      <Bell className="h-4 w-4 ml-1" />
      تفعيل الإشعارات
    </Button>
  );
}
