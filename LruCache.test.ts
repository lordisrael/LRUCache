import LRUCache from "./LruCache";

describe("LRUCache", () => {
    let cache: LRUCache<string, number>;

    beforeEach(() => {
        cache = new LRUCache<string, number>(2)  
    });

    test("should return null for non-existent keys", () => {
        expect(cache.get('x')).toBeNull
    });

    test("basic set and get operations", () => {
        cache.set('a', 1);
        expect(cache.get('a')).toBe(1);
    });

    test("eviction policy", () => {
        cache.set('a', 1);
        cache.set('b', 2);
        cache.get('a'); // Access 'a' to make it recently used
        cache.set('c', 3); // 'a' should be evicted
        expect(cache.get('b')).toBeNull();
        expect(cache.get('a')).toBe(1);
        expect(cache.get('c')).toBe(3);
    });

    test("global TTL expires keys", (done) => {
        cache = new LRUCache<string, number>(2, 50);
        cache.set('a', 1);
        setTimeout(() => {
            expect(cache.get('a')).toBeNull();
            done();
        }, 100);
    });

    test("per entey ttl overrides global ttl", () => {
        cache = new LRUCache<string, number>(2, 100);
        cache.set('a', 1, 50); // Set 'a' with a TTL of 50ms
        setTimeout(() => {
            expect(cache.get('a')).toBeNull(); // 'a' should be expired
            cache.set('b', 2); // 'b' should not be expired
            expect(cache.get('b')).toBe(2);
        }, 60);
    });

    test("getAsync uses storage fallback", async () => {
        const fallback = {
            async get(key: string): Promise<number | null> {
                if (key === 'missing') return 500;
                return null;
            }
        };
        cache = new LRUCache<string, number>(2, null, fallback);
        const value = await cache.getAsync('missing');
        expect(value).toBe(500);
        expect(cache.get('missing')).toBe(500);
    });

    test("event emissions", () => {
        const events: string[] = [];

        cache.on('set', (key) => events.push(`set:${key}`));
        cache.on('evict', (key) => events.push(`evict:${key}`));
        cache.on('delete', (key) => events.push(`delete:${key}`));
        cache.set('a', 1);  
        cache.set('b', 2);
        cache.delete('b');

        expect(events).toEqual([
            'set:a',
            'set:b',
            'delete:b'
        ]);
    });

});