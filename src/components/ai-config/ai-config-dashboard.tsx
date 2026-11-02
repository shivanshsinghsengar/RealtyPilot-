"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  BookOpen, 
  Settings, 
  Brain, 
  FileText, 
  AlertCircle,
  Save,
  Plus,
  Trash2,
  Edit,
  Check,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AIConfigDashboard() {
  const [activeTab, setActiveTab] = useState("templates");
  const [messageTemplates, setMessageTemplates] = useState<any[]>([]);
  const [propertyKnowledge, setPropertyKnowledge] = useState<any[]>([]);
  const [responseRules, setResponseRules] = useState<any[]>([]);
  const [learningLog, setLearningLog] = useState<any[]>([]);
  const [behaviorSettings, setBehaviorSettings] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      // Load message templates
      const { data: templates } = await supabase
        .from("ai_message_templates")
        .select("*")
        .order("priority", { ascending: true });

      // Load property knowledge
      const { data: knowledge } = await supabase
        .from("ai_property_knowledge")
        .select("*, projects(name)")
        .order("created_at", { ascending: false });

      // Load response rules
      const { data: rules } = await supabase
        .from("ai_response_rules")
        .select("*")
        .order("priority", { ascending: true });

      // Load learning log
      const { data: log } = await supabase
        .from("ai_learning_log")
        .select("*, leads(name, phone)")
        .order("created_at", { ascending: false })
        .limit(50);

      // Load behavior settings
      const { data: settings } = await supabase
        .from("ai_behavior_settings")
        .select("*");

      const settingsObj: any = {};
      settings?.forEach(s => {
        settingsObj[s.setting_name] = s.setting_value;
      });

      setMessageTemplates(templates || []);
      setPropertyKnowledge(knowledge || []);
      setResponseRules(rules || []);
      setLearningLog(log || []);
      setBehaviorSettings(settingsObj);
    } catch (error) {
      console.error("Error loading AI config:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Message Templates Section
  const TemplateCard = ({ template }: { template: any }) => (
    <Card className="p-4 mb-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold">{template.name}</h3>
            <Badge variant={template.is_active ? "default" : "secondary"}>
              {template.is_active ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="outline">{template.category}</Badge>
            <span className="text-xs text-muted-foreground">
              Priority: {template.priority}
            </span>
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-2">
            {template.template_text}
          </p>
          {template.conditions && Object.keys(template.conditions).length > 0 && (
            <div className="text-xs text-muted-foreground mb-2">
              Conditions: {JSON.stringify(template.conditions)}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );

  // Property Knowledge Section
  const KnowledgeCard = ({ knowledge }: { knowledge: any }) => (
    <Card className="p-4 mb-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold">{knowledge.property_name}</h3>
            <Badge variant="outline">{knowledge.knowledge_type}</Badge>
            <Badge variant="secondary">Confidence: {knowledge.confidence_score}%</Badge>
            {knowledge.is_verified && (
              <Badge variant="default">Verified</Badge>
            )}
          </div>
          <p className="text-sm mb-2">{knowledge.content}</p>
          {knowledge.keywords && knowledge.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {knowledge.keywords.map((kw: string, i: number) => (
                <span key={i} className="px-2 py-1 text-xs bg-secondary rounded">
                  {kw}
                </span>
              ))}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Source: {knowledge.source} • Used {knowledge.usage_count} times
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );

  // Learning Log Section
  const LearningLogCard = ({ log }: { log: any }) => (
    <Card className="p-4 mb-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold">{log.leads?.name || "Unknown Lead"}</h3>
            <Badge variant={
              log.status === 'answered' ? 'default' :
              log.status === 'researched' ? 'secondary' :
              log.status === 'escalated' ? 'destructive' : 'outline'
            }>
              {log.status}
            </Badge>
          </div>
          <p className="text-sm font-medium mb-1">Question: {log.original_question}</p>
          {log.ai_response && (
            <p className="text-sm text-muted-foreground mb-1">
              AI Response: {log.ai_response}
            </p>
          )}
          {log.human_response && (
            <p className="text-sm text-green-600 mb-1">
              Human Response: {log.human_response}
            </p>
          )}
          <div className="text-xs text-muted-foreground">
            Detected intent: {log.detected_intent || 'N/A'} • Confidence: {log.confidence_score}%
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {log.status === 'pending' && (
            <Button size="sm" variant="default">
              <Check className="h-4 w-4 mr-1" />
              Approve
            </Button>
          )}
          <Button size="sm" variant="outline">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Message Templates</p>
              <p className="text-2xl font-bold">{messageTemplates.length}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Property Knowledge</p>
              <p className="text-2xl font-bold">{propertyKnowledge.length}</p>
            </div>
            <BookOpen className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Response Rules</p>
              <p className="text-2xl font-bold">{responseRules.length}</p>
            </div>
            <Brain className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Learning Log</p>
              <p className="text-2xl font-bold">{learningLog.length}</p>
            </div>
            <FileText className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Main Configuration Area */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Message Templates
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Knowledge Base
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Response Rules
          </TabsTrigger>
          <TabsTrigger value="learning" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Learning Log
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Behavior Settings
          </TabsTrigger>
        </TabsList>

        {/* Message Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Message Templates</h2>
              <p className="text-muted-foreground">
                Define what your AI should say in different scenarios
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Template
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {messageTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </TabsContent>

        {/* Knowledge Base Tab */}
        <TabsContent value="knowledge" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Property Knowledge Base</h2>
              <p className="text-muted-foreground">
                Teach your AI about properties, pricing, amenities, and FAQs
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Knowledge
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {propertyKnowledge.map((knowledge) => (
              <KnowledgeCard key={knowledge.id} knowledge={knowledge} />
            ))}
          </div>
        </TabsContent>

        {/* Learning Log Tab */}
        <TabsContent value="learning" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">AI Learning Log</h2>
              <p className="text-muted-foreground">
                Review questions your AI couldn't answer and teach it
              </p>
            </div>
            <Button variant="outline" onClick={loadAllData}>
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {learningLog.map((log) => (
              <LearningLogCard key={log.id} log={log} />
            ))}
          </div>
        </TabsContent>

        {/* Behavior Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">AI Behavior Settings</h2>
              <p className="text-muted-foreground">
                Configure how your AI should behave and learn
              </p>
            </div>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Save All Settings
            </Button>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Learning Mode</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Learning</p>
                  <p className="text-sm text-muted-foreground">
                    Allow AI to learn from unknown questions
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">Enabled</Badge>
                  <Button size="sm" variant="outline">Toggle</Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto Research</p>
                  <p className="text-sm text-muted-foreground">
                    AI automatically researches unknown questions
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">Enabled</Badge>
                  <Button size="sm" variant="outline">Toggle</Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Confidence Threshold</p>
                  <p className="text-sm text-muted-foreground">
                    Minimum confidence to respond without human review
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">70%</Badge>
                  <Button size="sm" variant="outline">Edit</Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Response Style</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Language Style</p>
                  <p className="text-sm text-muted-foreground">
                    Mix of Hindi and English
                  </p>
                </div>
                <Badge variant="outline">Hindi + English</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Formality Level</p>
                  <p className="text-sm text-muted-foreground">
                    Professional but friendly tone
                  </p>
                </div>
                <Badge variant="outline">Professional Friendly</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Emoji Usage</p>
                  <p className="text-sm text-muted-foreground">
                    Add emojis to make messages engaging
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">Enabled</Badge>
                  <Button size="sm" variant="outline">Toggle</Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Fallback Behavior</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">When Answer Unknown</p>
                  <p className="text-sm text-muted-foreground">
                    Default action for unknown questions
                  </p>
                </div>
                <Badge variant="outline">Research & Respond</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Escalate Threshold</p>
                  <p className="text-sm text-muted-foreground">
                    After how many attempts to transfer to human
                  </p>
                </div>
                <Badge variant="outline">2 Attempts</Badge>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
