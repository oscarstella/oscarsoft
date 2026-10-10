// Servicio de Notificaciones Push mediante Expo Push Notification API

async function sendExpoPushNotification(pushToken, { title, body, data = {} }) {
  if (!pushToken || !pushToken.startsWith('ExponentPushToken[')) {
    console.log(`[Push Notification (Mock)] Para token '${pushToken}': "${title}" - ${body}`);
    return { success: true, mocked: true };
  }

  const message = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high',
    channelId: 'barigo-rides'
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log(`[Push Notification Enviada] a ${pushToken}:`, result);
    return { success: true, result };
  } catch (error) {
    console.error('[Push Notification Error]:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendExpoPushNotification
};
