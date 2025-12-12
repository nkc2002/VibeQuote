/**
 * Unit Tests for LRU Cache
 */

import LRUCache from "../utils/lru-cache";

describe("LRUCache", () => {
  it("should store and retrieve values", () => {
    const cache = new LRUCache<string>(10, 5);

    cache.set("key1", "value1");
    expect(cache.get("key1")).toBe("value1");
  });

  it("should return null for non-existent keys", () => {
    const cache = new LRUCache<string>(10, 5);

    expect(cache.get("nonexistent")).toBeNull();
  });

  it("should evict oldest entry when at capacity", () => {
    const cache = new LRUCache<string>(3, 5);

    cache.set("key1", "value1");
    cache.set("key2", "value2");
    cache.set("key3", "value3");
    cache.set("key4", "value4"); // Should evict key1

    expect(cache.get("key1")).toBeNull();
    expect(cache.get("key2")).toBe("value2");
    expect(cache.get("key4")).toBe("value4");
  });

  it("should update LRU order on get", () => {
    const cache = new LRUCache<string>(3, 5);

    cache.set("key1", "value1");
    cache.set("key2", "value2");
    cache.set("key3", "value3");

    // Access key1 to make it most recently used
    cache.get("key1");

    // Add new entry - should evict key2 (now oldest)
    cache.set("key4", "value4");

    expect(cache.get("key1")).toBe("value1");
    expect(cache.get("key2")).toBeNull();
  });

  it("should expire entries after TTL", () => {
    // Create cache with 0.001 minute (60ms) TTL for testing
    const cache = new LRUCache<string>(10, 0.001);

    cache.set("key1", "value1");

    // Wait for expiry
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(cache.get("key1")).toBeNull();
        resolve();
      }, 100);
    });
  });

  it("should report correct size", () => {
    const cache = new LRUCache<string>(10, 5);

    expect(cache.size()).toBe(0);

    cache.set("key1", "value1");
    expect(cache.size()).toBe(1);

    cache.set("key2", "value2");
    expect(cache.size()).toBe(2);
  });

  it("should clear all entries", () => {
    const cache = new LRUCache<string>(10, 5);

    cache.set("key1", "value1");
    cache.set("key2", "value2");

    cache.clear();

    expect(cache.size()).toBe(0);
    expect(cache.get("key1")).toBeNull();
  });

  it("should update existing key without changing size", () => {
    const cache = new LRUCache<string>(10, 5);

    cache.set("key1", "value1");
    cache.set("key1", "updated");

    expect(cache.size()).toBe(1);
    expect(cache.get("key1")).toBe("updated");
  });

  it("should correctly check if key exists", () => {
    const cache = new LRUCache<string>(10, 5);

    cache.set("key1", "value1");

    expect(cache.has("key1")).toBe(true);
    expect(cache.has("key2")).toBe(false);
  });
});
