const axios = require('axios');
const Monitor = require('../models/Monitor');

class PingService {
  constructor() {
    this.timeout = 10000; // 10 seconds
    this.userAgent = 'ZenPinger/1.0';
  }

  async checkHttp(url, type = 'https') {
    const startTime = Date.now();
    
    try {
      let fullUrl = url;
      if (!url.startsWith('http')) {
        fullUrl = type === 'http' ? `http://${url}` : `https://${url}`;
      }

      const response = await axios.get(fullUrl, {
        timeout: this.timeout,
        validateStatus: () => true,
        headers: { 'User-Agent': this.userAgent }
      });

      const responseTime = Date.now() - startTime;
      
      let status = 'up';
      if (response.status >= 400) status = 'down';
      if (responseTime > 5000) status = 'degraded';

      return { status, responseTime, statusCode: response.status };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return { status: 'down', responseTime, statusCode: null };
    }
  }

  async checkMonitor(monitorId) {
    try {
      const monitor = await Monitor.findById(monitorId);
      if (!monitor || !monitor.isActive) return;

      console.log(`Checking: ${monitor.name}`);

      let result;
      if (monitor.type === 'http' || monitor.type === 'https') {
        result = await this.checkHttp(monitor.url, monitor.type);
      } else {
        result = await this.checkHttp(monitor.url);
      }

      // Use the optimized method to save ping
      monitor.addPing(result.status, result.responseTime, result.statusCode);
      
      // Save only every 5th ping to database to reduce writes
      if (monitor.totalChecks % 5 === 0) {
        await monitor.save();
      }

      return result;
    } catch (error) {
      console.error('Error checking monitor:', error);
    }
  }

  async checkAllMonitors() {
    try {
      const activeMonitors = await Monitor.find({ isActive: true });
      console.log(`Checking ${activeMonitors.length} monitors`);
      
      // Process in batches to avoid overwhelming
      const batchSize = 3;
      for (let i = 0; i < activeMonitors.length; i += batchSize) {
        const batch = activeMonitors.slice(i, i + batchSize);
        await Promise.allSettled(
          batch.map(monitor => this.checkMonitor(monitor._id))
        );
        // Wait between batches
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error('Error in checkAllMonitors:', error);
    }
  }

  // Clean up old ping data (run weekly)
  async cleanupOldData() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      await Monitor.updateMany(
        {},
        {
          $pull: {
            pingHistory: {
              timestamp: { $lt: thirtyDaysAgo }
            }
          }
        }
      );
      
      console.log('Old ping data cleanup completed');
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

module.exports = new PingService();
