/**
 * Admin Dashboard - Přehled celého projektu
 * 
 * Zobrazuje:
 * - Celkové využití storage (Supabase free tier limit)
 * - Počet uživatelů a jejich růst
 * - Top uživatelé podle využití
 * - Denní statistiky
 */

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/Auth'
import { formatStorageSize } from '@/lib/supabase'
import {
  Users,
  Image,
  HardDrive,
  TrendingUp,
  AlertTriangle,
  Shield,
  RefreshCw,
  Crown,
  Zap,
  Building,
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface AdminStats {
  users: {
    total: number
    new_7d: number
    new_30d: number
    by_plan: Record<string, number>
  }
  creatives: {
    total: number
    new_7d: number
    new_30d: number
  }
  storage: {
    used_bytes: number
    used_mb: number
    limit_mb: number
    percent: number
  }
  top_users: Array<{
    email: string
    name: string
    plan: string
    storage_mb: number
    creatives: number
  }>
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AdminDashboard() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = profile?.is_admin === true

  useEffect(() => {
    if (isAdmin) {
      loadStats()
    }
  }, [isAdmin])

  const loadStats = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.rpc('get_admin_stats')
      
      if (error) throw error
      
      setStats(data as AdminStats)
    } catch (err: any) {
      console.error('Failed to load admin stats:', err)
      setError(err.message || 'Nepodařilo se načíst statistiky')
    } finally {
      setLoading(false)
    }
  }

  // Not admin - show access denied
  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Přístup odepřen</h2>
          <p className="text-gray-500">
            Tato stránka je pouze pro administrátory.
          </p>
        </div>
      </div>
    )
  }

  // Loading
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Chyba</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={loadStats}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Zkusit znovu
          </button>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const storageWarning = stats.storage.percent > 80
  const storageCritical = stats.storage.percent > 95

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500">Přehled celého projektu</p>
          </div>
          <button
            onClick={loadStats}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Obnovit
          </button>
        </div>

        {/* Storage Warning */}
        {storageWarning && (
          <div className={`p-4 rounded-xl border ${storageCritical ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-center gap-3">
              <AlertTriangle className={`w-6 h-6 ${storageCritical ? 'text-red-500' : 'text-yellow-500'}`} />
              <div>
                <h3 className={`font-semibold ${storageCritical ? 'text-red-800' : 'text-yellow-800'}`}>
                  {storageCritical ? 'Kritický stav storage!' : 'Varování: Blížíte se limitu'}
                </h3>
                <p className={`text-sm ${storageCritical ? 'text-red-600' : 'text-yellow-600'}`}>
                  Využito {stats.storage.percent}% z Supabase free tier limitu (1 GB).
                  {storageCritical && ' Zvažte upgrade nebo smazání starých dat.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Users */}
          <StatCard
            icon={<Users className="w-6 h-6" />}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            label="Uživatelé"
            value={stats.users.total}
            subtext={`+${stats.users.new_7d} za týden`}
          />

          {/* Creatives */}
          <StatCard
            icon={<Image className="w-6 h-6" />}
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
            label="Kreativy"
            value={stats.creatives.total}
            subtext={`+${stats.creatives.new_7d} za týden`}
          />

          {/* Storage */}
          <StatCard
            icon={<HardDrive className="w-6 h-6" />}
            iconBg={storageCritical ? "bg-red-100" : storageWarning ? "bg-yellow-100" : "bg-green-100"}
            iconColor={storageCritical ? "text-red-600" : storageWarning ? "text-yellow-600" : "text-green-600"}
            label="Storage"
            value={`${stats.storage.used_mb} MB`}
            subtext={`${stats.storage.percent}% z 1 GB`}
            progress={stats.storage.percent}
            progressColor={storageCritical ? "bg-red-500" : storageWarning ? "bg-yellow-500" : "bg-green-500"}
          />

          {/* Growth */}
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
            label="Růst (30 dní)"
            value={`+${stats.users.new_30d}`}
            subtext="nových uživatelů"
          />
        </div>

        {/* Plans Breakdown */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Uživatelé podle plánu</h2>
          <div className="grid grid-cols-3 gap-4">
            <PlanCard
              icon={<Zap className="w-5 h-5" />}
              name="Free"
              count={stats.users.by_plan?.free || 0}
              color="bg-gray-100 text-gray-600"
            />
            <PlanCard
              icon={<Crown className="w-5 h-5" />}
              name="Pro"
              count={stats.users.by_plan?.pro || 0}
              color="bg-purple-100 text-purple-600"
            />
            <PlanCard
              icon={<Building className="w-5 h-5" />}
              name="Enterprise"
              count={stats.users.by_plan?.enterprise || 0}
              color="bg-blue-100 text-blue-600"
            />
          </div>
        </div>

        {/* Top Users */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top uživatelé (podle storage)</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3 font-medium">Uživatel</th>
                  <th className="pb-3 font-medium">Plán</th>
                  <th className="pb-3 font-medium text-right">Kreativy</th>
                  <th className="pb-3 font-medium text-right">Storage</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_users?.map((user, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-3">
                      <div>
                        <div className="font-medium text-gray-900">{user.name || 'Bez jména'}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.plan === 'pro' ? 'bg-purple-100 text-purple-700' :
                        user.plan === 'enterprise' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {user.plan || 'free'}
                      </span>
                    </td>
                    <td className="py-3 text-right text-gray-900">{user.creatives}</td>
                    <td className="py-3 text-right text-gray-900">{user.storage_mb} MB</td>
                  </tr>
                ))}
                {(!stats.top_users || stats.top_users.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      Zatím žádní uživatelé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Supabase Limits Info */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">Supabase Free Tier limity</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-blue-600 font-medium">Storage</div>
              <div className="text-blue-900">1 GB</div>
            </div>
            <div>
              <div className="text-blue-600 font-medium">Database</div>
              <div className="text-blue-900">500 MB</div>
            </div>
            <div>
              <div className="text-blue-600 font-medium">Bandwidth</div>
              <div className="text-blue-900">5 GB / měsíc</div>
            </div>
            <div>
              <div className="text-blue-600 font-medium">Users</div>
              <div className="text-blue-900">50,000 MAU</div>
            </div>
          </div>
          <p className="mt-3 text-sm text-blue-700">
            Pro upgrade na Pro tier ($25/měsíc) získáš 8 GB storage, 100 GB bandwidth a další výhody.
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StatCardProps {
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  label: string
  value: string | number
  subtext: string
  progress?: number
  progressColor?: string
}

function StatCard({ icon, iconBg, iconColor, label, value, subtext, progress, progressColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-500">{subtext}</div>
      {progress !== undefined && (
        <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${progressColor} rounded-full`}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}
    </div>
  )
}

interface PlanCardProps {
  icon: React.ReactNode
  name: string
  count: number
  color: string
}

function PlanCard({ icon, name, count, color }: PlanCardProps) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="font-medium">{name}</span>
      </div>
      <div className="text-2xl font-bold">{count}</div>
    </div>
  )
}

export default AdminDashboard
