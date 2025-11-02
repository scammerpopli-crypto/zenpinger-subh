const axios = require('axios');
const Monitor = require('../models/Monitor');

class PingService {
  constructor() {
    this.timeout = 10000; // 10 seconds
  }

  async checkHttp(url, type = 'https') {
    const startTime = Date.now();
    
    try {
      const protocol = type === 'http' ? 'http' : 'https';
      const fullUrl = url.startsWith('http') ? url : `${protocol}://${url}`;
      
      const response = await axios.get(fullUrl, {
        timeout: this.timeout,
        validateStatus: () => true // Accept all status codes
      });

      const responseTime = Date.now() - startTime;
      
      let status = 'up';
      if (response.status >= 400) {
        status = 'degraded';
      }
      if (response.status >= 500) {
        status = 'down';
      }

      return {
        status,
        responseTime,
        statusCode: response.status,
        error: null
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'down',
        responseTime,
        statusCode: null,
        error: error.message
      };
    }
  }

  async checkMonitor(monitorId) {
    try {
      const monitor = await Monitor.findById(monitorId);
      if (!monitor || !monitor.isActive) return;

      let result;
      if (monitor.type === 'http' || monitor.type === 'https') {
        result = await this.checkHttp(monitor.url, monitor.type);
      } else {
        // For other types (ping, port), you can implement specific checks
        result = await this.checkHttp(monitor.url);
      }

      // Update monitor statistics
      const totalChecks = monitor.totalChecks + 1;
      const successfulChecks = result.status === 'up' ? 
        monitor.successfulChecks + 1 : monitor.successfulChecks;
      const uptime = (successfulChecks / totalChecks) * 100;

      // Calculate average response time
      const totalResponseTime = (monitor.averageResponse * monitor.totalChecks) + result.responseTime;
      const averageResponse = totalResponseTime / totalChecks;

      // Keep only last 100 ping history entries
      let pingHistory = [...monitor.pingHistory, {
        timestamp: new Date(),
        status: result.status,
        responseTime: result.responseTime,
        statusCode: result.statusCode,
        error: result.error
      }];

      if (pingHistory.length > 100) {
        pingHistory = pingHistory.slice(-100);
      }

      await Monitor.findByIdAndUpdate(monitorId, {
        lastChecked: new Date(),
        currentStatus: result.status,
        uptime: parseFloat(uptime.toFixed(2)),
        averageResponse: parseFloat(averageResponse.toFixed(2)),
        totalChecks,
        successfulChecks,
        pingHistory
      });

      return result;
    } catch (error) {
      console.error('Error checking monitor:', error);
    }
  }

  async checkAllMonitors() {
    try {
      const activeMonitors = await Monitor.find({ isActive: true });
      
      for (const monitor of activeMonitors) {
        await this.checkMonitor(monitor._id);
        // Add delay between checks to avoid overwhelming
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('Error checking all monitors:', error);
    }
  }
}

module.exports = new PingService();
