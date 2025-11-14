import { useState, useEffect, useCallback, useRef } from "react";
import webSocketService from "@/services/websocket-service";
import { notificationApi } from "../apis/notification-api";

/**
 * Custom hook for managing notifications
 * @param {number} userId - User ID
 * @param {string} token - JWT token
 * @returns {object} Notification state and methods
 */
export const useNotifications = (userId, token) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalElements, setTotalElements] = useState(0);

  const isInitialized = useRef(false);
  const lastFetchTime = useRef(0);
  const FETCH_COOLDOWN = 5000; // 5 seconds cooldown between fetches

  // Track recent notifications to prevent duplicates
  const recentNotifications = useRef(new Map());
  const NOTIFICATION_DEDUPE_WINDOW = 10000; // 10 seconds window for duplicate detection

  /**
   * Connect to WebSocket
   */
  const connectWebSocket = useCallback(async () => {
    if (!userId || !token) return;

    try {
      await webSocketService.connect(userId, token);
      setIsConnected(true);
      setConnectionStatus("connected");
      setError(null);
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
      setIsConnected(false);
      setConnectionStatus("disconnected");
      setError(error.message);
    }
  }, [userId, token]);

  /**
   * Fetch notifications from API
   */
  const fetchNotifications = useCallback(
    async (page = 0, append = false) => {
      if (!userId) return;

      const now = Date.now();
      if (now - lastFetchTime.current < FETCH_COOLDOWN) {
        return;
      }

      lastFetchTime.current = now;

      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const response = await notificationApi.getUserNotifications(userId, {
          page,
          size: 10,
          sort: "createdAt,desc",
        });

        if (response.success) {

          // Handle case where response.data is the API response object itself
          let apiData = response.data;
          if (
            apiData &&
            typeof apiData === "object" &&
            apiData.success !== undefined
          ) {

            apiData = apiData.data;
          }

          const { content, totalElements: total, last } = apiData;
          let notificationData = content || [];

          // Ensure notificationData is always an array
          if (!Array.isArray(notificationData)) {
            console.warn("notificationData is not an array:", notificationData);
            notificationData = [];
          }

          if (append) {
            setNotifications((prev) => [...prev, ...notificationData]);
          } else {
            setNotifications(notificationData);
          }

          setTotalElements(total || 0);
          setHasMore(!last);
          setCurrentPage(page);
          setError(null);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setError(error.message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [userId]
  );

  /**
   * Fetch unread count
   */
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await notificationApi.getUnreadCount(userId);
      if (response.success) {
        // Handle case where response.data is the API response object itself
        let apiData = response.data;
        if (
          apiData &&
          typeof apiData === "object" &&
          apiData.success !== undefined
        ) {
          apiData = apiData.data;
        }
        const count = apiData || 0;
        setUnreadCount(count);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [userId]);

  /**
   * Mark notifications as read
   */
  const markAsRead = useCallback(async (notificationIds) => {
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return;
    }

    try {
      const idsArray = notificationIds.filter((id) => id != null);
      if (idsArray.length === 0) return;

      const response = await notificationApi.markAsRead(idsArray);
      if (response.success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notification) =>
            idsArray.includes(notification.notificationId)
              ? { ...notification, read: true }
              : notification
          )
        );

        // Update unread count
        setUnreadCount((prev) => Math.max(0, prev - idsArray.length));
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await notificationApi.markAllAsRead(userId);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, [userId]);

  /**
   * Delete notification
   */
  const deleteNotification = useCallback(
    async (notificationId) => {
      if (!notificationId) return;

      try {
        const response = await notificationApi.deleteNotification(
          notificationId
        );
        if (response.success) {
          setNotifications((prev) => {
            const updated = prev.filter(
              (n) => n.notificationId !== notificationId
            );
            return updated;
          });

          // Update unread count if deleted notification was unread
          const deletedNotification = notifications.find(
            (n) => n.notificationId === notificationId
          );
          if (deletedNotification && !deletedNotification.read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      } catch (error) {
        console.error("Error deleting notification:", error);
      }
    },
    [notifications]
  );

  /**
   * Handle new notification from WebSocket
   */
  const handleNewNotification = useCallback(
    (event) => {

      const newNotification = event.detail;

      if (!newNotification || !newNotification.notificationId) {
        console.warn("⚠️ Invalid notification received:", newNotification);
        return;
      }

      // Check if notification is for current user
      if (newNotification.userId && newNotification.userId !== userId) {

        return;
      }

      // Check for duplicates
      const notificationKey = `${newNotification.notificationId}_${newNotification.createdAt}`;
      const now = Date.now();

      if (recentNotifications.current.has(notificationKey)) {
        const lastSeen = recentNotifications.current.get(notificationKey);
        if (now - lastSeen < NOTIFICATION_DEDUPE_WINDOW) {

          return; // Skip duplicate
        }
      }

      // Mark as seen
      recentNotifications.current.set(notificationKey, now);

      // Clean up old entries
      for (const [key, timestamp] of recentNotifications.current.entries()) {
        if (now - timestamp > NOTIFICATION_DEDUPE_WINDOW) {
          recentNotifications.current.delete(key);
        }
      }

      // Check if notification already exists
      const exists = notifications.some(
        (n) => n.notificationId === newNotification.notificationId
      );
      if (exists) {

        return;
      }

      // Add new notification to the top of the list
      setNotifications((prev) => [newNotification, ...prev]);

      // Update unread count if notification is unread
      if (!newNotification.read) {

        setUnreadCount((prev) => prev + 1);
      }

    },
    [userId, notifications]
  );

  /**
   * Load more notifications
   */
  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    fetchNotifications(currentPage + 1, true);
  }, [fetchNotifications, currentPage, hasMore, loadingMore]);

  /**
   * Refresh notifications
   */
  const refresh = useCallback(() => {
    fetchNotifications(0, false);
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // Handle WebSocket connection events
  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      setConnectionStatus("connected");
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setConnectionStatus("disconnected");
    };

    window.addEventListener("websocketConnected", handleConnect);
    window.addEventListener("websocketDisconnected", handleDisconnect);
    window.addEventListener("notificationReceived", handleNewNotification);

    return () => {
      window.removeEventListener("websocketConnected", handleConnect);
      window.removeEventListener("websocketDisconnected", handleDisconnect);
      window.removeEventListener("notificationReceived", handleNewNotification);
    };
  }, [handleNewNotification]);

  // Initialize hook
  useEffect(() => {
    if (!userId || !token || isInitialized.current) return;

    isInitialized.current = true;
    connectWebSocket();
    fetchNotifications();
    fetchUnreadCount();
  }, [userId, token, connectWebSocket, fetchNotifications, fetchUnreadCount]);

  // Reconnect WebSocket if disconnected
  useEffect(() => {
    if (!isConnected && userId && token && isInitialized.current) {
      const reconnectTimer = setTimeout(() => {
        connectWebSocket();
      }, 5000);

      return () => clearTimeout(reconnectTimer);
    }
  }, [isConnected, userId, token, connectWebSocket]);

  return {
    notifications,
    unreadCount,
    isConnected,
    connectionStatus,
    loading,
    loadingMore,
    error,
    hasMore,
    totalElements,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
    refresh,
    connectWebSocket,
  };
};
