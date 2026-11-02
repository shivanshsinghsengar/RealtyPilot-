-- AI Configuration Schema
-- This allows admin to customize AI behavior

-- Message templates table
CREATE TABLE ai_message_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('welcome', 'property_intro', 'follow_up', 'closing', 'fallback')),
    template_text TEXT NOT NULL,
    variables JSONB DEFAULT '{}',
    conditions JSONB DEFAULT '{}', -- {"min_budget": 4000000, "location": "Hoshangabad Road"}
    priority INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Property knowledge base
CREATE TABLE ai_property_knowledge (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    property_name TEXT NOT NULL,
    knowledge_type TEXT NOT NULL CHECK (knowledge_type IN ('basic_info', 'pricing', 'amenities', 'location', 'faq')),
    content TEXT NOT NULL,
    keywords TEXT[] DEFAULT '{}', -- For better matching
    confidence_score INTEGER DEFAULT 80 CHECK (confidence_score BETWEEN 0 AND 100),
    source TEXT DEFAULT 'manual', -- manual, learned, imported
    is_verified BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Response rules for AI
CREATE TABLE ai_response_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_name TEXT NOT NULL,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('keyword', 'question_pattern', 'budget_range', 'location', 'timeline')),
    trigger_value JSONB NOT NULL, -- {"keywords": ["price", "cost"], "min_budget": 4000000, "location": "Hoshangabad"}
    response_template_id UUID REFERENCES ai_message_templates(id),
    custom_response TEXT,
    action TEXT NOT NULL CHECK (action IN ('respond', 'suggest_property', 'ask_clarification', 'transfer_to_human')),
    priority INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI learning log (for unknown questions)
CREATE TABLE ai_learning_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    original_question TEXT NOT NULL,
    context JSONB DEFAULT '{}', -- {"lead_budget": 5000000, "lead_location": "Airport Road"}
    detected_intent TEXT,
    confidence_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'researched', 'answered', 'escalated')),
    ai_response TEXT,
    human_response TEXT,
    learned_knowledge_id UUID REFERENCES ai_property_knowledge(id),
    admin_reviewed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI behavior settings
CREATE TABLE ai_behavior_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_name TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default AI behavior settings
INSERT INTO ai_behavior_settings (setting_name, setting_value, description) VALUES
('learning_mode', '{"enabled": true, "auto_research": true, "confidence_threshold": 70}', 'Enable AI to learn from unknown questions'),
('response_style', '{"language": "hi_en_mix", "formality": "professional_friendly", "emoji_enabled": true}', 'AI response tone and style'),
('fallback_behavior', '{"action": "research_and_respond", "escalate_threshold": 2}', 'What to do when answer is unknown'),
('property_matching', '{"max_properties_per_message": 3, "match_score_threshold": 60}', 'How many properties to suggest');

-- Create indexes for performance
CREATE INDEX idx_ai_templates_category ON ai_message_templates(category, is_active);
CREATE INDEX idx_ai_knowledge_keywords ON ai_property_knowledge USING gin(keywords);
CREATE INDEX idx_ai_rules_trigger ON ai_response_rules(trigger_type, is_active);
CREATE INDEX idx_ai_learning_status ON ai_learning_log(status, created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE ai_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_property_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_response_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_behavior_settings ENABLE ROW LEVEL SECURITY;

-- Create policies (only admins can access)
CREATE POLICY "Admins can manage AI templates" ON ai_message_templates
    FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Admins can manage knowledge base" ON ai_property_knowledge
    FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Admins can manage response rules" ON ai_response_rules
    FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Admins can view learning log" ON ai_learning_log
    FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "System can insert learning log" ON ai_learning_log
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage behavior settings" ON ai_behavior_settings
    FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
