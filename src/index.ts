/**
 * @ankurah/react-hooks
 *
 * React hooks for Ankurah signal reactivity.
 * Works with both React Native (UniFFI bindings) and React Web (WASM bindings).
 *
 * Usage:
 * ```typescript
 * import { createAnkurahReactHooks } from '@ankurah/react-hooks';
 * import { ReactObserver } from './generated/ankurah_signals';
 *
 * const { useObserve, signalObserver } = createAnkurahReactHooks({ ReactObserver });
 *
 * const MyComponent = signalObserver(() => {
 *   // Signals accessed here are automatically tracked
 *   return <div>{someSignal.get()}</div>;
 * });
 * ```
 */

import { useRef, useCallback, useSyncExternalStore } from 'react';

/**
 * Interface for the ReactObserver class from Ankurah bindings.
 * Both WASM and UniFFI bindings implement this interface.
 */
export interface ReactObserverInterface {
  /** Begin tracking signal accesses for this render */
  beginTracking(): void;
  /** Finish tracking and clean up unused subscriptions */
  finish(): void;
  /** Subscribe to store changes (for useSyncExternalStore) */
  subscribe(callback: StoreChangeCallbackInterface): void;
  /** Unsubscribe from store changes */
  unsubscribe(): void;
  /** Get the current snapshot version (for useSyncExternalStore) */
  getSnapshot(): bigint;
  /** Get the number of signals currently being observed */
  signalCount(): number;
}

/**
 * Interface for the store change callback.
 * This is passed to subscribe() and called when signals change.
 */
export interface StoreChangeCallbackInterface {
  onChange(): void;
}

/**
 * Constructor type for ReactObserver
 */
export interface ReactObserverConstructor {
  new (): ReactObserverInterface;
}

/**
 * Bindings required to create the hooks.
 * Pass the ReactObserver class from your generated bindings.
 */
export interface AnkurahBindings {
  ReactObserver: ReactObserverConstructor;
}

/**
 * Creates Ankurah React hooks bound to your specific bindings.
 *
 * This factory pattern allows the same hook implementations to work with
 * both WASM (React web) and UniFFI (React Native) bindings.
 *
 * @param bindings - Object containing the ReactObserver class from your bindings
 * @returns Object containing useObserve hook and signalObserver HOC
 */
export function createAnkurahReactHooks(bindings: AnkurahBindings) {
  const { ReactObserver } = bindings;

  /**
   * Hook that enables automatic re-rendering when observed signals change.
   *
   * @returns An observer object with beginTracking() and finish() methods
   *
   * @example
   * ```tsx
   * function MyComponent() {
   *   const observer = useObserve();
   *   observer.beginTracking();
   *   try {
   *     const value = someSignal.get(); // Automatically tracked
   *     return <div>{value}</div>;
   *   } finally {
   *     observer.finish();
   *   }
   * }
   * ```
   */
  function useObserve(): ReactObserverInterface {
    // Create observer once per component instance
    const observerRef = useRef<ReactObserverInterface | null>(null);
    if (!observerRef.current) {
      observerRef.current = new ReactObserver();
    }
    const observer = observerRef.current;

    // Subscribe function for useSyncExternalStore
    const subscribe = useCallback(
      (onStoreChange: () => void) => {
        // Create callback that implements StoreChangeCallback interface
        const callback: StoreChangeCallbackInterface = {
          onChange: onStoreChange,
        };
        observer.subscribe(callback);

        // Return cleanup function
        return () => {
          observer.unsubscribe();
        };
      },
      [observer]
    );

    // Snapshot function for useSyncExternalStore
    const getSnapshot = useCallback(() => {
      return observer.getSnapshot();
    }, [observer]);

    // This hooks into React's concurrent rendering
    useSyncExternalStore(subscribe, getSnapshot);

    return observer;
  }

  /**
   * HOC that wraps a component to track signal access for reactive updates.
   *
   * IMPORTANT: This calls the component function directly (fc(props)) rather than
   * using React.createElement(). This ensures signals are accessed while the
   * observer is still on the stack, not deferred until React renders the element.
   *
   * @param fc - The function component to wrap
   * @returns A wrapped component that automatically re-renders when signals change
   *
   * @example
   * ```tsx
   * const MyComponent = signalObserver(({ name }) => {
   *   const count = countSignal.get(); // Automatically tracked
   *   return <div>{name}: {count}</div>;
   * });
   * ```
   */
  function signalObserver<P extends object>(
    fc: React.FC<P>
  ): React.FC<P> {
    return function SignalObserverWrapper(props: P) {
      const observer = useObserve();
      observer.beginTracking();
      try {
        // Direct function call - executes component body immediately
        // so signals are accessed while observer is on the stack
        return fc(props);
      } finally {
        observer.finish();
      }
    };
  }

  return {
    useObserve,
    signalObserver,
  };
}

// Re-export types for convenience
export type { ReactObserverInterface as ReactObserver };
