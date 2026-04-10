import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { BlueskyClient } from "./client.js";

import {
  searchPostsSchema, searchPosts,
  searchUsersSchema, searchUsers,
  getUserFeedSchema, getUserFeed,
  getTimelineSchema, getTimeline,
} from "./tools/search.js";

import {
  createPostSchema, createPost,
  replyPostSchema, replyPost,
  deletePostSchema, deletePost,
  likePostSchema, likePost,
  repostSchema, repostPost,
  followUserSchema, followUser,
} from "./tools/engage.js";

import {
  getProfileSchema, getProfile,
  getPostSchema, getPost,
  getThreadSchema, getThread,
  getNotificationsSchema, getNotifications,
  updateProfileSchema, updateProfile,
} from "./tools/info.js";

const server = new McpServer({ name: "bluesky", version: "1.0.0" });

let client: BlueskyClient;
function ensureClient(): BlueskyClient {
  if (!client) client = new BlueskyClient();
  return client;
}

// ─── Search ──────────────────────────────────────────────────────

server.tool(
  "search_posts",
  "Search Bluesky posts by keywords, hashtags, or phrases",
  searchPostsSchema.shape,
  async (args) => ({
    content: [{ type: "text", text: await searchPosts(ensureClient(), searchPostsSchema.parse(args)) }],
  }),
);

server.tool(
  "search_users",
  "Search Bluesky users by name or handle",
  searchUsersSchema.shape,
  async (args) => ({
    content: [{ type: "text", text: await searchUsers(ensureClient(), searchUsersSchema.parse(args)) }],
  }),
);

server.tool(
  "get_user_feed",
  "Get recent posts from a specific user",
  getUserFeedSchema.shape,
  async (args) => ({
    content: [{ type: "text", text: await getUserFeed(ensureClient(), getUserFeedSchema.parse(args)) }],
  }),
);

server.tool(
  "get_timeline",
  "Get your home timeline",
  getTimelineSchema.shape,
  async (args) => ({
    content: [{ type: "text", text: await getTimeline(ensureClient(), getTimelineSchema.parse(args)) }],
  }),
);

// ─── Engage ──────────────────────────────────────────────────────

server.tool(
  "create_post",
  "Create a new Bluesky post (max 300 chars). URLs and @mentions auto-linked.",
  createPostSchema.shape,
  async (args) => ({
    content: [{ type: "text", text: await createPost(ensureClient(), createPostSchema.parse(args)) }],
  }),
);

server.tool(
  "reply_post",
  "Reply to a Bluesky post. Requires parent URI + CID (get from search or get_post).",
  replyPostSchema.shape,
  async (args) => ({
    content: [{ type: "text", text: await replyPost(ensureClient(), replyPostSchema.parse(args)) }],
  }),
);

server.tool(
  "delete_post",
  "Delete a Bluesky post by AT URI",
  deletePostSchema.shape,
  async (args) => ({
    content: [{ type: "text", text: await deletePost(ensureClient(), deletePostSchema.parse(args)) }],
  }),
);

server.tool(
  "like_post",
  "Like a Bluesky post (requires URI + CID)",
  likePostSchema.shape,
  async (args) => ({
    content: [{ type: "text", text: await likePost(ensureClient(), likePostSchema.parse(args)) }],
  }),
);

server.tool(
  "repost",
  "Repost a Bluesky post (requires URI + CID)",
  repostSchema.shape,
  async (args) => ({
    content: [{ type: "text", text: await repostPost(ensureClient(), repostSchema.parse(args)) }],
  }),
);

server.tool(
  "follow_user",
  "Follow a Bluesky user by handle",
  followUserSchema.shape,
  async (args) => ({
    content: [{ type: "text", text: await followUser(ensureClient(), followUserSchema.parse(args)) }],
  }),
);

// ─── Info ────────────────────────────────────────────────────────

server.tool(
  "get_profile",
  "Get a Bluesky user profile (omit handle for own profile)",
  getProfileSchema.shape,
  async (args) => ({
    content: [{ type: "text", text: await getProfile(ensureClient(), getProfileSchema.parse(args)) }],
  }),
);

server.tool(
  "get_post",
  "Get a specific Bluesky post by AT URI",
  getPostSchema.shape,
  async (args) => ({
    content: [{ type: "text", text: await getPost(ensureClient(), getPostSchema.parse(args)) }],
  }),
);

server.tool(
  "get_thread",
  "Get a post thread with replies",
  getThreadSchema.shape,
  async (args) => ({
    content: [{ type: "text", text: await getThread(ensureClient(), getThreadSchema.parse(args)) }],
  }),
);

server.tool(
  "get_notifications",
  "Get recent notifications (likes, replies, follows, mentions)",
  getNotificationsSchema.shape,
  async (args) => ({
    content: [{ type: "text", text: await getNotifications(ensureClient(), getNotificationsSchema.parse(args)) }],
  }),
);

server.tool(
  "update_profile",
  "Update your Bluesky display name and/or bio",
  updateProfileSchema.shape,
  async (args) => ({
    content: [{ type: "text", text: await updateProfile(ensureClient(), updateProfileSchema.parse(args)) }],
  }),
);

// ─── Start ───────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[bluesky-mcp] Server started");
}

main().catch((err) => {
  console.error("[bluesky-mcp] Fatal:", err);
  process.exit(1);
});
