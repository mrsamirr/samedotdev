import type React from "react";
import { useState } from "react";
import {
  X,
  Sparkles,
  Zap,
  Layers,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { GenerationRequest } from "@/types/design";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export const Sidebar: React.FC<{
  isOpen: boolean;
  onToggle: () => void;
  onGenerate: (request: GenerationRequest) => void;
  isGenerating: boolean;
  generationCount: number;
}> = ({ isOpen, onToggle, onGenerate, isGenerating, generationCount }) => {
  const [prompt, setPrompt] = useState("");
  const [useCase, setUseCase] = useState<"wireframes" | "hifi">("hifi");
  const [screenType, setScreenType] = useState<"desktop" | "mobile" | "tablet">(
    "desktop"
  );
  const [deepDesign, setDeepDesign] = useState(false);
  const [autoflow, setAutoflow] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim().length >= 5) {
      onGenerate({
        context: prompt.trim(),
        useCase,
        screenType,
        deepDesign,
        autoflow,
      });
    }
  };

  return (
    <div className="">
      <Button
        variant="outline"
        size="icon"
        onClick={onToggle}
        className="absolute top-4 -right-3 bg-background border shadow-md z-50"
      >
        {isOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-md z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-80 bg-background/95 backdrop-blur-xl border-r z-40 transform transition-all duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } shadow-2xl`}
      >
        <div className="p-6 h-full overflow-y-auto overflow-x-visible">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold">UX Pilot</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-4">Use case</label>
              <div className="grid grid-cols-2 gap-3">
                <Card
                  className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                    useCase === "wireframes"
                      ? "ring-2 ring-primary bg-muted"
                      : ""
                  }`}
                  onClick={() => setUseCase("wireframes")}
                >
                  <CardContent className="p-4 text-center">
                    <Layers
                      className={`w-6 h-6 mx-auto mb-2 ${
                        useCase === "wireframes"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                    <div className="font-medium text-sm">Wireframes</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Structure & layout
                    </div>
                  </CardContent>
                </Card>
                <Card
                  className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                    useCase === "hifi" ? "ring-2 ring-primary bg-muted" : ""
                  }`}
                  onClick={() => setUseCase("hifi")}
                >
                  <CardContent className="p-4 text-center">
                    <Sparkles
                      className={`w-6 h-6 mx-auto mb-2 ${
                        useCase === "hifi"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                    <div className="font-medium text-sm">Hi-Fi Designs</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Styled & polished
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-4">
                Screen Type
              </label>
              <Select
                value={screenType}
                onValueChange={(value) =>
                  setScreenType(value as "desktop" | "mobile" | "tablet")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select device type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desktop">💻 Desktop</SelectItem>
                  <SelectItem value="mobile">📱 Mobile</SelectItem>
                  <SelectItem value="tablet">� TablSet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-4">Context</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Make a developer portfolio"
                className="resize-none"
                rows={4}
                minLength={5}
                required
              />
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Minimum 5 characters required
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Advanced Options
              </h3>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        Deep Design
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Enhanced detail & complexity
                      </div>
                    </div>
                    <Switch
                      checked={deepDesign}
                      onCheckedChange={setDeepDesign}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm flex items-center gap-2">
                        <Layers className="w-4 h-4 text-green-500" />
                        Auto Flow
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Generate connected screen flows
                      </div>
                    </div>
                    <Switch checked={autoflow} onCheckedChange={setAutoflow} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isGenerating || prompt.trim().length < 5}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  <span>Generate</span>
                </>
              )}
            </Button>
          </div>

          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <div className="text-sm font-medium">Generations</div>
              </div>
              <div className="text-2xl font-bold text-primary mb-1">
                {generationCount}
              </div>
              <div className="text-xs text-muted-foreground">
                Min. 5 chars required
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
