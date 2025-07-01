const webpush = require('web-push');
const Subscription = require('../models/Subscription');

// Configure web-push with your VAPID keys
webpush.setVapidDetails(
  'mailto:quanpham0405@gmail.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

class NotificationService {
  async saveSubscription(subscription) {
    try {
      await Subscription.findOneAndUpdate(
        { endpoint: subscription.endpoint },
        subscription,
        { upsert: true }
      );
      return true;
    } catch (error) {
      console.error('Error saving subscription:', error);
      return false;
    }
  }

  async sendNotification(title, body, url) {
    try {
      const subscriptions = await Subscription.find();
      
      const notificationPayload = {
        title,
        body,
        url
      };

      const notifications = subscriptions.map(subscription => {
        return webpush.sendNotification(
          subscription,
          JSON.stringify(notificationPayload)
        ).catch(error => {
          if (error.statusCode === 410) {
            // Subscription has expired or is no longer valid
            return Subscription.deleteOne({ _id: subscription._id });
          }
          throw error;
        });
      });

      await Promise.all(notifications);
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }
}

module.exports = new NotificationService(); 