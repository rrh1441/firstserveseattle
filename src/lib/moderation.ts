import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ModerationResult {
  approved: boolean;
  reason: string;
  confidence: number;
}

export async function moderateReview(
  reviewText: string,
  rating: number
): Promise<ModerationResult> {
  console.log(`🔍 [MODERATION] Starting moderation for review:`, {
    textLength: reviewText.length,
    rating,
    timestamp: new Date().toISOString()
  });

  const prompt = `You are a content moderator for tennis facility reviews. 

Analyze this review and respond with JSON only:
{
  "approved": boolean,
  "reason": "brief explanation",
  "confidence": 0.0-1.0
}

REJECT if review contains:
- Profanity, harassment, hate speech, offensive language
- Spam, promotional content, advertising, irrelevant content
- Personal attacks on staff, other users, or individuals
- False/misleading facility information or claims
- Off-topic content not related to tennis facilities
- Gibberish or nonsensical text

APPROVE if review:
- Gives honest facility feedback (positive or negative opinions welcome)
- Discusses courts, amenities, location, parking, conditions, etc.
- Uses appropriate language and tone
- Is relevant to tennis and the facility experience
- Contains constructive criticism or praise

Review text: "${reviewText.replace(/"/g, '\\"')}"
Rating: ${rating}/5 tennis balls`;

  try {
    console.log(`🤖 [MODERATION] Calling OpenAI API...`);
    const startTime = Date.now();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a content moderator. Respond only with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 150,
    });

    const duration = Date.now() - startTime;
    console.log(`✅ [MODERATION] OpenAI API call completed in ${duration}ms`);

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      console.error(`❌ [MODERATION] Empty response from OpenAI`);
      throw new Error('Empty response from OpenAI');
    }

    console.log(`📝 [MODERATION] Raw OpenAI response:`, content);

    try {
      const result = JSON.parse(content) as ModerationResult;
      
      // Validate the result structure
      if (typeof result.approved !== 'boolean' || 
          typeof result.reason !== 'string' || 
          typeof result.confidence !== 'number') {
        console.error(`❌ [MODERATION] Invalid response structure:`, result);
        throw new Error('Invalid response structure');
      }

      console.log(`✅ [MODERATION] Successfully parsed result:`, {
        approved: result.approved,
        reason: result.reason,
        confidence: result.confidence
      });

      return result;
    } catch (parseError) {
      console.error(`❌ [MODERATION] Failed to parse OpenAI response:`, {
        error: parseError,
        rawContent: content
      });
      // Fall back to rejection on parse error
      return {
        approved: false,
        reason: 'Moderation system error - manual review required',
        confidence: 0.0
      };
    }
  } catch (error) {
    console.error(`❌ [MODERATION] OpenAI API error:`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    // Fallback: reject on error to be safe
    return {
      approved: false,
      reason: 'Moderation system temporarily unavailable',
      confidence: 0.0
    };
  }
}

// Simple backup moderation using basic keyword filtering
export function basicModeration(reviewText: string): ModerationResult {
  const profanityKeywords = [
    'fuck', 'shit', 'damn', 'bitch', 'asshole', 'stupid', 'idiot',
    'hate', 'sucks', 'terrible', 'worst', 'awful', 'horrible'
  ];
  
  const spamKeywords = [
    'click here', 'visit', 'buy now', 'discount', 'free', 'prize',
    'www.', 'http', '.com', 'contact me', 'email me'
  ];

  const lowerText = reviewText.toLowerCase();
  
  // Check for profanity
  for (const word of profanityKeywords) {
    if (lowerText.includes(word)) {
      return {
        approved: false,
        reason: 'Contains inappropriate language',
        confidence: 0.8
      };
    }
  }
  
  // Check for spam
  for (const word of spamKeywords) {
    if (lowerText.includes(word)) {
      return {
        approved: false,
        reason: 'Appears to be spam or promotional content',
        confidence: 0.7
      };
    }
  }
  
  // Check if too short (likely not helpful)
  if (reviewText.trim().length < 10) {
    return {
      approved: false,
      reason: 'Review too short to be helpful',
      confidence: 0.6
    };
  }
  
  return {
    approved: true,
    reason: 'Passed basic content filters',
    confidence: 0.6
  };
}