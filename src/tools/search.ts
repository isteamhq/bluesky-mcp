import { z } from "zod";
import type { BlueskyClient } from "../client.js";

export const searchPostsSchema = z.object({
  query: z.string().describe("Search query — keywords, hashtags, or phrases"),
  limit: z.number().min(1).max(100).default(25).describe("Number of results"),
});

export async function searchPosts(
  client: BlueskyClient,
  args: z.infer<typeof searchPostsSchema>,
): Promise<string> {
  const posts = await client.searchPosts(args.query, args.limit);
  if (posts.length === 0) return "No posts found.";

  const lines: string[] = [];
  for (const p of posts) {
    const handle = p.author.handle;
    const name = p.author.displayName ?? handle;
    lines.push(`[${p.uri}]`);
    lines.push(`@${handle} (${name})`);
    lines.push(`CID: ${p.cid}`);
    lines.push(p.record.text);
    lines.push(`  ❤️ ${p.likeCount}  🔁 ${p.repostCount}  💬 ${p.replyCount}  📅 ${p.indexedAt}`);
    lines.push("");
  }
  return lines.join("\n");
}

export const searchUsersSchema = z.object({
  query: z.string().describe("Search query for users"),
  limit: z.number().min(1).max(50).default(10).describe("Number of results"),
});

export async function searchUsers(
  client: BlueskyClient,
  args: z.infer<typeof searchUsersSchema>,
): Promise<string> {
  const users = await client.searchUsers(args.query, args.limit);
  if (users.length === 0) return "No users found.";

  const lines: string[] = [];
  for (const u of users) {
    lines.push(`@${u.handle} (${u.displayName ?? "—"})`);
    lines.push(`  ${u.description?.slice(0, 120) ?? ""}`);
    lines.push(`  Followers: ${u.followersCount}  Following: ${u.followsCount}  Posts: ${u.postsCount}`);
    lines.push(`  DID: ${u.did}`);
    lines.push("");
  }
  return lines.join("\n");
}

export const getUserFeedSchema = z.object({
  handle: z.string().describe("Bluesky handle (e.g. alice.bsky.social)"),
  limit: z.number().min(1).max(50).default(10).describe("Number of posts"),
});

export async function getUserFeed(
  client: BlueskyClient,
  args: z.infer<typeof getUserFeedSchema>,
): Promise<string> {
  const feed = await client.getAuthorFeed(args.handle, args.limit);
  if (feed.length === 0) return "No posts found.";

  const lines: string[] = [];
  for (const item of feed) {
    const p = item.post;
    lines.push(`[${p.uri}] CID: ${p.cid}`);
    lines.push(p.record.text);
    lines.push(`  ❤️ ${p.likeCount}  🔁 ${p.repostCount}  💬 ${p.replyCount}  📅 ${p.indexedAt}`);
    lines.push("");
  }
  return lines.join("\n");
}

export const getTimelineSchema = z.object({
  limit: z.number().min(1).max(50).default(20).describe("Number of posts"),
});

export async function getTimeline(
  client: BlueskyClient,
  args: z.infer<typeof getTimelineSchema>,
): Promise<string> {
  const feed = await client.getTimeline(args.limit);
  if (feed.length === 0) return "Timeline is empty.";

  const lines: string[] = [];
  for (const item of feed) {
    const p = item.post;
    lines.push(`[${p.uri}] @${p.author.handle} CID: ${p.cid}`);
    lines.push(p.record.text);
    lines.push(`  ❤️ ${p.likeCount}  🔁 ${p.repostCount}  💬 ${p.replyCount}`);
    lines.push("");
  }
  return lines.join("\n");
}
