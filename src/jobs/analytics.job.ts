import cron from 'node-cron';
import prisma from '../config/database';

export const startAnalyticsJob = () => {
  // Run daily at midnight GMT
  cron.schedule('0 0 * * *', async () => {
    console.log('Starting daily analytics aggregation...');
    
    try {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      yesterday.setUTCHours(0, 0, 0, 0);

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      // Get all read logs from yesterday
      const readLogs = await prisma.readLog.findMany({
        where: {
          readAt: {
            gte: yesterday,
            lt: today,
          },
        },
        select: {
          articleId: true,
        },
      });

      // Group by articleId and count
      const articleViewCounts = readLogs.reduce((acc, log) => {
        acc[log.articleId] = (acc[log.articleId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Upsert into DailyAnalytics
      for (const [articleId, viewCount] of Object.entries(articleViewCounts)) {
        await prisma.dailyAnalytics.upsert({
          where: {
            articleId_date: {
              articleId,
              date: yesterday,
            },
          },
          update: {
            viewCount: {
              increment: viewCount,
            },
          },
          create: {
            articleId,
            date: yesterday,
            viewCount,
          },
        });
      }

      console.log(`Analytics aggregation completed. Processed ${Object.keys(articleViewCounts).length} articles.`);
    } catch (error) {
      console.error('Analytics job error:', error);
    }
  }, {
    timezone: 'GMT'
  });

  console.log('Analytics job scheduled (runs daily at midnight GMT)');
};

// Manual trigger for testing
export const runAnalyticsManually = async () => {
  console.log('Running analytics aggregation manually...');
  
  try {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    yesterday.setUTCHours(0, 0, 0, 0);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const readLogs = await prisma.readLog.findMany({
      where: {
        readAt: {
          gte: yesterday,
          lt: today,
        },
      },
      select: {
        articleId: true,
      },
    });

    const articleViewCounts = readLogs.reduce((acc, log) => {
      acc[log.articleId] = (acc[log.articleId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    for (const [articleId, viewCount] of Object.entries(articleViewCounts)) {
      await prisma.dailyAnalytics.upsert({
        where: {
          articleId_date: {
            articleId,
            date: yesterday,
          },
        },
        update: {
          viewCount: {
            increment: viewCount,
          },
        },
        create: {
          articleId,
          date: yesterday,
          viewCount,
        },
      });
    }

    console.log(`Manual analytics completed. Processed ${Object.keys(articleViewCounts).length} articles.`);
    return { success: true, articlesProcessed: Object.keys(articleViewCounts).length };
  } catch (error) {
    console.error('Manual analytics error:', error);
    throw error;
  }
};
