import axios from 'axios';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL_NAME = 'llama3-70b-8192';

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

const cleanJsonString = (str: string): string => {
  let cleaned = str.trim();
  // Strip starting ```json or ``` and ending ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/, '');
  return cleaned.trim();
};

/**
 * Fallback parser in case Groq is unavailable
 */
const mockParseFilters = (description: string): Record<string, any> => {
  const filters: Record<string, any> = {};
  const lower = description.toLowerCase();

  // City matching
  if (lower.includes('delhi')) filters.city = 'Delhi';
  if (lower.includes('mumbai')) filters.city = 'Mumbai';
  if (lower.includes('bangalore') || lower.includes('bengaluru')) filters.city = 'Bangalore';
  if (lower.includes('chandigarh')) filters.city = 'Chandigarh';
  if (lower.includes('pune')) filters.city = 'Pune';

  // Gender matching
  if (lower.includes('female') || lower.includes('women')) filters.gender = 'Female';
  else if (lower.includes('male') || lower.includes('men')) filters.gender = 'Male';

  // Category matching
  if (lower.includes('shoes')) filters.category = 'Shoes';
  if (lower.includes('t-shirt') || lower.includes('tshirt')) filters.category = 'T-Shirts';
  if (lower.includes('jeans')) filters.category = 'Jeans';
  if (lower.includes('accessories')) filters.category = 'Accessories';
  if (lower.includes('beauty')) filters.category = 'Beauty';

  // Spend matching
  const spendMinMatch = lower.match(/(?:spent|spend|value|ltv)\s*(?:over|above|>\s*|more than|gte\s*|₹\s*|rs\.?\s*)(\d+)/i);
  if (spendMinMatch) {
    filters.minSpend = parseInt(spendMinMatch[1], 10);
  }

  const spendMaxMatch = lower.match(/(?:spent|spend|value|ltv)\s*(?:under|below|<\s*|less than|lte\s*|₹\s*|rs\.?\s*)(\d+)/i);
  if (spendMaxMatch) {
    filters.maxSpend = parseInt(spendMaxMatch[1], 10);
  }

  // Inactive matching
  const inactiveMatch = lower.match(/(?:not shopped|not purchased|inactive|last shopped|days ago|since)\s*(?:in|for|>\s*|over)?\s*(\d+)\s*days/i);
  if (inactiveMatch) {
    filters.inactiveDays = parseInt(inactiveMatch[1], 10);
  }

  // Active matching
  const activeMatch = lower.match(/(?:shopped|purchased|active)\s*(?:within|in last|in the past|<\s*)?\s*(\d+)\s*days/i);
  if (activeMatch) {
    filters.activeDays = parseInt(activeMatch[1], 10);
  }

  // Min orders matching
  const ordersMatch = lower.match(/(?:min|at least|over|>\s*)?\s*(\d+)\s*(?:order|purchase|transact)/i);
  if (ordersMatch) {
    filters.minOrders = parseInt(ordersMatch[1], 10);
  }

  return filters;
};

export const parseAudienceFilters = async (description: string): Promise<Record<string, any>> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    console.log('[AI Service] No GROQ_API_KEY set. Using local mock filter parser.');
    return mockParseFilters(description);
  }

  try {
    const response = await axios.post<GroqResponse>(
      GROQ_API_URL,
      {
        model: MODEL_NAME,
        messages: [
          {
            role: 'system',
            content: `You are a CRM audience filter parser for a fashion retail brand in India.
Extract structured MongoDB-compatible filters from natural language.
Return ONLY a valid JSON object. No explanation. No markdown. No backticks.
Supported filter fields:
- minSpend: number (minimum lifetime value)
- maxSpend: number (maximum lifetime value)
- inactiveDays: number (days since last purchase)
- activeDays: number (purchased within last N days)
- city: string (Delhi, Mumbai, Bangalore, Chandigarh, Pune)
- gender: string (Male, Female)
- minOrders: number (minimum number of orders)
- category: string (Shoes, T-Shirts, Jeans, Accessories, Beauty)
If a field is not mentioned, omit it from JSON entirely.`,
          },
          {
            role: 'user',
            content: description,
          },
        ],
        temperature: 0.1,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const content = response.data.choices[0].message.content;
    const cleaned = cleanJsonString(content);
    return JSON.parse(cleaned);
  } catch (error: any) {
    console.error('[AI Service] parseAudienceFilters failed. Error:', error.message);
    console.log('[AI Service] Attempting fallback to local mock parser.');
    try {
      return mockParseFilters(description);
    } catch (fallbackError) {
      console.error('[AI Service] Mock fallback failed:', fallbackError);
      return {};
    }
  }
};

export const generateCampaign = async (
  goal: string,
  audienceDescription: string
): Promise<{ name: string; channel: string; message: string }> => {
  const defaultCampaign = {
    name: 'Exclusive Fashion Treat',
    channel: 'WhatsApp',
    message: 'Namaste {{name}}! Treat yourself to the trendiest styles. Enjoy an exclusive 15% off using code FASHION15. Shop now!',
  };

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    console.log('[AI Service] No GROQ_API_KEY set. Using default campaign template.');
    return defaultCampaign;
  }

  try {
    const response = await axios.post<GroqResponse>(
      GROQ_API_URL,
      {
        model: MODEL_NAME,
        messages: [
          {
            role: 'system',
            content: `You are an expert marketing campaign strategist for Indian fashion retail brands.
Generate a campaign based on the marketer's goal.
Return ONLY a valid JSON object with these exact fields:
{
  "name": "string",          // creative campaign name
  "channel": "string",       // one of: WhatsApp, SMS, Email, RCS
  "message": "string"        // personalized message using {{name}} placeholder
}
No explanation. No markdown. No backticks.`,
          },
          {
            role: 'user',
            content: `Goal: ${goal}
Target Audience: ${audienceDescription}
Generate a campaign for an Indian fashion brand.`,
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const content = response.data.choices[0].message.content;
    const cleaned = cleanJsonString(content);
    return JSON.parse(cleaned);
  } catch (error: any) {
    console.error('[AI Service] generateCampaign failed. Error:', error.message);
    return defaultCampaign;
  }
};

export const generateInsights = async (
  metrics: {
    sent: number;
    delivered: number;
    failed: number;
    opened: number;
    read: number;
    clicked: number;
    converted: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  }
): Promise<{ summary: string; insights: string[]; recommendations: string[] }> => {
  const defaultInsights = {
    summary: 'The campaign shows stable core engagement metrics. Delivery rates are within expected limits, but there is room to improve conversion stages.',
    insights: [
      'Recipient response peaks within the first hour of delivery.',
      'Conversion rates represent typical engagement for fashion products.',
      'A minor drop-off is visible between open and read states.',
    ],
    recommendations: [
      'A/B test different subject lines and message headers to boost initial open rates.',
      'Introduce a limited-time coupon code to accelerate the final conversion step.',
    ],
  };

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    console.log('[AI Service] No GROQ_API_KEY set. Using default analytical insights.');
    return defaultInsights;
  }

  try {
    const response = await axios.post<GroqResponse>(
      GROQ_API_URL,
      {
        model: MODEL_NAME,
        messages: [
          {
            role: 'system',
            content: `You are a marketing analytics expert for Indian fashion retail brands.
Analyze campaign performance metrics and return insights.
Return ONLY a valid JSON object:
{
  "summary": "string",        // 2 sentence performance summary
  "insights": ["string"],     // array of 3-4 specific insights
  "recommendations": ["string"] // array of 2-3 actionable recommendations
}
No markdown. No backticks.`,
          },
          {
            role: 'user',
            content: `Campaign Metrics:
Sent: ${metrics.sent}
Delivered: ${metrics.delivered}
Failed: ${metrics.failed}
Opened: ${metrics.opened}
Read: ${metrics.read}
Clicked: ${metrics.clicked}
Converted: ${metrics.converted}
Delivery Rate: ${metrics.deliveryRate}%
Open Rate: ${metrics.openRate}%
Click Rate: ${metrics.clickRate}%
Conversion Rate: ${metrics.conversionRate}%`,
          },
        ],
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const content = response.data.choices[0].message.content;
    const cleaned = cleanJsonString(content);
    return JSON.parse(cleaned);
  } catch (error: any) {
    console.error('[AI Service] generateInsights failed. Error:', error.message);
    return defaultInsights;
  }
};
