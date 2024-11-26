import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Twitter } from "lucide-react";

interface SuccessModalProps {
  spotId: number;
  projectName: string;
  previousProjectName?: string;
  onClose: () => void;
}

export const SuccessModal = ({ spotId, projectName, previousProjectName, onClose }: SuccessModalProps) => {
  const isSteal = !!previousProjectName;
  
  const handleTwitterShare = () => {
    const tweetText = encodeURIComponent(
      isSteal
        ? `🔥 Just stole spot #${spotId + 1} from ${previousProjectName} on Crypto500! ${projectName} is now part of this exclusive collection! 🚀\nCheck it out at: [your-website-url]`
        : `🎉 Just claimed spot #${spotId + 1} out of 500 on Crypto500! ${projectName} is now part of this exclusive collection! 🚀\nCheck it out at: [your-website-url]`
    );
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {isSteal ? '🔥 Spot Stolen!' : '🎉 Spot Claimed!'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="text-center space-y-2">
            <p className="text-lg">
              {isSteal
                ? `You've successfully stolen spot #${spotId + 1} from ${previousProjectName}!`
                : `You've successfully claimed spot #${spotId + 1} out of 500!`}
            </p>
            <p className="text-sm text-muted-foreground">
              {projectName} is now part of the Crypto500 collection
            </p>
          </div>
          <div className="flex justify-center">
            <Button
              onClick={handleTwitterShare}
              className="bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white"
            >
              <Twitter className="mr-2 h-4 w-4" />
              Share on Twitter
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
