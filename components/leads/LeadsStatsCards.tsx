"use client"

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Copy, TrendingUp, Package, Database, AlertTriangle } from "lucide-react";
import { fetchLeadsStats, LeadFilters } from '@/services/leadService';

interface LeadStats {
  totalLeads: number;
  leadsBySource: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;
  duplicatesBySource: Array<{
    source: string;
    duplicates: number;
    percentage: number;
  }>;
  totalBatches: number;
  processingBatches: number;
  completedBatches: number;
  failedBatches: number;
  totalDuplicates: number;
  dncMatches: number;
  leadsByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  leadsByCost: {
    totalCost: number;
    averageCost: number;
    minCost: number;
    maxCost: number;
  };
  monthOverMonthGrowth: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

interface LeadsStatsCardsProps {
  filters?: LeadFilters;
  onStatsLoad?: (stats: LeadStats) => void;
}

export default function LeadsStatsCards({ filters, onStatsLoad }: LeadsStatsCardsProps) {
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchLeadsStats(filters);
      setStats(data);
      onStatsLoad?.(data);
    } catch (error) {
      console.error("Error loading stats:", error);
      setError("Failed to load statistics");

      // Don't set fallback data - let the error state show
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [filters]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error && !stats) {
    return (
      <Card className="border-red-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-red-600">Unable to Load Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-sm">{error}</div>
          <p className="text-muted-foreground text-xs mt-2">
            Please check your database connection and try refreshing the page.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">No Data Available</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">
            No lead statistics available for the selected filters.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get top source for display
  const topSource = stats.leadsBySource.length > 0 ? stats.leadsBySource[0] : null;
  const topDuplicateSource = stats.duplicatesBySource.length > 0 ? stats.duplicatesBySource[0] : null;


  const statCards = [
    {
      title: "Total Leads",
      value: stats.totalLeads.toLocaleString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      subtitle: `${stats.monthOverMonthGrowth >= 0 ? '+' : ''}${stats.monthOverMonthGrowth}% from last month`
    },
    {
      title: "Top Supplier",
      value: topSource ? topSource.count.toLocaleString() : '0',
      icon: Database,
      color: "text-green-600",
      bgColor: "bg-green-50",
      subtitle: topSource ? `${topSource.source} (${topSource.percentage}% of filtered)` : 'No data'
    },
    {
      title: "Total Duplicates",
      value: stats.totalDuplicates.toLocaleString(),
      icon: Copy,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      subtitle: topDuplicateSource ? `Most from ${topDuplicateSource.source}` : 'System-wide duplicates'
    },
    {
      title: "Total Batches",
      value: stats.totalBatches.toLocaleString(),
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      subtitle: `${stats.processingBatches} processing, ${stats.failedBatches} failed`
    },
    {
      title: "DNC Matches",
      value: stats.dncMatches.toLocaleString(),
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      subtitle: "Do Not Contact matches"
    },
    {
      title: "Average Cost",
      value: `$${stats.leadsByCost.averageCost.toFixed(2)}`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      subtitle: `Total: $${stats.leadsByCost.totalCost.toLocaleString()}`
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className={`p-2 rounded-full ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Top Sources and Status Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top Lead Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.leadsBySource.slice(0, 4).map((source) => (
                <div key={source.source} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{source.source}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{source.count}</span>
                    <span className="text-xs text-muted-foreground">({source.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Lead Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.leadsByStatus.slice(0, 4).map((status) => (
                <div key={status.status} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{status.status}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{status.count}</span>
                    <span className="text-xs text-muted-foreground">({status.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
