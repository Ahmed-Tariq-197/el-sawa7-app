import { Link } from "react-router-dom";
import {
  Users,
  Car,
  MapPin,
  Ticket,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { useAdminStats } from "@/hooks/useAdmin";
import { Loader2 } from "lucide-react";

const AdminDashboard = () => {
  const { data: stats, isLoading } = useAdminStats();

  const statCards = [
    {
      label: "إجمالي الركاب",
      value: stats?.totalPassengers ?? 0,
      icon: Users,
      color: "bg-primary/10 text-primary",
      href: "/admin/reservations",
    },
    {
      label: "السائقين",
      value: stats?.totalDrivers ?? 0,
      icon: Car,
      color: "bg-accent/20 text-accent-foreground",
      href: "/admin/drivers",
    },
    {
      label: "الرحلات النشطة",
      value: stats?.activeTrips ?? 0,
      icon: MapPin,
      color: "bg-primary/10 text-primary",
      href: "/admin/trips",
    },
    {
      label: "حجوزات مؤكدة",
      value: stats?.confirmedReservations ?? 0,
      icon: CheckCircle,
      color: "bg-primary/10 text-primary",
      href: "/admin/reservations",
    },
  ];

  const alertCards = [
    {
      label: "حجوزات في الانتظار",
      value: stats?.pendingReservations ?? 0,
      description: "تحتاج مراجعة الدفع",
      icon: Clock,
      color: "bg-accent/20",
      href: "/admin/reservations?status=pending",
    },
    {
      label: "سائقين في الانتظار",
      value: stats?.pendingDriverApprovals ?? 0,
      description: "تحتاج موافقة",
      icon: AlertCircle,
      color: "bg-accent/20",
      href: "/admin/drivers",
    },
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          لوحة التحكم 📊
        </h1>
        <p className="text-muted-foreground">
          مرحباً بك في لوحة تحكم ElSawa7
        </p>
      </div>

      {/* Alert Cards */}
      {(stats?.pendingReservations ?? 0) > 0 ||
      (stats?.pendingDriverApprovals ?? 0) > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {alertCards.map(
            (card) =>
              card.value > 0 && (
                <Link
                  key={card.label}
                  to={card.href}
                  className={`${card.color} border border-accent/30 rounded-xl p-5 hover:shadow-accent transition-smooth`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {card.label}
                      </p>
                      <p className="text-3xl font-bold text-foreground mt-1">
                        {card.value}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {card.description}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-accent/30 flex items-center justify-center">
                      <card.icon className="h-6 w-6 text-accent-foreground" />
                    </div>
                  </div>
                </Link>
              )
          )}
        </div>
      ) : null}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <Link
            key={card.label}
            to={card.href}
            className="card-soft p-5 hover:shadow-glow transition-smooth"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center`}
              >
                <card.icon className="h-5 w-5" />
              </div>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card-soft p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">
          إجراءات سريعة
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/admin/trips"
            className="flex flex-col items-center p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-smooth"
          >
            <MapPin className="h-8 w-8 text-primary mb-2" />
            <span className="text-sm font-medium">إضافة رحلة</span>
          </Link>
          <Link
            to="/admin/cars"
            className="flex flex-col items-center p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-smooth"
          >
            <Car className="h-8 w-8 text-primary mb-2" />
            <span className="text-sm font-medium">إضافة عربية</span>
          </Link>
          <Link
            to="/admin/reservations?status=pending"
            className="flex flex-col items-center p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-smooth"
          >
            <Ticket className="h-8 w-8 text-primary mb-2" />
            <span className="text-sm font-medium">مراجعة الحجوزات</span>
          </Link>
          <Link
            to="/admin/drivers"
            className="flex flex-col items-center p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-smooth"
          >
            <Users className="h-8 w-8 text-primary mb-2" />
            <span className="text-sm font-medium">إدارة السائقين</span>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
