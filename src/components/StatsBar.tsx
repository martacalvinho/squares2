import { Users, TrendingUp, Award, MessageCircle, Rocket, Zap, Sword } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import cn from "classnames";

interface StatsBarProps {
  stats?: {
    occupiedSpots: number;
    totalBids: number;
    highestBid: number;
    totalUsers: number;
    totalComments: number;
    boostedProjects: number;
  };
}

export const StatsBar = ({ stats }: StatsBarProps) => {
  const { data: dbStats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      // Get unique wallets from both wallet_stats and boost_contributions
      const { data: uniqueWallets } = await supabase
        .rpc('get_unique_wallets_count');

      const [
        occupiedCount,
        { data: spots },
        { count: totalComments },
        { data: boostStats }
      ] = await Promise.all([
        supabase.from('spots').select('*', { count: 'exact', head: true })
          .not('project_name', 'is', null),
        supabase.from('spots').select('current_bid').order('current_bid', { ascending: false }).limit(1),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
        supabase.from('boost_stats').select('total_projects_boosted').single()
      ]);

      return {
        occupiedSpots: occupiedCount.count || 0,
        totalBids: occupiedCount.count || 0,
        highestBid: spots?.[0]?.current_bid || 0,
        totalUsers: uniqueWallets || 0,
        totalComments: totalComments || 0,
        boostedProjects: boostStats?.total_projects_boosted || 0
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
      label: "Occupied",
      value: finalStats?.occupiedSpots || 0,
      icon: Users,
      color: "from-pink-500 to-rose-500",
      mobileHide: false
    },
    {
      label: "Highest Bid",
      value: `${finalStats?.highestBid || 0} SOL`,
      icon: Award,
      color: "from-amber-500 to-orange-500",
      mobileHide: false
    },
    {
      label: "Boosted",
      value: finalStats?.boostedProjects || 0,
      icon: Rocket,
      color: "from-purple-500 to-indigo-500",
      tooltip: "Total number of projects that have been boosted",
      mobileHide: false
    },
    {
      label: "Users",
      value: finalStats?.totalUsers || 0,
      icon: Users,
      color: "from-green-500 to-emerald-500",
      tooltip: "Unique wallets that have interacted with the platform",
      mobileHide: true
    },
    {
      label: "Comments",
      value: finalStats?.totalComments || 0,
      icon: MessageCircle,
      color: "from-blue-500 to-cyan-500",
      mobileHide: true
    }
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-2 md:px-0">
      {statItems.map((stat, index) => (
        <div
          key={index}
          className={cn(
            "glass-effect rounded-lg px-3 py-2 flex items-center gap-2 min-w-fit hover:bg-white/5 transition-colors group relative",
            stat.mobileHide && "hidden md:flex"
          )}
          title={stat.tooltip}
        >
          <div className={`bg-gradient-to-r ${stat.color} p-1.5 rounded-md`}>
            <stat.icon className="w-3 h-3 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-400">{stat.label}</p>
            <p className="text-sm font-semibold text-white">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};