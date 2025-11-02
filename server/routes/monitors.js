const express = require('express');
const Monitor = require('../models/Monitor');
const auth = require('../middleware/auth');
const pingService = require('../utils/pingService');
const router = express.Router();

// Get all monitors for user
router.get('/', auth, async (req, res) => {
  try {
    const monitors = await Monitor.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json(monitors);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single monitor
router.get('/:id', auth, async (req, res) => {
  try {
    const monitor = await Monitor.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    res.json(monitor);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create monitor
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
      ...req.body,
      userId: req.user._id
    });

    await monitor.save();

    // Perform initial check
    setTimeout(() => {
      pingService.checkMonitor(monitor._id);
    }, 2000);

    res.status(201).json(monitor);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update monitor
router.put('/:id', auth, async (req, res) => {
  try {
    const monitor = await Monitor.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    res.json(monitor);
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

// Check monitor manually
router.post('/:id/check', auth, async (req, res) => {
  try {
    const result = await pingService.checkMonitor(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
