import { useState } from 'react';
import { ChevronDown, ChevronUp, Activity } from 'lucide-react';
import { Button } from './ui/button';
import { ActivityFeed } from './ActivityFeed';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const MobileDropdown = () => {
  return (
    <div className="block md:hidden w-full space-y-2 px-4 py-2">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="activity">
          <AccordionTrigger className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span>Activity Feed</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-2">
              <div className="glass-effect rounded-xl p-4">
                <ActivityFeed />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};