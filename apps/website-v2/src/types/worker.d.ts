/** [Ver001.000]
 * Type declarations for worker and service worker environments
 */

// Service Worker types
declare interface ExtendableEvent extends Event {
  waitUntil(promise: Promise<unknown>): void;
}

declare interface FetchEvent extends ExtendableEvent {
  readonly request: Request;
  readonly clientId: string;
  respondWith(response: Response | Promise<Response>): void;
}

declare interface ExtendableMessageEvent extends ExtendableEvent {
  readonly data: unknown;
  readonly ports: ReadonlyArray<MessagePort>;
}

// Extend ServiceWorkerGlobalScope
declare const self: ServiceWorkerGlobalScope & {
  skipWaiting(): Promise<void>;
  clients: Clients;
};

// Worker global scope
declare interface WorkerGlobalScope {
  importScripts(...urls: string[]): void;
}
