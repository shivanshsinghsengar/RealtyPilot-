# AI Configuration Setup Guide

## What We've Built

### ✅ **Feature 1: AI Behavior Customization**
You can now teach your AI:
- What messages to send to clients
- What information to provide
- How to respond to specific questions

### ✅ **Feature 2: Dynamic Knowledge Learning**
AI will automatically:
- Handle questions you haven't taught it
- Research answers using Gemini
- Learn and add new knowledge to its database
- Improve over time

---

## How to Use

### 1. **Access AI Configuration Dashboard**
```
URL: https://realty-pilot-tmo3.vercel.app/dashboard/ai-config
Path: /dashboard/ai-config (in sidebar)
Icon: 🧠 Brain
Access: Only for admin users
```

### 2. **Set Up Database**
Run the migration in Supabase:
```sql
-- Go to: https://supabase.com/dashboard/project/abvmkupnprogppemubpv/sql
-- Copy and run the SQL from: supabase/migrations/005_ai_configuration.sql
```

### 3. **Configure AI Step-by-Step**

#### Step A: Add Message Templates
```
Section: Message Templates
Purpose: Define what AI says in different scenarios
Categories:
• welcome - First message to leads
• property_intro - Property introduction
• follow_up - Follow-up messages
• closing - Closing messages
• fallback - Default when no match
```

**Example Template:**
```json
{
  "name": "Budget 40-50L Intro",
  "category": "property_intro",
  "template_text": "Hi [Name]! For your [Budget] budget in [Location], check out Narmada Greens.",
  "conditions": {
    "min_budget": 4000000,
    "max_budget": 5000000
  }
}
```

#### Step B: Add Property Knowledge
```
Section: Knowledge Base
Purpose: Teach AI about properties
Types:
• basic_info - Basic property details
• pricing - Price ranges, payment plans
• amenities - Features & facilities
• location - Area advantages
• faq - Common questions & answers
```

**Example Knowledge:**
```json
{
  "property_name": "Narmada Greens",
  "knowledge_type": "pricing",
  "content": "Plots available from ₹40 Lakh to ₹1.2 Crore",
  "keywords": ["narmada", "greens", "price", "cost"]
}
```

#### Step C: Create Response Rules
```
Section: Response Rules
Purpose: Tell AI when to use which template
Trigger types:
• keyword - When question contains specific words
• budget_range - Based on lead's budget
• location - Based on preferred locality
• timeline - Based on urgency
```

**Example Rule:**
```json
{
  "rule_name": "Price Inquiry",
  "trigger_type": "keyword",
  "trigger_value": {
    "keywords": ["price", "cost", "kitna", "rate"]
  },
  "action": "respond",
  "custom_response": "Prices start from ₹40 Lakh depending on location and size."
}
```

#### Step D: Configure Behavior Settings
```
Section: Behavior Settings
Key settings:
1. Learning Mode:
   - Enabled: AI learns from unknown questions
   - Auto Research: AI researches answers automatically
   - Confidence Threshold: Minimum 70% confidence to respond

2. Response Style:
   - Language: Hindi + English mix
   - Formality: Professional friendly
   - Emojis: Enabled

3. Fallback Behavior:
   - Action: Research & Respond
   - Escalate after: 2 attempts
```

---

## How It Works (Flow Diagram)

```
Client Question → AI Knowledge Service → Find Answer?
    │                              │
    ├─ Found → Return Answer ←─────┤
    │
    └─ Not Found → Handle Unknown
                   ├─ Learning Enabled? → Research → Learn
                   ├─ Auto Research? → Generate Answer
                   └─ Default → "I'll check & get back"
```

---

## Testing the AI

### API Endpoint:
```
POST: /api/ai/knowledge
Request:
{
  "question": "What's the price of Narmada Greens?",
  "context": {
    "lead_budget": 5000000,
    "lead_location": "Hoshangabad Road"
  }
}

Response:
{
  "success": true,
  "answer": "Narmada Greens plots start from ₹40 Lakh...",
  "confidence": 85,
  "source": "knowledge:pricing"
}
```

### Test via cURL:
```bash
curl -X POST "https://realty-pilot-tmo3.vercel.app/api/ai/knowledge" \
  -H "Content-Type: application/json" \
  -d '{"question": "Any plots near airport?", "context": {}}'
```

---

## Integration with WhatsApp Automation

### Smart Message Generation:
```typescript
// In your WhatsApp automation code:
const aiService = new AIKnowledgeService();
const message = await aiService.generateSmartMessage(leadId);
// Returns personalized message based on lead profile
```

### Example Output:
```
Hi Rahul! For your ₹45 Lakh budget in Airport Road, 
check out Bhojpal Enclave - ready-to-move plots 
with clubhouse and security. 😊
```

---

## Learning Process

### When AI doesn't know an answer:

1. **Logs the question** in Learning Log
2. **Researches using Gemini** (if enabled)
3. **Extracts knowledge** from researched answer
4. **Adds to knowledge base** for future use
5. **Notifies admin** for review

### View Learning Log:
- Go to: `/dashboard/ai-config → Learning Log`
- See unanswered questions
- Approve/reject AI's learned responses
- Manually add correct answers

---

## Advanced Features

### 1. **Context-Aware Responses**
AI considers:
- Lead's budget
- Preferred location
- Timeline urgency
- Previous conversation

### 2. **Template Variables**
Use placeholders in templates:
- `[Name]` - Lead's first name
- `[Budget]` - Formatted budget
- `[Location]` - Preferred locality
- `[Project]` - Matching project

### 3. **Rule Priority System**
Rules execute in priority order:
- Higher priority = checked first
- Stop at first match
- Default fallback rules

---

## Best Practices

### For Message Templates:
✅ Do:
- Use Hinglish (Hindi + English)
- Keep messages short (1-2 lines)
- Add emojis for engagement
- Personalize with variables

❌ Don't:
- Use complex sentences
- Include too many details
- Sound robotic or formal

### For Knowledge Base:
✅ Do:
- Add keywords for better matching
- Keep information updated
- Add multiple variations
- Include pricing with ranges

❌ Don't:
- Add contradictory information
- Forget to update old data
- Add sensitive information

---

## Troubleshooting

### Common Issues:

1. **AI not responding properly**
   - Check if templates are active
   - Verify rule conditions
   - Check confidence scores

2. **Learning not working**
   - Verify learning_mode is enabled
   - Check Gemini API key
   - Look at learning log

3. **Performance slow**
   - Add indexes to database
   - Limit knowledge base size
   - Cache frequent responses

### Debug API:
```
GET: /api/ai/knowledge
Returns: API status and usage instructions
```

---

## Migration Instructions

### Run these SQL commands in Supabase:

1. **Go to SQL Editor:**
   ```
   https://supabase.com/dashboard/project/abvmkupnprogppemubpv/sql
   ```

2. **Run migration:**
   ```sql
   -- Copy entire content from:
   -- supabase/migrations/005_ai_configuration.sql
   ```

3. **Verify tables:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name LIKE 'ai_%';
   ```

4. **Add test data:**
   ```sql
   INSERT INTO ai_message_templates (name, category, template_text) 
   VALUES ('Welcome', 'welcome', 'Hi [Name]! Welcome to RealtyPilot.');
   ```

---

## What's Next

### Phase 2 (Coming Soon):
1. **Analytics Dashboard** - See which responses work best
2. **Bulk Import** - Import knowledge from CSV
3. **Multi-language Support** - Hindi-only mode
4. **Human-in-the-loop** - Agent review before sending

### Phase 3:
1. **Voice Integration** - AI can call leads
2. **Email Automation** - AI-powered emails
3. **Competitor Analysis** - Learn from market data
4. **Predictive Scoring** - Predict lead conversion

---

## Support

For help:
1. Check logs in `/dashboard/ai-config/learning`
2. Test API with sample questions
3. Review templates and rules
4. Contact support if issues persist

---

## Success Metrics

Track these in Boss Dashboard:
- ✅ AI response accuracy %
- ✅ Learning efficiency (questions solved/learned)
- ✅ Customer satisfaction scores
- ✅ Time saved per agent (hours/week)
- ✅ Conversion rate improvement

---

**Ready to launch!** 🚀