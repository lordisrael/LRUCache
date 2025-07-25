# LRUCache

A TypeScript implementation of an **LRU (Least Recently Used) Cache** with optional per-entry and global TTL (Time-To-Live), event emission, and support for storage fallback.

## Features

- **LRU Eviction Policy:** Automatically removes the least recently used items when the cache exceeds its capacity.
- **Global TTL:** Optionally expire all entries after a set time.
- **Per-entry TTL:** Optionally set a custom TTL for each entry.
- **EventEmitter:** Emits events for `set`, `evict`, `expire`, and `delete` actions.
- **Storage Fallback:** Optionally fetch missing keys from an external storage source.
- **TypeScript Generics:** Supports any key and value types.

## Usage

```typescript
import LRUCache from './LruCache';

const cache = new LRUCache<string, number>(2, 1000); // capacity 2, global TTL 1000ms

cache.set('a', 1);
cache.set('b', 2);

console.log(cache.get('a')); // 1

cache.set('c', 3); // 'b' is evicted (least recently used)
console.log(cache.get('b')); // null

// Per-entry TTL
cache.set('d', 4, 500); // 'd' will expire in 500ms

// Listen to events
cache.on('evict', (key) => {
  console.log(`Evicted: ${key}`);
});
```

## Events

- **set**: Emitted when a key is set.  
  `cache.on('set', (key, value) => { ... })`
- **evict**: Emitted when a key is evicted due to capacity.  
  `cache.on('evict', (key) => { ... })`
- **expire**: Emitted when a key expires due to TTL.  
  `cache.on('expire', (key) => { ... })`
- **delete**: Emitted when a key is deleted manually.  
  `cache.on('delete', (key) => { ... })`

## API

- `set(key, value, ttl?)`: Add or update a value, with optional TTL (ms).
- `get(key)`: Get a value or `null` if not found or expired.
- `getAsync(key)`: Async get, uses storage fallback if configured.
- `has(key)`: Check if a key exists and is not expired.
- `delete(key)`: Remove a key.
- `clear()`: Clear the cache.
- `size()`: Number of items in the cache.
- `keys()`: Array of keys in LRU order.

## Testing

Run tests with:

```
npm test
```

## License

ISC
