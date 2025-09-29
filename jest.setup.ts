// Jest setup file
import '@testing-library/jest-dom';

// Mock globals for Next.js API routes
global.Request = class MockRequest {
  constructor(url, init) {
    this._url = url;
    this.method = init?.method || 'GET';
    this.body = init?.body;
    this._json = null;
  }

  get url() {
    return this._url;
  }

  async json() {
    if (this._json) return this._json;
    if (this.body) {
      this._json = JSON.parse(this.body);
      return this._json;
    }
    return {};
  }
};

global.Response = class MockResponse {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
  }

  async json() {
    return JSON.parse(this.body);
  }
};

// Mock Headers
global.Headers = class MockHeaders {
  constructor(init) {
    this._headers = {};
    if (init) {
      if (init[Symbol.iterator]) {
        for (const [key, value] of init) {
          this._headers[key.toLowerCase()] = value;
        }
      } else {
        for (const [key, value] of Object.entries(init)) {
          this._headers[key.toLowerCase()] = value;
        }
      }
    }
  }

  get(name) {
    return this._headers[name.toLowerCase()] || null;
  }

  set(name, value) {
    this._headers[name.toLowerCase()] = value;
  }

  has(name) {
    return name.toLowerCase() in this._headers;
  }
};

// Mock NextResponse with constructor support
global.NextResponse = class MockNextResponse {
  constructor(body, init) {
    this._body = body;
    this.status = init?.status || 200;
    this.headers = new global.Headers(init?.headers);
  }

  async text() {
    return this._body;
  }

  async json() {
    return JSON.parse(this._body);
  }

  static json(data, init) {
    return {
      json: async () => data,
      status: init?.status || 200,
      headers: new global.Headers(init?.headers),
    };
  }
};

// Set required environment variables for tests
process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-secret-for-jest';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';
process.env.RESEND_API_KEY = 'test-resend-api-key';
process.env.FROM_EMAIL = 'test@formflow.ca';