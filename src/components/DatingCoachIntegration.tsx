import React, { useState, useEffect } from 'react';
import DatingAppInterface from './DatingAppInterface';
import { 
  DateSchedule, 
  CoachLesson, 
  TextConversation,
  DateSession,
  ConversationMetrics,
  SwipeAction
} from '../types/DatingTypes';
import { dateScheduler } from '../services/DateScheduler';
import { coachLessonGenerator } from '../services/CoachLessonGenerator';
import { analyzeTextingPerformance } from '../services/TextingAnalyzer';
import './DatingCoachIntegration.css';

interface ScheduledCoachLesson extends CoachLesson {
  scheduledTime?: Date;
}

interface DatingCoachIntegrationProps {
  userId?: string;
  onLessonComplete?: (lesson: CoachLesson) => void;
  onBack?: () => void;
}

type ViewMode = 'dating-app' | 'active-date' | 'coach-lesson' | 'schedule' | 'progress';

export const DatingCoachIntegration: React.FC<DatingCoachIntegrationProps> = ({
  userId = 'user',
  onLessonComplete,
  onBack
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('dating-app');
  const [activeDateId, setActiveDateId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Map<string, TextConversation>>(new Map());
  const [scheduledDates, setScheduledDates] = useState<DateSchedule[]>([]);
  const [completedDates, setCompletedDates] = useState<DateSession[]>([]);
  const [swipeHistory, setSwipeHistory] = useState<SwipeAction[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<ConversationMetrics | null>(null);
  const [coachLessons, setCoachLessons] = useState<ScheduledCoachLesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<CoachLesson | null>(null);

  useEffect(() => {
    // Check for upcoming dates
    const upcomingDates = dateScheduler.getUpcomingDates();
    setScheduledDates(upcomingDates);

    // Check if it's time for a date
    const now = new Date();
    const readyDate = upcomingDates.find(date => {
      const timeDiff = date.dateTime.getTime() - now.getTime();
      return timeDiff < 15 * 60 * 1000 && timeDiff > 0; // Within 15 minutes
    });

    if (readyDate && !activeDateId) {
      // Send reminder
      dateScheduler.sendReminder(readyDate.id);
      showDateReminder(readyDate);
    }
  }, [activeDateId]);

  const handleScheduleDate = (profileId: string, conversation: TextConversation) => {
    // Analyze conversation to determine readiness
    const metrics = analyzeTextingPerformance(conversation);
    
    if (conversation.messages.length < 10) {
      showCoachTip("Keep chatting a bit more before suggesting a date!");
      return;
    }

    // Create date schedule
    const profile = getProfileById(profileId); // This would fetch from your profile store
    if (profile) {
      const schedule = dateScheduler.scheduleDate(profile, conversation, {
        profileId: profileId
      });
      
      setScheduledDates([...scheduledDates, schedule]);
      showDateScheduled(schedule);
      
      // Generate pre-date coaching lesson
      const performanceData = {
        conversationMetrics: metrics,
        textConversation: conversation,
        swipeHistory: swipeHistory
      };
      
      const lesson = coachLessonGenerator.generatePersonalizedLesson(performanceData);
      
      // Schedule lesson for 1 hour before date
      const lessonTime = new Date(schedule.dateTime);
      lessonTime.setHours(lessonTime.getHours() - 1);
      
      // Store lesson with scheduled time
      setCoachLessons([...coachLessons, { ...lesson, scheduledTime: lessonTime }]);
      
      // Notify user
      showNotification(`Pre-date coaching with ${lesson.coachId} scheduled for ${lessonTime.toLocaleTimeString()}`);
    }
  };

  const handleStartDate = (dateId: string) => {
    const date = scheduledDates.find(d => d.id === dateId);
    if (!date) return;

    // Prepare NPC for date
    const npcPersonality = dateScheduler.prepareNPCForDate(date.profileId);
    
    setActiveDateId(dateId);
    setViewMode('active-date');
  };

  const handleDateComplete = (dateSession: DateSession) => {
    setCompletedDates([...completedDates, dateSession]);
    setActiveDateId(null);
    setViewMode('dating-app');

    // Generate post-date lesson based on performance
    const lesson = coachLessonGenerator.generatePostDateLesson(dateSession);
    setCurrentLesson(lesson);
    
    // Show date summary and offer coaching
    showDateSummary(dateSession, lesson);
  };

  const handleCoachFeedback = (feedback: string[]) => {
    // Display coach feedback as tips
    feedback.forEach(tip => showCoachTip(tip));
  };

  const showDateReminder = (date: DateSchedule) => {
    showNotification(`Your date at ${date.location} is coming up in 15 minutes!`);
  };

  const showDateScheduled = (schedule: DateSchedule) => {
    showNotification(`Date scheduled for ${schedule.dateTime.toLocaleDateString()} at ${schedule.location}`);
  };

  const showDateSummary = (session: DateSession, lesson: CoachLesson) => {
    const duration = session.endTime 
      ? Math.round((session.endTime.getTime() - session.startTime.getTime()) / 60000)
      : 0;
    
    const summary = `
      Date Performance: ${session.overallScore}%
      Duration: ${duration} minutes
      Feedback: ${session.coachFeedback.length} tips received
      
      ${lesson.title} lesson available to improve your skills!
    `;
    
    showNotification(summary);
  };

  const showCoachTip = (tip: string) => {
    // This would show a toast or modal with the coach tip
    console.log('Coach Tip:', tip);
  };

  const showNotification = (message: string) => {
    // This would show a notification to the user
    console.log('Notification:', message);
  };

  const getProfileById = (profileId: string) => {
    // This would fetch from your profile storage
    return null; // Placeholder
  };

  const renderNavigation = () => (
    <nav className="integration-nav">
      <button 
        className={viewMode === 'dating-app' ? 'active' : ''}
        onClick={() => setViewMode('dating-app')}
      >
        Dating App
      </button>
      <button 
        className={viewMode === 'schedule' ? 'active' : ''}
        onClick={() => setViewMode('schedule')}
      >
        Schedule ({scheduledDates.length})
      </button>
      <button 
        className={viewMode === 'coach-lesson' ? 'active' : ''}
        onClick={() => setViewMode('coach-lesson')}
        disabled={!currentLesson}
      >
        Coach Lesson
      </button>
      <button 
        className={viewMode === 'progress' ? 'active' : ''}
        onClick={() => setViewMode('progress')}
      >
        Progress
      </button>
    </nav>
  );

  const renderScheduleView = () => (
    <div className="schedule-view">
      <h2>Upcoming Dates</h2>
      {scheduledDates.length === 0 ? (
        <p className="empty-state">No dates scheduled yet. Keep swiping and chatting!</p>
      ) : (
        <div className="date-list">
          {scheduledDates.map(date => (
            <div key={date.id} className="date-card">
              <h3>{date.location}</h3>
              <p>{date.locationType}</p>
              <p className="date-time">
                {date.dateTime.toLocaleDateString()} at {date.dateTime.toLocaleTimeString()}
              </p>
              <div className="date-actions">
                <button 
                  onClick={() => handleStartDate(date.id)}
                  disabled={!date.confirmed}
                >
                  Start Date
                </button>
                <button onClick={() => dateScheduler.rescheduleDate(date.id, new Date())}>
                  Reschedule
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderProgressView = () => {
    const weeklyProgress = coachLessonGenerator.generateWeeklyProgress(
      coachLessons, // Pass actual lessons
      Array.from(conversations.values()),
      completedDates
    );

    return (
      <div className="progress-view">
        <h2>Your Dating Progress</h2>
        <div className="progress-summary">
          <p>{weeklyProgress.summary}</p>
        </div>
        
        <div className="progress-section">
          <h3>Improvements</h3>
          <ul>
            {weeklyProgress.improvements.map((improvement: string, idx: number) => (
              <li key={idx}>{improvement}</li>
            ))}
          </ul>
        </div>
        
        <div className="progress-section">
          <h3>Focus Areas</h3>
          <ul>
            {weeklyProgress.areasToFocus.map((area: string, idx: number) => (
              <li key={idx}>{area}</li>
            ))}
          </ul>
        </div>
        
        <div className="progress-section">
          <h3>Next Steps</h3>
          <ul>
            {weeklyProgress.nextSteps.map((step: string, idx: number) => (
              <li key={idx}>{step}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="dating-coach-integration">
      {renderNavigation()}
      
      <div className="integration-content">
        {viewMode === 'dating-app' && (
          <DatingAppInterface
            onScheduleDate={handleScheduleDate}
            onCoachFeedback={handleCoachFeedback}
            userPreferences={{
              ageRange: [25, 35],
              interests: ['Travel', 'Fitness', 'Music'],
              personalityTypes: ['confident', 'adventurous']
            }}
          />
        )}
        
        {viewMode === 'active-date' && activeDateId && (
          <div className="active-date-placeholder">
            <h2>Date Simulation</h2>
            <p>Date simulation would load here with date ID: {activeDateId}</p>
            <button onClick={() => {
              setViewMode('schedule');
              setActiveDateId(null);
            }}>
              End Date
            </button>
          </div>
        )}
        
        {viewMode === 'schedule' && renderScheduleView()}
        
        {viewMode === 'coach-lesson' && currentLesson && (
          <div className="lesson-view">
            <h2>{currentLesson.title}</h2>
            <p>{currentLesson.description}</p>
            <button onClick={() => {
              // Start lesson implementation
              console.log('Starting lesson:', currentLesson.id);
            }}>
              Start Lesson
            </button>
          </div>
        )}
        
        {viewMode === 'progress' && renderProgressView()}
      </div>
    </div>
  );
};

export default DatingCoachIntegration;
