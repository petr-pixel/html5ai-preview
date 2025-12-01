/**
 * Admin Dashboard - Správa projektu a uživatelů
 * 
 * Zobrazuje:
 * - Celkové statistiky
 * - Seznam uživatelů s možností správy
 * - Změna plánů
 * - Využití storage
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
  Search,
  Edit2,
  Save,
  X,
  ChevronDown,
  Mail,
  Calendar,
  Database,
  Check
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
    id: string
    email: string
    name: string
    plan: string
    storage_mb: number
    creatives: number
  }>
}

interface UserRecord {
  id: string
  email: string
  name: string | null
  plan: 'free' | 'pro' | 'enterprise'
  storage_used: number
  storage_limit: number
  is_admin: boolean
  created_at: string
  updated_at: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AdminDashboard() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [savingUser, setSavingUser] = useState<string | null>(null)

  const isAdmin = profile?.is_admin === true

  useEffect(() => {
    if (isAdmin) {
      loadData()
    }
  }, [isAdmin])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Load stats
      const { data: statsData, error: statsError } = await supabase.rpc('get_admin_stats')
      if (statsError) throw statsError
      setStats(statsData as AdminStats)

      // Load all users
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (usersError) throw usersError
      setUsers(usersData || [])
    } catch (err: any) {
      console.error('Failed to load admin data:', err)
      setError(err.message || 'Nepodařilo se načíst data')
    } finally {
      setLoading(false)
    }
  }

  const updateUserPlan = async (userId: string, newPlan: 'free' | 'pro' | 'enterprise') => {
    setSavingUser(userId)
    try {
      const storageLimit = newPlan === 'free' ? 100 * 1024 * 1024 : 
                          newPlan === 'pro' ? 1024 * 1024 * 1024 : 
                          10 * 1024 * 1024 * 1024 // 100MB, 1GB, 10GB

      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          plan: newPlan,
          storage_limit: storageLimit,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, plan: newPlan, storage_limit: storageLimit } : u
      ))
      setEditingUser(null)
    } catch (err: any) {
      console.error('Failed to update user:', err)
      alert('Nepodařilo se aktualizovat uživatele: ' + err.message)
    } finally {
      setSavingUser(null)
    }
  }

  const toggleUserAdmin = async (userId: string, isAdmin: boolean) => {
    setSavingUser(userId)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          is_admin: isAdmin,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_admin: isAdmin } : u
      ))
    } catch (err: any) {
      console.error('Failed to toggle admin:', err)
      alert('Nepodařilo se změnit admin práva: ' + err.message)
    } finally {
      setSavingUser(null)
    }
  }

  // Filter users by search
  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Not admin - show access denied
  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Přístup odepřen</h2>
          <p className="text-white/60">Tato sekce je pouze pro administrátory.</p>
        </div>
      </div>
    )
  }

  // Loading
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-400 mx-auto mb-4 animate-spin" />
          <p className="text-white/60">Načítání...</p>
        </div>
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Chyba</h2>
          <p className="text-white/60 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Zkusit znovu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 mesh-gradient-static">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Admin Dashboard</h1>
          <p className="text-white/50">Správa uživatelů a přehled projektu</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-5 py-2.5 glass-card hover:bg-white/10 text-white transition-all duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          Obnovit
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 p-1 bg-white/5 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            'px-5 py-2.5 rounded-lg font-medium transition-all duration-200',
            activeTab === 'overview' 
              ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/25' 
              : 'text-white/60 hover:text-white hover:bg-white/5'
          )}
        >
          Přehled
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={cn(
            'px-5 py-2.5 rounded-lg font-medium transition-all duration-200',
            activeTab === 'users' 
              ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/25' 
              : 'text-white/60 hover:text-white hover:bg-white/5'
          )}
        >
          Uživatelé ({users.length})
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={<Users className="w-6 h-6" />}
              label="Uživatelé"
              value={stats.users.total}
              subtext={`+${stats.users.new_7d} tento týden`}
              color="violet"
            />
            <StatCard
              icon={<Image className="w-6 h-6" />}
              label="Kreativy"
              value={stats.creatives.total}
              subtext={`+${stats.creatives.new_7d} tento týden`}
              color="cyan"
            />
            <StatCard
              icon={<HardDrive className="w-6 h-6" />}
              label="Storage"
              value={`${stats.storage.used_mb.toFixed(1)} MB`}
              subtext={`${stats.storage.percent.toFixed(1)}% z ${stats.storage.limit_mb} MB`}
              color={stats.storage.percent > 80 ? 'red' : stats.storage.percent > 60 ? 'amber' : 'emerald'}
            />
            <StatCard
              icon={<TrendingUp className="w-6 h-6" />}
              label="Růst (30d)"
              value={`+${stats.users.new_30d}`}
              subtext="nových uživatelů"
              color="pink"
            />
          </div>

          {/* Plans Breakdown */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              Rozdělení podle plánů
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <PlanCard plan="free" count={stats.users.by_plan.free || 0} />
              <PlanCard plan="pro" count={stats.users.by_plan.pro || 0} />
              <PlanCard plan="enterprise" count={stats.users.by_plan.enterprise || 0} />
            </div>
          </div>

          {/* Top Users */}
          {stats.top_users && stats.top_users.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-400" />
                Top uživatelé podle storage
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-white/40 text-sm">
                      <th className="pb-3 font-medium">Email</th>
                      <th className="pb-3 font-medium">Plán</th>
                      <th className="pb-3 font-medium">Storage</th>
                      <th className="pb-3 font-medium">Kreativy</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/80">
                    {stats.top_users.slice(0, 10).map((u, i) => (
                      <tr key={i} className="border-t border-white/5">
                        <td className="py-3">{u.email}</td>
                        <td className="py-3">
                          <PlanBadge plan={u.plan} />
                        </td>
                        <td className="py-3">{u.storage_mb.toFixed(1)} MB</td>
                        <td className="py-3">{u.creatives}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Hledat podle emailu nebo jména..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Users Table */}
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-left text-white/40 text-sm bg-white/5">
                  <th className="px-4 py-3 font-medium">Uživatel</th>
                  <th className="px-4 py-3 font-medium">Plán</th>
                  <th className="px-4 py-3 font-medium">Storage</th>
                  <th className="px-4 py-3 font-medium">Admin</th>
                  <th className="px-4 py-3 font-medium">Registrace</th>
                  <th className="px-4 py-3 font-medium">Akce</th>
                </tr>
              </thead>
              <tbody className="text-white/80">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">{u.name || '(bez jména)'}</div>
                        <div className="text-sm text-white/50">{u.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {editingUser === u.id ? (
                        <select
                          value={u.plan}
                          onChange={(e) => updateUserPlan(u.id, e.target.value as any)}
                          className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white"
                        >
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      ) : (
                        <PlanBadge plan={u.plan} />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        {formatStorageSize(u.storage_used)} / {formatStorageSize(u.storage_limit)}
                      </div>
                      <div className="w-20 h-1 bg-white/10 rounded-full mt-1">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min(100, (u.storage_used / u.storage_limit) * 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleUserAdmin(u.id, !u.is_admin)}
                        disabled={savingUser === u.id || u.id === user?.id}
                        className={cn(
                          'px-2 py-1 rounded text-xs font-medium transition-colors',
                          u.is_admin 
                            ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30' 
                            : 'bg-white/10 text-white/50 hover:bg-white/20',
                          (savingUser === u.id || u.id === user?.id) && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {u.is_admin ? 'Admin' : 'User'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/50">
                      {new Date(u.created_at).toLocaleDateString('cs-CZ')}
                    </td>
                    <td className="px-4 py-3">
                      {editingUser === u.id ? (
                        <button
                          onClick={() => setEditingUser(null)}
                          className="p-2 text-white/50 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditingUser(u.id)}
                          className="p-2 text-white/50 hover:text-white"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="p-8 text-center text-white/50">
                Žádní uživatelé nenalezeni
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatCard({ 
  icon, 
  label, 
  value, 
  subtext, 
  color 
}: { 
  icon: React.ReactNode
  label: string
  value: string | number
  subtext: string
  color: 'violet' | 'cyan' | 'emerald' | 'pink' | 'red' | 'amber'
}) {
  const colors = {
    violet: 'from-violet-500 to-purple-600',
    cyan: 'from-cyan-500 to-blue-600',
    emerald: 'from-emerald-500 to-teal-600',
    pink: 'from-pink-500 to-rose-600',
    red: 'from-red-500 to-orange-600',
    amber: 'from-amber-500 to-yellow-600',
  }
  
  const glows = {
    violet: 'shadow-violet-500/20',
    cyan: 'shadow-cyan-500/20',
    emerald: 'shadow-emerald-500/20',
    pink: 'shadow-pink-500/20',
    red: 'shadow-red-500/20',
    amber: 'shadow-amber-500/20',
  }

  return (
    <div className={`glass-card-hover p-6 ${glows[color]}`}>
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
        <div>
          <div className="text-sm text-white/50 font-medium mb-1">{label}</div>
          <div className="text-3xl font-bold text-white">{value}</div>
          <div className="text-xs text-white/40 mt-1">{subtext}</div>
        </div>
      </div>
    </div>
  )
}

function PlanCard({ plan, count }: { plan: string; count: number }) {
  const config = {
    free: { icon: <Zap className="w-5 h-5" />, gradient: 'from-slate-500 to-gray-600', label: 'Free', glow: '' },
    pro: { icon: <Crown className="w-5 h-5" />, gradient: 'from-amber-400 to-orange-500', label: 'Pro', glow: 'shadow-amber-500/20' },
    enterprise: { icon: <Building className="w-5 h-5" />, gradient: 'from-violet-500 to-purple-600', label: 'Enterprise', glow: 'shadow-violet-500/20' },
  }[plan] || { icon: <Zap className="w-5 h-5" />, gradient: 'from-slate-500 to-gray-600', label: plan, glow: '' }

  return (
    <div className={`p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200 ${config.glow}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white shadow-lg`}>
          {config.icon}
        </div>
        <span className="text-white font-semibold">{config.label}</span>
      </div>
      <div className="text-3xl font-bold text-white">{count}</div>
      <div className="text-xs text-white/40 mt-1">uživatelů</div>
    </div>
  )
}

function PlanBadge({ plan }: { plan: string }) {
  const config = {
    free: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    pro: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    enterprise: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  }[plan] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${config}`}>
      {plan.charAt(0).toUpperCase() + plan.slice(1)}
    </span>
  )
}
