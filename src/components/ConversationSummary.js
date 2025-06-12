import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import './ConversationSummary.css';

// Emotion config
const emotionConfig = [
  { name: 'Joy', color: '#5cb85c' },
  { name: 'Interest', color: '#5bc0de' },
  { name: 'Concentration', color: '#428bca' },
  { name: 'Boredom', color: '#777777' },
  { name: 'Confusion', color: '#ff7f0e' },
  { name: 'Doubt', color: '#d9534f' },
  { name: 'Sadness', color: '#5253a3' },
  { name: 'Disgust', color: '#a94442' },
  { name: 'Anxiety', color: '#d62728' },
];

// Emoji mapping for emotions
const emotionEmojis = {
  Joy: '😊',
  Interest: '🙂',
  Concentration: '😐',
  Boredom: '😒',
  Confusion: '😕',
  Doubt: '🤔',
  Sadness: '😢',
  Disgust: '😖',
  Anxiety: '😨',
};

const ConversationSummary = ({ summaryData, userId, roomId, onClose }) => {
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (summaryData) {
      generateAISummary(summaryData);
    }
  }, [summaryData]);

  // Call OpenAI API to generate text summary
  const generateAISummary = async (data) => {
    setLoading(true);
    try {
      // Get OpenAI API key from environment variable
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY;



      // Analyze the emotion data
      const user1DominantEmotions = getTopEmotions(data.user1.dominantEmotions, 3);
      const user2DominantEmotions = getTopEmotions(data.user2.dominantEmotions, 3);
      
      // Calculate conversation duration
      const durationMs = Date.now() - data.startTime;
      const minutes = Math.floor(durationMs / 60000);
      const seconds = Math.floor((durationMs % 60000) / 1000);
      
      // Prepare emotion trends data
      const user1EmotionTrends = prepareEmotionTrends(data.user1.emotionTrends);
      const user2EmotionTrends = prepareEmotionTrends(data.user2.emotionTrends);
      
      // Create prompt for GPT
      const prompt = {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert in analyzing emotional data from conversations. Your task is to generate an insightful, helpful, and positive summary of a video chat conversation based on the emotional data provided. Format your response in Markdown."
          },
          {
            role: "user",
            content: `Please analyze this video chat conversation data and provide a personalized summary:

Conversation duration: ${minutes} minutes and ${seconds} seconds

User emotions:
${user1DominantEmotions.map(e => `- ${e.name}: ${e.count} occurrences (${e.emoji})`).join('\n')}

Partner emotions:
${user2DominantEmotions.map(e => `- ${e.name}: ${e.count} occurrences (${e.emoji})`).join('\n')}

Emotion trends for user:
${JSON.stringify(user1EmotionTrends)}

Emotion trends for partner:
${JSON.stringify(user2EmotionTrends)}

Topics discussed:
${data.topics.length > 0 ? data.topics.join(', ') : 'General conversation'}

Please generate a friendly, personalized summary with the following sections:
1. Conversation Overview (duration and general tone)
2. Emotional Dynamics (how emotions changed, patterns noticed)
3. Connection Analysis (compatibility based on emotional responses)
4. Conversation Highlights (what went well, interesting moments)
5. Tips for Future Conversations (based on the emotional patterns)

Format as Markdown with appropriate headers and sections. Keep the tone positive and supportive, but honest.`
          }
        ]
      };
      
      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(prompt)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const responseData = await response.json();
      const summaryText = responseData.choices[0].message.content;
      
      setAiAnalysis(summaryText);
      
      // Generate a downloadable file
      const blob = new Blob([summaryText], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      
      setLoading(false);
    } catch (error) {
      console.error('Error generating AI summary:', error);
      setError(error.message);
      
      // Fallback to a basic summary if API fails
      const fallbackSummary = generateFallbackSummary(data);
      setAiAnalysis(fallbackSummary);
      
      // Create downloadable file for fallback summary
      const blob = new Blob([fallbackSummary], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      
      setLoading(false);
    }
  };

  // Helper function to prepare emotion trends for the API
  const prepareEmotionTrends = (emotionTrends) => {
    if (!emotionTrends || emotionTrends.length < 2) {
      return [];
    }
    
    // Find timestamps at regular intervals
    const startTime = emotionTrends[0].timestamp;
    const endTime = emotionTrends[emotionTrends.length - 1].timestamp;
    const duration = endTime - startTime;
    const intervals = Math.min(5, emotionTrends.length);
    
    const result = [];
    for (let i = 0; i < intervals; i++) {
      const targetTime = startTime + (duration * i / (intervals - 1));
      
      // Find closest data point
      const closestPoint = emotionTrends.reduce((prev, curr) => {
        return (Math.abs(curr.timestamp - targetTime) < Math.abs(prev.timestamp - targetTime))
          ? curr : prev;
      });
      
      const topEmotions = Object.entries(closestPoint.emotions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([name, value]) => ({ name, value: Math.round(value * 100) }));
      
      result.push({
        timeIndex: i,
        relativeTime: i === 0 ? "Start" : i === intervals - 1 ? "End" : `${Math.round((i / (intervals - 1)) * 100)}%`,
        topEmotions
      });
    }
    
    return result;
  };

  // Generate fallback summary if API call fails
  const generateFallbackSummary = (data) => {
    const user1DominantEmotions = getTopEmotions(data.user1.dominantEmotions, 2);
    const user2DominantEmotions = getTopEmotions(data.user2.dominantEmotions, 2);
    
    const durationMs = Date.now() - data.startTime;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    
    return `
# Conversation Summary

Your conversation lasted ${minutes} minutes and ${seconds} seconds.

## Emotional Overview

During this conversation, your dominant emotions were ${user1DominantEmotions.map(e => `${e.name} (${e.emoji})`).join(' and ')}.
Your partner primarily expressed ${user2DominantEmotions.map(e => `${e.name} (${e.emoji})`).join(' and ')}.

## Conversation Highlights

You both showed genuine interest in each other's perspectives. The emotional tone was generally positive, with moments of curiosity and thoughtful consideration. 

Topics that stood out in your conversation:
${data.topics.length > 0 ? data.topics.map(topic => `- ${topic}`).join('\n') : '- General conversation and getting to know each other'}

## Compatibility Analysis

Based on your emotional responses, you appear to have good conversational chemistry. The balance of interest and joy suggests a positive foundation for continued interaction.

Thank you for using XRCupid! We hope this analysis helps you reflect on your conversation experience.
    `;
  };

  // Helper to get top emotions
  const getTopEmotions = (emotionsObj, count = 2) => {
    if (!emotionsObj || Object.keys(emotionsObj).length === 0) {
      return [{ name: 'Neutral', count: 1, emoji: '😐' }];
    }
    
    const emotionsList = Object.entries(emotionsObj).map(([name, count]) => ({
      name,
      count,
      emoji: emotionEmojis[name] || ''
    }));
    
    return emotionsList
      .sort((a, b) => b.count - a.count)
      .slice(0, count);
  };

  // Prepare emotion trend data
  const prepareEmotionTrendData = (emotionTrends) => {
    if (!emotionTrends || emotionTrends.length < 2) {
      return [];
    }
    
    // Get top emotions to track
    const emotionCounts = {};
    emotionTrends.forEach(point => {
      Object.entries(point.emotions).forEach(([emotion, value]) => {
        if (value > 0.2) { // Only count significant emotions
          emotionCounts[emotion] = (emotionCounts[emotion] || 0) + value;
        }
      });
    });
    
    const topEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);
    
    // Create chart data with regular intervals
    const firstTimestamp = emotionTrends[0].timestamp;
    const lastTimestamp = emotionTrends[emotionTrends.length - 1].timestamp;
    const duration = lastTimestamp - firstTimestamp;
    const points = Math.min(10, emotionTrends.length);
    const interval = duration / (points - 1);
    
    const chartData = [];
    for (let i = 0; i < points; i++) {
      const targetTime = firstTimestamp + (i * interval);
      
      // Find closest data point
      const closestPoint = emotionTrends.reduce((prev, curr) => {
        return (Math.abs(curr.timestamp - targetTime) < Math.abs(prev.timestamp - targetTime))
          ? curr : prev;
      });
      
      const dataPoint = {
        time: new Date(targetTime).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      
      // Add top emotions
      topEmotions.forEach(emotion => {
        dataPoint[emotion] = closestPoint.emotions[emotion] 
          ? Math.round(closestPoint.emotions[emotion] * 100) 
          : 0;
      });
      
      chartData.push(dataPoint);
    }
    
    return { chartData, topEmotions };
  };

  // Process dominant emotions for pie chart
  const prepareDominantEmotionsData = (dominantEmotions) => {
    if (!dominantEmotions || Object.keys(dominantEmotions).length === 0) {
      return [{ name: 'Neutral', value: 1 }];
    }
    
    return Object.entries(dominantEmotions)
      .map(([name, count]) => ({
        name,
        value: count
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Show top 5 emotions
  };

  // Handle download summary
  const downloadSummary = () => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `XRCupid-Summary-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Conditional rendering - must be INSIDE the component function
  if (!summaryData) {
    return (
      <div className="conversation-summary-container">
        <div className="summary-header">
          <h2>No conversation data available</h2>
          <button className="close-button" onClick={onClose}>Close</button>
        </div>
        <p>There is no data available to generate a summary.</p>
      </div>
    );
  }

  // Prepare chart data
  const user1TrendData = prepareEmotionTrendData(summaryData.user1.emotionTrends);
  const user2TrendData = prepareEmotionTrendData(summaryData.user2.emotionTrends);
  const user1PieData = prepareDominantEmotionsData(summaryData.user1.dominantEmotions);
  const user2PieData = prepareDominantEmotionsData(summaryData.user2.dominantEmotions);

  return (
    <div className="conversation-summary-container">
      <div className="summary-header">
        <h2>Conversation Summary</h2>
        <div className="header-buttons">
          <button className="download-button" onClick={downloadSummary}>
            Download Summary
          </button>
          <button className="close-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Analyzing your conversation data...</p>
        </div>
      ) : (
        <div className="summary-content">
          {error && (
            <div className="error-message">
              <p>There was an error generating the AI analysis: {error}</p>
              <p>Showing a basic summary instead.</p>
            </div>
          )}
          
          <div className="text-summary">
            <div className="markdown-content">
              {aiAnalysis.split('\n').map((line, index) => {
                if (line.startsWith('# ')) {
                  return <h1 key={index}>{line.substring(2)}</h1>;
                } else if (line.startsWith('## ')) {
                  return <h2 key={index}>{line.substring(3)}</h2>;
                } else if (line.startsWith('### ')) {
                  return <h3 key={index}>{line.substring(4)}</h3>;
                } else if (line.startsWith('- ')) {
                  return <div className="list-item" key={index}>{line}</div>;
                } else if (line === '') {
                  return <br key={index} />;
                } else {
                  return <p key={index}>{line}</p>;
                }
              })}
            </div>
          </div>

          <div className="charts-container">
            <div className="chart-section">
              <h3>Your Emotional Journey</h3>
              <div className="chart-wrapper">
                {user1TrendData.chartData && user1TrendData.chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={user1TrendData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`]} />
                      <Legend />
                      {user1TrendData.topEmotions.map((emotion) => {
                        const config = emotionConfig.find(e => e.name === emotion) || { color: '#999' };
                        return (
                          <Line
                            key={emotion}
                            type="monotone"
                            dataKey={emotion}
                            stroke={config.color}
                            name={`${emotion} ${emotionEmojis[emotion] || ''}`}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="no-data-message">Not enough data to visualize emotion trends</div>
                )}
              </div>
            </div>

            <div className="chart-section">
              <h3>Your Dominant Emotions</h3>
              <div className="chart-wrapper">
                {user1PieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={user1PieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {user1PieData.map((entry, index) => {
                          const emotion = emotionConfig.find(e => e.name === entry.name);
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={emotion ? emotion.color : `hsl(${index * 45}, 70%, 60%)`} 
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} occurrences`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="no-data-message">No dominant emotions detected</div>
                )}
              </div>
            </div>

            <div className="chart-section">
              <h3>Partner's Emotional Journey</h3>
              <div className="chart-wrapper">
                {user2TrendData.chartData && user2TrendData.chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={user2TrendData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`]} />
                      <Legend />
                      {user2TrendData.topEmotions.map((emotion) => {
                        const config = emotionConfig.find(e => e.name === emotion) || { color: '#999' };
                        return (
                          <Line
                            key={emotion}
                            type="monotone"
                            dataKey={emotion}
                            stroke={config.color}
                            name={`${emotion} ${emotionEmojis[emotion] || ''}`}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="no-data-message">Not enough data to visualize emotion trends</div>
                )}
              </div>
            </div>

            <div className="chart-section">
              <h3>Partner's Dominant Emotions</h3>
              <div className="chart-wrapper">
                {user2PieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={user2PieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {user2PieData.map((entry, index) => {
                          const emotion = emotionConfig.find(e => e.name === entry.name);
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={emotion ? emotion.color : `hsl(${index * 45}, 70%, 60%)`} 
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} occurrences`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="no-data-message">No dominant emotions detected</div>
                )}
              </div>
            </div>

            <div className="chart-section full-width">
              <h3>Emotional Compatibility</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart outerRadius={90} data={emotionConfig}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="You"
                      dataKey={(entry) => {
                        const emotion = summaryData.user1.dominantEmotions[entry.name];
                        return emotion ? Math.min(emotion * 10, 100) : 0;
                      }}
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.5}
                    />
                    <Radar
                      name="Partner"
                      dataKey={(entry) => {
                        const emotion = summaryData.user2.dominantEmotions[entry.name];
                        return emotion ? Math.min(emotion * 10, 100) : 0;
                      }}
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      fillOpacity={0.5}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationSummary;