import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface DriverRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationId: string;
  driverId: string;
  passengerId: string;
  driverName?: string;
  onRatingSubmitted?: () => void;
}

export function DriverRatingModal({
  isOpen,
  onClose,
  reservationId,
  driverId,
  passengerId,
  driverName = "السائق",
  onRatingSubmitted,
}: DriverRatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "خطأ",
        description: "من فضلك اختار تقييم",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if already rated
      const { data: existingRating } = await supabase
        .from("passenger_ratings")
        .select("id")
        .eq("reservation_id", reservationId)
        .single();

      if (existingRating) {
        toast({
          title: "تم التقييم مسبقاً",
          description: "أنت قيّمت السائق لهذه الرحلة من قبل",
          variant: "destructive",
        });
        onClose();
        return;
      }

      // Insert rating
      const { error } = await supabase
        .from("passenger_ratings")
        .insert({
          reservation_id: reservationId,
          driver_id: driverId,
          passenger_id: passengerId,
          rating,
        });

      if (error) throw error;

      toast({
        title: "شكراً لتقييمك! ⭐",
        description: "تقييمك يساعدنا في تحسين الخدمة",
      });

      onRatingSubmitted?.();
      onClose();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حصل مشكلة. حاول تاني.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            قيّم {driverName} ⭐
          </DialogTitle>
          <DialogDescription className="text-center">
            رأيك يساعدنا نحسّن الخدمة
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {/* Star Rating */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-transform hover:scale-110 focus:outline-none"
              >
                <Star
                  className={`h-10 w-10 transition-colors ${
                    star <= displayRating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Rating Label */}
          <p className="text-center text-lg font-medium mb-4">
            {displayRating === 0 && "اختار تقييمك"}
            {displayRating === 1 && "سيء 😞"}
            {displayRating === 2 && "مقبول 😐"}
            {displayRating === 3 && "جيد 🙂"}
            {displayRating === 4 && "جيد جداً 😊"}
            {displayRating === 5 && "ممتاز! 🌟"}
          </p>

          {/* Comment (Optional) */}
          <Textarea
            placeholder="أضف تعليق (اختياري - ٢٥٠ حرف كحد أقصى)"
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 250))}
            className="resize-none text-right"
            rows={3}
          />
          <p className="text-xs text-muted-foreground mt-1 text-left">
            {comment.length}/250
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            لاحقاً
          </Button>
          <Button
            variant="hero"
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : null}
            إرسال التقييم
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}