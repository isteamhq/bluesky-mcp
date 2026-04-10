const XRPC = "https://bsky.social/xrpc";

interface Session {
  accessJwt: string;
  did: string;
  handle: string;
}

interface PostRecord {
  uri: string;
  cid: string;
}

interface PostView {
  uri: string;
  cid: string;
  author: { did: string; handle: string; displayName?: string };
  record: { text: string; createdAt: string };
  replyCount: number;
  repostCount: number;
  likeCount: number;
  quoteCount: number;
  indexedAt: string;
}

interface ProfileView {
  did: string;
  handle: string;
  displayName?: string;
  description?: string;
  followersCount: number;
  followsCount: number;
  postsCount: number;
}

interface FeedItem {
  post: PostView;
  reply?: { parent: PostView; root: PostView };
  reason?: unknown;
}

export class BlueskyClient {
  private identifier: string;
  private password: string;
  private session: Session | null = null;

  constructor() {
    const id = process.env.BLUESKY_IDENTIFIER;
    const pw = process.env.BLUESKY_APP_PASSWORD;
    if (!id || !pw) {
      throw new Error("Missing BLUESKY_IDENTIFIER or BLUESKY_APP_PASSWORD");
    }
    this.identifier = id;
    this.password = pw;
  }

  private async ensureSession(): Promise<Session> {
    if (this.session) return this.session;
    return this.createSession();
  }

  private async createSession(): Promise<Session> {
    const res = await fetch(`${XRPC}/com.atproto.server.createSession`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: this.identifier, password: this.password }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Bluesky login failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as { accessJwt: string; did: string; handle: string };
    this.session = { accessJwt: data.accessJwt, did: data.did, handle: data.handle };
    return this.session;
  }

  /** Re-authenticate if a request fails with ExpiredToken */
  private async refreshSession(): Promise<Session> {
    this.session = null;
    return this.createSession();
  }

  private async get(nsid: string, params?: Record<string, string>, retried = false): Promise<unknown> {
    const session = await this.ensureSession();
    const url = new URL(`${XRPC}/${nsid}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    }

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${session.accessJwt}` },
    });

    if (!res.ok) {
      const body = await res.text();
      if (!retried && (res.status === 400 || res.status === 401) && body.includes("ExpiredToken")) {
        await this.refreshSession();
        return this.get(nsid, params, true);
      }
      throw new Error(`Bluesky API ${res.status}: ${body}`);
    }
    return res.json();
  }

  private async post(nsid: string, body: unknown, retried = false): Promise<unknown> {
    const session = await this.ensureSession();

    const res = await fetch(`${XRPC}/${nsid}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessJwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      if (!retried && (res.status === 400 || res.status === 401) && text.includes("ExpiredToken")) {
        await this.refreshSession();
        return this.post(nsid, body, true);
      }
      throw new Error(`Bluesky API ${res.status}: ${text}`);
    }
    return res.json();
  }

  // ─── Facets (clickable links + mentions) ───────────────────────

  private detectFacets(text: string): unknown[] {
    const encoder = new TextEncoder();
    const facets: unknown[] = [];

    // Links
    const urlRegex = /https?:\/\/[^\s)]+/g;
    let match;
    while ((match = urlRegex.exec(text)) !== null) {
      const start = encoder.encode(text.slice(0, match.index)).byteLength;
      const end = start + encoder.encode(match[0]).byteLength;
      facets.push({
        index: { byteStart: start, byteEnd: end },
        features: [{ $type: "app.bsky.richtext.facet#link", uri: match[0] }],
      });
    }

    // Mentions (@handle)
    const mentionRegex = /@([a-zA-Z0-9._-]+(?:\.[a-zA-Z0-9._-]+)*)/g;
    while ((match = mentionRegex.exec(text)) !== null) {
      const start = encoder.encode(text.slice(0, match.index)).byteLength;
      const end = start + encoder.encode(match[0]).byteLength;
      facets.push({
        index: { byteStart: start, byteEnd: end },
        features: [{ $type: "app.bsky.richtext.facet#mention", did: match[1] }],
      });
    }

    return facets;
  }

  // ─── Public API ────────────────────────────────────────────────

  async getProfile(actor?: string): Promise<ProfileView> {
    const session = await this.ensureSession();
    const data = (await this.get("app.bsky.actor.getProfile", {
      actor: actor ?? session.did,
    })) as ProfileView;
    return data;
  }

  async createPost(text: string): Promise<PostRecord> {
    const session = await this.ensureSession();
    const facets = this.detectFacets(text);

    const record: Record<string, unknown> = {
      $type: "app.bsky.feed.post",
      text,
      createdAt: new Date().toISOString(),
    };
    if (facets.length > 0) record.facets = facets;

    const data = (await this.post("com.atproto.repo.createRecord", {
      repo: session.did,
      collection: "app.bsky.feed.post",
      record,
    })) as PostRecord;
    return data;
  }

  async reply(text: string, parentUri: string, parentCid: string, rootUri?: string, rootCid?: string): Promise<PostRecord> {
    const session = await this.ensureSession();
    const facets = this.detectFacets(text);

    const record: Record<string, unknown> = {
      $type: "app.bsky.feed.post",
      text,
      createdAt: new Date().toISOString(),
      reply: {
        root: { uri: rootUri ?? parentUri, cid: rootCid ?? parentCid },
        parent: { uri: parentUri, cid: parentCid },
      },
    };
    if (facets.length > 0) record.facets = facets;

    const data = (await this.post("com.atproto.repo.createRecord", {
      repo: session.did,
      collection: "app.bsky.feed.post",
      record,
    })) as PostRecord;
    return data;
  }

  async deletePost(uri: string): Promise<void> {
    const session = await this.ensureSession();
    const rkey = uri.split("/").pop()!;
    await this.post("com.atproto.repo.deleteRecord", {
      repo: session.did,
      collection: "app.bsky.feed.post",
      rkey,
    });
  }

  async like(uri: string, cid: string): Promise<void> {
    const session = await this.ensureSession();
    await this.post("com.atproto.repo.createRecord", {
      repo: session.did,
      collection: "app.bsky.feed.like",
      record: {
        $type: "app.bsky.feed.like",
        subject: { uri, cid },
        createdAt: new Date().toISOString(),
      },
    });
  }

  async repost(uri: string, cid: string): Promise<void> {
    const session = await this.ensureSession();
    await this.post("com.atproto.repo.createRecord", {
      repo: session.did,
      collection: "app.bsky.feed.repost",
      record: {
        $type: "app.bsky.feed.repost",
        subject: { uri, cid },
        createdAt: new Date().toISOString(),
      },
    });
  }

  async follow(did: string): Promise<void> {
    const session = await this.ensureSession();
    await this.post("com.atproto.repo.createRecord", {
      repo: session.did,
      collection: "app.bsky.graph.follow",
      record: {
        $type: "app.bsky.graph.follow",
        subject: did,
        createdAt: new Date().toISOString(),
      },
    });
  }

  async searchPosts(query: string, limit = 25): Promise<PostView[]> {
    const data = (await this.get("app.bsky.feed.searchPosts", {
      q: query,
      limit: Math.min(limit, 100).toString(),
    })) as { posts: PostView[] };
    return data.posts ?? [];
  }

  async searchUsers(query: string, limit = 10): Promise<ProfileView[]> {
    const data = (await this.get("app.bsky.actor.searchActors", {
      q: query,
      limit: Math.min(limit, 50).toString(),
    })) as { actors: ProfileView[] };
    return data.actors ?? [];
  }

  async getPost(uri: string): Promise<PostView> {
    const data = (await this.get("app.bsky.feed.getPosts", {
      uris: uri,
    })) as { posts: PostView[] };
    if (!data.posts?.[0]) throw new Error("Post not found");
    return data.posts[0];
  }

  async getPostThread(uri: string): Promise<unknown> {
    return this.get("app.bsky.feed.getPostThread", { uri, depth: "5" });
  }

  async getTimeline(limit = 20): Promise<FeedItem[]> {
    const data = (await this.get("app.bsky.feed.getTimeline", {
      limit: limit.toString(),
    })) as { feed: FeedItem[] };
    return data.feed ?? [];
  }

  async getAuthorFeed(actor: string, limit = 20): Promise<FeedItem[]> {
    const data = (await this.get("app.bsky.feed.getAuthorFeed", {
      actor,
      limit: limit.toString(),
    })) as { feed: FeedItem[] };
    return data.feed ?? [];
  }

  async getNotifications(limit = 20): Promise<unknown> {
    return this.get("app.bsky.notification.listNotifications", {
      limit: limit.toString(),
    });
  }

  async resolveHandle(handle: string): Promise<string> {
    const data = (await this.get("com.atproto.identity.resolveHandle", {
      handle,
    })) as { did: string };
    return data.did;
  }

  async updateProfile(displayName?: string, description?: string): Promise<void> {
    const session = await this.ensureSession();

    // Get current profile record
    const existing = (await this.get("com.atproto.repo.getRecord", {
      repo: session.did,
      collection: "app.bsky.actor.profile",
      rkey: "self",
    })) as { value: Record<string, unknown>; cid: string };

    const updated = { ...existing.value };
    if (displayName !== undefined) updated.displayName = displayName;
    if (description !== undefined) updated.description = description;

    await this.post("com.atproto.repo.putRecord", {
      repo: session.did,
      collection: "app.bsky.actor.profile",
      rkey: "self",
      record: updated,
      swapRecord: existing.cid,
    });
  }
}
