import { useFeaturedProjects } from '@/hooks/useFeaturedProjects';
import { cn } from '@/lib/utils';

export const FeaturedBanner = () => {
  const { data: featuredProjects } = useFeaturedProjects();

  if (!featuredProjects?.length) return null;

  return (
    <div className="w-full border-b border-crypto-primary/10 bg-crypto-dark/50 backdrop-blur-md py-2">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Featured:
          </span>
          <div className="flex gap-2">
            {featuredProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1"
              >
                {project.logo && (
                  <img
                    src={project.logo}
                    alt={project.name}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span className="text-sm font-medium whitespace-nowrap">
                  {project.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
