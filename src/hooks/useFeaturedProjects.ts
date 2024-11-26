import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface FeaturedProject {
  id: string;
  name: string;
  logo?: string;
}

export const useFeaturedProjects = () => {
  return useQuery({
    queryKey: ['featured-projects'],
    queryFn: async () => {
      const { data: boostedProjects, error } = await supabase
        .from('boosts')
        .select('project_id, projects(name, logo)')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return boostedProjects.map(bp => ({
        id: bp.project_id,
        name: bp.projects?.name || 'Unknown Project',
        logo: bp.projects?.logo
      })) as FeaturedProject[];
    }
  });
};
