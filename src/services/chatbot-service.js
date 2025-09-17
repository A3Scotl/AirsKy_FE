import { io } from "socket.io-client";

const CHATBOT_BASE_URL = "http://localhost:3000";

class ChatbotService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.messageHandlers = new Map();
  }

  connect() {
    if (this.socket && this.isConnected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.socket = io(CHATBOT_BASE_URL, {
        timeout: 5000,
        transports: ["websocket", "polling"],
      });

      this.socket.on("connect", () => {
        console.log("Connected to chatbot server");
        this.isConnected = true;
        resolve();
      });

      this.socket.on("disconnect", () => {
        console.log("Disconnected from chatbot server");
        this.isConnected = false;
      });

      this.socket.on("connect_error", (error) => {
        console.error("Connection error:", error);
        reject(error);
      });

      // Listen for responses
      this.socket.on("chat_response", (response) => {
        const handler = this.messageHandlers.get("chat_response");
        if (handler) {
          handler(response);
        }
      });

      // Listen for history
      this.socket.on("chat_history", (history) => {
        const handler = this.messageHandlers.get("chat_history");
        if (handler) {
          handler(history);
        }
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  async sendMessage(message, userId = null) {
    try {
      // Ensure connection
      if (!this.isConnected) {
        await this.connect();
      }

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Response timeout"));
        }, 30000); // 30 second timeout

        // Set up response handler
        this.messageHandlers.set("chat_response", (response) => {
          console.log("📥 Raw socket response:", response);
          clearTimeout(timeout);
          this.messageHandlers.delete("chat_response");
          resolve({
            success: true,
            response: response,
            data: { response },
          });
        });

        // Send message
        this.socket.emit("chat_message", { message, userId });
      });
    } catch (error) {
      console.error("Chatbot socket error:", error);

      let errorMessage = "Xin lỗi, có lỗi xảy ra khi kết nối với server.";

      if (error.message === "Response timeout") {
        errorMessage = "Server phản hồi quá chậm. Vui lòng thử lại.";
      } else if (error.code === "ECONNREFUSED") {
        errorMessage =
          "Không thể kết nối đến server chatbot. Vui lòng kiểm tra kết nối mạng.";
      }

      return {
        success: false,
        error: errorMessage,
        response: errorMessage,
      };
    }
  }

  async getChatHistory(userId) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("History timeout"));
        }, 10000);

        this.messageHandlers.set("chat_history", (history) => {
          clearTimeout(timeout);
          this.messageHandlers.delete("chat_history");
          resolve({
            success: true,
            data: history,
          });
        });

        // History is automatically sent on connection
      });
    } catch (error) {
      console.error("Get chat history error:", error);
      return {
        success: false,
        error: "Không thể tải lịch sử trò chuyện.",
        data: [],
      };
    }
  }

  async clearChatHistory(userId) {
    // Since we're not using Redis, just return success
    return {
      success: true,
      data: { message: "History cleared" },
    };
  }
}

export default new ChatbotService();
