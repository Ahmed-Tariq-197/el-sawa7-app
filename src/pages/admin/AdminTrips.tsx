import { useState } from "react";
import { Plus, MapPin, Loader2, Calendar, Clock } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminTrips, useCreateTrip, useAdminCars } from "@/hooks/useAdmin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const LOCATIONS = [
  "القاهرة",
  "الجيزة",
  "الإسكندرية",
  "المنصورة",
  "طنطا",
  "الزقازيق",
  "دمياط",
  "بورسعيد",
  "أسيوط",
  "الفيوم",
];

const AdminTrips = () => {
  const { data: trips, isLoading } = useAdminTrips();
  const { data: cars } = useAdminCars();
  const createTrip = useCreateTrip();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    car_id: "",
    origin: "",
    destination: "",
    trip_date: "",
    departure_time: "",
    price: 50,
    available_seats: 14,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTrip.mutateAsync(formData);
    setFormData({
      car_id: "",
      origin: "",
      destination: "",
      trip_date: "",
      departure_time: "",
      price: 50,
      available_seats: 14,
    });
    setIsDialogOpen(false);
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("ar-EG", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(new Date(dateStr));
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const period = hour >= 12 ? "م" : "ص";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      scheduled: { label: "مجدول", variant: "default" as const },
      in_progress: { label: "جاري", variant: "secondary" as const },
      completed: { label: "مكتمل", variant: "outline" as const },
      cancelled: { label: "ملغي", variant: "destructive" as const },
    };
    const s = statusMap[status as keyof typeof statusMap] || statusMap.scheduled;
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            إدارة الرحلات 🚀
          </h1>
          <p className="text-muted-foreground">أضف وأدر رحلات النقل</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus className="h-4 w-4 ml-2" />
              إضافة رحلة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة رحلة جديدة</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>العربية</Label>
                <Select
                  value={formData.car_id}
                  onValueChange={(v) => {
                    const car = cars?.find((c: any) => c.id === v);
                    setFormData({
                      ...formData,
                      car_id: v,
                      available_seats: car?.capacity || 14,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر العربية" />
                  </SelectTrigger>
                  <SelectContent>
                    {cars?.map((car: any) => (
                      <SelectItem key={car.id} value={car.id}>
                        {car.name} - {car.plate_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>من</Label>
                  <Select
                    value={formData.origin}
                    onValueChange={(v) =>
                      setFormData({ ...formData, origin: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="نقطة الانطلاق" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>إلى</Label>
                  <Select
                    value={formData.destination}
                    onValueChange={(v) =>
                      setFormData({ ...formData, destination: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="الوجهة" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>التاريخ</Label>
                  <Input
                    type="date"
                    required
                    value={formData.trip_date}
                    onChange={(e) =>
                      setFormData({ ...formData, trip_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>الوقت</Label>
                  <Input
                    type="time"
                    required
                    value={formData.departure_time}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        departure_time: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>السعر (ج.م)</Label>
                  <Input
                    type="number"
                    required
                    min={1}
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>المقاعد المتاحة</Label>
                  <Input
                    type="number"
                    required
                    min={1}
                    value={formData.available_seats}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        available_seats: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createTrip.isPending}
              >
                {createTrip.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "إضافة الرحلة"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !trips || trips.length === 0 ? (
        <div className="card-soft p-12 text-center">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">مفيش رحلات مسجلة</p>
          <Button variant="accent" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 ml-2" />
            أضف أول رحلة
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map((trip: any) => (
            <div
              key={trip.id}
              className="card-soft p-5 flex flex-col md:flex-row md:items-center gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-foreground">
                    {trip.origin} → {trip.destination}
                  </h3>
                  {getStatusBadge(trip.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  🚌 {trip.cars?.name} | {trip.cars?.plate_number}
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDate(trip.trip_date)}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {formatTime(trip.departure_time)}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-primary">{trip.price}</p>
                  <p className="text-xs text-muted-foreground">ج.م</p>
                </div>
                <div className="text-center">
                  <p
                    className={`text-lg font-bold ${
                      trip.available_seats > 3
                        ? "text-primary"
                        : trip.available_seats > 0
                        ? "text-accent-foreground"
                        : "text-destructive"
                    }`}
                  >
                    {trip.available_seats}
                  </p>
                  <p className="text-xs text-muted-foreground">مقعد</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminTrips;
