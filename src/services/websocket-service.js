import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.isConnected = false;
    this.subscriptions = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.reconnectDelay = 5000;
    this.userId = null;
  }

  connect(userId, token) {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        console.log("WebSocket already connected");
        resolve();
        return;
      }

      this.userId = userId;

      const baseWsUrl =
        import.meta.env.VITE_WEBSOCKET_URL || "http://localhost:8080/ws";
      const wsUrlWithToken = token
        ? `${baseWsUrl}?token=${encodeURIComponent(
            token
          )}&userId=${encodeURIComponent(userId)}`
        : baseWsUrl;

      const socket = new SockJS(wsUrlWithToken, null, {
        transports: ["websocket", "xhr-streaming", "xhr-polling"],
        timeout: 10000,
      });

      this.stompClient = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
          userId: userId.toString(),
        },
        debug: (str) => {
          if (import.meta.env.MODE === "development") {
            console.log("STOMP:", str);
          }
        },
        onConnect: (frame) => {
          console.log("websocket-service.js:61 WebSocket connected");
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.subscribeToNotifications(userId);
          window.dispatchEvent(
            new CustomEvent("websocketConnected", {
              detail: { connected: true, userId },
            })
          );
          resolve(frame);
        },
        onDisconnect: (frame) => {
          console.log("WebSocket disconnected");
          this.isConnected = false;
          this.subscriptions.clear();
          window.dispatchEvent(
            new CustomEvent("websocketDisconnected", {
              detail: { connected: false },
            })
          );
        },
        onStompError: (frame) => {
          console.error("WebSocket STOMP error:", frame.headers["message"]);
          this.handleReconnect(userId, token);
          reject(new Error(frame.headers["message"]));
        },
        onWebSocketError: (error) => {
          console.error("WebSocket error:", error);
          this.handleReconnect(userId, token);
          reject(error);
        },
      });

      this.stompClient.activate();
    });
  }

  subscribeToNotifications(userId) {
    if (!this.stompClient || !this.stompClient.connected) {
      console.warn("Cannot subscribe: WebSocket not connected");
      return;
    }

    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.clear();

    const userQueue = `/user/${userId}/queue/notifications`;
    console.log(" Subscribing to user queue:", userQueue);
    const userSubscription = this.stompClient.subscribe(
      userQueue,
      (message) => {
        console.log(" Received message on user queue:", userQueue);
        console.log(" User queue message headers:", message.headers);
        console.log(" User queue message body:", message.body);
        this.handleNotificationMessage(message);
      }
    );
    this.subscriptions.set(userQueue, userSubscription);

    const broadcastQueue = "/topic/notifications";
    console.log(" Subscribing to broadcast queue:", broadcastQueue);
    const broadcastSubscription = this.stompClient.subscribe(
      broadcastQueue,
      (message) => {
        console.log(" Received message on broadcast queue:", broadcastQueue);
        console.log(" Broadcast queue message headers:", message.headers);
        console.log(" Broadcast queue message body:", message.body);
        this.handleNotificationMessage(message);
      }
    );
    this.subscriptions.set(broadcastQueue, broadcastSubscription);
  }

  handleNotificationMessage(message) {
    try {
      console.log(" WebSocket message received:", message);
      console.log(" Message destination:", message.headers?.destination);
      console.log(" Message body:", message.body);
      const rawNotification = JSON.parse(message.body);
      console.log(" Raw notification data:", rawNotification);

      const notification = {
        notificationId: rawNotification.notificationId || rawNotification.id,
        title: rawNotification.title,
        message: rawNotification.message,
        type: rawNotification.type,
        relatedId: rawNotification.relatedId,
        read: rawNotification.isRead || rawNotification.read || false,
        createdAt:
          rawNotification.timestamp ||
          rawNotification.createdAt ||
          new Date().toISOString(),
        userId: rawNotification.userId || this.userId,
      };

      console.log(" Mapped notification:", notification);

      window.dispatchEvent(
        new CustomEvent("notificationReceived", { detail: notification })
      );

      console.log(" Notification event dispatched");
    } catch (error) {
      console.error(" Error processing notification:", error);
    }
  }

  testConnection() {
    if (!this.stompClient || !this.stompClient.connected) {
      console.warn("Cannot test connection: WebSocket not connected");
      return false;
    }

    try {
      this.stompClient.publish({
        destination: "/app/test",
        body: JSON.stringify({
          message: "test connection",
          timestamp: new Date().toISOString(),
        }),
      });
      console.log(" Test message sent to /app/test");
      return true;
    } catch (error) {
      console.error(" Failed to send test message:", error);
      return false;
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      stompConnected: this.stompClient?.connected || false,
      subscriptions: Array.from(this.subscriptions.keys()),
    };
  }

  /**
   * Check if WebSocket is connected (backward compatibility method)
   * @returns {boolean} Connection status
   */
  isWebSocketConnected() {
    return this.isConnected && this.stompClient && this.stompClient.connected;
  }

  /**
   * Send test notification to self (for testing purposes)
   * @returns {boolean} Success status
   */
  sendTestNotificationToSelf() {
    if (!this.stompClient || !this.stompClient.connected || !this.userId) {
      console.warn(
        "Cannot send test notification: WebSocket not connected or no userId"
      );
      return false;
    }

    try {
      // Send to user-specific queue
      this.stompClient.publish({
        destination: "/app/send-notification",
        body: JSON.stringify({
          userId: this.userId,
          title: "Test Notification",
          message: `Test message sent at ${new Date().toLocaleTimeString()}`,
          type: "BOOKING_CONFIRMED", // Use a user-specific type
          timestamp: new Date().toISOString(),
        }),
      });

      // Also send to broadcast queue for testing
      this.stompClient.publish({
        destination: "/app/broadcast",
        body: JSON.stringify({
          title: "Broadcast Test",
          message: `Broadcast test message at ${new Date().toLocaleTimeString()}`,
          type: "SYSTEM_ANNOUNCEMENT", // Use broadcast type
          timestamp: new Date().toISOString(),
        }),
      });

      console.log(" Test notifications sent to both user and broadcast queues");
      return true;
    } catch (error) {
      console.error(" Failed to send test notification:", error);
      return false;
    }
  }

  handleReconnect(userId, token) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      );

      setTimeout(() => {
        this.connect(userId, token).catch(() => {});
      }, this.reconnectDelay);
    } else {
      console.error("Max reconnection attempts reached");
    }
  }

  disconnect() {
    if (this.stompClient) {
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.subscriptions.clear();
      this.stompClient.deactivate();
      this.isConnected = false;
      this.stompClient = null;
      console.log("WebSocket disconnected");
    }
  }
}

export default new WebSocketService();
