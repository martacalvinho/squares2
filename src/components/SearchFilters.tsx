import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SearchFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  priceRange: string;
  onPriceRangeChange: (value: string) => void;
}

export const SearchFilters = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priceRange,
  onPriceRangeChange,
}: SearchFiltersProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8">
      <div className="flex-1">
        <Input
          placeholder="Search by project name or spot ID..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-crypto-dark border-crypto-primary/20"
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full md:w-[180px] bg-crypto-dark border-crypto-primary/20">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Spots</SelectItem>
          <SelectItem value="occupied">Occupied</SelectItem>
          <SelectItem value="empty">Empty</SelectItem>
        </SelectContent>
      </Select>
      <Select value={priceRange} onValueChange={onPriceRangeChange}>
        <SelectTrigger className="w-full md:w-[180px] bg-crypto-dark border-crypto-primary/20">
          <SelectValue placeholder="Price range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Prices</SelectItem>
          <SelectItem value="0-10">0-10 SOL</SelectItem>
          <SelectItem value="10-50">10-50 SOL</SelectItem>
          <SelectItem value="50+">50+ SOL</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};