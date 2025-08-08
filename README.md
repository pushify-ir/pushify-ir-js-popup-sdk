# Pushify-ir SDK

A JavaScript SDK for integrating push notifications into your web application using the Pushify-ir service.

## Installation

Install the Pushify-ir SDK via npm:

```bash
npm i @pushify-ir/main
```

## Setup

1. **Copy Service Worker File**
   Copy the `pushify-ir-sw.js` file from the package's `dist` folder to your project's `public` folder. Ensure it is accessible at `example.com/pushify-ir-sw.js`.

2. **Import and Initialize the SDK**
   Import the `PushFlow` class from the package and initialize it in your JavaScript code.

   ```javascript
   import PushFlow from "@pushify-ir/main";

   const pushFlow = new PushFlow({
       subscriberId: "", // Your subscriber ID
       apiUrl: "", //  API URL FROM INTEGRATIIONS
       debug: true, // Enable debug mode for logs
       onUserRegistered: (userData) => {
           console.log("User registered:", userData);
       },
   });

   pushFlow.init();
   ```

## Constructor Configuration

The `PushFlow` constructor accepts a configuration object with the following properties:

| Property                | Type     | Description                                                                 | Required | Default        |
|-------------------------|----------|-----------------------------------------------------------------------------|----------|----------------|
| `subscriberId`          | String   | Your unique subscriber ID provided by Pushify-ir.                           | Yes      | -              |
| `apiUrl`                | String   | The API URL for the Pushify-ir service.                                    | Yes      | -              |
| `debug`                 | Boolean  | Enable debug logging for troubleshooting.                                   | No       | `false`        |
| `onNotificationReceived`| Function | Callback triggered when a push notification is received.                    | No       | `null`         |
| `onPermissionGranted`   | Function | Callback triggered when the user grants push notification permission.       | No       | `null`         |
| `onPermissionDenied`    | Function | Callback triggered when the user denies push notification permission.       | No       | `null`         |
| `onUserRegistered`      | Function | Callback triggered when the user is successfully registered.                | No       | `null`         |
| `platform`              | String   | The platform for the SDK (e.g., "WEB").                                    | No       | `"WEB"`        |

### Example Configuration

```javascript
const pushFlow = new PushFlow({
    subscriberId: "cmdyiclij00024jnldzfirp9s",
    apiUrl: "http://0.0.0.0:11001/api",
    debug: true,
    onNotificationReceived: (notification) => {
        console.log("Notification received:", notification);
    },
    onPermissionGranted: () => {
        console.log("Permission granted for notifications");
    },
    onPermissionDenied: () => {
        console.log("Permission denied for notifications");
    },
    onUserRegistered: (userData) => {
        console.log("User registered:", userData);
    },
});

pushFlow.init();
```

## Methods

### `init()`
Initializes the SDK, registers the service worker, and sets up push notification subscriptions. Call this method after creating a `PushFlow` instance.

```javascript
pushFlow.init();
```

## Browser Support

The SDK relies on the following browser APIs:
- `ServiceWorker` API
- `PushManager` API

Ensure your target browsers support these APIs. Most modern browsers (e.g., Chrome, Firefox, Edge) are compatible.

## Debugging

When `debug: true` is set in the configuration, the SDK will output logs to the console to help troubleshoot issues. Example log:

```
pushify-ir SDK initialized
```

## Example Project Structure

```
your-project/
├── public/
│   └── pushify-ir-sw.js
├── src/
│   └── index.js
├── package.json
```

1. Copy `pushify-ir-sw.js` to the `public/` folder.
2. Ensure the service worker is accessible at `https://your-domain.com/pushify-ir-sw.js`.
3. Initialize the SDK in your `index.js` as shown above.

## Notes

- The `pushify-ir-sw.js` file must be served from the root of your domain (e.g., `example.com/pushify-ir-sw.js`) for the service worker to function correctly.
- Ensure your `apiUrl` is correct and accessible, as it is used for registering users and handling notifications.
- If the browser does not support the required APIs (`ServiceWorker` or `PushManager`), the `isSupported` property will be `false`, and the SDK will not initialize.

## License

This project is licensed under the MIT License.
