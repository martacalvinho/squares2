import { useState, useEffect } from 'react';
import { ChevronUp, Search, Activity, MessageSquare, Star } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

type Tab = 'search' | 'activity' | 'comments' | 'featured';

interface MobileFeaturesProps {
  onSearch?: (term: string) => void;
  onStatusFilter?: (status: 'empty' | 'occupied') => void;
  searchResults?: number;
  spotCount?: number;
}

export const MobileFeatures = ({
  onSearch,
  onStatusFilter,
  searchResults = -1,
  spotCount = 0,
}: MobileFeaturesProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [showingStatus, setShowingStatus] = useState<'empty' | 'occupied'>('empty');

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearchTerm !== '') {
      onSearch?.(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, onSearch]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleStatusToggle = () => {
    const newShowingStatus = showingStatus === 'empty' ? 'occupied' : 'empty';
    setShowingStatus(newShowingStatus);
    onStatusFilter?.(newShowingStatus);
  };

  const handleCloseDrawer = () => {
    setIsOpen(false);
    if (searchTerm) {
      setSearchTerm('');
      onSearch?.('');
    }
  };

  const getStatusButtonText = () => {
    switch (showingStatus) {
      case 'empty':
        return 'Empty Spots';
      case 'occupied':
        return 'Occupied Spots';
      default:
        return 'All Spots';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'search':
        return (
          <div className="p-4 space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search squares..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-crypto-dark/50 border border-crypto-primary/20 focus:border-crypto-primary focus:outline-none focus:ring-2 focus:ring-crypto-primary/20 text-gray-200 placeholder:text-gray-500"
                />
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-crypto-primary/60" />
              </div>
              <button 
                onClick={handleCloseDrawer}
                className="p-2.5 rounded-xl bg-crypto-dark/50 border border-crypto-primary/20 hover:border-crypto-primary/50 hover:bg-crypto-dark/70 transition-colors group"
              >
                <ChevronUp className="w-5 h-5 text-crypto-primary/60 group-hover:text-crypto-primary transition-colors" />
              </button>
            </div>

            {/* Project Not Found Message */}
            {searchTerm && searchResults === 0 && (
              <div className="text-center py-3 text-gray-400">
                Project not found - claim a spot now
              </div>
            )}

            {/* Status Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
              <button 
                onClick={handleStatusToggle}
                className={`px-4 py-1.5 rounded-full border text-sm whitespace-nowrap transition-colors ${
                  showingStatus === 'empty' 
                    ? 'bg-crypto-primary/10 border-crypto-primary/20 text-crypto-primary'
                    : 'bg-crypto-dark/50 border-crypto-primary/20 text-gray-400'
                }`}
              >
                Empty
              </button>
              <button 
                onClick={handleStatusToggle}
                className={`px-4 py-1.5 rounded-full border text-sm whitespace-nowrap transition-colors ${
                  showingStatus === 'occupied' 
                    ? 'bg-crypto-primary/10 border-crypto-primary/20 text-crypto-primary'
                    : 'bg-crypto-dark/50 border-crypto-primary/20 text-gray-400'
                }`}
              >
                Occupied
              </button>
            </div>

            {/* No Results Message */}
            {!searchTerm && spotCount === 0 && (
              <div className="text-center py-3 text-gray-400">
                No {showingStatus} spots found
              </div>
            )}
          </div>
        );

      case 'activity':
        return (
          <div className="p-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-crypto-dark/50 border border-crypto-primary/20">
              <Activity className="w-5 h-5 text-crypto-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-gray-200">New Bid</div>
                <div className="text-sm text-gray-400">User placed a bid on spot #42</div>
                <div className="text-xs text-gray-500 mt-1">2 minutes ago</div>
              </div>
            </div>
          </div>
        );
      
      case 'comments':
        return (
          <div className="p-4">
            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-crypto-dark/50 border border-crypto-primary/20">
                <div className="w-8 h-8 rounded-full bg-crypto-dark/70 border border-crypto-primary/20 shrink-0" />
                <div>
                  <div className="font-medium text-gray-200">User123</div>
                  <div className="text-sm text-gray-400">Great project!</div>
                  <div className="text-xs text-gray-500 mt-1">5 minutes ago</div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 rounded-lg bg-crypto-dark/50 border border-crypto-primary/20 focus:border-crypto-primary focus:outline-none focus:ring-2 focus:ring-crypto-primary/20 text-gray-200 placeholder:text-gray-500"
              />
              <button className="px-4 py-2 bg-crypto-primary text-white rounded-lg hover:bg-crypto-primary/90 transition-colors">
                Send
              </button>
            </div>
          </div>
        );
      
      case 'featured':
        return (
          <div className="p-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-crypto-dark/50 border border-crypto-primary/20">
              <div className="w-12 h-12 rounded-lg bg-crypto-dark/70 border border-crypto-primary/20 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-200">Featured Project</div>
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                </div>
                <div className="text-sm text-gray-400">An amazing crypto project</div>
                <div className="text-xs text-gray-500 mt-1">Featured today</div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div 
      className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-4.5rem)]'
      }`}
    >
      <div className="bg-crypto-dark/95 backdrop-blur-md border-t border-x border-crypto-primary/20 rounded-t-xl">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="w-6" />
          <div className="flex gap-8">
            <button 
              onClick={() => {
                setActiveTab('search');
                setIsOpen(true);
              }}
              className={`text-gray-400 hover:text-crypto-primary transition-colors ${
                activeTab === 'search' && isOpen ? 'text-crypto-primary' : ''
              }`}
            >
              <Search className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                setActiveTab('activity');
                setIsOpen(true);
              }}
              className={`text-gray-400 hover:text-crypto-primary transition-colors ${
                activeTab === 'activity' && isOpen ? 'text-crypto-primary' : ''
              }`}
            >
              <Activity className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                setActiveTab('comments');
                setIsOpen(true);
              }}
              className={`text-gray-400 hover:text-crypto-primary transition-colors ${
                activeTab === 'comments' && isOpen ? 'text-crypto-primary' : ''
              }`}
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                setActiveTab('featured');
                setIsOpen(true);
              }}
              className={`text-gray-400 hover:text-crypto-primary transition-colors ${
                activeTab === 'featured' && isOpen ? 'text-crypto-primary' : ''
              }`}
            >
              <Star className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="w-6 h-6 flex items-center justify-center"
          >
            <ChevronUp 
              className={`w-5 h-5 text-crypto-primary transition-transform duration-300 ${
                isOpen ? 'rotate-180' : ''
              }`} 
            />
          </button>
        </div>
      </div>

      <div className="bg-crypto-dark/95 backdrop-blur-md border-t border-x border-crypto-primary/20 h-[70vh]">
        <div className="flex border-b border-crypto-primary/20">
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'search' 
                ? 'text-crypto-primary border-b-2 border-crypto-primary bg-crypto-primary/5' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('search')}
          >
            Search
          </button>
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'activity' 
                ? 'text-crypto-primary border-b-2 border-crypto-primary bg-crypto-primary/5' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('activity')}
          >
            Activity
          </button>
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'comments' 
                ? 'text-crypto-primary border-b-2 border-crypto-primary bg-crypto-primary/5' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('comments')}
          >
            Comments
          </button>
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'featured' 
                ? 'text-crypto-primary border-b-2 border-crypto-primary bg-crypto-primary/5' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('featured')}
          >
            Featured
          </button>
        </div>

        <div className="overflow-y-auto" style={{ height: 'calc(70vh - 3rem - 45px)' }}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};
