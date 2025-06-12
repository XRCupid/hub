import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import TranscriptTimeline from './TranscriptTimeline';
import { TranscriptSegment } from '../services/humeVoiceService';
import './ChemistryReport.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface EmotionSnapshot {
  timestamp: number;
  participant1Emotions: { name: string; score: number }[];
  participant2Emotions: { name: string; score: number }[];
}

interface ChemistryReportProps {
  emotionHistory: EmotionSnapshot[];
  participant1Name: string;
  participant2Name: string;
  callDuration: number; // in seconds
  transcriptSegments?: TranscriptSegment[];
  onClose: () => void;
}

interface ChemistryMetrics {
  overallScore: number;
  peakMoment: { time: number; score: number; description: string };
  lowMoment: { time: number; score: number; description: string };
  emotionalSync: number;
  dominantVibe: string;
  keyMoments: { time: number; event: string; impact: 'positive' | 'negative' }[];
}

const ChemistryReport: React.FC<ChemistryReportProps> = ({
  emotionHistory,
  participant1Name,
  participant2Name,
  callDuration,
  transcriptSegments = [],
  onClose
}) => {
  const chemistryMetrics = useMemo(() => {
    if (!emotionHistory.length) return null;

    // Calculate chemistry score for each snapshot
    const chemistryScores = emotionHistory.map((snapshot, index) => {
      const p1Positive = snapshot.participant1Emotions
        .filter(e => ['Joy', 'Interest', 'Excitement', 'Amusement'].includes(e.name))
        .reduce((sum, e) => sum + e.score, 0);
      
      const p2Positive = snapshot.participant2Emotions
        .filter(e => ['Joy', 'Interest', 'Excitement', 'Amusement'].includes(e.name))
        .reduce((sum, e) => sum + e.score, 0);
      
      const p1Negative = snapshot.participant1Emotions
        .filter(e => ['Sadness', 'Anger', 'Fear', 'Disgust'].includes(e.name))
        .reduce((sum, e) => sum + e.score, 0);
      
      const p2Negative = snapshot.participant2Emotions
        .filter(e => ['Sadness', 'Anger', 'Fear', 'Disgust'].includes(e.name))
        .reduce((sum, e) => sum + e.score, 0);

      // Chemistry is high when both have positive emotions and low negative
      const positiveSync = Math.min(p1Positive, p2Positive) / 100;
      const negativeSync = (p1Negative + p2Negative) / 200;
      const chemistry = (positiveSync * 0.7) - (negativeSync * 0.3);
      
      return {
        time: index * (callDuration / emotionHistory.length),
        score: Math.max(0, Math.min(1, chemistry)),
        p1Dominant: snapshot.participant1Emotions[0]?.name || 'Neutral',
        p2Dominant: snapshot.participant2Emotions[0]?.name || 'Neutral'
      };
    });

    // Find peak and low moments
    const peakMoment = chemistryScores.reduce((max, current) => 
      current.score > max.score ? current : max
    );
    
    const lowMoment = chemistryScores.reduce((min, current) => 
      current.score < min.score ? current : min
    );

    // Calculate emotional synchrony
    const emotionalSync = chemistryScores.reduce((sum, snapshot, index) => {
      if (index === 0) return sum;
      const p1Emotions = emotionHistory[index].participant1Emotions;
      const p2Emotions = emotionHistory[index].participant2Emotions;
      
      // Check if top emotions match
      if (p1Emotions[0]?.name === p2Emotions[0]?.name) {
        return sum + 1;
      }
      return sum;
    }, 0) / Math.max(1, chemistryScores.length - 1);

    // Identify key moments (significant changes)
    const keyMoments: { time: number; event: string; impact: 'positive' | 'negative' }[] = [];
    for (let i = 1; i < chemistryScores.length; i++) {
      const change = chemistryScores[i].score - chemistryScores[i - 1].score;
      if (Math.abs(change) > 0.2) {
        keyMoments.push({
          time: chemistryScores[i].time,
          event: change > 0 ? 
            `Vibe shift! Both showed ${chemistryScores[i].p1Dominant}` :
            `Energy dip - mismatch in emotions`,
          impact: change > 0 ? 'positive' : 'negative'
        });
      }
    }

    // Determine dominant vibe
    const emotionCounts: Record<string, number> = {};
    emotionHistory.forEach(snapshot => {
      [snapshot.participant1Emotions[0], snapshot.participant2Emotions[0]].forEach(emotion => {
        if (emotion) {
          emotionCounts[emotion.name] = (emotionCounts[emotion.name] || 0) + 1;
        }
      });
    });
    
    const dominantVibe = Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Neutral';

    return {
      overallScore: chemistryScores.reduce((sum, s) => sum + s.score, 0) / chemistryScores.length,
      peakMoment: {
        ...peakMoment,
        description: `Both were ${peakMoment.p1Dominant} and ${peakMoment.p2Dominant}`
      },
      lowMoment: {
        ...lowMoment,
        description: `Emotional mismatch: ${lowMoment.p1Dominant} vs ${lowMoment.p2Dominant}`
      },
      emotionalSync,
      dominantVibe,
      keyMoments,
      chemistryScores
    };
  }, [emotionHistory, callDuration]);

  if (!chemistryMetrics) {
    return <div className="chemistry-report">No data available</div>;
  }

  const chartData = {
    labels: chemistryMetrics.chemistryScores.map(s => 
      `${Math.floor(s.time / 60)}:${String(Math.floor(s.time % 60)).padStart(2, '0')}`
    ),
    datasets: [
      {
        label: 'Chemistry Level',
        data: chemistryMetrics.chemistryScores.map(s => s.score * 100),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Chemistry Over Time'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value: any) => `${value}%`
        }
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 0.8) return '🔥';
    if (score >= 0.6) return '✨';
    if (score >= 0.4) return '👍';
    if (score >= 0.2) return '🤔';
    return '😬';
  };

  const getScoreText = (score: number) => {
    if (score >= 0.8) return 'Amazing Chemistry!';
    if (score >= 0.6) return 'Great Connection';
    if (score >= 0.4) return 'Good Vibes';
    if (score >= 0.2) return 'Some Potential';
    return 'Not Much Spark';
  };

  return (
    <div className="chemistry-report-overlay">
      <div className="chemistry-report">
        <button className="close-button" onClick={onClose}>×</button>
        
        <h1>Chemistry Analysis Report</h1>
        <div className="participants">
          {participant1Name} & {participant2Name}
        </div>
        
        <div className="overall-score">
          <div className="score-circle">
            <div className="score-value">
              {Math.round(chemistryMetrics.overallScore * 100)}%
            </div>
            <div className="score-emoji">{getScoreEmoji(chemistryMetrics.overallScore)}</div>
          </div>
          <h2>{getScoreText(chemistryMetrics.overallScore)}</h2>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <h3>🎯 Emotional Sync</h3>
            <div className="metric-value">{Math.round(chemistryMetrics.emotionalSync * 100)}%</div>
            <p>How often you both felt the same emotions</p>
          </div>

          <div className="metric-card">
            <h3>🌟 Peak Moment</h3>
            <div className="metric-value">@ {formatTime(chemistryMetrics.peakMoment.time)}</div>
            <p>{chemistryMetrics.peakMoment.description}</p>
          </div>

          <div className="metric-card">
            <h3>📉 Low Point</h3>
            <div className="metric-value">@ {formatTime(chemistryMetrics.lowMoment.time)}</div>
            <p>{chemistryMetrics.lowMoment.description}</p>
          </div>

          <div className="metric-card">
            <h3>🎭 Dominant Vibe</h3>
            <div className="metric-value">{chemistryMetrics.dominantVibe}</div>
            <p>The most common emotional state</p>
          </div>
        </div>

        <div className="chemistry-chart">
          <Line data={chartData} options={chartOptions} />
        </div>

        <div className="key-moments">
          <h3>Key Moments</h3>
          <div className="moments-timeline">
            {chemistryMetrics.keyMoments.map((moment, index) => (
              <div key={index} className={`moment ${moment.impact}`}>
                <div className="moment-time">{formatTime(moment.time)}</div>
                <div className="moment-event">{moment.event}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Transcript Timeline */}
        {transcriptSegments.length > 0 && (
          <div className="transcript-section">
            <TranscriptTimeline
              segments={transcriptSegments}
              callDuration={callDuration}
            />
          </div>
        )}

        <div className="recommendations">
          <h3>💡 Insights</h3>
          {chemistryMetrics.overallScore >= 0.6 ? (
            <ul>
              <li>Strong emotional connection detected!</li>
              <li>You both showed synchronized {chemistryMetrics.dominantVibe} emotions</li>
              <li>Consider scheduling a follow-up to build on this chemistry</li>
            </ul>
          ) : (
            <ul>
              <li>Chemistry needs more time to develop</li>
              <li>Try finding common interests to spark more {chemistryMetrics.dominantVibe}</li>
              <li>Focus on activities that bring out positive emotions</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChemistryReport;
