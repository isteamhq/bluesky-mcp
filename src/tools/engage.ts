import { z } from "zod";
import type { BlueskyClient } from "../client.js";

export const createPostSchema = z.object({
  text: z.string().max(300).describe("Post text (max 300 chars). URLs and @mentions auto-detected."),
});

export async function createPost(
  client: BlueskyClient,
  args: z.infer<typeof createPostSchema>,
): Promise<string> {
  const record = await client.createPost(args.text);
  const postId = record.uri.split("/").pop();
  const profile = await client.getProfile();
  return `Post created!\nURI: ${record.uri}\nURL: https://bsky.app/profile/${profile.handle}/post/${postId}`;
}

export const replyPostSchema = z.object({
  text: z.string().max(300).describe("Reply text (max 300 chars)"),
  parent_uri: z.string().describe("AT URI of the post to reply to"),
  parent_cid: z.string().describe("CID of the post to reply to"),
  root_uri: z.string().optional().describe("AT URI of the thread root (omit if replying to top-level post)"),
  root_cid: z.string().optional().describe("CID of the thread root"),
});

export async function replyPost(
  client: BlueskyClient,
  args: z.infer<typeof replyPostSchema>,
): Promise<string> {
  const record = await client.reply(
    args.text,
    args.parent_uri,
    args.parent_cid,
    args.root_uri,
    args.root_cid,
  );
  const postId = record.uri.split("/").pop();
  const profile = await client.getProfile();
  return `Reply posted!\nURI: ${record.uri}\nURL: https://bsky.app/profile/${profile.handle}/post/${postId}`;
}

export const deletePostSchema = z.object({
  uri: z.string().describe("AT URI of the post to delete"),
});

export async function deletePost(
  client: BlueskyClient,
  args: z.infer<typeof deletePostSchema>,
): Promise<string> {
  await client.deletePost(args.uri);
  return `Post deleted: ${args.uri}`;
}

export const likePostSchema = z.object({
  uri: z.string().describe("AT URI of the post to like"),
  cid: z.string().describe("CID of the post to like"),
});

export async function likePost(
  client: BlueskyClient,
  args: z.infer<typeof likePostSchema>,
): Promise<string> {
  await client.like(args.uri, args.cid);
  return `Post liked: ${args.uri}`;
}

export const repostSchema = z.object({
  uri: z.string().describe("AT URI of the post to repost"),
  cid: z.string().describe("CID of the post to repost"),
});

export async function repostPost(
  client: BlueskyClient,
  args: z.infer<typeof repostSchema>,
): Promise<string> {
  await client.repost(args.uri, args.cid);
  return `Reposted: ${args.uri}`;
}

export const followUserSchema = z.object({
  handle: z.string().describe("Bluesky handle to follow (e.g. alice.bsky.social)"),
});

export async function followUser(
  client: BlueskyClient,
  args: z.infer<typeof followUserSchema>,
): Promise<string> {
  const did = await client.resolveHandle(args.handle);
  await client.follow(did);
  return `Now following @${args.handle}`;
}
