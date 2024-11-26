import { useBoostSlots } from '@/hooks/useBoostSlots';

export const FeaturedBanner = () => {
  const { data: boostSlots } = useBoostSlots();
  const featuredProjects = boostSlots?.filter(slot => slot.project && slot.active);

  if (!featuredProjects?.length) return null;

  return (
    <div className="sticky top-[60px] z-40 w-full border-b border-crypto-primary/10 bg-crypto-dark/95 backdrop-blur-md py-2">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-sm font-medium text-crypto-primary whitespace-nowrap">
            Featured:
          </span>
          <div className="flex gap-2 snap-x snap-mandatory">
            {featuredProjects.map((slot) => (
              <div
                key={slot.project?.id}
                className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 hover:bg-white/20 transition-colors snap-start"
              >
                {slot.project?.logo && (
                  <img
                    src={slot.project.logo}
                    alt={slot.project.name}
                    className="w-6 h-6 rounded-full object-cover bg-black/20"
                  />
                )}
                <span className="text-sm font-medium whitespace-nowrap text-white">
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
