const express = require('express');
const Monitor = require('../models/Monitor');
const auth = require('../middleware/auth');
const router = express.Router();

// Get monitors with limited data
router.get('/', auth, async (req, res) => {
  try {
    const monitors = await Monitor.find({ userId: req.user._id })
      .select('name url type currentStatus uptime averageResponse totalChecks lastChecked createdAt')
      .sort({ createdAt: -1 })
      .lean(); // Use lean for better performance
    
    // Calculate virtual fields
    const monitorsWithVirtuals = monitors.map(monitor => ({
      ...monitor,
      uptime: monitor.totalChecks > 0 ? (monitor.successfulChecks / monitor.totalChecks) * 100 : 0,
      averageResponse: monitor.totalChecks > 0 ? monitor.totalResponseTime / monitor.totalChecks : 0
    }));

    res.json(monitorsWithVirtuals);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single monitor with limited history
router.get('/:id', auth, async (req, res) => {
  try {
    const monitor = await Monitor.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    }).select('name url type currentStatus pingHistory totalChecks successfulChecks totalResponseTime createdAt');

    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    // Return only last 24 hours of ping history
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const recentPings = monitor.pingHistory.filter(
      ping => ping.timestamp > oneDayAgo
    );

    res.json({
      ...monitor.toObject(),
      pingHistory: recentPings,
      uptime: monitor.uptime,
      averageResponse: monitor.averageResponse
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create monitor with validation
router.post('/', auth, async (req, res) => {
  try {
    // Check monitor limit
    const monitorCount = await Monitor.countDocuments({ userId: req.user._id });
    if (monitorCount >= req.user.maxMonitors) {
      return res.status(400).json({ 
        error: `Monitor limit reached. Maximum ${req.user.maxMonitors} monitors allowed.` 
      });
    }

    const monitor = new Monitor({
      name: req.body.name,
      url: req.body.url,
      type: req.body.type || 'https',
      userId: req.user._id
    });

    await monitor.save();

    res.status(201).json({
      id: monitor._id,
      name: monitor.name,
      url: monitor.url,
      type: monitor.type,
      currentStatus: monitor.currentStatus,
      createdAt: monitor.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete monitor
router.delete('/:id', auth, async (req, res) => {
  try {
    const monitor = await Monitor.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    res.json({ message: 'Monitor deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
