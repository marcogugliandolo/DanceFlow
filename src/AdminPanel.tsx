import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, LayoutDashboard, CalendarDays, DollarSign, Activity } from 'lucide-react';

interface Stats {
  usersCount: number;
  activitiesCount: number;
  sessionsCount: number;
  totalRevenue: number;
  totalHours: number;
}

interface UserStat {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  role: string;
  activitiesCount: number;
  sessionsCount: number;
}

export default function AdminPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/users')
        ]);
        
        if (!statsRes.ok || !usersRes.ok) throw new Error("Error fetching admin data");
        
        const statsData = await statsRes.json();
        const usersData = await usersRes.json();

        setStats(statsData);
        setUsers(usersData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  if (loading) return <div className="text-center py-20 text-zinc-500">Cargando panel de administración...</div>;
  if (error) return <div className="text-center py-20 text-rose-500">Error: {error}</div>;

  return (
    <div className="w-full max-w-6xl mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-3xl font-black text-zinc-900 dark:text-white flex items-center justify-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-rose-500" />
            Panel de Director
        </h2>
        <p className="text-center text-zinc-500 dark:text-zinc-400 mt-2">Visión global de la academia</p>
      </motion.div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Profesores" value={stats.usersCount} icon={<Users className="w-6 h-6 text-fuchsia-500" />} />
          <StatCard title="Total Actividades" value={stats.activitiesCount} icon={<Activity className="w-6 h-6 text-rose-500" />} />
          <StatCard title="Total Sesiones" value={stats.sessionsCount} icon={<CalendarDays className="w-6 h-6 text-orange-500" />} />
          <StatCard title="Ingresos Totales (Clases)" value={`${stats.totalRevenue.toFixed(2)}€`} icon={<DollarSign className="w-6 h-6 text-green-500" />} />
          <StatCard title="Horas Totales" value={`${stats.totalHours.toFixed(1)} h`} icon={<CalendarDays className="w-6 h-6 text-blue-500" />} />
        </div>
      )}

      <div className="bg-white dark:bg-zinc-800 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-700 shadow-xl shadow-zinc-200/40 dark:shadow-black/20">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Listado de Profesores</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="py-3 px-4 font-semibold text-zinc-500 dark:text-zinc-400">Nombre</th>
                <th className="py-3 px-4 font-semibold text-zinc-500 dark:text-zinc-400">Email</th>
                <th className="py-3 px-4 font-semibold text-zinc-500 dark:text-zinc-400 text-center">Actividades</th>
                <th className="py-3 px-4 font-semibold text-zinc-500 dark:text-zinc-400 text-center">Sesiones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-zinc-100 dark:border-zinc-700/50 hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-zinc-900 dark:text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-500 font-bold flex-shrink-0">
                      {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full rounded-full" /> : u.name?.charAt(0).toUpperCase()}
                    </div>
                    {u.name}
                  </td>
                  <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400">{u.email}</td>
                  <td className="py-3 px-4 text-center font-bold text-zinc-700 dark:text-zinc-300">
                    {u.activitiesCount}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-zinc-700 dark:text-zinc-300">
                    {u.sessionsCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-zinc-800 rounded-3xl p-5 flex items-center gap-4 border border-zinc-200 dark:border-zinc-700 shadow-xl shadow-zinc-200/40 dark:shadow-black/20"
    >
      <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-zinc-100 dark:border-zinc-800 flex-shrink-0 shadow-inner">
        {icon}
      </div>
      <div>
        <p className="text-xs sm:text-sm font-semibold text-zinc-500 dark:text-zinc-400">{title}</p>
        <p className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white mt-0.5">{value}</p>
      </div>
    </motion.div>
  );
}
