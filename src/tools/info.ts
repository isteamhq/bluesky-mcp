import { z } from "zod";
import type { BlueskyClient } from "../client.js";

export const getProfileSchema = z.object({
  handle: z.string().optional().describe("Handle to look up (omit for own profile)"),
});

export async function getProfile(
  client: BlueskyClient,
  args: z.infer<typeof getProfileSchema>,
): Promise<string> {
  const p = await client.getProfile(args.handle);
  const lines = [
    `@${p.handle} (${p.displayName ?? "—"})`,
    p.description ?? "",
    "",
    `Followers: ${p.followersCount}`,
    `Following: ${p.followsCount}`,
    `Posts: ${p.postsCount}`,
    `DID: ${p.did}`,
    `\nProfile: https://bsky.app/profile/${p.handle}`,
  ];
  return lines.join("\n");
}

export const getPostSchema = z.object({
  uri: z.string().describe("AT URI of the post"),
});

export async function getPost(
  client: BlueskyClient,
  args: z.infer<typeof getPostSchema>,
): Promise<string> {
  const p = await client.getPost(args.uri);
  const postId = p.uri.split("/").pop();
  const lines = [
    `@${p.author.handle} (${p.author.displayName ?? "—"})`,
    `CID: ${p.cid}`,
    `Date: ${p.indexedAt}`,
    "",
    p.record.text,
    "",
    `❤️ ${p.likeCount}  🔁 ${p.repostCount}  💬 ${p.replyCount}`,
    `\nURL: https://bsky.app/profile/${p.author.handle}/post/${postId}`,
  ];
  return lines.join("\n");
}

export const getThreadSchema = z.object({
  uri: z.string().describe("AT URI of the post to get thread for"),
});

export async function getThread(
  client: BlueskyClient,
  args: z.infer<typeof getThreadSchema>,
): Promise<string> {
  const thread = await client.getPostThread(args.uri);
  return JSON.stringify(thread, null, 2).slice(0, 3000);
}

export const getNotificationsSchema = z.object({
  limit: z.number().min(1).max(50).default(20).describe("Number of notifications"),
});

export async function getNotifications(
  client: BlueskyClient,
  args: z.infer<typeof getNotificationsSchema>,
): Promise<string> {
  const data = (await client.getNotifications(args.limit)) as {
    notifications: {
      reason: string;
      author: { handle: string; displayName?: string };
      record?: { text?: string };
      indexedAt: string;
    }[];
  };

  if (!data.notifications?.length) return "No notifications.";

  const lines: string[] = [];
  for (const n of data.notifications) {
    const who = `@${n.author.handle}`;
    const text = n.record?.text?.slice(0, 80) ?? "";
    lines.push(`[${n.reason}] ${who} — ${text} (${n.indexedAt})`);
  }
  return lines.join("\n");
}

export const updateProfileSchema = z.object({
  display_name: z.string().max(64).optional().describe("Display name"),
  description: z.string().max(256).optional().describe("Bio/description"),
});

export async function updateProfile(
  client: BlueskyClient,
  args: z.infer<typeof updateProfileSchema>,
): Promise<string> {
  await client.updateProfile(args.display_name, args.description);
  const p = await client.getProfile();
  return `Profile updated!\nName: ${p.displayName}\nBio: ${p.description}`;
}
