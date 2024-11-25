import { Clock, Users, Rocket, Loader2 } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";

interface BoostSubmissionFormProps {
  projectName: string;
  setProjectName: (value: string) => void;
  projectLogo: string;
  setProjectLogo: (value: string) => void;
  projectLink: string;
  setProjectLink: (value: string) => void;
  telegramLink: string;
  setTelegramLink: (value: string) => void;
  chartLink: string;
  setChartLink: (value: string) => void;
  handleSubmit: () => void;
  isSubmitting: boolean;
  isConnected: boolean;
}

export const BoostSubmissionForm = ({
  projectName,
  setProjectName,
  projectLogo,
  setProjectLogo,
  projectLink,
  setProjectLink,
  telegramLink,
  setTelegramLink,
  chartLink,
  setChartLink,
  handleSubmit,
  isSubmitting,
  isConnected,
}: BoostSubmissionFormProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-lg bg-crypto-dark/30 p-4 border border-crypto-primary/20">
        <h4 className="font-medium text-crypto-primary">Boost Rules</h4>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-crypto-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Maximum Duration</p>
              <p>Projects can be boosted for up to 48 hours</p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <Users className="w-4 h-4 text-crypto-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Contribution Rates</p>
              <ul className="space-y-1 mt-1">
                <li>• $5.00 = 1 hour boost time</li>
                <li>• $2.50 = 30 minutes boost time</li>
              </ul>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <Rocket className="w-4 h-4 text-crypto-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Ranking System</p>
              <p>Projects are ranked by number of contributors and total contributions</p>
            </div>
          </li>
        </ul>
      </div>

      <div className="space-y-4">
        <Input
          placeholder="Project Name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          required
        />
        <Input
          placeholder="Logo URL"
          value={projectLogo}
          onChange={(e) => setProjectLogo(e.target.value)}
          required
        />
        <Input
          placeholder="Project URL"
          value={projectLink}
          onChange={(e) => setProjectLink(e.target.value)}
          required
        />
        <Input
          placeholder="Telegram Link (Optional)"
          value={telegramLink}
          onChange={(e) => setTelegramLink(e.target.value)}
        />
        <Input
          placeholder="Chart Link (Optional)"
          value={chartLink}
          onChange={(e) => setChartLink(e.target.value)}
        />
        <Button
          onClick={handleSubmit}
          className="w-full"
          disabled={!isConnected || isSubmitting}
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Submit Project
        </Button>
      </div>
    </div>
  );
};