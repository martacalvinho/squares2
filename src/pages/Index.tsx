import { Grid } from "@/components/Grid";
import { Header } from "@/components/Header";
import { BoostedProjects } from "@/components/boost/BoostedProjects";
import { MobileDropdown } from "@/components/MobileDropdown";

const Index = () => {
  return (
    <div className="min-h-screen bg-crypto-dark">
      <Header />
      <BoostedProjects />
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto text-center mb-8">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-crypto-primary to-crypto-light bg-clip-text text-transparent mb-4">
            Own Your Spot in Web3 History
          </h2>
          <p className="text-lg text-gray-400">
            Bid on one of 500 exclusive spots to showcase your crypto project
          </p>
        </div>
        <MobileDropdown />
        <Grid />
      </main>
    </div>
  );
};

export default Index;