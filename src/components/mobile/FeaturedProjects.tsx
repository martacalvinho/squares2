import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { formatSol } from "@/lib/price";

interface FeaturedProject {
  id: number;
  project_name: string;
  project_link: string;
  project_logo: string | null;
  telegram_link: string | null;
  chart_link: string | null;
  current_bid: number;
}

export const MobileFeaturedProjects = () => {
  const [projects, setProjects] = useState<FeaturedProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProjects();
    const subscription = supabase
      .channel('featured_projects')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'boost_slots' }, () => {
        fetchFeaturedProjects();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchFeaturedProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('boost_slots')
        .select('*')
        .order('current_bid', { ascending: false })
        .limit(3);

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching featured projects:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-crypto-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-crypto-primary to-crypto-secondary bg-clip-text text-transparent">
          Featured Projects
        </h2>
        <p className="text-muted-foreground mt-2">
          Top projects by bid amount
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {projects.map((project) => (
          <Card key={project.id} className="overflow-hidden">
            <CardHeader className="p-4">
              <div className="flex items-center gap-4">
                {project.project_logo && (
                  <img
                    src={project.project_logo}
                    alt={`${project.project_name} logo`}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">
                    {project.project_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatSol(project.current_bid)} SOL
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => window.open(project.project_link, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visit Project
                </Button>
                {project.telegram_link && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(project.telegram_link!, '_blank')}
                  >
                    Telegram
                  </Button>
                )}
                {project.chart_link && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(project.chart_link!, '_blank')}
                  >
                    Chart
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};