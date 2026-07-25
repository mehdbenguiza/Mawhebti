import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, TrendingUp, Users, Clock, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { api } from '../../lib/api';

interface CampaignData {
  id: string;
  title: string;
  status: string;
  target: number;
  collected: number;
}

interface StatsData {
  total_target: number;
  total_collected: number;
  progress_percentage: number;
  donors_count: number;
  donations_count: number;
  average_donation: number;
  campaigns: CampaignData[];
}

export function CrowdfundingDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Assuming we have an endpoint for this
    // For now, we mock the data since the endpoint might not be fully hooked to frontend api client yet
    const fetchStats = async () => {
      try {
        // const res = await api.get('/campaigns/stats/mine');
        // setStats(res.data);
        
        // Mock data for MVP Display
        setTimeout(() => {
          setStats({
            total_target: 15000,
            total_collected: 8450,
            progress_percentage: 56.33,
            donors_count: 142,
            donations_count: 150,
            average_donation: 56.33,
            campaigns: [
              {
                id: '1',
                title: 'Achat de matériel vidéo',
                status: 'ACTIVE',
                target: 5000,
                collected: 3200
              },
              {
                id: '2',
                title: 'Tournée en Tunisie',
                status: 'PENDING_REVIEW',
                target: 10000,
                collected: 5250
              }
            ]
          });
          setLoading(false);
        }, 800);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-white">Chargement des données financières...</div>;
  }

  if (!stats) {
    return <div className="p-8 text-center text-white">Erreur de chargement.</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Finance & Crowdfunding</h1>
          <p className="text-gray-400">Gérez vos campagnes de financement participatif en toute sécurité.</p>
        </div>
        <button 
          onClick={() => navigate('/dashboard/campaigns/new')}
          className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white font-medium hover:opacity-90 transition-opacity flex items-center space-x-2"
        >
          <Coins className="w-5 h-5" />
          <span>Créer une campagne</span>
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Coins className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-sm font-medium text-purple-400">Total Récolté</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{stats.total_collected.toLocaleString()} €</div>
          <div className="text-sm text-gray-400">sur {stats.total_target.toLocaleString()} € (Objectif)</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-sm font-medium text-blue-400">Progression</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{stats.progress_percentage}%</div>
          <div className="w-full bg-white/10 rounded-full h-2 mt-4">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full" 
              style={{ width: `${Math.min(100, stats.progress_percentage)}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <Users className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-sm font-medium text-green-400">Donateurs</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{stats.donors_count}</div>
          <div className="text-sm text-gray-400">{stats.donations_count} dons au total</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-500/20 rounded-xl">
              <Coins className="w-6 h-6 text-orange-400" />
            </div>
            <span className="text-sm font-medium text-orange-400">Don Moyen</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{stats.average_donation.toLocaleString()} €</div>
          <div className="text-sm text-gray-400">par donateur</div>
        </div>
      </div>

      {/* Mes Campagnes */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6">Mes Campagnes</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {stats.campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-white">{campaign.title}</h3>
                  {campaign.status === 'ACTIVE' && (
                    <span className="flex items-center px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      ACTIVE
                    </span>
                  )}
                  {campaign.status === 'PENDING_REVIEW' && (
                    <span className="flex items-center px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-medium rounded-full border border-orange-500/30">
                      <Clock className="w-3 h-3 mr-1" />
                      EN REVUE
                    </span>
                  )}
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Récolté</span>
                    <span className="text-white font-medium">{campaign.collected} € / {campaign.target} €</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full" 
                      style={{ width: `${Math.min(100, (campaign.collected / campaign.target) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-4">
                <button className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-colors">
                  Gérer
                </button>
                {campaign.status === 'ACTIVE' && (
                  <button className="py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {stats.campaigns.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 border border-dashed border-gray-700 rounded-2xl">
              Vous n'avez aucune campagne active.
            </div>
          )}
        </div>
      </div>
      
      {/* Sécurité Notice */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 flex items-start space-x-4">
        <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
          <AlertTriangle className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h4 className="text-blue-400 font-bold mb-1">Architecture Zero Trust & Idempotente</h4>
          <p className="text-sm text-gray-400">
            Toutes les transactions financières sont traitées de manière sécurisée et immuable. Si vous êtes un mineur, 
            les fonds seront obligatoirement transférés vers le compte bancaire vérifié (KYC) de votre parent. 
            Aucune opération n'est validée côté frontend, tout est géré par Webhooks sécurisés.
          </p>
        </div>
      </div>
    </div>
  );
}
