import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "./use-toast";

interface ValidationResult {
  isValid: boolean;
  confidence: number;
  extractedAmount?: number;
  extractedDate?: string;
  extractedTransactionId?: string;
  warnings: string[];
  reasons: string[];
}

export function useValidateReceipt() {
  return useMutation({
    mutationFn: async ({
      imageUrl,
      expectedAmount,
      reservationId,
    }: {
      imageUrl: string;
      expectedAmount?: number;
      reservationId?: string;
    }): Promise<ValidationResult> => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("يجب تسجيل الدخول أولاً");
      }

      const response = await supabase.functions.invoke("validate-receipt", {
        body: { imageUrl, expectedAmount, reservationId },
      });

      if (response.error) {
        throw new Error(response.error.message || "فشل في التحقق من الإيصال");
      }

      return response.data as ValidationResult;
    },
    onSuccess: (data) => {
      if (data.isValid) {
        toast({
          title: "إيصال صالح ✓",
          description: `الثقة: ${data.confidence}%${data.extractedAmount ? ` | المبلغ: ${data.extractedAmount} ج.م` : ""}`,
        });
      } else {
        toast({
          title: "تحذير ⚠️",
          description: data.reasons.join(". "),
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في التحقق",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
