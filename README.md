# @ankurah/react-hooks

React hooks for Ankurah signal reactivity. Works with both React Native (UniFFI bindings) and React Web (WASM bindings).

## Installation

```bash
npm install @ankurah/react-hooks
```

## Usage

This package exports a factory function that creates hooks bound to your specific Ankurah bindings:

```typescript
import { createAnkurahReactHooks } from '@ankurah/react-hooks';
import { ReactObserver } from './generated/ankurah_signals'; // Your generated bindings

const { useObserve, signalObserver } = createAnkurahReactHooks({ ReactObserver });

// Use signalObserver HOC to automatically track signal access
const MyComponent = signalObserver(({ name }) => {
  const count = countSignal.get(); // Automatically tracked
  return <div>{name}: {count}</div>;
});

// Or use useObserve directly for more control
function MyManualComponent() {
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

## Why a factory function?

The hooks need to close over the `ReactObserver` class from your bindings. Since WASM and UniFFI generate different binding code, this factory pattern allows the same hook implementations to work with either:

- **React Web (WASM)**: `ReactObserver` from `ankurah-wasm-bindings`
- **React Native (UniFFI)**: `ReactObserver` from generated UniFFI TypeScript

## API

### `createAnkurahReactHooks(bindings)`

Creates the hooks bound to your bindings.

**Parameters:**
- `bindings.ReactObserver` - The ReactObserver class from your generated bindings

**Returns:**
- `useObserve()` - Hook that returns a ReactObserver instance wired up to React's useSyncExternalStore
- `signalObserver(fc)` - HOC that wraps a component to automatically track signal access

### `signalObserver<P>(fc: React.FC<P>): React.FC<P>`

Higher-order component that wraps a function component to track signal access.

Any signals accessed during render (via `.get()`) are automatically subscribed to. When those signals change, the component re-renders.

### `useObserve(): ReactObserver`

Low-level hook that returns a ReactObserver. Use this if you need manual control over tracking.

Call `observer.beginTracking()` before accessing signals and `observer.finish()` afterwards (in a finally block).

## License

MIT
