import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Bus,
  MapPin,
  Clock,
  Calendar,
  Upload,
  CreditCard,
  ArrowRight,
  Users,
  Check,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCreateReservation, useTripQueue, useTripVotes, useVoteForExtraCar } from "@/hooks/useTrips";
import { useValidateReceipt } from "@/hooks/useValidateReceipt";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const BookTrip = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [trip, setTrip] = useState<any>(null);
  const [isLoadingTrip, setIsLoadingTrip] = useState(true);
  const [seatsCount, setSeatsCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"screenshot" | "txid">("screenshot");
  const [transactionId, setTransactionId] = useState("");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [receiptValidation, setReceiptValidation] = useState<{
    isValid: boolean;
    confidence: number;
    checked: boolean;
  } | null>(null);

  const { data: queue } = useTripQueue(tripId || "");
  const { data: votesCount } = useTripVotes(tripId || "");
  const createReservation = useCreateReservation();
  const voteForExtraCar = useVoteForExtraCar();
  const validateReceipt = useValidateReceipt();

  useEffect(() => {
    const fetchTrip = async () => {
      if (!tripId) return;

      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          cars (name, plate_number, capacity)
        `)
        .eq("id", tripId)
        .single();

      if (error) {
        toast({
          title: "خطأ",
          description: "الرحلة مش موجودة",
          variant: "destructive",
        });
        navigate("/trips");
        return;
      }

      setTrip(data);
      setIsLoadingTrip(false);
    };

    fetchTrip();
  }, [tripId, navigate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "الملف كبير جداً",
        description: "أقصى حجم للملف ٥ ميجا",
        variant: "destructive",
      });
      return;
    }

    setPaymentProof(file);
    setReceiptValidation(null);
    
    // Upload temporarily for AI validation
    try {
      if (!user) return;
      
      const fileExt = file.name.split(".").pop();
      const tempPath = `${user.id}/temp-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(tempPath, file);
        
      if (uploadError) throw uploadError;
      
      // Validate with AI
      const result = await validateReceipt.mutateAsync({
        imageUrl: tempPath,
        expectedAmount: trip?.price * seatsCount,
      });
      
      setReceiptValidation({
        isValid: result.isValid,
        confidence: result.confidence,
        checked: true,
      });
    } catch (error) {
      console.error("Validation error:", error);
      // Don't block booking if validation fails - admin will review
      setReceiptValidation({ isValid: false, confidence: 0, checked: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    if (!tripId) return;

    // Validate payment proof
    if (seatsCount === 2 && !paymentProof && !transactionId) {
      toast({
        title: "إثبات الدفع مطلوب",
        description: "لحجز مقعدين لازم ترفع صورة الإيصال أو رقم العملية",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      let paymentProofUrl: string | undefined;

      // Upload payment proof if exists
      if (paymentProof) {
        const fileExt = paymentProof.name.split(".").pop();
        const filePath = `${user.id}/${tripId}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("payment-proofs")
          .upload(filePath, paymentProof);

        if (uploadError) throw uploadError;

        paymentProofUrl = filePath;
      }

      await createReservation.mutateAsync({
        tripId,
        seatsCount,
        paymentProofUrl,
        paymentTransactionId: transactionId || undefined,
      });

      navigate("/my-bookings");
    } catch (error: any) {
      toast({
        title: "فشل الحجز",
        description: error.message || "حصل خطأ. حاول تاني.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleVote = async () => {
    if (!tripId) return;
    await voteForExtraCar.mutateAsync(tripId);
  };

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

  if (isLoadingTrip) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const isFull = trip?.available_seats === 0 || trip?.is_full;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Link
          to="/trips"
          className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 transition-smooth"
        >
          <ArrowRight className="h-4 w-4 ml-1" />
          العودة للرحلات
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trip Details */}
          <div className="lg:col-span-1">
            <div className="card-soft overflow-hidden sticky top-24">
              <div className="bg-gradient-primary p-5">
                <div className="flex items-center gap-3 text-primary-foreground">
                  <Bus className="h-8 w-8" />
                  <div>
                    <h2 className="font-bold text-lg">{trip?.cars?.name}</h2>
                    <p className="text-sm opacity-80">{trip?.cars?.plate_number}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Route */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <div className="w-0.5 h-6 bg-border" />
                    <div className="w-3 h-3 rounded-full bg-accent" />
                  </div>
                  <div>
                    <p className="font-medium">{trip?.origin}</p>
                    <p className="font-medium">{trip?.destination}</p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{formatDate(trip?.trip_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{formatTime(trip?.departure_time)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    <span
                      className={
                        trip?.available_seats > 3
                          ? "text-primary"
                          : trip?.available_seats > 0
                          ? "text-accent"
                          : "text-destructive"
                      }
                    >
                      {trip?.available_seats} مقعد متاح
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">السعر</span>
                    <span className="text-2xl font-bold text-primary">
                      {trip?.price} ج.م
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Form or Full Message */}
          <div className="lg:col-span-2">
            {isFull ? (
              <div className="card-soft p-8 text-center">
                <AlertCircle className="h-16 w-16 mx-auto text-accent mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  الحجز خلص 😔
                </h2>
                <p className="text-muted-foreground mb-6">
                  للأسف الرحلة دي اتملت. صوّت عشان نضيف عربية تانية!
                </p>

                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    عدد الأصوات الحالي
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {votesCount || 0} / 14
                  </p>
                </div>

                <Button
                  variant="accent"
                  size="lg"
                  onClick={handleVote}
                  disabled={voteForExtraCar.isPending}
                >
                  {voteForExtraCar.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin ml-2" />
                  ) : (
                    "🗳️ صوّت على عربية جديدة"
                  )}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="card-soft p-6 space-y-6">
                <h2 className="text-xl font-bold text-foreground">
                  احجز مكانك 🎫
                </h2>

                {/* Seats Selection */}
                <div>
                  <Label className="text-base font-medium mb-3 block">
                    عدد المقاعد
                  </Label>
                  <RadioGroup
                    value={seatsCount.toString()}
                    onValueChange={(v) => setSeatsCount(parseInt(v))}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="1" id="seat-1" />
                      <Label htmlFor="seat-1">مقعد واحد</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="2" id="seat-2" />
                      <Label htmlFor="seat-2">مقعدين</Label>
                    </div>
                  </RadioGroup>
                  {seatsCount === 2 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      💡 لحجز مقعدين لازم ترفع إيصال الدفع
                    </p>
                  )}
                </div>

                {/* Payment Info */}
                <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-accent" />
                    طريقة الدفع: Vodafone Cash
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    حوّل المبلغ{" "}
                    <span className="font-bold text-foreground">
                      {trip?.price * seatsCount} ج.م
                    </span>{" "}
                    على الرقم:
                  </p>
                  <p className="text-xl font-bold text-primary mt-1" dir="ltr">
                    01012345678
                  </p>
                </div>

                {/* Payment Proof Method */}
                <div>
                  <Label className="text-base font-medium mb-3 block">
                    إثبات الدفع
                  </Label>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(v) => setPaymentMethod(v as "screenshot" | "txid")}
                    className="flex gap-4 mb-4"
                  >
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="screenshot" id="method-screenshot" />
                      <Label htmlFor="method-screenshot">رفع صورة الإيصال</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="txid" id="method-txid" />
                      <Label htmlFor="method-txid">رقم العملية</Label>
                    </div>
                  </RadioGroup>

                  {paymentMethod === "screenshot" ? (
                    <div>
                      <label
                        htmlFor="payment-proof"
                        className={`
                          flex flex-col items-center justify-center w-full h-32 
                          border-2 border-dashed rounded-lg cursor-pointer
                          transition-smooth
                          ${
                            paymentProof
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          }
                        `}
                      >
                        {validateReceipt.isPending ? (
                          <div className="flex flex-col items-center text-muted-foreground">
                            <Loader2 className="h-8 w-8 mb-2 animate-spin text-primary" />
                            <span>جاري التحقق من الإيصال...</span>
                          </div>
                        ) : paymentProof ? (
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2 text-primary mb-1">
                              <Check className="h-6 w-6" />
                              <span className="font-medium">{paymentProof.name}</span>
                            </div>
                            {receiptValidation?.checked && (
                              <div className={`flex items-center gap-1 text-sm ${
                                receiptValidation.isValid 
                                  ? "text-elsawa7-success" 
                                  : "text-accent"
                              }`}>
                                <ShieldCheck className="h-4 w-4" />
                                {receiptValidation.isValid 
                                  ? `تم التحقق ✓ (${receiptValidation.confidence}%)`
                                  : "سيتم المراجعة يدوياً"
                                }
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-muted-foreground">
                            <Upload className="h-8 w-8 mb-2" />
                            <span>اضغط لرفع صورة الإيصال</span>
                            <span className="text-xs mt-1">PNG, JPG (أقصى ٥ ميجا)</span>
                          </div>
                        )}
                        <input
                          id="payment-proof"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={validateReceipt.isPending}
                        />
                      </label>
                    </div>
                  ) : (
                    <Input
                      placeholder="أدخل رقم العملية"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="text-right"
                    />
                  )}
                </div>

                {/* Queue Preview */}
                {queue && queue.length > 0 && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium text-foreground mb-2">
                      الطابور الحالي ({queue.length} حجز)
                    </h4>
                    <div className="space-y-1">
                      {queue.slice(0, 5).map((reservation, index) => (
                        <div
                          key={reservation.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Badge variant="outline" className="w-6 h-6 p-0 justify-center">
                            {index + 1}
                          </Badge>
                          <span className="text-muted-foreground">
                            {reservation.profiles?.name}
                          </span>
                          {reservation.status === "confirmed" && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      ))}
                      {queue.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          + {queue.length - 5} آخرين
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-medium">الإجمالي</span>
                    <span className="text-2xl font-bold text-primary">
                      {trip?.price * seatsCount} ج.م
                    </span>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  variant="hero"
                  size="xl"
                  className="w-full"
                  disabled={isUploading || createReservation.isPending}
                >
                  {isUploading || createReservation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin ml-2" />
                      جاري الحجز...
                    </>
                  ) : (
                    "تأكيد الحجز"
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookTrip;
