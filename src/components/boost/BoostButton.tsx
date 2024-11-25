import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import { Boost } from "./Boost";

interface BoostButtonProps {
  isDialog?: boolean;
}

export function BoostButton({ isDialog = false }: BoostButtonProps) {
  if (isDialog) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button 
            className="bg-crypto-primary text-white font-medium px-4 py-2.5 rounded-xl hover:bg-crypto-primary/90 transition-colors"
            variant="ghost"
          >
            <Rocket className="w-4 h-4 mr-2" />
            Boost Project
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Boost Your Project</DialogTitle>
            <DialogDescription>
              Get more visibility by boosting your project
            </DialogDescription>
          </DialogHeader>
          <Boost />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Button 
      className="bg-crypto-primary text-white font-medium px-4 py-2.5 rounded-xl hover:bg-crypto-primary/90 transition-colors"
      variant="ghost"
    >
      <Rocket className="w-4 h-4 mr-2" />
      Boost Project
    </Button>
  );
}