import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info } from "lucide-react";

export const Rules = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          className="bg-white text-gray-900 font-medium px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-colors"
          variant="ghost"
        >
          <Info className="w-4 h-4 mr-2" />
          Rules
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">How It Works</DialogTitle>
          <DialogDescription>
            Simple rules to participate in Crypto 500
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            <section>
              <h3 className="font-semibold text-lg mb-2 text-crypto-primary">Bidding</h3>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Start bidding at $1.00 for any empty spot</li>
                <li>Each new bid must be at least $1.00 higher</li>
                <li>All bids are final</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2 text-crypto-primary">Boost</h3>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Minimum contribution of 0.05 SOL (~$10) for 1 hour of boost time</li>
                <li>Each 0.05 SOL adds 1 hour of featured time</li>
                <li>Maximum of 48 hours per slot</li>
                <li>Projects move up slots as others expire</li>
                <li>Projects can join waitlist and auto-fill empty slots</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2 text-crypto-primary">Your Spot</h3>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Showcase your crypto project after winning a bid</li>
                <li>Keep your spot until someone outbids you</li>
                <li>Update your project info anytime</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2 text-crypto-primary">Requirements</h3>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Projects must be crypto/blockchain related</li>
                <li>Information must be accurate</li>
                <li>Appropriate logos and safe links only</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2 text-crypto-primary">Payment</h3>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>All payments are in SOL</li>
                <li>Connect your Solana wallet to participate</li>
                <li>Payment is instant and automatic</li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};