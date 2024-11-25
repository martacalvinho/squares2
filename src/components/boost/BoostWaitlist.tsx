import { WaitlistProject } from "./BoostTypes";

interface BoostWaitlistProps {
  projects: WaitlistProject[];
}

export function BoostWaitlist({ projects }: BoostWaitlistProps) {
  return (
    <div className="flex items-center justify-between pt-2 border-t border-crypto-primary/5">
      <div className="flex-1">
        <div className="flex items-center gap-4 mb-2">
          <h4 className="text-sm font-medium text-gray-400">Waitlist</h4>
          <p className="text-xs text-gray-500">
            {projects.length} project{projects.length !== 1 ? "s" : ""} waiting
          </p>
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 10 }).map((_, index) => {
            const project = projects[index];
            return (
              <div
                key={index}
                className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-crypto-primary/20 to-crypto-dark"
                title={project?.project_name}
              >
                {project ? (
                  <img
                    src={project.project_logo}
                    alt={project.project_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-crypto-primary/20" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}