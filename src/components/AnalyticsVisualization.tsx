import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Eye, Heart, Brain, TrendingUp, Activity } from 'lucide-react';
import './AnalyticsVisualization.css';

interface TimelineData {
  timestamp: number;
  userEmotions: { name: string; score: number; color: string }[];
  partnerEmotions: { name: string; score: number; color: string }[];
  userEngagement: number;
  partnerEngagement: number;
  userEyeContact: boolean;
  partnerEyeContact: boolean;
  userPosture: number;
  partnerPosture: number;
  transcript?: {
    speaker: 'user' | 'partner';
    text: string;
  };
}

interface AnalyticsVisualizationProps {
  data: TimelineData[];
  duration: number;
}

export const AnalyticsVisualization: React.FC<AnalyticsVisualizationProps> = ({ data, duration }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedPoint, setSelectedPoint] = useState<TimelineData | null>(null);
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return;

    const container = containerRef.current;
    const margin = { top: 40, right: 60, bottom: 60, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, duration])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, 1])
      .range([height, 0]);

    // Create gradients for each emotion
    const defs = svg.append('defs');
    
    const emotionColors = [
      { name: 'joy', color: '#FFD700' },
      { name: 'excitement', color: '#FF6B6B' },
      { name: 'interest', color: '#4ECDC4' },
      { name: 'love', color: '#FF69B4' },
      { name: 'sadness', color: '#6C8EBF' },
      { name: 'confusion', color: '#B39BC8' }
    ];

    emotionColors.forEach(emotion => {
      const gradient = defs.append('linearGradient')
        .attr('id', `gradient-${emotion.name}`)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', emotion.color)
        .attr('stop-opacity', 0.8);

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', emotion.color)
        .attr('stop-opacity', 0.1);
    });

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-height)
        .tickFormat(() => '')
        .ticks(10))
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.3);

    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale)
        .tickSize(-width)
        .tickFormat(() => '')
        .ticks(5))
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.3);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickFormat(d => `${Math.floor(d / 60000)}:${String(Math.floor((d % 60000) / 1000)).padStart(2, '0')}`))
      .attr('class', 'x-axis');

    g.append('g')
      .call(d3.axisLeft(yScale)
        .tickFormat(d => `${(d * 100).toFixed(0)}%`))
      .attr('class', 'y-axis');

    // Create lines for different metrics
    const metricsToPlot = [
      { key: 'userEngagement', name: 'Your Engagement', color: '#7C3AED', strokeWidth: 3 },
      { key: 'partnerEngagement', name: 'Partner Engagement', color: '#EC4899', strokeWidth: 3 },
      { key: 'userPosture', name: 'Your Posture', color: '#10B981', strokeWidth: 2, dashArray: '5,5' },
      { key: 'partnerPosture', name: 'Partner Posture', color: '#F59E0B', strokeWidth: 2, dashArray: '5,5' }
    ];

    metricsToPlot.forEach(metric => {
      const line = d3.line<TimelineData>()
        .x(d => xScale(d.timestamp))
        .y(d => yScale(d[metric.key as keyof TimelineData] as number))
        .curve(d3.curveMonotoneX);

      const path = g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', metric.color)
        .attr('stroke-width', metric.strokeWidth)
        .attr('class', `metric-line ${metric.key}`)
        .attr('d', line);

      if (metric.dashArray) {
        path.attr('stroke-dasharray', metric.dashArray);
      }

      // Animate the line drawing
      const totalLength = path.node()?.getTotalLength() || 0;
      path
        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(2000)
        .attr('stroke-dashoffset', 0);
    });

    // Add eye contact indicators
    const eyeContactData = data.map(d => ({
      timestamp: d.timestamp,
      userContact: d.userEyeContact ? 0.05 : 0,
      partnerContact: d.partnerEyeContact ? 0.05 : 0
    }));

    g.selectAll('.eye-contact-user')
      .data(eyeContactData.filter(d => d.userContact > 0))
      .enter()
      .append('rect')
      .attr('x', d => xScale(d.timestamp) - 1)
      .attr('y', height - 10)
      .attr('width', 2)
      .attr('height', 10)
      .attr('fill', '#7C3AED')
      .attr('opacity', 0.5);

    g.selectAll('.eye-contact-partner')
      .data(eyeContactData.filter(d => d.partnerContact > 0))
      .enter()
      .append('rect')
      .attr('x', d => xScale(d.timestamp) - 1)
      .attr('y', height)
      .attr('width', 2)
      .attr('height', 10)
      .attr('fill', '#EC4899')
      .attr('opacity', 0.5);

    // Add emotion areas
    const emotionArea = d3.area<TimelineData>()
      .x(d => xScale(d.timestamp))
      .y0(height)
      .y1(d => yScale(d.userEmotions[0]?.score || 0))
      .curve(d3.curveMonotoneX);

    data.forEach((d, i) => {
      if (d.userEmotions[0]) {
        g.append('path')
          .datum([d])
          .attr('fill', `url(#gradient-${d.userEmotions[0].name})`)
          .attr('opacity', 0.3)
          .attr('d', emotionArea);
      }
    });

    // Add interactive overlay
    const focus = g.append('g')
      .attr('class', 'focus')
      .style('display', 'none');

    focus.append('line')
      .attr('class', 'focus-line')
      .attr('y1', 0)
      .attr('y2', height)
      .style('stroke', '#666')
      .style('stroke-dasharray', '3,3');

    focus.append('circle')
      .attr('r', 5)
      .style('fill', '#7C3AED');

    const tooltip = d3.select('body').append('div')
      .attr('class', 'analytics-tooltip')
      .style('opacity', 0);

    svg.append('rect')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mouseover', () => focus.style('display', null))
      .on('mouseout', () => {
        focus.style('display', 'none');
        tooltip.style('opacity', 0);
      })
      .on('mousemove', function(event) {
        const x0 = xScale.invert(d3.pointer(event, this)[0]);
        const bisect = d3.bisector<TimelineData, number>(d => d.timestamp).left;
        const i = bisect(data, x0, 1);
        const d0 = data[i - 1];
        const d1 = data[i];
        const d = x0 - d0.timestamp > d1.timestamp - x0 ? d1 : d0;
        
        focus.attr('transform', `translate(${xScale(d.timestamp)},${yScale(d.userEngagement)})`);
        focus.select('.focus-line')
          .attr('transform', `translate(0,${-yScale(d.userEngagement)})`);
        
        tooltip.transition()
          .duration(200)
          .style('opacity', .9);
        
        tooltip.html(`
          <div class="tooltip-header">
            ${new Date(d.timestamp).toLocaleTimeString()}
          </div>
          <div class="tooltip-content">
            <div class="tooltip-row">
              <span class="tooltip-label">Your Engagement:</span>
              <span class="tooltip-value">${(d.userEngagement * 100).toFixed(0)}%</span>
            </div>
            <div class="tooltip-row">
              <span class="tooltip-label">Partner Engagement:</span>
              <span class="tooltip-value">${(d.partnerEngagement * 100).toFixed(0)}%</span>
            </div>
            ${d.userEmotions[0] ? `
              <div class="tooltip-row">
                <span class="tooltip-label">Your Emotion:</span>
                <span class="tooltip-value">${d.userEmotions[0].name}</span>
              </div>
            ` : ''}
            ${d.transcript ? `
              <div class="tooltip-transcript">
                <strong>${d.transcript.speaker}:</strong> "${d.transcript.text}"
              </div>
            ` : ''}
          </div>
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
        
        setSelectedPoint(d);
      });

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 150}, 20)`);

    metricsToPlot.forEach((metric, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      legendRow.append('line')
        .attr('x1', 0)
        .attr('x2', 20)
        .attr('y1', 10)
        .attr('y2', 10)
        .attr('stroke', metric.color)
        .attr('stroke-width', metric.strokeWidth)
        .attr('stroke-dasharray', metric.dashArray || '');

      legendRow.append('text')
        .attr('x', 25)
        .attr('y', 10)
        .attr('dy', '0.32em')
        .style('font-size', '12px')
        .text(metric.name);
    });

    return () => {
      tooltip.remove();
    };
  }, [data, duration]);

  return (
    <div className="analytics-visualization">
      <div className="visualization-header">
        <h3>Engagement & Emotion Timeline</h3>
        <div className="metric-pills">
          <div 
            className={`metric-pill ${hoveredMetric === 'engagement' ? 'active' : ''}`}
            onMouseEnter={() => setHoveredMetric('engagement')}
            onMouseLeave={() => setHoveredMetric(null)}
          >
            <Brain size={16} />
            <span>Engagement</span>
          </div>
          <div 
            className={`metric-pill ${hoveredMetric === 'emotion' ? 'active' : ''}`}
            onMouseEnter={() => setHoveredMetric('emotion')}
            onMouseLeave={() => setHoveredMetric(null)}
          >
            <Heart size={16} />
            <span>Emotions</span>
          </div>
          <div 
            className={`metric-pill ${hoveredMetric === 'eyecontact' ? 'active' : ''}`}
            onMouseEnter={() => setHoveredMetric('eyecontact')}
            onMouseLeave={() => setHoveredMetric(null)}
          >
            <Eye size={16} />
            <span>Eye Contact</span>
          </div>
          <div 
            className={`metric-pill ${hoveredMetric === 'posture' ? 'active' : ''}`}
            onMouseEnter={() => setHoveredMetric('posture')}
            onMouseLeave={() => setHoveredMetric(null)}
          >
            <Activity size={16} />
            <span>Posture</span>
          </div>
        </div>
      </div>
      
      <div ref={containerRef} className="visualization-container">
        <svg ref={svgRef}></svg>
      </div>

      {selectedPoint && (
        <div className="point-details">
          <div className="detail-card">
            <h4>Detailed Metrics at {new Date(selectedPoint.timestamp).toLocaleTimeString()}</h4>
            <div className="metrics-grid">
              <div className="metric-item">
                <Eye className={selectedPoint.userEyeContact ? 'active' : ''} />
                <span>Your Eye Contact</span>
              </div>
              <div className="metric-item">
                <Eye className={selectedPoint.partnerEyeContact ? 'active' : ''} />
                <span>Partner Eye Contact</span>
              </div>
              <div className="metric-item">
                <TrendingUp />
                <span>Your Posture: {(selectedPoint.userPosture * 100).toFixed(0)}%</span>
              </div>
              <div className="metric-item">
                <TrendingUp />
                <span>Partner Posture: {(selectedPoint.partnerPosture * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Heatmap component for emotion patterns
export const EmotionHeatmap: React.FC<{ data: TimelineData[] }> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Create emotion intensity map
    const emotionTypes = ['joy', 'excitement', 'interest', 'love', 'sadness', 'confusion', 'fear', 'anger'];
    const cellHeight = height / emotionTypes.length;
    const cellWidth = width / data.length;

    data.forEach((point, i) => {
      emotionTypes.forEach((emotion, j) => {
        const userScore = point.userEmotions.find(e => e.name === emotion)?.score || 0;
        const partnerScore = point.partnerEmotions.find(e => e.name === emotion)?.score || 0;
        const avgScore = (userScore + partnerScore) / 2;

        // Create gradient based on score
        const intensity = Math.floor(avgScore * 255);
        ctx.fillStyle = `rgba(124, 58, 237, ${avgScore})`;
        ctx.fillRect(i * cellWidth, j * cellHeight, cellWidth, cellHeight / 2);
        
        ctx.fillStyle = `rgba(236, 72, 153, ${avgScore})`;
        ctx.fillRect(i * cellWidth, j * cellHeight + cellHeight / 2, cellWidth, cellHeight / 2);
      });
    });

    // Add labels
    ctx.fillStyle = '#374151';
    ctx.font = '12px sans-serif';
    emotionTypes.forEach((emotion, j) => {
      ctx.fillText(emotion, 5, j * cellHeight + cellHeight / 2);
    });

  }, [data]);

  return (
    <div className="emotion-heatmap">
      <h3>Emotion Intensity Heatmap</h3>
      <div className="heatmap-legend">
        <span>Low</span>
        <div className="gradient-bar"></div>
        <span>High</span>
      </div>
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={400}
        className="heatmap-canvas"
      />
    </div>
  );
};

export default AnalyticsVisualization;
