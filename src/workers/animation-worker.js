const express = require('express');
const Queue = require('bull');
const { KrikeyAutomationService } = require('../services/KrikeyAutomationService');

const app = express();
app.use(express.json());

// Redis connection for job queue
const animationQueue = new Queue('animation-generation', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

// Initialize Krikey service
const krikeyService = new KrikeyAutomationService();

// Process animation jobs
animationQueue.process(async (job) => {
  const { sentiment, message, userId } = job.data;
  
  console.log(`Processing animation for user ${userId}`);
  
  try {
    await krikeyService.initialize();
    
    const animationUrl = await krikeyService.generateAnimation({
      text: message,
      emotion: sentiment,
      avatarStyle: 'casual'
    });
    
    await krikeyService.cleanup();
    
    return { animationUrl, status: 'completed' };
  } catch (error) {
    console.error('Animation generation failed:', error);
    throw error;
  }
});

// REST endpoint to queue animations
app.post('/api/animations/generate', async (req, res) => {
  const { sentiment, message, userId } = req.body;
  
  // Add to queue
  const job = await animationQueue.add({
    sentiment,
    message,
    userId,
    timestamp: Date.now()
  });
  
  res.json({
    jobId: job.id,
    status: 'queued',
    estimatedTime: '30-60 seconds'
  });
});

// Check job status
app.get('/api/animations/status/:jobId', async (req, res) => {
  const job = await animationQueue.getJob(req.params.jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  const state = await job.getState();
  const result = job.returnvalue;
  
  res.json({
    jobId: job.id,
    state,
    result,
    progress: job.progress()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'animation-worker' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Animation worker listening on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down animation worker...');
  await animationQueue.close();
  await krikeyService.cleanup();
  process.exit(0);
});
