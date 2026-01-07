# @ankurah/react-hooks

Official React bindings for [Ankurah](https://ankurah.org) — the distributed state synchronization framework.

This package provides fine-grained reactivity for React applications using Ankurah's signal-based state management. Components automatically re-render when the specific signals they access change, with zero manual subscription management.

**Works with both React Native (UniFFI) and React Web (WASM).**

## Installation

```bash
npm install @ankurah/react-hooks
```

## Quick Start

```typescript
import React from 'react';
import { createAnkurahReactHooks } from '@ankurah/react-hooks';
import { ReactObserver } from './generated/ankurah_signals';

// Create hooks bound to your bindings
const { signalObserver } = createAnkurahReactHooks({ React, ReactObserver });

// Components automatically re-render when signals change
const MessageCount = signalObserver(() => {
  const count = messageQuery.length(); // Automatically tracked
  return <span>{count} messages</span>;
});

const MessageList = signalObserver(() => {
  const messages = messageQuery.items(); // Live query results
  return (
    <ul>
      {messages.map(msg => (
        <li key={msg.id()}>{msg.content()}</li>
      ))}
    </ul>
  );
});
```

## Why Ankurah?

Ankurah provides real-time data synchronization across distributed systems with built-in observability. Key features:

- **Live Queries** — Subscribe to filtered data that updates automatically
- **Fine-grained Reactivity** — Only re-render what actually changed
- **Schema-first Design** — Rust macros generate type-safe bindings
- **Multi-platform** — Same patterns work on web, mobile, and server

Learn more at [ankurah.org](https://ankurah.org)

## API

### `createAnkurahReactHooks(bindings)`

Factory function that creates React hooks bound to your Ankurah bindings.

```typescript
const { useObserve, signalObserver } = createAnkurahReactHooks({
  React,           // Your React instance
  ReactObserver,   // From generated Ankurah bindings
});
```

**Why pass React?** This avoids module resolution issues in monorepos and ensures the hooks use the same React instance as your app — critical for hooks to work correctly.

### `signalObserver<P>(Component)`

Higher-order component that enables automatic signal tracking.

```typescript
const MyComponent = signalObserver((props) => {
  // Any signal.get() calls here are automatically tracked
  const value = someSignal.get();
  return <div>{value}</div>;
});
```

When any accessed signal changes, the component re-renders. No manual subscriptions, no cleanup, no stale data.

### `useObserve()`

Low-level hook for manual tracking control. Most users should prefer `signalObserver`.

```typescript
function MyComponent() {
  const observer = useObserve();
  observer.beginTracking();
  try {
    const value = someSignal.get();
    return <div>{value}</div>;
  } finally {
    observer.finish();
  }
}
```

## Platform Support

This package works with both Ankurah binding types:

| Platform | Bindings | Generated From |
|----------|----------|----------------|
| React Web | WASM | `ankurah-wasm` crate |
| React Native | UniFFI | `uniffi-bindgen-react-native` |

The factory pattern allows the same hook implementations to work with either binding type.

## License

MIT
