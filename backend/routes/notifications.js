const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');

// Get VAPID public key
router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// Subscribe to push notifications
router.post('/subscribe', async (req, res) => {
  try {
    const subscription = req.body;
    await notificationService.saveSubscription(subscription);
    res.status(201).json({ message: 'Subscription saved successfully' });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ message: 'Error saving subscription' });
  }
});

// Send a test notification
router.post('/send-test', async (req, res) => {
  try {
    const { title, body, url } = req.body;
    await notificationService.sendNotification(
      title || 'New Article Available',
      body || 'Check out our latest article!',
      url || 'https://skii36.io.vn'
    );
    res.json({ message: 'Test notification sent successfully' });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ message: 'Error sending test notification' });
  }
});

module.exports = router; 