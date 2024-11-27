import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { ArrowRight, Sparkles } from "lucide-react";

interface Activity {
  id: number;
  created_at: string;
  spot_id: number;
  project_name: string;
  previous_project_name: string | null;
  transaction_signature: string;
}

export const MobileActivityFeed = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    const subscription = supabase
      .channel('activities')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spot_history' }, () => {
        fetchActivities();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('spot_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-crypto-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
      </div>
      <div className="divide-y">
        {activities.map((activity) => {
          const isSteal = !!activity.previous_project_name;
          return (
            <div
              key={activity.id}
              className="p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "mt-1 p-2 rounded-full",
                  isSteal ? "bg-red-100" : "bg-green-100"
                )}>
                  <Sparkles className={cn(
                    "w-4 h-4",
                    isSteal ? "text-red-500" : "text-green-500"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium truncate">
                      {activity.project_name}
                    </span>
                    {isSteal && (
                      <>
                        <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground truncate">
                          {activity.previous_project_name}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {isSteal ? "Stole" : "Claimed"} spot #{activity.spot_id + 1}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <a
                  href={`https://solscan.io/tx/${activity.transaction_signature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  View Transaction
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
