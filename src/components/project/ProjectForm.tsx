import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProjectFormProps {
  onSubmit: (name: string, link: string, logo: string) => void;
  initialData: {
    name: string;
    link: string;
    logo: string;
  };
}

export const ProjectForm = ({ onSubmit, initialData }: ProjectFormProps) => {
  const [projectName, setProjectName] = useState(initialData.name);
  const [projectLink, setProjectLink] = useState(initialData.link);
  const [projectLogo, setProjectLogo] = useState(initialData.logo);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      await handleImageUpload(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleImageUpload(file);
    }
  };

  const handleImageUpload = async (file: File) => {
    // Here you would typically upload the file to your storage service
    // For now, we'll create a local URL for preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProjectLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(projectName, projectLink, projectLogo);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="projectName">Project Name</Label>
        <Input
          id="projectName"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="bg-crypto-dark/50"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="projectLink">Project Link</Label>
        <Input
          id="projectLink"
          value={projectLink}
          onChange={(e) => setProjectLink(e.target.value)}
          className="bg-crypto-dark/50"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="projectLogo">Logo</Label>
        <div className="space-y-2">
          <Input
            id="projectLogo"
            value={projectLogo}
            onChange={(e) => setProjectLogo(e.target.value)}
            placeholder="Enter logo URL"
            className="bg-crypto-dark/50"
          />
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
              isDragging ? "border-crypto-primary bg-crypto-primary/10" : "border-crypto-primary/20 hover:border-crypto-primary/40",
              "relative"
            )}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
            <p className="text-sm text-gray-400">
              Drag and drop an image here, or click to select
            </p>
            {projectLogo && (
              <div className="mt-2">
                <img
                  src={projectLogo}
                  alt="Logo preview"
                  className="max-h-20 mx-auto rounded"
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <Button 
        type="submit" 
        className="w-full bg-crypto-primary hover:bg-crypto-primary/80"
      >
        Continue to Payment
      </Button>
    </form>
  );
};