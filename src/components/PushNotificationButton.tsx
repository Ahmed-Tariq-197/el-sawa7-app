import { Bell, BellOff, Loader2, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PushNotificationButtonProps {
  variant?: "icon" | "full";
  className?: string;
}

export function PushNotificationButton({
  variant = "icon",
  className,
}: PushNotificationButtonProps) {
  const {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  if (!isSupported) {
    return null;
  }

  const handleClick = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const getIcon = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (isSubscribed) return <BellRing className="h-4 w-4" />;
    if (permission === "denied") return <BellOff className="h-4 w-4" />;
    return <Bell className="h-4 w-4" />;
  };

  const getLabel = () => {
    if (isSubscribed) return "الإشعارات مفعّلة";
    if (permission === "denied") return "الإشعارات محظورة";
    return "تفعيل الإشعارات";
  };

  const getTooltip = () => {
    if (permission === "denied") {
      return "يمكنك تفعيل الإشعارات من إعدادات المتصفح";
    }
    return isSubscribed ? "اضغط لإلغاء الإشعارات" : "اضغط لتفعيل الإشعارات";
  };

  if (variant === "icon") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isSubscribed ? "default" : "ghost"}
            size="icon"
            onClick={handleClick}
            disabled={isLoading || permission === "denied"}
            className={className}
          >
            {getIcon()}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltip()}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button
      variant={isSubscribed ? "default" : "outline"}
      onClick={handleClick}
      disabled={isLoading || permission === "denied"}
      className={className}
    >
      {getIcon()}
      <span className="mr-2">{getLabel()}</span>
    </Button>
  );
}
