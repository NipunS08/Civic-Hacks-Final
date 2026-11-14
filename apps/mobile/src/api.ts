import { parseItemsResponse, type AgendaItem } from "@civiclens/shared";
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");
export const recentItems = new Map<string, AgendaItem>();
export async function loadItems(
  path: string,
  signal?: AbortSignal,
): Promise<AgendaItem[]> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort);
  const timer = setTimeout(abort, 60000);
  try {
    const response = await fetch(`${API_URL}/api/mobile/items${path}`, {
      signal: controller.signal,
    });
    if (!response.ok)
      throw new Error(
        response.status === 404
          ? "This record is no longer in the current feed. Your saved copy may be out of date."
          : "Unable to load municipal records. Check your connection and server address, then retry.",
      );
    const items = parseItemsResponse(await response.json());
    items.forEach((i) => recentItems.set(i.item_number, i));
    return items;
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error("The request timed out or was cancelled. Please retry.");
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
