import { Users, TrendingUp, Award, MessageCircle, Rocket, Zap, Sword } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StatsBarProps {
  stats?: {
    occupiedSpots: number;
    totalBids: number;
    highestBid: number;
    totalUsers: number;
    totalComments: number;
    boostedProjects: number;
  };
  variant?: 'default' | 'mobile';
}

export const StatsBar = ({ stats, variant = 'default' }: StatsBarProps) => {
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
      mobileHide: false
    },
    {
      label: "Comments",
      value: finalStats?.totalComments || 0,
      icon: MessageCircle,
      color: "from-blue-500 to-cyan-500",
      mobileHide: false
    }
  ];

  const visibleStats = variant === 'mobile' 
    ? statItems
    : statItems.filter(stat => !stat.mobileHide);

  return (
    <div className={cn(
      "w-full",
      variant === 'mobile' ? "grid grid-cols-2 gap-4" : "flex flex-wrap gap-4"
    )}>
      {visibleStats.map((stat, index) => (
        <TooltipProvider key={index}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors",
                  variant === 'mobile' && "flex-col items-center text-center px-2"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg bg-gradient-to-r",
                  stat.color
                )}>
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-[60px]">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="font-medium">{stat.value}</p>
                </div>
              </div>
            </TooltipTrigger>
            {stat.tooltip && (
              <TooltipContent>
                <p>{stat.tooltip}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
};