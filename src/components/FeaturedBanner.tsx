import { useBoostSlots } from '@/hooks/useBoostSlots';

export const FeaturedBanner = () => {
  const { data: boostSlots } = useBoostSlots();
  const featuredProjects = boostSlots?.filter(slot => slot.project && slot.active);

  if (!featuredProjects?.length) return null;

  return (
    <div className="w-full border-b border-crypto-primary/10 bg-crypto-dark/50 backdrop-blur-md py-2">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Featured:
          </span>
          <div className="flex gap-2">
            {featuredProjects.map((slot) => (
              <div
                key={slot.project_id}
                className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1 hover:bg-white/10 transition-colors"
              >
                {slot.project?.logo && (
                  <img
                    src={slot.project.logo}
                    alt={slot.project.name}
                    className="w-6 h-6 rounded-full object-cover bg-black/20"
                  />
                )}
                <span className="text-sm font-medium whitespace-nowrap">
                  {slot.project?.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
