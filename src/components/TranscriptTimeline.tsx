import React, { useState, useRef, useEffect } from 'react';
import './TranscriptTimeline.css';

interface TranscriptSegment {
  timestamp: number;
  speaker: string;
  text: string;
  emotions: { name: string; score: number }[];
  dominantEmotion?: string;
  emotionIntensity?: number;
}

interface TranscriptTimelineProps {
  segments: TranscriptSegment[];
  callDuration: number;
  onSeek?: (timestamp: number) => void;
  currentTime?: number;
}

const TranscriptTimeline: React.FC<TranscriptTimelineProps> = ({
  segments,
  callDuration,
  onSeek,
  currentTime = 0
}) => {
  const [selectedSegment, setSelectedSegment] = useState<TranscriptSegment | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<TranscriptSegment | null>(null);
  const [playbackTime, setPlaybackTime] = useState(currentTime);
  const [searchQuery, setSearchQuery] = useState('');
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPlaybackTime(currentTime);
  }, [currentTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const getEmotionColor = (emotion: string) => {
    const emotionColors: Record<string, string> = {
      Joy: '#FFD700',
      Interest: '#4ECDC4',
      Excitement: '#FF6B6B',
      Amusement: '#FFA500',
      Sadness: '#4682B4',
      Anger: '#DC143C',
      Fear: '#8B4513',
      Disgust: '#556B2F',
      Surprise: '#FF69B4',
      Confusion: '#9370DB'
    };
    return emotionColors[emotion] || '#888';
  };

  const getEmotionEmoji = (emotion: string) => {
    const emotionEmojis: Record<string, string> = {
      Joy: '😊',
      Interest: '🤔',
      Excitement: '🤩',
      Amusement: '😄',
      Sadness: '😢',
      Anger: '😠',
      Fear: '😨',
      Disgust: '🤢',
      Surprise: '😲',
      Confusion: '😕'
    };
    return emotionEmojis[emotion] || '😐';
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const timestamp = percentage * callDuration;
    
    setPlaybackTime(timestamp);
    if (onSeek) {
      onSeek(timestamp);
    }
  };

  const filteredSegments = segments.filter(segment =>
    searchQuery === '' || 
    segment.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    segment.speaker.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSegmentPosition = (timestamp: number) => {
    return (timestamp / callDuration) * 100;
  };

  return (
    <div className="transcript-timeline">
      <div className="timeline-header">
        <h3>Conversation Timeline</h3>
        <input
          type="text"
          placeholder="Search transcript..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Visual Timeline */}
      <div className="visual-timeline" ref={timelineRef} onClick={handleTimelineClick}>
        <div className="timeline-track">
          {/* Emotion intensity background */}
          <div className="emotion-heatmap">
            {segments.map((segment, index) => {
              const width = index < segments.length - 1
                ? ((segments[index + 1].timestamp - segment.timestamp) / callDuration) * 100
                : ((callDuration - segment.timestamp) / callDuration) * 100;
              
              return (
                <div
                  key={index}
                  className="heatmap-segment"
                  style={{
                    left: `${getSegmentPosition(segment.timestamp)}%`,
                    width: `${width}%`,
                    backgroundColor: segment.dominantEmotion 
                      ? getEmotionColor(segment.dominantEmotion)
                      : 'transparent',
                    opacity: segment.emotionIntensity || 0.3
                  }}
                />
              );
            })}
          </div>

          {/* Playhead */}
          <div 
            className="playhead" 
            style={{ left: `${(playbackTime / callDuration) * 100}%` }}
          />

          {/* Segment markers */}
          {filteredSegments.map((segment, index) => (
            <div
              key={index}
              className={`timeline-marker ${selectedSegment === segment ? 'selected' : ''}`}
              style={{ left: `${getSegmentPosition(segment.timestamp)}%` }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedSegment(segment);
                setPlaybackTime(segment.timestamp);
                if (onSeek) onSeek(segment.timestamp);
              }}
              onMouseEnter={() => setHoveredSegment(segment)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              {segment.dominantEmotion && (
                <span className="marker-emoji">
                  {getEmotionEmoji(segment.dominantEmotion)}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Time labels */}
        <div className="timeline-labels">
          <span>0:00</span>
          <span>{formatTime(callDuration / 2)}</span>
          <span>{formatTime(callDuration)}</span>
        </div>
      </div>

      {/* Transcript Display */}
      <div className="transcript-display">
        <div className="current-time">
          Current: {formatTime(playbackTime)}
        </div>

        <div className="transcript-segments">
          {filteredSegments.map((segment, index) => {
            const isActive = Math.abs(segment.timestamp - playbackTime) < 5;
            
            return (
              <div
                key={index}
                className={`transcript-segment ${isActive ? 'active' : ''} ${
                  selectedSegment === segment ? 'selected' : ''
                }`}
                onClick={() => {
                  setSelectedSegment(segment);
                  setPlaybackTime(segment.timestamp);
                  if (onSeek) onSeek(segment.timestamp);
                }}
              >
                <div className="segment-header">
                  <span className="segment-time">{formatTime(segment.timestamp)}</span>
                  <span className="segment-speaker">{segment.speaker}</span>
                  {segment.dominantEmotion && (
                    <span 
                      className="segment-emotion"
                      style={{ color: getEmotionColor(segment.dominantEmotion) }}
                    >
                      {getEmotionEmoji(segment.dominantEmotion)} {segment.dominantEmotion}
                    </span>
                  )}
                </div>
                <div className="segment-text">{segment.text}</div>
                
                {/* Emotion breakdown on hover/select */}
                {(hoveredSegment === segment || selectedSegment === segment) && segment.emotions.length > 0 && (
                  <div className="emotion-breakdown">
                    {segment.emotions.slice(0, 5).map((emotion, i) => (
                      <div key={i} className="emotion-item">
                        <span>{getEmotionEmoji(emotion.name)}</span>
                        <span>{emotion.name}</span>
                        <div className="emotion-bar">
                          <div 
                            className="emotion-fill"
                            style={{ 
                              width: `${emotion.score}%`,
                              backgroundColor: getEmotionColor(emotion.name)
                            }}
                          />
                        </div>
                        <span>{Math.round(emotion.score)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredSegment && (
        <div className="timeline-tooltip" style={{
          left: `${getSegmentPosition(hoveredSegment.timestamp)}%`
        }}>
          <div className="tooltip-time">{formatTime(hoveredSegment.timestamp)}</div>
          <div className="tooltip-speaker">{hoveredSegment.speaker}</div>
          <div className="tooltip-preview">"{hoveredSegment.text.slice(0, 50)}..."</div>
        </div>
      )}
    </div>
  );
};

export default TranscriptTimeline;
