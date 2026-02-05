import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

export function usePushNotifications() {
  const { user, session } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      // Check existing subscription
      if (user) {
        checkExistingSubscription();
      }
    }
  }, [user]);

  const checkExistingSubscription = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!user || !session) {
      toast({
        title: "تنبيه",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return false;
    }

    if (!isSupported) {
      toast({
        title: "غير مدعوم",
        description: "المتصفح لا يدعم الإشعارات",
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);

    try {
      // Request permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        toast({
          title: "رفضت السماح بالإشعارات",
          description: "يمكنك تغيير الإعدادات من المتصفح",
          variant: "destructive",
        });
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      let subscription: PushSubscription;
      
      if (VAPID_PUBLIC_KEY) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      } else {
        // Fallback without VAPID (limited functionality)
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
        });
      }

      const subscriptionJson = subscription.toJSON();

      // Save to backend
      const response = await supabase.functions.invoke("notifications-subscribe", {
        body: {
          endpoint: subscriptionJson.endpoint,
          keys: {
            p256dh: subscriptionJson.keys?.p256dh,
            auth: subscriptionJson.keys?.auth,
          },
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setIsSubscribed(true);
      toast({
        title: "تم تفعيل الإشعارات! 🔔",
        description: "هتوصلك كل التحديثات",
      });

      return true;
    } catch (error: any) {
      console.error("Push subscription error:", error);
      toast({
        title: "فشل تفعيل الإشعارات",
        description: error.message || "حاول مرة أخرى",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, session, isSupported]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      toast({
        title: "تم إلغاء الإشعارات",
        description: "لن تتلقى إشعارات بعد الآن",
      });

      return true;
    } catch (error: any) {
      console.error("Unsubscribe error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    return await subscribe();
  }, [subscribe]);

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

  const sendTestNotification = useCallback(async () => {
    try {
      const response = await supabase.functions.invoke("notifications-test-send", {
        body: {
          title: "ElSawa7 🚌",
          body: "إشعار تجريبي - الإشعارات تعمل بنجاح!",
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "تم إرسال الإشعار التجريبي",
        description: response.data?.test_mode 
          ? "تم التسجيل في وضع الاختبار" 
          : "تحقق من الإشعارات",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "فشل إرسال الإشعار",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    subscribe,
    unsubscribe,
    requestPermission,
    showNotification,
    sendTestNotification,
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
