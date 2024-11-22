import { Share2, Twitter, Facebook, Link } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "./ui/use-toast";

interface ShareButtonsProps {
  spotId: number;
}

export const ShareButtons = ({ spotId }: ShareButtonsProps) => {
  const shareUrl = `${window.location.origin}?spot=${spotId}`;

  const handleShare = async (platform: string) => {
    if (platform === 'clipboard') {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "The spot link has been copied to your clipboard.",
      });
      return;
    }

    const shareText = `Check out spot #${spotId} on CryptoSquares!`;
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    };

    window.open(urls[platform as keyof typeof urls], '_blank');
  };

  return (
    <div className="flex gap-2 items-center">
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => handleShare('twitter')}
      >
        <Twitter className="h-4 w-4" />
        Tweet
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => handleShare('facebook')}
      >
        <Facebook className="h-4 w-4" />
        Share
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => handleShare('clipboard')}
      >
        <Link className="h-4 w-4" />
        Copy
      </Button>
    </div>
  );
};