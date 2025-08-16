// ================================================
// FIREBASE MESSAGING SERVICE WORKER - SECURE VERSION
// This version fetches config from API endpoint
// ================================================

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// ================================================
// FETCH FIREBASE CONFIG FROM API
// ================================================

let messaging = null;

// Fetch config from your API endpoint
async function initializeFirebase() {
  try {
    // Fetch config from your API (this endpoint will read from env vars)
    const response = await fetch('/api/firebase-config');
    const config = await response.json();
    
    // Initialize Firebase with fetched config
    firebase.initializeApp(config);
    
    // Get messaging instance
    messaging = firebase.messaging();
    
    // Setup background message handler
    setupBackgroundHandler();
    
    console.log('[Service Worker] Firebase initialized successfully');
  } catch (error) {
    console.error('[Service Worker] Failed to initialize Firebase:', error);
  }
}

// Initialize on service worker activation
initializeFirebase();

// ================================================
// BACKGROUND MESSAGE HANDLER
// ================================================

function setupBackgroundHandler() {
  if (!messaging) return;
  
  messaging.onBackgroundMessage((payload) => {
    console.log('[Service Worker] Background message received:', payload);

    // Extract notification data
    const { title, body, icon, badge, image, data } = payload.notification || {};
    
    // Custom notification options
    const notificationOptions = {
      body: body || 'Hai una nuova notifica!',
      icon: icon || '/icons/icon-192x192.png',
      badge: badge || '/icons/badge-72x72.png',
      image: image,
      vibrate: [200, 100, 200],
      tag: data?.tag || `notification-${Date.now()}`,
      requireInteraction: data?.requireInteraction || false,
      data: {
        ...payload.data,
        FCM_MSG: payload,
        timestamp: Date.now()
      },
      actions: getNotificationActions(payload.data?.type)
    };

    // Customize notification based on type
    const customTitle = getCustomTitle(payload.data?.type, title);
    
    // Show the notification
    return self.registration.showNotification(customTitle, notificationOptions);
  });
}

// ================================================
// NOTIFICATION CLICK HANDLER
// ================================================

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);
  
  event.notification.close();

  // Handle action buttons
  if (event.action) {
    handleNotificationAction(event.action, event.notification.data);
    return;
  }

  // Default click - open app
  const urlToOpen = getNotificationUrl(event.notification.data);
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if app is already open
        for (let client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if not open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ================================================
// NOTIFICATION CLOSE HANDLER
// ================================================

self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed:', event);
  
  // Track notification dismissal
  if (event.notification.data?.notificationId) {
    // Could send analytics here
  }
});

// ================================================
// HELPER FUNCTIONS
// ================================================

function getCustomTitle(type, defaultTitle) {
  const titles = {
    'duel_challenge': '⚔️ Nuova Sfida!',
    'duel_accepted': '🤝 Sfida Accettata!',
    'duel_completed': '🏆 Duello Completato!',
    'duel_reminder': '⏰ Reminder Duello',
    'mission_available': '🎯 Nuove Missioni!',
    'mission_completed': '✅ Missione Completata!',
    'achievement_unlocked': '🏅 Achievement Sbloccato!',
    'friend_request': '👥 Richiesta di Amicizia',
    'team_invite': '👫 Invito Team',
    'streak_warning': '🔥 Streak in Pericolo!',
    'level_up': '⬆️ Level Up!',
    'leaderboard_update': '📊 Aggiornamento Classifica',
    'system': '📢 FitDuel'
  };
  
  return titles[type] || defaultTitle || 'FitDuel';
}

function getNotificationActions(type) {
  switch (type) {
    case 'duel_challenge':
      return [
        { action: 'accept', title: '✅ Accetta' },
        { action: 'decline', title: '❌ Rifiuta' }
      ];
    case 'friend_request':
      return [
        { action: 'accept', title: '✅ Accetta' },
        { action: 'ignore', title: '🚫 Ignora' }
      ];
    case 'mission_available':
      return [
        { action: 'view', title: '👀 Visualizza' },
        { action: 'later', title: '⏰ Più tardi' }
      ];
    case 'streak_warning':
      return [
        { action: 'train', title: '💪 Allenati Ora' }
      ];
    default:
      return [
        { action: 'view', title: '👀 Visualizza' }
      ];
  }
}

function getNotificationUrl(data) {
  const baseUrl = self.location.origin;
  
  // Check for custom action URL
  if (data?.actionUrl) {
    return `${baseUrl}${data.actionUrl}`;
  }
  
  // Default URLs based on type
  const typeUrls = {
    'duel_challenge': '/duels',
    'duel_accepted': '/duels',
    'duel_completed': '/duels',
    'mission_available': '/missions',
    'mission_completed': '/missions',
    'achievement_unlocked': '/achievements',
    'friend_request': '/friends',
    'team_invite': '/teams',
    'streak_warning': '/training',
    'level_up': '/profile',
    'leaderboard_update': '/leaderboard'
  };
  
  const path = typeUrls[data?.type] || '/dashboard';
  return `${baseUrl}${path}`;
}

function handleNotificationAction(action, data) {
  switch (action) {
    case 'accept':
      if (data?.type === 'duel_challenge') {
        // Accept duel
        acceptDuel(data.duelId);
      } else if (data?.type === 'friend_request') {
        // Accept friend request
        acceptFriendRequest(data.userId);
      }
      break;
      
    case 'decline':
    case 'ignore':
      // Just close notification
      break;
      
    case 'train':
      // Open training page
      clients.openWindow(`${self.location.origin}/training`);
      break;
      
    case 'view':
      // Open relevant page
      clients.openWindow(getNotificationUrl(data));
      break;
  }
}

async function acceptDuel(duelId) {
  if (!duelId) return;
  
  // Send message to client to accept duel
  const allClients = await clients.matchAll({ includeUncontrolled: true });
  allClients.forEach(client => {
    client.postMessage({
      type: 'ACCEPT_DUEL',
      duelId: duelId
    });
  });
}

async function acceptFriendRequest(userId) {
  if (!userId) return;
  
  // Send message to client to accept friend request
  const allClients = await clients.matchAll({ includeUncontrolled: true });
  allClients.forEach(client => {
    client.postMessage({
      type: 'ACCEPT_FRIEND',
      userId: userId
    });
  });
}

// ================================================
// INSTALL & ACTIVATE EVENTS
// ================================================

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated');
  event.waitUntil(clients.claim());
});

// ================================================
// PERIODIC SYNC (for future use)
// ================================================

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkForNewNotifications());
  }
});

async function checkForNewNotifications() {
  // Could check for missed notifications here
  console.log('[Service Worker] Checking for notifications...');
}

// ================================================
// PUSH EVENT (raw push messages)
// ================================================

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);
  
  if (!event.data) {
    console.log('[Service Worker] Push had no data');
    return;
  }
  
  try {
    const payload = event.data.json();
    
    // Show notification
    const title = payload.notification?.title || 'FitDuel';
    const options = {
      body: payload.notification?.body || 'Nuova notifica',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: payload.data
    };
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('[Service Worker] Error handling push:', error);
  }
});

console.log('[Service Worker] Loaded successfully');