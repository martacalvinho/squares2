import { useState } from 'react';
import { ChevronDown, ChevronUp, Activity, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { ActivityFeed } from './ActivityFeed';
import { Comments } from './Comments';
import { cn } from '@/lib/utils';

export const MobileDropdown = () => {
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  return (
    <div className="md:hidden w-full space-y-2 px-4 py-2">
      {/* Activity Feed Button and Dropdown */}
      <div className="w-full">
        <Button
          variant="outline"
          className="w-full flex items-center justify-between"
          onClick={() => setIsActivityOpen(!isActivityOpen)}
        >
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span>Activity Feed</span>
          </div>
          {isActivityOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        <div
          className={cn(
            "transition-all duration-200 ease-in-out overflow-hidden",
            isActivityOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="pt-2">
            <ActivityFeed />
          </div>
        </div>
      </div>

      {/* Comments Button and Dropdown */}
      <div className="w-full">
        <Button
          variant="outline"
          className="w-full flex items-center justify-between"
          onClick={() => setIsCommentsOpen(!isCommentsOpen)}
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Comments</span>
          </div>
          {isCommentsOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        <div
          className={cn(
            "transition-all duration-200 ease-in-out overflow-hidden",
            isCommentsOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="pt-2">
            <Comments />
          </div>
        </div>
      </div>
    </div>
  );
};