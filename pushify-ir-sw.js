self.addEventListener("push", function (event) {
    console.log(
        "Push event received:",
        event.data ? event.data.text() : "No data",
    );

    if (event.data) {
        try {
            const data = event.data.json();
            console.log("income data is :", data);

            const options = {
                body: data.body,
                icon: data.iconUrl || "/default-icon.png",
                image: data.imageUrl,
                badge: "/badge-icon.png",
                vibrate: [100, 50, 100],
                data: {
                    url: data.clickUrl,
                    notificationId: data.id,
                    deliveryId: data.deliveryId,
                },
                actions: data.actions || [],
                tag: `pushflow-${data.id || Date.now()}`,
                renotify: data.priority === "HIGH",
                requireInteraction: data.priority === "HIGH",
            };
            console.log("setteledOptionis :", options);
            event.waitUntil(
                self.registration.showNotification(data.title, options),
            );
        } catch (error) {
            console.error("Error processing push event:", error);
        }
    }
});

self.addEventListener("notificationclick", function (event) {
    console.log("Notification clicked:", event.notification.data);
    event.notification.close();

    if (event.notification.data) {
        if (event.notification.data.deliveryId) {
            trackDeliveryEvent(event.notification.data.deliveryId, "CLICKED");
        }

        if (event.notification.data.url) {
            event.waitUntil(clients.openWindow(event.notification.data.url));
        }
    }
});

self.addEventListener("notificationclose", function (event) {
    if (event.notification.data && event.notification.data.deliveryId) {
        trackDeliveryEvent(event.notification.data.deliveryId, "DELIVERED");
    }
});

self.addEventListener("notificationshow", function (event) {
    if (event.notification.data && event.notification.data.deliveryId) {
        trackDeliveryEvent(event.notification.data.deliveryId, "DELIVERED");
    }
});

async function trackDeliveryEvent(deliveryId, eventType) {
    try {
        const response = await fetch(`/api/deliveries/${deliveryId}/status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                status: eventType,
                timestamp: new Date().toISOString(),
            }),
        });
        console.log(
            "Track delivery response:",
            response.status,
            await response.text(),
        );
    } catch (error) {
        console.error("Failed to track delivery event:", error);
    }
}
