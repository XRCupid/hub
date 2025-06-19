import React, { useEffect, useMemo, useState, Suspense } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Link,
  useLocation,
  Navigate
} from "react-router-dom";
import HumeConversationTab from './components/HumeConversationTab';
import CoachCallTab from './components/CoachCallTab';
import CoachExperience from './components/CoachExperience';
import FacialAnalysisTab from './components/FacialAnalysisTab';
import EyeContactPracticeTab from './components/EyeContactPracticeTab';
import PosturePracticeTab from './components/PosturePracticeTab';
import GesturePracticeView from './components/GesturePracticeView';
import DatingApp from './components/DatingApp';
import DemoPlaceholder from './components/DemoPlaceholder';
import AnimatedAvatarDemo from './components/AnimatedAvatarDemo';
import DatingSkillsDashboard from './components/DatingSkillsDashboard';
import ChatSimulation from './components/ChatSimulation';
import RizzTrainingModule from './components/RizzTrainingModule';
import PhoneCallTraining from './components/PhoneCallTraining';
import DatingSimulationHub from './components/DatingSimulationHub';
import { RPMSetup } from './pages/RPMSetup';
import { RPMTest } from './pages/RPMTest';
import DatingCoachDemo from './pages/DatingCoachDemo';
import AvatarTest from './pages/AvatarTest';
import RPMAvatarTest from './pages/RPMAvatarTest';
import SimulationTest from './pages/SimulationTest';
import AvatarManager from './pages/AvatarManager';
import RPMAvatarExample from './components/RPMAvatarExample';
import { PreloadedRPMAvatarViewer } from './components/PreloadedRPMAvatar';
import { AvatarControlDemo } from './components/AvatarControlDemo';
import AnimationTester from './components/AnimationTester';
import { FacePuppetingDemo } from './components/FacePuppetingDemo';
import { SimpleFaceTrackingDemo } from './components/SimpleFaceTrackingDemo';
import MorphTargetTest from './components/MorphTargetTest';
import AvatarInspector from './components/AvatarInspector';
import { AvatarComparison } from './components/AvatarComparison';
import AvatarDiagnostic from './components/AvatarDiagnostic';
import DatingFlow from './components/DatingFlow';
import SimplifiedHome from './pages/SimplifiedHome';
import SimplifiedDatingCoach from './components/SimplifiedDatingCoach';
import Navigation from './components/Navigation';
import HomePage from './components/HomePage';
import AvatarSetup from './pages/AvatarSetup';
import { AvatarTestPage } from './components/AvatarTestPage';
import EnhancedCoachSession from './components/EnhancedCoachSession';
import CoachRizzoSession from './components/CoachRizzoSession';
import CoachPosieSession from './components/CoachPosieSession';
import ComputerVisionDemo from './components/ComputerVisionDemo';
import AvatarPuppetDemo from './components/AvatarPuppetDemo';
import AngelMascot from './components/AngelMascot';
import SimpleArmTest from './components/SimpleArmTest';
import DirectPoseTest from './components/DirectPoseTest';
import PracticeDate from './components/PracticeDate';
import HumeDebug from './components/HumeDebug';
import EnvCheck from './components/EnvCheck';
import QuickDebug from './components/QuickDebug';
import HumeConnectionDebug from './components/HumeConnectionDebug';
import HumeQuickSetup from './components/HumeQuickSetup';
import PostProcessingDemo from './pages/PostProcessingDemo';
import PostProcessingTest from './pages/PostProcessingTest';
import TestConvai from './pages/TestConvai';
import EnhancedCoachSessionConvai from './components/EnhancedCoachSessionConvai';
import EyeTrackingAvatar from './components/EyeTrackingAvatar';
import PresenceAvatarWithGaze from './components/PresenceAvatarWithGaze';
import EyeContactGame from './components/EyeContactGame';
import EyeContactGameSimple from './components/EyeContactGameSimple';
import EyeContactGameRobust from './components/EyeContactGameRobust';
import EyeContactGameML5 from './components/EyeContactGameML5';
import EyeContactGameWebGazer from './components/EyeContactGameWebGazer';
import RobustVideoChat from './components/RobustVideoChat';
import SimpleVideoChat from './components/SimpleVideoChat';
import WorkingVideoChat from './components/WorkingVideoChat';
import SimpleWorkingChat from './components/SimpleWorkingChat';
import VideoChat from './components/VideoChat';
import ConferenceSetup from './components/ConferenceSetup';
import IntegratedCoachDateExperience from './components/IntegratedCoachDateExperience';
import { initializeTensorFlow } from './tfjs-initializer'; // Import the TFJS initializer
import { AuthProvider } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext'; // Added UserProvider
import { testBlendshapeCompositor } from './utils/testBlendshapeCompositor';
import './utils/mockDataForTesting';
import './utils/mockHumeData'; // Import mock Hume data to make it available in browser console
import { testRPMIntegration } from './utils/testRPMIntegration'; // Import RPM test utility
import { testRPMAvatars } from './utils/testRPMAvatars'; // Import RPM avatar test utility
import { createTestAvatar } from './utils/createTestAvatar'; // Import test avatar creator
import PiPTrackingTest from './components/PiPTrackingTest'; // Import PiP tracking test component
import './utils/quickWins'; // Import quick wins utilities
import './utils/diagnostics'; // Import diagnostics utilities  
import './utils/offlineMode'; // Import offline mode handler
import './utils/performanceMonitor'; // Import performance monitor
import CurriculumNavigator from './components/CurriculumNavigator';
import { PerformanceToProgress } from './components/PerformanceToProgress';
import { CoachingSessionDemo } from './components/CoachingSessionDemo';
import AvatarCreationHub from './pages/AvatarCreationHub';
import ConferenceDemoLauncher from './components/ConferenceDemoLauncher';
import { SkillTreeDiagram } from './components/SkillTreeDiagram';
import { InteractiveCurriculumOverview } from './components/InteractiveCurriculumOverview';
import { InteractiveCurriculumOverviewSimple } from './components/InteractiveCurriculumOverviewSimple';
import { TestComponent } from './components/TestComponent';
import { SampleLessons } from './components/SampleLessons';
import HumeCoachCall from './components/HumeCoachCall'; // Fix import to use default export
import CoachSession from './components/CoachSession'; // New credit-conserving coach component
import ConferenceBoothDemo from './components/ConferenceBoothDemo'; // Fix import to use default export
import ConferenceHost from './components/ConferenceHost';
import ConferenceMobile from './components/ConferenceMobile';
import ConferenceAudience from './components/ConferenceAudience';
import SimpleInvestorDemo from './components/SimpleInvestorDemo';
import EmotionAnalysisShowcase from './components/EmotionAnalysisShowcase';
import DougieSpeedDate from './components/DougieSpeedDate';
import DougieSpeedDateV2 from './components/DougieSpeedDateV2';
import DougieSpeedDateV3 from './components/DougieSpeedDateV3';
import DougieSpeedDateSimple from './components/DougieSpeedDateSimple';
import DougieSpeedDateCoach from './components/DougieSpeedDateCoach';
import DougieCoachSimple from './components/DougieCoachSimple';
import DougieCoachWorkingCopy from './components/DougieCoachWorkingCopy';
import DougieTest from './components/DougieTest';
import TestPiPAvatar from './components/TestPiPAvatar';
import TestPiPVersions from './components/TestPiPVersions';
import TestBasicFaceTracking from './components/TestBasicFaceTracking';
import TestML5Direct from './components/TestML5Direct';
import LiveDemoController from './components/LiveDemoController';
import { HeartIcon, SparkleIcon, RadiatingHeartIcon, WingedHeartIcon } from './components/RisographIcons';
import { CupidCursor } from './components/CupidCursor';
import PasswordProtection from './components/PasswordProtection';
import './App.css';
import './global.css';
import './services/nuclearHumeOverride';

// Make testBlendshapeCompositor, testRPMIntegration, and testRPMAvatars available globally
window.testBlendshapeCompositor = testBlendshapeCompositor;
window.testRPMIntegration = testRPMIntegration;
window.testRPMAvatars = testRPMAvatars;
window.createTestAvatar = createTestAvatar;

// Floating Heart Component
const FloatingHeart = ({ delay, left, duration }) => (
  <div 
    className="floating-heart" 
    style={{ 
      left: `${left}%`, 
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`
    }}
  >
    <HeartIcon size={30} color="#FF6B9D" />
  </div>
);

// Floating Sparkle Component
const FloatingSparkle = ({ top, left, delay }) => (
  <div 
    className="sparkle" 
    style={{ 
      top: `${top}%`, 
      left: `${left}%`,
      animationDelay: `${delay}s`
    }}
  >
    <SparkleIcon size={25} color="#9C88FF" />
  </div>
);

// AppContent component that uses Router context
const AppContent = () => {
  const location = useLocation();

  return (
    <>
      {/* Fixed Navigation */}
      <Navigation />
      
      {/* Decorative Background Elements */}
      <div className="decorative-bg">
        {/* Clouds effect */}
        <div className="clouds"></div>
        
        {/* Floating Hearts */}
        <div className="floating-hearts">
          <FloatingHeart delay={0} left={5} duration={18} />
          <FloatingHeart delay={3} left={15} duration={22} />
          <FloatingHeart delay={6} left={25} duration={20} />
          <FloatingHeart delay={9} left={35} duration={24} />
          <FloatingHeart delay={12} left={45} duration={19} />
          <FloatingHeart delay={15} left={55} duration={21} />
          <FloatingHeart delay={18} left={65} duration={23} />
          <FloatingHeart delay={21} left={75} duration={20} />
          <FloatingHeart delay={24} left={85} duration={22} />
          <FloatingHeart delay={27} left={95} duration={18} />
        </div>
        
        {/* Floating Sparkles */}
        <div className="floating-sparkles">
          <FloatingSparkle top={10} left={10} delay={0} />
          <FloatingSparkle top={20} left={85} delay={2} />
          <FloatingSparkle top={30} left={50} delay={4} />
          <FloatingSparkle top={40} left={70} delay={6} />
          <FloatingSparkle top={50} left={20} delay={8} />
          <FloatingSparkle top={60} left={90} delay={10} />
          <FloatingSparkle top={70} left={40} delay={12} />
          <FloatingSparkle top={80} left={60} delay={14} />
        </div>
      </div>
      
      {/* Main Content */}
      <main className="app-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/conversation" element={<HumeConversationTab />} />
          <Route path="/coach-call" element={<CoachSession />} />
          <Route path="/coach-call/:coachId" element={<CoachSession />} />
          <Route path="/coach-experience" element={<CoachExperience />} />
          <Route path="/facial-analysis" element={<FacialAnalysisTab />} />
          <Route path="/eye-contact" element={<EyeContactPracticeTab />} />
          <Route path="/posture" element={<PosturePracticeTab />} />
          <Route path="/gestures" element={<GesturePracticeView />} />
          <Route path="/dating-app" element={<DatingApp />} />
          <Route path="/demo" element={<DemoPlaceholder />} />
          <Route path="/animated-avatar" element={<AnimatedAvatarDemo />} />
          <Route path="/dashboard" element={<DatingSkillsDashboard />} />
          <Route path="/chat-simulation" element={<ChatSimulation />} />
          <Route path="/dating-simulation" element={<DatingSimulationHub />} />
          <Route path="/hume-coach-call" element={<HumeCoachCall />} />
          <Route path="/video-chat" element={<VideoChat />} />
          <Route path="/conference-booth" element={<ConferenceBoothDemo />} />
          <Route path="/hume-quick-setup" element={<HumeQuickSetup />} />
          <Route path="/test-simple" element={<div style={{padding: '2rem', color: 'white'}}>TEST ROUTE WORKS!</div>} />
          <Route path="/investor-demo" element={<SimpleInvestorDemo />} />
          <Route path="/million-dollar-demo" element={<SimpleInvestorDemo />} />
          <Route path="/emotion-showcase" element={<EmotionAnalysisShowcase />} />
          <Route path="/emotion-analysis" element={<EmotionAnalysisShowcase />} />
          <Route path="/speed-date-dougie" element={<DougieSpeedDate />} />
          <Route path="/speed-date-dougie-v2" element={<DougieSpeedDateV2 />} />
          <Route path="/speed-date-dougie-v3" element={<DougieSpeedDateV3 />} />
          <Route path="/speed-date-simple" element={<DougieSpeedDateSimple />} />
          <Route path="/dougie-coach" element={<DougieSpeedDateCoach />} />
          <Route path="/dougie-coach-simple" element={<DougieCoachSimple />} />
          <Route path="/dougie-coach-working-copy" element={<DougieCoachWorkingCopy />} />
          <Route path="/dougie-test" element={<DougieTest />} />
          <Route path="/conference" element={<ConferenceHost />} />
          <Route path="/conference-host" element={<ConferenceHost />} />
          <Route path="/conference-mobile" element={<ConferenceMobile />} />
          <Route path="/conference-audience" element={<ConferenceAudience />} />
          <Route path="/conference-setup" element={<ConferenceSetup />} />
          <Route path="/integrated-experience" element={<IntegratedCoachDateExperience />} />
          <Route path="/test" element={<TestComponent />} />
          <Route path="/sample-lessons" element={<SampleLessons />} />
          <Route path="/interactive-curriculum-overview" element={<InteractiveCurriculumOverview />} />
          {/* Debug Routes */}
          <Route path="/env-check" element={<EnvCheck />} />
          <Route path="/hume-debug" element={<HumeConnectionDebug />} />
          <Route path="/pip-tracking-test" element={<PiPTrackingTest />} />
          <Route path="/test-pip-avatar" element={<TestPiPAvatar />} />
          <Route path="/test-pip-versions" element={<TestPiPVersions />} />
          <Route path="/test-face-tracking" element={<TestBasicFaceTracking />} />
          <Route path="/test-ml5" element={<TestML5Direct />} />
          {/* Enhanced Coach Sessions */}
          <Route path="/enhanced-coach" element={<EnhancedCoachSession />} />
          <Route path="/coaching-demo" element={<CoachingSessionDemo />} />
          
          {/* Avatar Creation Hub */}
          <Route path="/avatar-creation-hub" element={<AvatarCreationHub />} />
          
          {/* Practice Date with NPC */}
          <Route path="/practice-date/:npcId" element={<PracticeDate />} />
          
          <Route path="/live-demo-controller" element={<LiveDemoController />} />
          <Route path="/demo-controller" element={<LiveDemoController />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
};

function App() {
  useEffect(() => {
    // Initialize TensorFlow.js when the App component mounts
    initializeTensorFlow().catch(console.error); // Call and catch any potential errors
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <AuthProvider>
      <UserProvider> {/* Added UserProvider Wrapper */}
        <Suspense fallback={
          <div className="loading-screen">
            <div className="loading-content">
              <AngelMascot size="medium" animate={true} />
              <p>Loading XRCupid...</p>
            </div>
          </div>
        }>
          <Router>
            <CupidCursor />
            <PasswordProtection>
              <AppContent />
            </PasswordProtection>
          </Router>
        </Suspense>
      </UserProvider> {/* Closed UserProvider Wrapper */}
    </AuthProvider>
  );
}

export default App;