const axios = require('axios');
const Monitor = require('../models/Monitor');

class PingService {
  constructor() {
    this.timeout = 30000; // 30 seconds timeout for free tier
    this.userAgent = 'ZenPinger-Monitor/1.0';
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
        validateStatus: () => true, // Accept all status codes
        headers: {
          'User-Agent': this.userAgent
        }
      });

      const responseTime = Date.now() - startTime;
      
      let status = 'up';
      if (response.status >= 400 && response.status < 500) {
        status = 'degraded';
      } else if (response.status >= 500) {
        status = 'down';
      }

      // Consider slow response as degraded (over 5 seconds)
      if (responseTime > 5000) {
        status = 'degraded';
      }

      return {
        status,
        responseTime,
        statusCode: response.status,
        error: null
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      let errorMessage = 'Unknown error';
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'DNS lookup failed';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused';
      } else {
        errorMessage = error.message;
      }

      return {
        status: 'down',
        responseTime,
        statusCode: null,
        error: errorMessage
      };
    }
  }

  async checkMonitor(monitorId) {
    try {
      const monitor = await Monitor.findById(monitorId);
      if (!monitor || !monitor.isActive) return;

      console.log(`Checking monitor: ${monitor.name} (${monitor.url})`);

      let result;
      if (monitor.type === 'http' || monitor.type === 'https') {
        result = await this.checkHttp(monitor.url, monitor.type);
      } else {
        // Fallback to HTTP check for other types in free version
        result = await this.checkHttp(monitor.url);
      }

      // Update monitor statistics
      const totalChecks = monitor.totalChecks + 1;
      const successfulChecks = result.status === 'up' ? 
        monitor.successfulChecks + 1 : monitor.successfulChecks;
      const uptime = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0;

      // Calculate average response time
      const totalResponseTime = (monitor.averageResponse * monitor.totalChecks) + result.responseTime;
      const averageResponse = totalChecks > 0 ? totalResponseTime / totalChecks : 0;

      // Keep only last 50 ping history entries to save storage
      let pingHistory = [...monitor.pingHistory, {
        timestamp: new Date(),
        status: result.status,
        responseTime: result.responseTime,
        statusCode: result.statusCode,
        error: result.error
      }];

      if (pingHistory.length > 50) {
        pingHistory = pingHistory.slice(-50);
      }

      const updateData = {
        lastChecked: new Date(),
        currentStatus: result.status,
        uptime: parseFloat(uptime.toFixed(2)),
        averageResponse: parseFloat(averageResponse.toFixed(2)),
        totalChecks,
        successfulChecks,
        pingHistory
      };

      await Monitor.findByIdAndUpdate(monitorId, updateData);

      console.log(`Monitor ${monitor.name} status: ${result.status}, response: ${result.responseTime}ms`);

      return result;
    } catch (error) {
      console.error('Error checking monitor:', error);
      return null;
    }
  }

  async checkAllMonitors() {
    try {
      console.log('Starting monitor checks...');
      const activeMonitors = await Monitor.find({ isActive: true });
      console.log(`Found ${activeMonitors.length} active monitors to check`);
      
      let checkedCount = 0;
      
      for (const monitor of activeMonitors) {
        try {
          await this.checkMonitor(monitor._id);
          checkedCount++;
          
          // Add delay between checks to avoid overwhelming the free tier
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`Error checking monitor ${monitor.name}:`, error);
        }
      }
      
      console.log(`Completed checks for ${checkedCount} monitors`);
    } catch (error) {
      console.error('Error in checkAllMonitors:', error);
    }
  }

  // Get monitoring statistics
  async getStats(userId) {
    const stats = await Monitor.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalMonitors: { $sum: 1 },
          activeMonitors: { 
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } 
          },
          upMonitors: { 
            $sum: { $cond: [{ $eq: ['$currentStatus', 'up'] }, 1, 0] } 
          },
          downMonitors: { 
            $sum: { $cond: [{ $eq: ['$currentStatus', 'down'] }, 1, 0] } 
          },
          avgUptime: { $avg: '$uptime' },
          avgResponse: { $avg: '$averageResponse' }
        }
      }
    ]);

    return stats[0] || {
      totalMonitors: 0,
      activeMonitors: 0,
      upMonitors: 0,
      downMonitors: 0,
      avgUptime: 0,
      avgResponse: 0
    };
  }
}

module.exports = new PingService();
