import {EventEmitter} from 'events';

interface CacheEntry<V> {
    value: V;
    timestamp: number;
    ttl?: number;
}

interface StorageFallback<K, V> {
    get(key: K) : Promise<V  | undefined | null>;
}



class LRUCache<K, V> extends EventEmitter{
    private capacity: number;
    private globalTtl?: number;
    private cache: Map<K, CacheEntry<V>>;
    private storageFallback?: StorageFallback<K, V>;


    constructor(capacity:number, globalTtl: number | null = null, storageFallback?: StorageFallback<K, V>)
    {
        super();
        if(capacity <= 0) {
            throw new Error("Capacity must be greater than 0")
        }
        this.capacity = capacity;
        this.globalTtl = globalTtl ? globalTtl : undefined;
        this.cache = new Map();
        this.storageFallback = storageFallback;
    }

    private isExpired(entry: CacheEntry<V>): boolean {
        const ttl = entry.ttl !== undefined ? entry.ttl : this.globalTtl;
        if(!ttl) return false;
        return (Date.now() - entry.timestamp) > ttl;
    }

    private evictIfNeeded(): void {
        if(this.cache.size >= this.capacity) {
            const oldestKey = this.cache.keys().next().value;
            const oldestEntry = this.cache.get(oldestKey);
            if(oldestEntry && this.isExpired(oldestEntry)) {
                this.cache.delete(oldestKey);
            } else {
                this.cache.delete(oldestKey);
            }
            this.emit('evict', oldestKey);
        }
    }

    public set(key: K, value: V, ttl?: number): void {
        if(this.cache.has(key)) {
            this.cache.delete(key);
        } else { this.evictIfNeeded(); }

        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            ttl,
        })

        this.emit('set', key, value);
    }

    public get(key: K): V | null {
        const entry = this.cache.get(key);
        if(!entry) return null;

        if(this.isExpired(entry)) {
            this.cache.delete(key);
            this.emit('expire', key);
            return null;
        }

        this.cache.delete(key);
        this.cache.set(key, entry);

        return entry.value;
    }
    public async getAsync(key: K): Promise<V | null> {
        const value = this.get(key);
        if(value !== null) {    
            return value;
        }

        if(this.storageFallback && typeof this.storageFallback.get === 'function') {
            const fallbackValue = await this.storageFallback.get(key);
            if(fallbackValue !== undefined && fallbackValue !== null) {
                this.set(key, fallbackValue);
                return fallbackValue;
            }
        }
        return null;
    }

    public has(key: K): boolean {
        const entry = this.cache.get(key);
        if(!entry) return false;
        if(this.isExpired(entry)) {
            this.cache.delete(key);
            this.emit('expire', key);
            return false;
        }
        return true;
    }

    public delete(key: K): boolean {
        const deleted = this.cache.delete(key);
        if(deleted) {
            this.emit('delete', key);
        }
        return deleted;
    }   

    public clear(): void {
        this.cache.clear();
        this.emit('clear');
    }

    public size(): number {
        return this.cache.size;
    }

    public keys(): K[] {
        return Array.from(this.cache.keys());
    }
}

export default LRUCache;

