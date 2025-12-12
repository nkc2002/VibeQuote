/**
 * Mock Unsplash API
 *
 * Provides mock responses for Unsplash API calls.
 */

export const mockUnsplashPhoto = {
  id: "test-photo-id-123",
  width: 1920,
  height: 1080,
  urls: {
    full: "https://images.unsplash.com/photo-test-full",
    regular: "https://images.unsplash.com/photo-test-regular",
    small: "https://images.unsplash.com/photo-test-small",
    thumb: "https://images.unsplash.com/photo-test-thumb",
  },
  user: {
    name: "Test Photographer",
    username: "testphotographer",
    links: {
      html: "https://unsplash.com/@testphotographer",
    },
  },
  links: {
    download_location: "https://api.unsplash.com/photos/test/download",
  },
};

export const mockSearchResults = {
  total: 100,
  total_pages: 10,
  results: [
    mockUnsplashPhoto,
    { ...mockUnsplashPhoto, id: "test-photo-2" },
    { ...mockUnsplashPhoto, id: "test-photo-3" },
  ],
};

export const mockRandomPhoto = mockUnsplashPhoto;

// Mock fetch for Unsplash API
export const setupUnsplashMock = () => {
  const originalFetch = global.fetch;

  global.fetch = jest.fn((url: string) => {
    const urlStr = url.toString();

    // Search endpoint
    if (urlStr.includes("api.unsplash.com/search/photos")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSearchResults),
      } as Response);
    }

    // Random endpoint
    if (urlStr.includes("api.unsplash.com/photos/random")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockRandomPhoto),
      } as Response);
    }

    // Get photo by ID
    if (urlStr.includes("api.unsplash.com/photos/")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUnsplashPhoto),
      } as Response);
    }

    // Download tracking
    if (urlStr.includes("/download")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({ url: "https://download-url.com/image.jpg" }),
      } as Response);
    }

    // Image download (return a buffer for actual image)
    if (urlStr.includes("images.unsplash.com")) {
      return Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
        buffer: () => Promise.resolve(Buffer.alloc(1024)),
      } as unknown as Response);
    }

    // Default: call original fetch
    return originalFetch(url);
  }) as jest.Mock;

  return () => {
    global.fetch = originalFetch;
  };
};

// Mock node-fetch for server-side
export const mockNodeFetch = jest.fn();
