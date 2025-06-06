import { TextConversation, ConversationMetrics, TextMessage } from '../types/DatingTypes';

export function analyzeTextingPerformance(conversation: TextConversation): ConversationMetrics {
  const userMessages = conversation.messages.filter(m => m.senderId === 'user');
  const npcMessages = conversation.messages.filter(m => m.senderId !== 'user');
  
  // Calculate response times
  const responseTimes: number[] = [];
  for (let i = 1; i < conversation.messages.length; i++) {
    const current = conversation.messages[i];
    const previous = conversation.messages[i - 1];
    
    if (current.senderId !== previous.senderId) {
      const timeDiff = current.timestamp.getTime() - previous.timestamp.getTime();
      responseTimes.push(timeDiff / 60000); // Convert to minutes
    }
  }
  
  const avgResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0;
  
  // Calculate message lengths
  const messageLengths = userMessages.map(m => m.content.split(' ').length);
  const avgMessageLength = messageLengths.length > 0
    ? messageLengths.reduce((a, b) => a + b, 0) / messageLengths.length
    : 0;
  
  // Calculate emoji usage
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const messagesWithEmoji = userMessages.filter(m => emojiRegex.test(m.content)).length;
  const emojiUsage = userMessages.length > 0 
    ? (messagesWithEmoji / userMessages.length) * 100
    : 0;
  
  // Calculate question ratio
  const questionsAsked = userMessages.filter(m => m.content.includes('?')).length;
  const questionRatio = userMessages.length > 0
    ? (questionsAsked / userMessages.length) * 100
    : 0;
  
  // Calculate engagement score
  const engagementScore = calculateEngagementScore({
    avgResponseTime,
    avgMessageLength,
    questionRatio,
    messageCount: userMessages.length
  });
  
  // Calculate flirt level
  const flirtLevel = calculateFlirtLevel(userMessages);
  
  // Calculate humor score
  const humor = calculateHumorScore(conversation.messages);
  
  // Calculate conversation depth
  const depth = calculateConversationDepth(conversation.messages);
  
  return {
    responseTime: avgResponseTime,
    messageLength: avgMessageLength,
    emojiUsage,
    questionRatio,
    engagementScore,
    flirtLevel,
    humor,
    depth
  };
}

function calculateEngagementScore(params: {
  avgResponseTime: number;
  avgMessageLength: number;
  questionRatio: number;
  messageCount: number;
}): number {
  let score = 50; // Base score
  
  // Response time scoring (faster is better, up to a point)
  if (params.avgResponseTime < 2) {
    score += 20; // Very quick responses
  } else if (params.avgResponseTime < 5) {
    score += 15;
  } else if (params.avgResponseTime < 10) {
    score += 10;
  } else if (params.avgResponseTime > 30) {
    score -= 10; // Too slow
  }
  
  // Message length scoring (moderate length is best)
  if (params.avgMessageLength >= 5 && params.avgMessageLength <= 15) {
    score += 15; // Good length
  } else if (params.avgMessageLength < 3) {
    score -= 10; // Too short
  } else if (params.avgMessageLength > 30) {
    score -= 5; // Too long
  }
  
  // Question ratio scoring (showing interest)
  if (params.questionRatio >= 20 && params.questionRatio <= 40) {
    score += 15; // Good balance
  } else if (params.questionRatio > 60) {
    score -= 5; // Too many questions
  }
  
  return Math.max(0, Math.min(100, score));
}

function calculateFlirtLevel(messages: TextMessage[]): number {
  let flirtScore = 0;
  
  const flirtIndicators = [
    { pattern: /😉|😏|😊|☺️|🥰|😍|💕|❤️|💗|💖/, weight: 1 },
    { pattern: /\bhaha\b|\blol\b|\bhehe\b/i, weight: 0.5 },
    { pattern: /\bcute\b|\bhandsome\b|\bbeautiful\b|\bgorgeous\b/i, weight: 2 },
    { pattern: /\bwink\b|\bflirt\b|\btease\b/i, weight: 1.5 },
    { pattern: /\bdate\b|\bmeet\b|\bsee you\b|\bhang out\b/i, weight: 1 },
    { pattern: /\b(can't wait|excited|looking forward)\b/i, weight: 1.5 },
    { pattern: /\b(your|you're) (smile|eyes|laugh)\b/i, weight: 2 },
    { pattern: /\b(dinner|drinks|coffee|movie)\b.*\b(together|with you)\b/i, weight: 1.5 }
  ];
  
  messages.forEach(message => {
    flirtIndicators.forEach(indicator => {
      if (indicator.pattern.test(message.content)) {
        flirtScore += indicator.weight;
      }
    });
  });
  
  // Normalize to 0-10 scale
  return Math.min(10, Math.round(flirtScore / messages.length * 2));
}

function calculateHumorScore(messages: TextMessage[]): number {
  let humorScore = 0;
  
  const humorIndicators = [
    { pattern: /\bhaha\b|\blol\b|\blmao\b|\brofl\b/i, weight: 1 },
    { pattern: /😂|🤣|😆|😄|😃/, weight: 1 },
    { pattern: /\bjoke\b|\bfunny\b|\bhilarious\b/i, weight: 1.5 },
    { pattern: /\b(that's|you're) (funny|hilarious)\b/i, weight: 2 },
    { pattern: /\b(made me laugh|cracking up)\b/i, weight: 2 }
  ];
  
  messages.forEach(message => {
    humorIndicators.forEach(indicator => {
      if (indicator.pattern.test(message.content)) {
        humorScore += indicator.weight;
      }
    });
  });
  
  // Normalize to 0-10 scale
  return Math.min(10, Math.round(humorScore / messages.length * 3));
}

function calculateConversationDepth(messages: TextMessage[]): number {
  let depthScore = 0;
  
  const depthIndicators = [
    { pattern: /\b(feel|feeling|felt)\b/i, weight: 1.5 },
    { pattern: /\b(think|thought|believe|opinion)\b/i, weight: 1 },
    { pattern: /\b(dream|goal|aspiration|hope)\b/i, weight: 2 },
    { pattern: /\b(passion|love|care about)\b/i, weight: 1.5 },
    { pattern: /\b(experience|story|remember when)\b/i, weight: 1.5 },
    { pattern: /\b(important|meaningful|significant)\b/i, weight: 1.5 },
    { pattern: /\b(why|how come|what made you)\b/i, weight: 1 },
    { pattern: /\b(tell me more|elaborate|explain)\b/i, weight: 1.5 }
  ];
  
  // Longer messages often indicate deeper conversation
  const longMessages = messages.filter(m => m.content.split(' ').length > 20).length;
  depthScore += longMessages * 0.5;
  
  messages.forEach(message => {
    depthIndicators.forEach(indicator => {
      if (indicator.pattern.test(message.content)) {
        depthScore += indicator.weight;
      }
    });
  });
  
  // Normalize to 0-10 scale
  return Math.min(10, Math.round(depthScore / messages.length * 2));
}

export function generateTextingFeedback(metrics: ConversationMetrics): string[] {
  const feedback: string[] = [];
  
  // Response time feedback
  if (metrics.responseTime < 2) {
    feedback.push("Great response time! You're showing genuine interest.");
  } else if (metrics.responseTime > 15) {
    feedback.push("Try to respond a bit quicker to maintain momentum.");
  }
  
  // Message length feedback
  if (metrics.messageLength < 5) {
    feedback.push("Your messages are quite short. Try adding more detail to show engagement.");
  } else if (metrics.messageLength > 25) {
    feedback.push("Consider shorter messages to keep the conversation flowing.");
  }
  
  // Question ratio feedback
  if (metrics.questionRatio < 10) {
    feedback.push("Ask more questions to show interest in getting to know them.");
  } else if (metrics.questionRatio > 50) {
    feedback.push("Balance questions with sharing about yourself too.");
  }
  
  // Flirt level feedback
  if (metrics.flirtLevel < 3) {
    feedback.push("Don't be afraid to add some playful energy to the conversation!");
  } else if (metrics.flirtLevel > 8) {
    feedback.push("Great flirting! Keep that playful energy going.");
  }
  
  // Engagement feedback
  if (metrics.engagementScore > 70) {
    feedback.push("Excellent engagement! You're creating a great connection.");
  } else if (metrics.engagementScore < 40) {
    feedback.push("Try to be more engaged - ask questions and share stories.");
  }
  
  return feedback;
}
