# POS - Point of Sale

An offline tablet point-of-sale app built for a local printing service. Cashiers manage products, record sales and expenses, and review revenue and profit using data stored on the device.

## Features

- Product, category, and subcategory management with touch-friendly item tiles.
- Cart, item quantities and unit prices, checkout, and change calculation.
- Configurable payment methods with optional reference numbers.
- Transaction history and item-level details.
- Date-filtered revenue, order counts, daily sales, top items, and payment breakdowns.
- Expense records, daily subtotals, and net profit calculations.
- PIN-protected dashboard and JSON backup/restore through native file sharing.

Built with Expo SDK 54, React Native, TypeScript, Expo Router, React Native Paper, Expo SQLite, and Zustand. No backend server or account is required for sales data.

## Download and demo

Check [GitHub Releases](https://github.com/echo-riga/Point-of-Sales/releases) for published Android builds. The repository does not guarantee that a release is available.

[Watch the demo](https://github.com/user-attachments/assets/2019c76f-022d-437f-b2a4-aa6bfca68b89).

The interface targets Android tablets in portrait and landscape. Phone layouts and iOS distribution are not supported by the documented release workflow.

## Run locally

Use Node.js 22 LTS, npm, and an Android tablet or tablet emulator.

```sh
npm ci
npm start
```

Connect a compatible Expo client or use a native Android development build:

```sh
npm run android
```

Native Android builds require the Android SDK and a configured emulator or connected device. No environment variables are required for the local database.

## Build an APK

With EAS CLI installed and authenticated to your own Expo project:

```sh
eas build --platform android --profile preview
```

The preview profile in [eas.json](eas.json) produces an APK. Review the Expo project association and application identifiers in [app.json](app.json) before building under another account.

## Source layout

| Path | Purpose |
| --- | --- |
| [app](app) | Ordering, checkout, products, dashboard, transactions, and expenses |
| [services](services) | SQLite initialization and product, payment, transaction, and expense queries |
| [context](context) | Shared application state |
| [components](components) | Reusable interface components |

## Data and verification

Data stays on the device; there is no cloud synchronization. Export a backup before clearing data or uninstalling. Restoring a backup replaces current records.

Run npm run lint for static checks. There is no automated test script. Verify checkout, transaction totals, expense filters, and backup/restore on a tablet using disposable data.
