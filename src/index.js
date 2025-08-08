/**
 * PushFlow SDK
 * A JavaScript SDK for integrating push notifications into web applications
 */
class PushFlow {
    constructor(config) {
        this.subscriberId = config.subscriberId;
        this.apiUrl = config.apiUrl;
        this.debug = config.debug || false;
        this.onNotificationReceived = config.onNotificationReceived || null;
        this.onPermissionGranted = config.onPermissionGranted || null;
        this.onPermissionDenied = config.onPermissionDenied || null;
        this.onUserRegistered = config.onUserRegistered || null;
        this.user = null;
        this.device = null;
        this.isSupported =
            "serviceWorker" in navigator && "PushManager" in window;
        this.initialized = false;
        this.subscription = null;
        this.platform = config.platform | "WEB";
        this.log("pushify-ir SDK initialized");
    }

    log(message, ...args) {
        if (this.debug) {
            console.log(`[PushFlow] ${message}`, ...args);
        }
    }

    error(message, ...args) {
        console.error(`[PushFlow Error] ${message}`, ...args);
    }

    async init() {
        if (this.initialized) {
            this.log("PushFlow already initialized, skipping");
            return false;
        }
        this.initialized = true;

        if (!this.isSupported) {
            this.error("Push notifications are not supported in this browser");
            return false;
        }

        try {
            await this.registerServiceWorker();

            const permission = await Notification.permission;
            if (permission === "granted") {
                await this.subscribeUser();
            } else if (permission === "default") {
                this.log("Push notification permission not yet requested");
            } else {
                this.log("Push notification permission denied");
                if (this.onPermissionDenied) this.onPermissionDenied();
            }
            return true;
        } catch (error) {
            this.error("Failed to initialize PushFlow", error);
            return false;
        }
    }

    async registerServiceWorker() {
        try {
            const existingRegistration =
                await navigator.serviceWorker.getRegistration(
                    "/pusify-ir-sw.js",
                );
            if (existingRegistration) {
                this.log("Service worker already registered");
                return existingRegistration;
            }

            const registration = await navigator.serviceWorker.register(
                "/pushify-ir-sw.js",
                { scope: "/" },
            );
            this.log("Service worker registered successfully");
            return registration;
        } catch (error) {
            this.error("Service worker registration failed", error);
            throw error;
        }
    }

    async requestPermission() {
        if (!this.isSupported) {
            this.error("Push notifications are not supported");
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                this.log("Push notification permission granted");
                if (this.onPermissionGranted) this.onPermissionGranted();
                await this.subscribeUser();
                return true;
            } else {
                this.log("Push notification permission denied");
                if (this.onPermissionDenied) this.onPermissionDenied();
                return false;
            }
        } catch (error) {
            this.error("Failed to request permission", error);
            return false;
        }
    }

    async subscribeUser() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const existingSubscription =
                await registration.pushManager.getSubscription();

            if (existingSubscription) {
                this.log("Push subscription already exists");
                this.subscription = existingSubscription;
                return { user: this.user, device: this.device };
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(
                    "BCTrlArvyrzg3Me6lCLc6Zo6ymgCo4p3j3IGMoumsxmO5C7x6m4BDluZNl7cejeCspvbruBDC3FSK-C73m4reB8",
                ),
            });

            const userEmail = await this.getUserEmail();
            const userName = await this.getUserName();

            const response = await fetch(`${this.apiUrl}/public/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: userEmail || `anonymous-${Date.now()}@example.com`,
                    name: userName || `anonymous-${Date.now()}`,
                    subscriberId: this.subscriberId,
                    deviceToken: JSON.stringify(subscription),
                    platform: this.platform,
                    userAgent: navigator.userAgent,
                    language: navigator.language,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                this.error("Backend error response:", errorText);
                throw new Error("Failed to register user with backend");
            }

            const data = await response.json();
            this.user = data.user;
            this.device = data.device;
            this.subscription = subscription;
            this.log("User subscribed successfully", data);

            if (this.onUserRegistered) this.onUserRegistered(data);
            return data;
        } catch (error) {
            this.error("Failed to subscribe user", error);
            throw error;
        }
    }

    async getUserEmail() {
        const emailInput = document.querySelector('input[type="email"]');
        if (emailInput && emailInput.value) return emailInput.value;

        const emailFields = document.querySelectorAll(
            'input[name*="email"], input[id*="email"]',
        );
        for (const field of emailFields) {
            if (field.value && field.value.includes("@")) return field.value;
        }
        return null;
    }

    async getUserName() {
        const nameInput = document.querySelector(
            'input[name="name"], input[name="full_name"]',
        );
        if (nameInput && nameInput.value) return nameInput.value;

        const nameFields = document.querySelectorAll(
            'input[name*="name"], input[id*="name"]',
        );
        for (const field of nameFields) {
            if (field.value) return field.value;
        }
        return null;
    }

    async updatePreferences(preferences) {
        if (!this.user) {
            this.error("No user registered");
            return false;
        }

        try {
            const response = await fetch(
                `${this.apiUrl}/public/users/${this.user.id}/preferences`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(preferences),
                },
            );

            if (!response.ok) throw new Error("Failed to update preferences");

            const data = await response.json();
            this.user = { ...this.user, ...preferences };
            this.log("User preferences updated", data);
            return data;
        } catch (error) {
            this.error("Failed to update preferences", error);
            return false;
        }
    }

    async unsubscribe() {
        try {
            if (this.subscription) {
                await this.subscription.unsubscribe();
                this.subscription = null;
            }

            if (this.user) {
                await this.updatePreferences({ optIn: false });
            }

            this.log("User unsubscribed successfully");
            return true;
        } catch (error) {
            this.error("Failed to unsubscribe", error);
            return false;
        }
    }

    urlBase64ToUint8Array(base64String) {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, "+")
            .replace(/_/g, "/");
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    static isSupported() {
        return "serviceWorker" in navigator && "PushManager" in window;
    }

    static async getPermissionStatus() {
        if (!PushFlow.isSupported()) return "unsupported";
        return Notification.permission;
    }
}

// Export for both CommonJS and ES Modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = PushFlow;
} else if (typeof window !== "undefined") {
    window.PushFlow = PushFlow;
}
