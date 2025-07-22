"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useChatStore } from "@/lib/gemini/store"
import { useSecureApiKey } from "@/hooks/use-secure-api-key"
import { useToast } from "@/components/ui/use-toast"
import { GEMINI_MODELS, DEFAULT_GENERATION_PARAMS, HarmBlockThreshold, HarmCategory } from "@/lib/gemini"
import { PROMPT_PRESETS } from "@/lib/ai/presets"
import { ThemeAvatar } from "@/components/ui/theme-avatar"
import { ThemeTab } from "@/components/settings/theme-tab"
import { ExternalLink, Loader2, CheckCircle, XCircle, Zap, Brain, Settings2 } from "lucide-react"

interface SettingsPanelProps {
  onClose?: () => void
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { 
    apiKey, 
    setApiKey,
    generationParams,
    setGenerationParams,
    activeChat,
    chats,
    setSystemInstruction,
    userAvatar,
    setUserAvatar,
    geminiAvatar,
    setGeminiAvatar,
    globalSystemInstruction,
    setGlobalSystemInstruction
  } = useChatStore()

  const { saveApiKey, clearApiKey, isLoading, hasStoredKey } = useSecureApiKey()
  const { toast } = useToast()
  
  const currentChat = chats.find(chat => chat.id === activeChat)
  const [key, setKey] = useState(apiKey || "")
  const [saveStatus, setSaveStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const avatars = [
    "/avatars/01.svg",
    "/avatars/02.svg",
    "/avatars/03.svg",
    "/avatars/04.svg",
    "/avatars/05.svg",
    "/avatars/06.svg",
    "/avatars/07.svg",
    "/avatars/08.svg",
    "/avatars/09.svg",
    "/avatars/10.svg",
    "/avatars/11.svg",
    "/avatars/12.svg",
    "/avatars/13.svg",
    "/avatars/14.svg",
    "/avatars/15.svg",
    "/avatars/16.svg",
    "/avatars/17.svg",
    "/avatars/18.svg",
    "/avatars/19.svg",
    "/avatars/20.svg"
  ];
  
  const handleSaveApiKey = async () => {
    try {
      setSaveStatus('loading')
      const trimmedKey = key.trim()
      
      if (!trimmedKey) {
        await clearApiKey()
        setSaveStatus('success')
        toast({
          title: "API key removed",
          description: "Your API key has been removed from secure storage."
        })
        return
      }
      
      // Save to secure storage
      const success = await saveApiKey(trimmedKey)
      
      if (success) {
        setSaveStatus('success')
        toast({
          title: "API key saved securely",
          description: "Your API key has been securely stored."
        })
        setTimeout(() => {
          onClose?.()
        }, 1500)
      } else {
        setSaveStatus('error')
        toast({
          variant: "destructive",
          title: "Failed to save API key",
          description: "There was an error saving your API key."
        })
      }
    } catch (error) {
      console.error('Error in API key handling:', error)
      setSaveStatus('error')
    }
  }

  return (
    <Tabs defaultValue="general">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="ai-presets">AI Presets</TabsTrigger>
        <TabsTrigger value="themes">Themes</TabsTrigger>
        <TabsTrigger value="appearance">Appearance</TabsTrigger>
        <TabsTrigger value="generation">Generation</TabsTrigger>
        <TabsTrigger value="safety">Safety</TabsTrigger>
      </TabsList>
      
      <TabsContent value="general">
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>
              Configure your Gemini API settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <div className="flex gap-2">
                <Input 
                  id="api-key"
                  type="password" 
                  placeholder="Enter your Gemini API key" 
                  value={key} 
                  onChange={(e) => setKey(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => window.open("https://ai.google.dev/", "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                {hasStoredKey && (
                  <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle size={14} />
                    Secured
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Get your API key from the Google AI Studio
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Your API key is securely stored in an HTTP-only cookie.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              onClick={handleSaveApiKey}
              disabled={isLoading || saveStatus === 'loading'}
            >
              {(isLoading || saveStatus === 'loading') && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {saveStatus === 'success' && (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              {saveStatus === 'error' && (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="ai-presets">
        <Card>
          <CardContent className="space-y-6 pt-6">

            {/* Work Mode Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Work Mode
              </Label>
              <Select
                value={generationParams.workMode || 'business'}
                onValueChange={(value: 'standard' | 'business' | 'technical' | 'concise') => {
                  setGenerationParams({ workMode: value });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select work mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">Business - Professional and structured responses</SelectItem>
                  <SelectItem value="technical">Technical - Detailed technical explanations</SelectItem>
                  <SelectItem value="standard">Standard - Balanced general responses</SelectItem>
                  <SelectItem value="concise">Concise - Brief and to-the-point answers</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Work mode affects the AI's response style and level of detail
              </p>
            </div>

            {/* AI Presets */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Assistant Presets
              </Label>
              <div className="grid gap-3">
                {PROMPT_PRESETS.map((preset) => {
                  const isActive = globalSystemInstruction === preset.prompt;
                  return (
                    <div
                      key={preset.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:bg-muted/50 ${
                        isActive ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => setGlobalSystemInstruction(preset.prompt)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium text-sm">{preset.name}</h4>
                          <p className="text-xs text-muted-foreground">{preset.description}</p>
                        </div>
                        {isActive && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="appearance">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize the look and feel of the chat interface.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>User Avatar</Label>
              <div className="grid grid-cols-6 gap-4">
                {avatars.map(avatar => (
                  <ThemeAvatar 
                    key={avatar}
                    src={avatar}
                    className={`cursor-pointer ${userAvatar === avatar ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setUserAvatar(avatar)}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <Label>altIA Avatar</Label>
              <div className="grid grid-cols-6 gap-4">
                {avatars.map(avatar => (
                  <ThemeAvatar 
                    key={avatar}
                    src={avatar}
                    className={`cursor-pointer ${geminiAvatar === avatar ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setGeminiAvatar(avatar)}
                  />
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </CardFooter>
        </Card>
      </TabsContent>
      
      <TabsContent value="generation">
        <Card>
          <CardHeader>
            <CardTitle>Generation Settings</CardTitle>
            <CardDescription>
              Configure how AI generates responses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="system-instruction">System Instruction</Label>
              <Textarea
                id="system-instruction"
                placeholder="e.g., You are a professional business assistant that specializes in project management and document analysis."
                value={globalSystemInstruction}
                onChange={(e) => setGlobalSystemInstruction(e.target.value)}
                className="min-h-[120px] text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Define the AI's personality, role, or style. This instruction persists across all chats.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="temperature">Temperature: {generationParams.temperature?.toFixed(2)}</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setGenerationParams({ temperature: DEFAULT_GENERATION_PARAMS.temperature })}
                    className="h-7 text-xs"
                  >
                    Reset
                  </Button>
                </div>
                <Slider
                  id="temperature"
                  min={0}
                  max={1}
                  step={0.01}
                  value={[generationParams.temperature || 0.7]}
                  onValueChange={(value: number[]) => setGenerationParams({ temperature: value[0] })}
                />
                <p className="text-xs text-muted-foreground">
                  Lower values are more deterministic, higher values more creative
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="top-p">Top P: {generationParams.topP?.toFixed(2)}</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setGenerationParams({ topP: DEFAULT_GENERATION_PARAMS.topP })}
                    className="h-7 text-xs"
                  >
                    Reset
                  </Button>
                </div>
                <Slider
                  id="top-p"
                  min={0}
                  max={1}
                  step={0.01}
                  value={[generationParams.topP || 0.95]}
                  onValueChange={(value: number[]) => setGenerationParams({ topP: value[0] })}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="top-k">Top K: {generationParams.topK}</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setGenerationParams({ topK: DEFAULT_GENERATION_PARAMS.topK })}
                    className="h-7 text-xs"
                  >
                    Reset
                  </Button>
                </div>
                <Slider
                  id="top-k"
                  min={1}
                  max={100}
                  step={1}
                  value={[generationParams.topK || 40]}
                  onValueChange={(value: number[]) => setGenerationParams({ topK: value[0] })}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="max-tokens">Max Output Tokens: {generationParams.maxOutputTokens}</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setGenerationParams({ maxOutputTokens: DEFAULT_GENERATION_PARAMS.maxOutputTokens })}
                    className="h-7 text-xs"
                  >
                    Reset
                  </Button>
                </div>
                <Slider
                  id="max-tokens"
                  min={100}
                  max={8192}
                  step={100}
                  value={[generationParams.maxOutputTokens || 2048]}
                  onValueChange={(value: number[]) => setGenerationParams({ maxOutputTokens: value[0] })}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2" htmlFor="streaming-speed">
                    <Zap className="h-4 w-4" />
                    Streaming Speed: {generationParams.streamingSpeed}ms
                  </Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setGenerationParams({ streamingSpeed: DEFAULT_GENERATION_PARAMS.streamingSpeed })}
                    className="h-7 text-xs"
                  >
                    Reset
                  </Button>
                </div>
                <Slider
                  id="streaming-speed"
                  min={5}
                  max={15}
                  step={1}
                  value={[generationParams.streamingSpeed || 5]}
                  onValueChange={(value: number[]) => setGenerationParams({ streamingSpeed: value[0] })}
                />
                <p className="text-xs text-muted-foreground">
                  Controls typing speed: 5ms = very fast, 10ms = moderate, 15ms = slow
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="thinking-enabled">Thinking Mode</Label>
                    <p className="text-xs text-muted-foreground">
                      Show the model's internal reasoning process
                    </p>
                  </div>
                  <Switch
                    id="thinking-enabled"
                    checked={generationParams.thinkingEnabled}
                    onCheckedChange={(checked: boolean) => setGenerationParams({ thinkingEnabled: checked })}
                  />
                </div>
              </div>
              
              {generationParams.thinkingEnabled && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="thinking-budget">
                      Thinking Budget: {generationParams.thinkingBudget === -1 ? 'Dynamic' : generationParams.thinkingBudget}
                    </Label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setGenerationParams({ thinkingBudget: DEFAULT_GENERATION_PARAMS.thinkingBudget })}
                      className="h-7 text-xs"
                    >
                      Reset
                    </Button>
                  </div>
                  
                  {/* Dynamic thinking toggle */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="dynamic-thinking"
                      checked={generationParams.thinkingBudget === -1}
                      onChange={(e) => setGenerationParams({ 
                        thinkingBudget: e.target.checked ? -1 : 1024 
                      })}
                      className="rounded"
                    />
                    <Label htmlFor="dynamic-thinking" className="text-sm">
                      Dynamic thinking (recommended)
                    </Label>
                  </div>
                  
                  {generationParams.thinkingBudget !== -1 && (
                    <>
                      <Slider
                        id="thinking-budget"
                        min={128}
                        max={8192}
                        step={128}
                        value={[Math.max(128, generationParams.thinkingBudget || 1024)]}
                        onValueChange={(value: number[]) => setGenerationParams({ thinkingBudget: value[0] })}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>128 (minimal)</span>
                        <span>8192 (extensive)</span>
                      </div>
                    </>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    {generationParams.thinkingBudget === -1 
                      ? 'Model automatically adjusts thinking depth based on complexity'
                      : 'Higher values allow for more detailed reasoning but increase cost'
                    }
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="grounding-enabled">Google Search Grounding</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable real-time web search for current information and citations
                    </p>
                  </div>
                  <Switch
                    id="grounding-enabled"
                    checked={generationParams.groundingEnabled || false}
                    onCheckedChange={(checked: boolean) => setGenerationParams({ groundingEnabled: checked })}
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="safety">
        <Card>
          <CardHeader>
            <CardTitle>Safety Settings</CardTitle>
            <CardDescription>
              Configure safety thresholds for content filtering
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {Object.values(HarmCategory).map((category) => {
                const setting = generationParams.safetySettings?.find(
                  (s) => s.category === category
                );
                
                return (
                  <div key={category} className="space-y-2">
                    <Label htmlFor={`safety-${category}`}>
                      {category.replace('HARM_CATEGORY_', '').replace(/_/g, ' ')}
                    </Label>
                    <Select
                      value={setting?.threshold || HarmBlockThreshold.BLOCK_NONE}
                      onValueChange={(value: HarmBlockThreshold) => {
                        const newSettings = [...(generationParams.safetySettings || [])];
                        const existingIndex = newSettings.findIndex(s => s.category === category);
                        
                        if (existingIndex >= 0) {
                          newSettings[existingIndex] = { 
                            ...newSettings[existingIndex], 
                            threshold: value as any 
                          };
                        } else {
                          newSettings.push({
                            category,
                            threshold: value as any
                          });
                        }
                        
                        setGenerationParams({ safetySettings: newSettings });
                      }}
                    >
                      <SelectTrigger id={`safety-${category}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(HarmBlockThreshold).map((threshold) => (
                          <SelectItem key={threshold} value={threshold}>
                            {threshold.replace('BLOCK_', '').replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
              
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setGenerationParams({ safetySettings: DEFAULT_GENERATION_PARAMS.safetySettings })}
                >
                  Reset to Defaults
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="themes">
        <ThemeTab />
      </TabsContent>
    </Tabs>
  )
}
