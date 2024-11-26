import { useState } from 'react';
import { ChevronDown, ChevronUp, Activity, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { ActivityFeed } from './ActivityFeed';
import { Comments } from './Comments';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const MobileDropdown = () => {
  return (
    <div className="md:hidden w-full space-y-2 px-4 py-2">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="activity">
          <AccordionTrigger className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span>Activity Feed</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-2">
              <ActivityFeed />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="comments">
          <AccordionTrigger className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Comments</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-2">
              <Comments />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};