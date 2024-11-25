import { Rocket } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { BoostSubmissionForm } from "./BoostSubmissionForm";

interface BoostHeaderProps {
  solPrice: number;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
}

export function BoostHeader({
  solPrice,
  dialogOpen,
  setDialogOpen,
}: BoostHeaderProps) {
  const handleSuccess = () => {
    setDialogOpen(false);
  };

  return (
    <div className="flex items-center justify-between mb-2">
      <div>
        <h3 className="text-lg font-semibold text-crypto-primary/80">
          Featured Projects
        </h3>
        <p className="text-sm text-gray-400">
          Buy a premium spot to highlight your project
        </p>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="flex items-center gap-2">
            <Rocket className="w-4 h-4" />
            Boost Project
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Project</DialogTitle>
          </DialogHeader>
          <BoostSubmissionForm
            onSuccess={handleSuccess}
            solPrice={solPrice}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}