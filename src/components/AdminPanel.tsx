import React, { useState, useMemo } from 'react';
import {
  Shield,
  Check,
  X,
  Ban,
  Plus,
  Trash2,
  Users,
  Eye,
  TrendingUp,
  Zap,
  Edit2,
  ExternalLink,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  DollarSign,
  Clock,
  Layers,
  FileText
} from 'lucide-react';
import type { Ad, AdminStats, Campaign, WithdrawalRequest, UserProfile } from '../lib/supabase';
import { formatSatsPlain } from '../utils';

interface AdminPanelProps {
  stats: AdminStats | null;
  pendingAds: Ad[];
  allAds: Ad[];
  adminUsers: UserProfile[];
  campaigns: Campaign[];
  withdrawals: WithdrawalRequest[];
  onApproveAd: (id: string) => Promise<void>;
  onRejectAd: (id: string) => Promise<void>;
  onToggleBan: (userId: string) => Promise<void>;
  onUpdateUserBalance?: (userId: string, newBalance: number) => Promise<void>;
  onCreateAd: (adData: Partial<Ad>) => Promise<void>;
  onUpdateAd: (id: string, adData: Partial<Ad>) => Promise<void>;
  onDeleteAd: (id: string) => Promise<void>;
}

type SortField = 'reward_sats' | 'duration_sec' | 'clicks_remaining' | 'status' | 'created_at';
type SortOrder = 'asc' | 'desc';

export function AdminPanel({
  stats,
  pendingAds,
  allAds,
  adminUsers,
  campaigns,
  withdrawals,
  onApproveAd,
  onRejectAd,
  onToggleBan,
  onUpdateUserBalance,
  onCreateAd,
  onUpdateAd,
  onDeleteAd,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'ads' | 'create' | 'users' | 'withdrawals' | 'campaigns'>('overview');

  // Estados de Ordenação e Filtros de Anúncios
  const [sortField, setSortField] = useState<SortField>('reward_sats');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Estados para Edição Modal de Anúncio
  const [editingAd, setEditingAd] = useState<Ad | null>(null);

  // Estados para Edição de Saldo do Utilizador
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newBalanceInput, setNewBalanceInput] = useState<string>('');

  // Estados para Modal de Confirmação de Ban
  const [userToConfirmBan, setUserToConfirmBan] = useState<UserProfile | null>(null);

  // Estados do Formulário de Criação de Anúncios
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTargetUrl, setNewTargetUrl] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newCategory, setNewCategory] = useState('crypto');
  const [newReward, setNewReward] = useState('20');
  const [newDuration, setNewDuration] = useState('15');
  const [newTotalViews, setNewTotalViews] = useState('1000');
  
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Lógica de Filtros e Ordenação
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedAds = useMemo(() => {
    return allAds
      .filter((ad) => {
        const matchesSearch =
          ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ad.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ad.domain.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || ad.status === statusFilter;
        const matchesCategory = categoryFilter === 'all' || ad.category === categoryFilter;
        return matchesSearch && matchesStatus && matchesCategory;
      })
      .sort((a, b) => {
        let aValue: any = a[sortField] ?? 0;
        let bValue: any = b[sortField] ?? 0;

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = (bValue as string).toLowerCase();
        }

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [allAds, searchTerm, statusFilter, categoryFilter, sortField, sortOrder]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-bitcoin-400" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-bitcoin-400" />
    );
  };

  // Funções de Gestão de Saldo do Utilizador
  const handleStartEditBalance = (user: UserProfile) => {
    setEditingUserId(user.id);
    setNewBalanceInput(String(user.sats_balance ?? 0));
  };

  const handleSaveBalance = async (userId: string) => {
    const parsed = parseInt(newBalanceInput, 10);
    if (isNaN(parsed) || parsed < 0) {
      setMessage({ type: 'error', text: 'Por favor introduza um saldo válido.' });
      return;
    }

    try {
      if (onUpdateUserBalance) {
        await onUpdateUserBalance(userId, parsed);
        setMessage({ type: 'success', text: 'Saldo atualizado com sucesso!' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Falha ao atualizar o saldo.' });
    } finally {
      setEditingUserId(null);
    }
  };

  // Funções de Ban/Unban
  const handleConfirmToggleBan = async () => {
    if (!userToConfirmBan) return;
    try {
      await onToggleBan(userToConfirmBan.id);
      setMessage({
        type: 'success',
        text: `Utilizador ${userToConfirmBan.is_banned ? 'desbanido' : 'banido'} com sucesso!`,
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Erro ao alterar estado de ban.' });
    } finally {
      setUserToConfirmBan(null);
    }
  };

  // submissão de Novo Anúncio
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      await onCreateAd({
        title: newTitle,
        description: newDescription,
        domain: newTargetUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''),
        image_url: newImageUrl || 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=600&q=80',
        category: newCategory,
        reward_sats: parseInt(newReward, 10) || 20,
        duration_sec: parseInt(newDuration, 10) || 15,
        clicks_target: parseInt(newTotalViews, 10) || 1000,
        clicks_remaining: parseInt(newTotalViews, 10) || 1000,
        status: 'active',
      });

      setMessage({ type: 'success', text: 'Anúncio oficial publicado com sucesso!' });
      setNewTitle('');
      setNewDescription('');
      setNewTargetUrl('');
      setNewImageUrl('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Erro ao criar o anúncio.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Submissão da Edição de Anúncio Existente
  const handleUpdateAdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAd) return;
    
    try {
      await onUpdateAd(editingAd.id, editingAd);
      setMessage({ type: 'success', text: 'Anúncio atualizado com sucesso!' });
      setEditingAd(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Erro ao atualizar o anúncio.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho de Navegação e Tabs */}
      <div className="flex flex-col gap-4 border-b border-ink-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bitcoin-500/20 text-bitcoin-400">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-white">Painel de Administração</h1>
            <p className="text-xs text-ink-400">Gestão centralizada do sistema e utilizadores</p>
          </div>
        </div>

        {/* Menu de Tabs */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              activeTab === 'overview' ? 'bg-bitcoin-500 text-ink-950' : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
            }`}
          >
            Geral
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`relative rounded-lg px-3 py-1.5 text-xs font-semibold ${
              activeTab === 'pending' ? 'bg-bitcoin-500 text-ink-950' : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
            }`}
          >
            Pendente
            {pendingAds.length > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-bold text-ink-950">
                {pendingAds.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('ads')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              activeTab === 'ads' ? 'bg-bitcoin-500 text-ink-950' : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
            }`}
          >
            Anúncios ({allAds.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${
              activeTab === 'create' ? 'bg-bitcoin-500 text-ink-950' : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            Criar
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              activeTab === 'users' ? 'bg-bitcoin-500 text-ink-950' : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
            }`}
          >
            Utilizadores ({adminUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              activeTab === 'withdrawals' ? 'bg-bitcoin-500 text-ink-950' : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
            }`}
          >
            Levantamentos ({withdrawals.length})
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              activeTab === 'campaigns' ? 'bg-bitcoin-500 text-ink-950' : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
            }`}
          >
            Campanhas ({campaigns.length})
          </button>
        </div>
      </div>

      {/* Alertas Globais */}
      {message && (
        <div
          className={`flex items-center justify-between rounded-xl border p-4 text-xs ${
            message.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-red-500/30 bg-red-500/10 text-red-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* TAB 1: VISÃO GERAL */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-ink-800 bg-ink-900/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-400 uppercase">Utilizadores Registados</span>
                <Users className="h-4 w-4 text-bitcoin-400" />
              </div>
              <p className="mt-2 text-2xl font-bold text-white">{stats?.total_users ?? adminUsers.length}</p>
              <p className="mt-1 text-[10px] text-ink-500">Contas ativas no sistema</p>
            </div>

            <div className="rounded-xl border border-ink-800 bg-ink-900/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-400 uppercase">Anúncios Ativos</span>
                <Eye className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="mt-2 text-2xl font-bold text-white">
                {stats?.active_ads ?? allAds.filter((a) => a.status === 'active').length}
              </p>
              <p className="mt-1 text-[10px] text-ink-500">A gerar visualizações</p>
            </div>

            <div className="rounded-xl border border-ink-800 bg-ink-900/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-400 uppercase">Cliques Validados</span>
                <TrendingUp className="h-4 w-4 text-bitcoin-400" />
              </div>
              <p className="mt-2 text-2xl font-bold text-white">{stats?.total_clicks?.toLocaleString() ?? 0}</p>
              <p className="mt-1 text-[10px] text-ink-500">Visualizações pagas aos utilizadores</p>
            </div>

            <div className="rounded-xl border border-ink-800 bg-ink-900/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-400 uppercase">Total Pago</span>
                <Zap className="h-4 w-4 text-amber-400" fill="currentColor" />
              </div>
              <p className="mt-2 text-2xl font-bold text-bitcoin-400">
                {formatSatsPlain(stats?.total_sats_paid ?? 0)} Sats
              </p>
              <p className="mt-1 text-[10px] text-ink-500">Distribuído via Lightning Network</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANÚNCIOS PENDENTES */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink-300">Anúncios de Anunciantes Pendentes de Revisão</h2>
          {pendingAds.length === 0 ? (
            <div className="rounded-xl border border-ink-800 bg-ink-900/20 p-8 text-center text-xs text-ink-400">
              Nenhum anúncio pendente para aprovação no momento.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingAds.map((ad) => (
                <div key={ad.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl border border-ink-800 bg-ink-900/40 p-4 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase">
                        {ad.category || 'Crypto'}
                      </span>
                      <h3 className="font-bold text-white text-sm">{ad.title}</h3>
                    </div>
                    <p className="text-xs text-ink-400 line-clamp-2">{ad.description}</p>
                    <div className="flex flex-wrap gap-4 pt-1 text-[11px] text-bitcoin-400 font-medium">
                      <span>Recompensa: {ad.reward_sats} Sats</span>
                      <span>Duração: {ad.duration_sec}s</span>
                      <span>Total Vistas: {ad.clicks_target}</span>
                      <a href={`https://${ad.domain}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-ink-400 hover:text-white">
                        <ExternalLink className="h-3 w-3" /> Link Destino
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => onApproveAd(ad.id)}
                      className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/30"
                    >
                      <Check className="h-3.5 w-3.5" /> Aprovar
                    </button>
                    <button
                      onClick={() => onRejectAd(ad.id)}
                      className="flex items-center gap-1 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/30"
                    >
                      <X className="h-3.5 w-3.5" /> Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TODOS OS ANÚNCIOS COM FILTROS E ORDENAÇÃO */}
      {activeTab === 'ads' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-500" />
              <input
                type="text"
                placeholder="Pesquisar por título, URL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-ink-800 bg-ink-900 pl-9 pr-3 py-2 text-xs text-white focus:border-bitcoin-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-ink-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-ink-800 bg-ink-900 px-3 py-2 text-xs text-white focus:border-bitcoin-500 focus:outline-none"
              >
                <option value="all">Todos os Estados</option>
                <option value="active">Ativos</option>
                <option value="pending">Pendentes</option>
                <option value="completed">Concluídos</option>
                <option value="rejected">Rejeitados</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-xl border border-ink-800 bg-ink-900 px-3 py-2 text-xs text-white focus:border-bitcoin-500 focus:outline-none"
              >
                <option value="all">Todas as Categorias</option>
                <option value="crypto">Crypto</option>
                <option value="shopping">Shopping</option>
                <option value="tech">Tech</option>
                <option value="finance">Finance</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-ink-800 bg-ink-900/40">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-ink-800 bg-ink-950/60 text-ink-400">
                <tr>
                  <th className="p-3 font-semibold">Título e Destino</th>
                  <th className="p-3 font-semibold">
                    <button onClick={() => handleSort('reward_sats')} className="group flex items-center gap-1 hover:text-white">
                      <span>Recompensa</span>
                      {renderSortIcon('reward_sats')}
                    </button>
                  </th>
                  <th className="p-3 font-semibold">
                    <button onClick={() => handleSort('duration_sec')} className="group flex items-center gap-1 hover:text-white">
                      <span>Tempo</span>
                      {renderSortIcon('duration_sec')}
                    </button>
                  </th>
                  <th className="p-3 font-semibold">
                    <button onClick={() => handleSort('clicks_remaining')} className="group flex items-center gap-1 hover:text-white">
                      <span>Vistas Restantes</span>
                      {renderSortIcon('clicks_remaining')}
                    </button>
                  </th>
                  <th className="p-3 font-semibold">
                    <button onClick={() => handleSort('status')} className="group flex items-center gap-1 hover:text-white">
                      <span>Estado</span>
                      {renderSortIcon('status')}
                    </button>
                  </th>
                  <th className="p-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800/50 text-ink-300">
                {filteredAndSortedAds.map((ad) => (
                  <tr key={ad.id} className="hover:bg-ink-800/30">
                    <td className="p-3 font-medium text-white max-w-[220px]">
                      <div className="truncate font-bold">{ad.title}</div>
                      <div className="truncate text-[10px] text-ink-500">{ad.domain}</div>
                    </td>
                    <td className="p-3 font-bold text-bitcoin-400">{formatSatsPlain(ad.reward_sats)} Sats</td>
                    <td className="p-3">{ad.duration_sec}s</td>
                    <td className="p-3">{ad.clicks_remaining?.toLocaleString() ?? 0} / {ad.clicks_target?.toLocaleString() ?? 0}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          ad.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : ad.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {ad.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => setEditingAd(ad)}
                        className="rounded p-1 text-ink-400 hover:bg-ink-800 hover:text-white"
                        title="Editar Anúncio"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteAd(ad.id)}
                        className="rounded p-1 text-ink-400 hover:bg-red-500/20 hover:text-red-400"
                        title="Eliminar Anúncio"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CRIAR NOVO ANÚNCIO */}
      {activeTab === 'create' && (
        <div className="max-w-2xl rounded-xl border border-ink-800 bg-ink-900/40 p-6 space-y-4">
          <h2 className="text-base font-bold text-white">Criar Anúncio Oficial do Sistema</h2>
          <p className="text-xs text-ink-400">Publicar anúncio ativo imediatamente para a lista dos utilizadores.</p>

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-300">Título</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Ganhe Bitcoin Diariamente"
                className="w-full rounded-xl border border-ink-800 bg-ink-900 px-3 py-2 text-xs text-white focus:border-bitcoin-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink-300">Descrição</label>
              <textarea
                required
                rows={3}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Descrição clara da oferta..."
                className="w-full rounded-xl border border-ink-800 bg-ink-900 px-3 py-2 text-xs text-white focus:border-bitcoin-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-300">URL Destino</label>
                <input
                  type="url"
                  required
                  value={newTargetUrl}
                  onChange={(e) => setNewTargetUrl(e.target.value)}
                  placeholder="https://exemplo.com"
                  className="w-full rounded-xl border border-ink-800 bg-ink-900 px-3 py-2 text-xs text-white focus:border-bitcoin-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-300">URL Imagem</label>
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://images.unsplash..."
                  className="w-full rounded-xl border border-ink-800 bg-ink-900 px-3 py-2 text-xs text-white focus:border-bitcoin-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-300">Categoria</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full rounded-xl border border-ink-800 bg-ink-900 px-3 py-2 text-xs text-white focus:border-bitcoin-500 focus:outline-none"
                >
                  <option value="crypto">Crypto</option>
                  <option value="shopping">Shopping</option>
                  <option value="tech">Tech</option>
                  <option value="finance">Finance</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-300">Recompensa (Sats)</label>
                <input
                  type="number"
                  min="1"
                  value={newReward}
                  onChange={(e) => setNewReward(e.target.value)}
                  className="w-full rounded-xl border border-ink-800 bg-ink-900 px-3 py-2 text-xs text-white focus:border-bitcoin-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-300">Duração (Segs)</label>
                <input
                  type="number"
                  min="5"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="w-full rounded-xl border border-ink-800 bg-ink-900 px-3 py-2 text-xs text-white focus:border-bitcoin-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-300">Total Vistas</label>
                <input
                  type="number"
                  min="10"
                  value={newTotalViews}
                  onChange={(e) => setNewTotalViews(e.target.value)}
                  className="w-full rounded-xl border border-ink-800 bg-ink-900 px-3 py-2 text-xs text-white focus:border-bitcoin-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-bitcoin-500 py-3 text-xs font-bold text-ink-950 hover:bg-bitcoin-400 disabled:opacity-50"
            >
              {submitting ? 'A Publicar...' : 'Publicar Anúncio Oficial'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: UTILIZADORES */}
      {activeTab === 'users' && (
        <div className="overflow-x-auto rounded-xl border border-ink-800 bg-ink-900/40">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-ink-800 bg-ink-950/60 text-ink-400">
              <tr>
                <th className="p-3 font-semibold">ID Utilizador</th>
                <th className="p-3 font-semibold">Username</th>
                <th className="p-3 font-semibold">Função</th>
                <th className="p-3 font-semibold">Saldo Atual</th>
                <th className="p-3 font-semibold">Total Ganho</th>
                <th className="p-3 font-semibold">Estado</th>
                <th className="p-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800/50 text-ink-300">
              {adminUsers.map((u) => (
                <tr key={u.id} className="hover:bg-ink-800/30">
                  <td className="p-3 font-mono text-[10px] text-ink-500">{u.id.slice(0, 8)}...</td>
                  <td className="p-3 font-medium text-white">{u.username || 'Utilizador'}</td>
                  <td className="p-3">
                    <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ${u.is_admin ? 'bg-bitcoin-500/20 text-bitcoin-400' : 'bg-ink-800 text-ink-400'}`}>
                      {u.is_admin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="p-3">
                    {editingUserId === u.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={newBalanceInput}
                          onChange={(e) => setNewBalanceInput(e.target.value)}
                          className="w-24 rounded-lg border border-bitcoin-500/50 bg-ink-950 px-2 py-1 text-xs font-bold text-white focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveBalance(u.id)}
                          className="rounded p-1 text-emerald-400 hover:bg-emerald-500/20"
                          title="Guardar Saldo"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingUserId(null)}
                          className="rounded p-1 text-ink-400 hover:bg-ink-800"
                          title="Cancelar"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-bitcoin-400">{formatSatsPlain(u.sats_balance ?? 0)} Sats</span>
                        <button
                          onClick={() => handleStartEditBalance(u)}
                          className="text-ink-500 hover:text-white transition-colors"
                          title="Editar Saldo"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="p-3">{formatSatsPlain(u.total_earned_sats || 0)} Sats</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${u.is_banned ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {u.is_banned ? <Ban className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                      {u.is_banned ? 'Banido' : 'Ativo'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setUserToConfirmBan(u)}
                      className={`rounded px-2.5 py-1 text-[10px] font-bold transition-all ${u.is_banned ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
                    >
                      {u.is_banned ? 'Desbanir' : 'Banir'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 6: LEVANTAMENTOS */}
      {activeTab === 'withdrawals' && (
        <div className="overflow-x-auto rounded-xl border border-ink-800 bg-ink-900/40">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-ink-800 bg-ink-950/60 text-ink-400">
              <tr>
                <th className="p-3 font-semibold">ID Utilizador</th>
                <th className="p-3 font-semibold">Montante</th>
                <th className="p-3 font-semibold">Invoice / LNURL</th>
                <th className="p-3 font-semibold">Estado</th>
                <th className="p-3 font-semibold">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800/50 text-ink-300">
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-ink-500">
                    Nenhum pedido de levantamento efetuado.
                  </td>
                </tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-ink-800/30">
                    <td className="p-3 font-mono text-[10px] text-ink-400">{w.user_id.slice(0, 8)}...</td>
                    <td className="p-3 font-bold text-bitcoin-400">{formatSatsPlain(w.amount_sats)} Sats</td>
                    <td className="p-3 max-w-[200px] truncate font-mono text-[10px]">{w.invoice_or_address}</td>
                    <td className="p-3">
                      <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                        w.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : w.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="p-3 text-[10px] text-ink-500">{new Date(w.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 7: CAMPANHAS */}
      {activeTab === 'campaigns' && (
        <div className="overflow-x-auto rounded-xl border border-ink-800 bg-ink-900/40">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-ink-800 bg-ink-950/60 text-ink-400">
              <tr>
                <th className="p-3 font-semibold">ID Campanha</th>
                <th className="p-3 font-semibold">Orçamento Total</th>
                <th className="p-3 font-semibold">Estado Pagamento</th>
                <th className="p-3 font-semibold">Data Criação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800/50 text-ink-300">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-ink-500">
                    Nenhuma campanha de anunciante registada.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-ink-800/30">
                    <td className="p-3 font-mono text-[10px] text-ink-400">{c.id.slice(0, 8)}...</td>
                    <td className="p-3 font-bold text-bitcoin-400">{formatSatsPlain(c.total_budget_sats)} Sats</td>
                    <td className="p-3">
                      <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                        c.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3 text-[10px] text-ink-500">{new Date(c.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE EDIÇÃO COMPLETA DE ANÚNCIO */}
      {editingAd && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-ink-800 bg-ink-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-ink-800 pb-3">
              <h3 className="text-sm font-bold text-white">Editar Anúncio #{editingAd.id.slice(0, 6)}</h3>
              <button onClick={() => setEditingAd(null)} className="text-ink-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateAdSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-ink-300">Título</label>
                <input
                  type="text"
                  value={editingAd.title}
                  onChange={(e) => setEditingAd({ ...editingAd, title: e.target.value })}
                  className="w-full rounded-lg border border-ink-800 bg-ink-950 px-3 py-1.5 text-xs text-white focus:border-bitcoin-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-ink-300">URL Destino</label>
                <input
                  type="url"
                  value={editingAd.domain}
                  onChange={(e) => setEditingAd({ ...editingAd, domain: e.target.value })}
                  className="w-full rounded-lg border border-ink-800 bg-ink-950 px-3 py-1.5 text-xs text-white focus:border-bitcoin-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-ink-300">Recompensa (Sats)</label>
                  <input
                    type="number"
                    value={editingAd.reward_sats}
                    onChange={(e) => setEditingAd({ ...editingAd, reward_sats: parseInt(e.target.value, 10) || 0 })}
                    className="w-full rounded-lg border border-ink-800 bg-ink-950 px-3 py-1.5 text-xs text-white focus:border-bitcoin-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-ink-300">Estado</label>
                  <select
                    value={editingAd.status}
                    onChange={(e) => setEditingAd({ ...editingAd, status: e.target.value as any })}
                    className="w-full rounded-lg border border-ink-800 bg-ink-950 px-3 py-1.5 text-xs text-white focus:border-bitcoin-500 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAd(null)}
                  className="rounded-lg bg-ink-800 px-3 py-1.5 text-xs text-ink-300 hover:bg-ink-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-bitcoin-500 px-4 py-1.5 text-xs font-bold text-ink-950 hover:bg-bitcoin-400"
                >
                  Guardar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE BAN */}
      {userToConfirmBan && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-red-500/40 bg-ink-900 p-6 shadow-2xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-400 mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">
              {userToConfirmBan.is_banned ? 'Desbanir Utilizador?' : 'Confirmar Ban de Conta?'}
            </h3>
            <p className="mt-2 text-xs text-ink-400">
              {userToConfirmBan.is_banned
                ? `Reativar acesso para o utilizador ${userToConfirmBan.username || userToConfirmBan.id.slice(0, 8)}?`
                : `Tem a certeza que deseja banir ${userToConfirmBan.username || userToConfirmBan.id.slice(0, 8)}? O utilizador perderá imediatamente acesso às recompensas.`}
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setUserToConfirmBan(null)}
                className="rounded-lg bg-ink-800 px-4 py-2 text-xs font-semibold text-ink-300 hover:bg-ink-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmToggleBan}
                className={`rounded-lg px-4 py-2 text-xs font-bold text-white ${
                  userToConfirmBan.is_banned ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {userToConfirmBan.is_banned ? 'Sim, Desbanir' : 'Sim, Banir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}