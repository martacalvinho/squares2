import { Bitcoin, Users, TrendingUp, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StatsBarProps {
  stats?: {
    totalSpots: number;
    occupiedSpots: number;
    totalBids: number;
    highestBid: number;
  };
}

export const StatsBar = ({ stats }: StatsBarProps) => {
  const { data: dbStats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const [spotsCount, occupiedCount, { data: spots }] = await Promise.all([
        supabase.from('spots').select('*', { count: 'exact', head: true }),
        supabase.from('spots').select('*', { count: 'exact', head: true })
          .not('project_name', 'is', null),
        supabase.from('spots').select('current_bid').order('current_bid', { ascending: false }).limit(1)
      ]);

      return {
        totalSpots: spotsCount.count || 0,
        occupiedSpots: occupiedCount.count || 0,
        totalBids: occupiedCount.count || 0, // For now, using occupied spots as total bids
        highestBid: spots?.[0]?.current_bid || 0
      };
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  if (isLoading) {
    return <div>Loading stats...</div>;
  }

  const finalStats = stats || dbStats;

  const statItems = [
    {
      label: "Total Spots",
      value: finalStats?.totalSpots || 0,
      icon: Bitcoin,
      color: "from-purple-500 to-indigo-500",
    },
    {
      label: "Occupied Spots",
      value: finalStats?.occupiedSpots || 0,
      icon: Users,
      color: "from-pink-500 to-rose-500",
    },
    {
      label: "Total Bids",
      value: finalStats?.totalBids || 0,
      icon: TrendingUp,
      color: "from-green-500 to-emerald-500",
    },
    {
      label: "Highest Bid",
      value: `${finalStats?.highestBid || 0} SOL`,
      icon: Award,
      color: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((stat, index) => (
        <div
          key={index}
          className="glass-effect rounded-xl p-4 hover:scale-105 transition-transform duration-300"
        >
          <div className={`bg-gradient-to-r ${stat.color} p-2 rounded-lg inline-block mb-2`}>
            <stat.icon className="w-5 h-5 text-white" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm text-gray-400">{stat.label}</h3>
            <p className="text-xl font-bold text-white">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};