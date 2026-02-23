import app from './app';
import { config } from './config/env';
import { startAnalyticsJob } from './jobs/analytics.job';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  
  // Start analytics cron job
  startAnalyticsJob();
});
