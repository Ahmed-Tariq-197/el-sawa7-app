import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { Button } from "./ui/button";

// Phrase pools by user category
const PHRASE_POOLS = {
  newUser: [
    "أهلاً بيك في عيلة ElSawa7! 🎉 أول رحلة عليك؟ يلا نبدأ!",
    "نوّرتنا! احجز أول رحلة وخلينا نوصّلك بأمان 🚌",
    "مرحباً بيك! جاهز تجرب أسهل طريقة للمواصلات؟",
    "أهلاً وسهلاً! رحلتك الأولى هتكون مميزة معانا 💙",
  ],
  returning: [
    "أهلاً بيك تاني! 👋 وحشتنا!",
    "رجعتلنا تاني! يلا نحجزلك رحلة؟",
    "نوّرت! إيه الخطة النهاردة؟",
    "أهلاً بالغالي! جاهز للرحلة؟ 🚌",
  ],
  shortBreak: [
    "وحشتنا! 💙 فاتك رحلات حلوة... تعال نعوّضك",
    "أهلاً بيك بعد الغيبة! جاهز للرحلة القادمة؟",
    "رجعتلنا! كان فيه رحلات كتير... يلا نحجزلك واحدة",
    "فينك من زمان؟ الطريق مش زي ما كان من غيرك 🛣️",
  ],
  lapsed: [
    "وحشتنا أوي يا {firstName}! 😢 فين كنت؟ يلا نرجع زي الأول!",
    "غبت علينا كتير! الطريق مش زي زمان من غيرك 🚌💙",
    "اشتقنالك! آخر مرة كانت من {lastTripFrom}... يلا نجدد الذكريات",
    "فينك يا {firstName}؟ عدت {daysSinceLast} يوم من غيرك! 😔",
    "الطريق بقى وحش من غيرك! رجعتلنا أخيراً 🎉",
  ],
};

interface UserActivity {
  lastTripDate: string | null;
  lastTripFrom: string | null;
  totalTrips: number;
}

function getStorageKey(): string {
  const today = new Date().toISOString().split("T")[0];
  return `elsawa7_welcome_v${today}`;
}

function selectRandomPhrase(phrases: string[]): string {
  return phrases[Math.floor(Math.random() * phrases.length)];
}

function interpolatePhrase(phrase: string, tokens: Record<string, string | number>): string {
  let result = phrase;
  for (const [key, value] of Object.entries(tokens)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }
  return result;
}

export function SmartWelcome() {
  const { user, profile } = useAuth();
  const [activity, setActivity] = useState<UserActivity | null>(null);
  const [isHidden, setIsHidden] = useState(false);
  const [welcomePhrase, setWelcomePhrase] = useState<string | null>(null);

  // Check if user opted out
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hideWelcome = localStorage.getItem("elsawa7_welcome_hide");
      if (hideWelcome === "true") {
        setIsHidden(true);
      }
    }
  }, []);

  // Fetch user activity
  useEffect(() => {
    async function fetchActivity() {
      if (!user) return;

      try {
        // Get last completed reservation
        const { data: lastReservation } = await supabase
          .from("reservations")
          .select(`
            created_at,
            trips (origin, trip_date)
          `)
          .eq("user_id", user.id)
          .eq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Get total trips count
        const { count } = await supabase
          .from("reservations")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "completed");

        setActivity({
          lastTripDate: lastReservation?.trips?.trip_date || null,
          lastTripFrom: lastReservation?.trips?.origin || null,
          totalTrips: count || 0,
        });
      } catch (error) {
        console.error("Error fetching activity:", error);
      }
    }

    fetchActivity();
  }, [user]);

  // Select and persist welcome phrase
  const phrase = useMemo(() => {
    if (!profile || isHidden) return null;

    // Check if we already have a phrase for today
    const storageKey = getStorageKey();
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return stored;
    }

    // Determine user category
    let category: keyof typeof PHRASE_POOLS;
    let daysSinceLast = 0;

    if (!activity || activity.totalTrips === 0) {
      category = "newUser";
    } else if (activity.lastTripDate) {
      const lastDate = new Date(activity.lastTripDate);
      const today = new Date();
      daysSinceLast = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceLast >= 21) {
        category = "lapsed";
      } else if (daysSinceLast >= 7) {
        category = "shortBreak";
      } else {
        category = "returning";
      }
    } else {
      category = "returning";
    }

    // Select random phrase from pool
    const phrasePool = PHRASE_POOLS[category];
    let selectedPhrase = selectRandomPhrase(phrasePool);

    // Interpolate tokens
    const firstName = profile.name?.split(" ")[0] || "صديقنا";
    selectedPhrase = interpolatePhrase(selectedPhrase, {
      firstName,
      lastTripFrom: activity?.lastTripFrom || "رحلتك السابقة",
      lastTripDate: activity?.lastTripDate || "",
      daysSinceLast,
    });

    // Persist for today
    localStorage.setItem(storageKey, selectedPhrase);
    
    // Emit analytics event (without PII)
    console.log("Analytics: welcomePhraseShown", { category, daysSinceLast });

    return selectedPhrase;
  }, [profile, activity, isHidden]);

  useEffect(() => {
    if (phrase) {
      setWelcomePhrase(phrase);
    }
  }, [phrase]);

  const handleDismiss = () => {
    setIsHidden(true);
    // Clear today's phrase
    localStorage.removeItem(getStorageKey());
  };

  const handleOptOut = () => {
    localStorage.setItem("elsawa7_welcome_hide", "true");
    setIsHidden(true);
  };

  if (isHidden || !welcomePhrase) {
    return null;
  }

  return (
    <div className="relative bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-xl p-4 mb-6 border border-primary/20">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 left-2 h-6 w-6 text-muted-foreground hover:text-foreground"
        onClick={handleDismiss}
        aria-label="إخفاء"
      >
        <X className="h-4 w-4" />
      </Button>
      
      <p className="text-lg font-medium text-foreground pr-4" dir="rtl">
        {welcomePhrase}
      </p>
      
      <button
        onClick={handleOptOut}
        className="text-xs text-muted-foreground hover:text-foreground mt-2 underline"
      >
        عدم إظهار رسائل الترحيب
      </button>
    </div>
  );
}
