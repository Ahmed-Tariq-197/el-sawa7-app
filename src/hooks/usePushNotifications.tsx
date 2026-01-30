import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

const VAPID_PUBLIC_KEY = ""; // Will be generated if needed

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    // Check if push notifications are supported
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: "غير مدعوم",
        description: "الإشعارات غير مدعومة في هذا المتصفح",
        variant: "destructive",
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        toast({
          title: "تم تفعيل الإشعارات ✅",
          description: "هتوصلك إشعارات لما يحصل أي تحديث",
        });
        return true;
      } else if (result === "denied") {
        toast({
          title: "تم رفض الإشعارات",
          description: "يمكنك تفعيلها من إعدادات المتصفح",
          variant: "destructive",
        });
        return false;
      }
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!isSupported || permission !== "granted") {
        console.log("Cannot show notification - not permitted");
        return;
      }

      // Check if service worker is ready
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "SHOW_NOTIFICATION",
          title,
          options: {
            icon: "/icons/android-chrome-192x192.png",
            badge: "/icons/favicon-32x32.png",
            dir: "rtl",
            lang: "ar",
            ...options,
          },
        });
      } else {
        // Fallback to regular notification
        try {
          new Notification(title, {
            icon: "/icons/android-chrome-192x192.png",
            badge: "/icons/favicon-32x32.png",
            dir: "rtl",
            lang: "ar",
            ...options,
          });
        } catch (error) {
          console.error("Error showing notification:", error);
        }
      }
    },
    [isSupported, permission]
  );

  return {
    isSupported,
    isSubscribed,
    permission,
    requestPermission,
    showNotification,
  };
}

// Helper to send common notifications
export function useAppNotifications() {
  const { showNotification, permission } = usePushNotifications();

  const notifyPaymentConfirmed = useCallback(
    (tripInfo: string) => {
      if (permission === "granted") {
        showNotification("تم تأكيد الدفع ✅", {
          body: `حجزك في رحلة ${tripInfo} اتأكد!`,
          tag: "payment-confirmed",
        });
      }
    },
    [showNotification, permission]
  );

  const notifyQueueUpdate = useCallback(
    (position: number, tripInfo: string) => {
      if (permission === "granted") {
        showNotification("تحديث الطابور 📊", {
          body: `مكانك الجديد في طابور ${tripInfo}: ${position}`,
          tag: "queue-update",
        });
      }
    },
    [showNotification, permission]
  );

  const notifyNewBooking = useCallback(
    (passengerName: string, tripInfo: string) => {
      if (permission === "granted") {
        showNotification("حجز جديد 🎫", {
          body: `${passengerName} حجز في رحلة ${tripInfo}`,
          tag: "new-booking",
        });
      }
    },
    [showNotification, permission]
  );

  const notifyNewDriver = useCallback(
    (driverName: string) => {
      if (permission === "granted") {
        showNotification("سائق جديد 🚗", {
          body: `${driverName} سجّل كسائق ومحتاج موافقة`,
          tag: "new-driver",
        });
      }
    },
    [showNotification, permission]
  );

  return {
    notifyPaymentConfirmed,
    notifyQueueUpdate,
    notifyNewBooking,
    notifyNewDriver,
  };
}
