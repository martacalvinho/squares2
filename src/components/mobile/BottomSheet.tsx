import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  children: React.ReactNode;
  tabs: {
    id: string;
    label: string;
    content: React.ReactNode;
  }[];
  className?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ children, tabs, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(tabs[0].id);
  const [sheetHeight, setSheetHeight] = useState('60vh');
  const constraintsRef = useRef(null);

  // Handle drag to dismiss
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.velocity.y > 20 || info.offset.y > 200) {
      setIsOpen(false);
    }
  };

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      {/* Pull Tab */}
      <div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm rounded-full shadow-lg cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <div className="px-6 py-2 flex items-center gap-2">
          <ChevronUp className="w-4 h-4" />
          <span className="text-sm font-medium">More</span>
        </div>
      </div>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40"
              onClick={() => setIsOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              ref={constraintsRef}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl shadow-2xl"
              style={{ height: sheetHeight }}
            >
              {/* Pull Bar */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-muted rounded-full" />

              {/* Tabs */}
              <div className="pt-8 px-4">
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedTab(tab.id)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                        selectedTab === tab.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="mt-4">
                  {tabs.find(tab => tab.id === selectedTab)?.content}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
