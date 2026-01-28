import { useState } from "react";
import { Plus, Car, Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminCars, useCreateCar } from "@/hooks/useAdmin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const AdminCars = () => {
  const { data: cars, isLoading } = useAdminCars();
  const createCar = useCreateCar();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    plate_number: "",
    capacity: 14,
    region: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCar.mutateAsync(formData);
    setFormData({ name: "", plate_number: "", capacity: 14, region: "" });
    setIsDialogOpen(false);
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            إدارة العربيات 🚌
          </h1>
          <p className="text-muted-foreground">أضف وأدر العربيات المتاحة</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus className="h-4 w-4 ml-2" />
              إضافة عربية
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة عربية جديدة</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>اسم العربية</Label>
                <Input
                  required
                  placeholder="مثال: ميكروباص 1"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>رقم اللوحة</Label>
                <Input
                  required
                  placeholder="مثال: أ ب ج 1234"
                  value={formData.plate_number}
                  onChange={(e) =>
                    setFormData({ ...formData, plate_number: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>عدد المقاعد</Label>
                <Input
                  type="number"
                  required
                  min={1}
                  max={50}
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>المنطقة</Label>
                <Input
                  required
                  placeholder="مثال: القاهرة - الجيزة"
                  value={formData.region}
                  onChange={(e) =>
                    setFormData({ ...formData, region: e.target.value })
                  }
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createCar.isPending}
              >
                {createCar.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "إضافة العربية"
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
      ) : !cars || cars.length === 0 ? (
        <div className="card-soft p-12 text-center">
          <Car className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">مفيش عربيات مسجلة</p>
          <Button variant="accent" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 ml-2" />
            أضف أول عربية
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cars.map((car: any) => (
            <div key={car.id} className="card-soft p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Car className="h-6 w-6 text-primary" />
                </div>
                <Badge variant={car.is_active ? "default" : "secondary"}>
                  {car.is_active ? "نشط" : "غير نشط"}
                </Badge>
              </div>
              <h3 className="font-bold text-lg text-foreground mb-1">
                {car.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {car.plate_number}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{car.region}</span>
                <span className="font-medium text-primary">
                  {car.capacity} مقعد
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCars;
