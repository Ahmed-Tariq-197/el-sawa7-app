import { Link, useNavigate } from "react-router-dom";
import { 
  Bus, 
  Clock, 
  Users, 
  MapPin, 
  LogOut, 
  User, 
  Bell,
  Plus,
  ArrowLeft,
  Settings,
  Car
} from "lucide-react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useMyReservations } from "@/hooks/useTrips";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { Badge } from "@/components/ui/badge";
import { NotificationToggle } from "@/components/NotificationToggle";

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile, roles, isDriver, isAdmin, isApprovedDriver, signOut, isLoading } = useAuth();
  const { data: reservations } = useMyReservations();
  
  // Enable realtime notifications
  useRealtimeNotifications();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const userName = profile?.name || "مستخدم";
  const activeReservations = reservations?.filter(
    (r) => r.status === "pending" || r.status === "confirmed"
  );

  const quickActions = [
    {
      icon: Plus,
      title: "حجز جديد",
      description: "احجز مكانك في الرحلة القادمة",
      href: "/trips",
      color: "bg-primary",
    },
    {
      icon: Clock,
      title: "حجوزاتي",
      description: "تابع حجوزاتك الحالية والسابقة",
      href: "/my-bookings",
      color: "bg-accent",
    },
    {
      icon: MapPin,
      title: "الرحلات المتاحة",
      description: "استعرض جميع الرحلات",
      href: "/trips",
      color: "bg-primary/80",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/">
              <Logo size="sm" />
            </Link>

            <div className="flex items-center gap-4">
              {isApprovedDriver && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/driver">
                    <Car className="h-4 w-4 ml-2" />
                    لوحة السائق
                  </Link>
                </Button>
              )}
              
              {isAdmin && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin">
                    <Settings className="h-4 w-4 ml-2" />
                    لوحة التحكم
                  </Link>
                </Button>
              )}
              
              <NotificationToggle />
              
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-foreground">{userName}</p>
                  <p className="text-xs text-muted-foreground">
                    {isAdmin ? "مدير" : isDriver ? "سائق" : "راكب"}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            أهلاً، {userName}! 👋
          </h1>
          <p className="text-muted-foreground">
            إيه اللي عايز تعمله النهاردة؟
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="card-soft p-6 hover:shadow-glow transition-smooth group"
            >
              <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth`}>
                <action.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {action.title}
              </h3>
              <p className="text-sm text-muted-foreground">{action.description}</p>
            </Link>
          ))}
        </div>

        {/* Upcoming Trips */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">رحلاتك القادمة</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/my-bookings">
                عرض الكل
                <ArrowLeft className="h-4 w-4 mr-1" />
              </Link>
            </Button>
          </div>

          {!activeReservations || activeReservations.length === 0 ? (
            <div className="card-soft p-8 text-center">
              <Bus className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">
                مش عندك حجوزات حالياً
              </p>
              <Button variant="accent" asChild>
                <Link to="/trips">
                  <Plus className="h-4 w-4 ml-2" />
                  احجز رحلتك الأولى
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeReservations.slice(0, 3).map((reservation) => (
                <div key={reservation.id} className="card-soft p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Bus className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {reservation.trips?.origin} → {reservation.trips?.destination}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {reservation.trips?.trip_date} | الطابور #{reservation.queue_position}
                    </p>
                  </div>
                  <Badge variant={reservation.status === "confirmed" ? "default" : "secondary"}>
                    {reservation.status === "confirmed" ? "مؤكد" : "في الانتظار"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Driver Stats */}
        {isDriver && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-foreground mb-6">إحصائياتك</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "رحلات مكتملة", value: "0" },
                { label: "ركاب نقلتهم", value: "0" },
                { label: "تقييمك", value: "-" },
                { label: "أرباح الشهر", value: "٠ ج.م" },
              ].map((stat) => (
                <div key={stat.label} className="card-soft p-4 text-center">
                  <p className="text-2xl font-bold text-primary mb-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Logout */}
        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={signOut} 
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
