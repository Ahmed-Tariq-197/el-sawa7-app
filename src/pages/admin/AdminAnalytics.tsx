import { AdminLayout } from "@/components/AdminLayout";
import { Loader2, TrendingUp, MapPin, Users, Star } from "lucide-react";
import {
  useReservationTrends,
  useTopVotedTrips,
  useRegionStats,
  useDriverPerformance,
} from "@/hooks/useAdminAnalytics";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#0B6E4F", "#F4A900", "#22c55e", "#3b82f6", "#ef4444", "#8b5cf6"];

const AdminAnalytics = () => {
  const { data: reservationTrends, isLoading: trendsLoading } = useReservationTrends(14);
  const { data: topVoted, isLoading: votesLoading } = useTopVotedTrips();
  const { data: regionStats, isLoading: regionsLoading } = useRegionStats();
  const { data: driverStats, isLoading: driversLoading } = useDriverPerformance();

  const isLoading = trendsLoading || votesLoading || regionsLoading || driversLoading;

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
          التقارير والإحصائيات 📈
        </h1>
        <p className="text-muted-foreground">
          تحليلات شاملة للحجوزات والرحلات والأداء
        </p>
      </div>

      <div className="grid gap-6">
        {/* Reservation Trends Chart */}
        <div className="card-soft p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              اتجاه الحجوزات (آخر 14 يوم)
            </h2>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reservationTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  name="إجمالي الحجوزات"
                  stroke="#0B6E4F" 
                  strokeWidth={2}
                  dot={{ fill: "#0B6E4F" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="confirmed" 
                  name="مؤكدة"
                  stroke="#22c55e" 
                  strokeWidth={2}
                  dot={{ fill: "#22c55e" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="pending" 
                  name="في الانتظار"
                  stroke="#F4A900" 
                  strokeWidth={2}
                  dot={{ fill: "#F4A900" }}
                />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Voted Trips */}
          <div className="card-soft p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-bold text-foreground">
                الرحلات الأكثر تصويتاً
              </h2>
            </div>
            {topVoted && topVoted.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topVoted} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis 
                      type="category" 
                      dataKey="origin" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      width={80}
                      tickFormatter={(value) => value.substring(0, 10)}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value, name, props) => [
                        `${value} صوت`,
                        `${props.payload.origin} ← ${props.payload.destination}`
                      ]}
                    />
                    <Bar dataKey="votes" fill="#F4A900" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                لا توجد أصوات بعد
              </p>
            )}
          </div>

          {/* Region Distribution */}
          <div className="card-soft p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">
                توزيع الحجوزات حسب المنطقة
              </h2>
            </div>
            {regionStats && regionStats.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={regionStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ region, percent }) => 
                        `${region} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={80}
                      dataKey="reservations"
                    >
                      {regionStats.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value) => [`${value} حجز`, "الحجوزات"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                لا توجد بيانات
              </p>
            )}
          </div>
        </div>

        {/* Driver Performance */}
        <div className="card-soft p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              أداء السائقين
            </h2>
          </div>
          {driverStats && driverStats.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={driverStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar 
                    dataKey="trips" 
                    name="عدد الرحلات"
                    fill="#0B6E4F" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              لا يوجد سائقين معتمدين بعد
            </p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
