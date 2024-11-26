import { BoostSlot } from '@/components/boost/Boost';

interface FeaturedBannerProps {
  slots: BoostSlot[];
}

export const FeaturedBanner = ({ slots }: FeaturedBannerProps) => {
  // Get the first featured slot with a project
  const featuredSlot = slots.find(slot => slot.project_name && slot.project_logo);

  if (!featuredSlot) {
    return null;
  }

  return (
    <div className="relative w-full h-[300px] overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${featuredSlot.project_logo})`,
          filter: 'blur(20px)',
          transform: 'scale(1.1)',
          opacity: 0.3
        }}
      />

      {/* Content */}
      <div className="relative flex items-center justify-center h-full">
        <div className="flex flex-col items-center space-y-4">
          <img
            src={featuredSlot.project_logo}
            alt={featuredSlot.project_name}
            className="w-32 h-32 rounded-full object-cover"
          />
          <h2 className="text-2xl font-bold text-white">
            {featuredSlot.project_name}
          </h2>
          <div className="flex space-x-4">
            <a
              href={featuredSlot.project_link}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Visit Website
            </a>
            {featuredSlot.telegram_link && (
              <a
                href={featuredSlot.telegram_link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Join Telegram
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
