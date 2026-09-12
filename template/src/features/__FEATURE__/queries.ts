import { desc, eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { isLiveQueryLoading, useLiveQuery } from "@/src/db/live";
import { __FEATURE__, type __FEATURE_PASCAL__Row } from "@/src/db/schema";
import { newUuid } from "@/src/db/uuid";
import type { __FEATURE_PASCAL__FormOut } from "./schema";

/**
 * The only module allowed to touch the __FEATURE__ table.
 * Reads are live-query hooks; mutations are plain async functions
 * (live queries re-run automatically after writes).
 */

export function useAll__FEATURE_PASCAL__() {
  const result = useLiveQuery(db.select().from(__FEATURE__).orderBy(desc(__FEATURE__.createdAt)));
  return { ...result, isLoading: isLiveQueryLoading(result) };
}

export function use__FEATURE_PASCAL__ById(id: number) {
  const result = useLiveQuery(db.select().from(__FEATURE__).where(eq(__FEATURE__.id, id)), [id]);
  return {
    ...result,
    row: result.data[0] as __FEATURE_PASCAL__Row | undefined,
    isLoading: isLiveQueryLoading(result),
  };
}

export async function create__FEATURE_PASCAL__(input: __FEATURE_PASCAL__FormOut): Promise<void> {
  await db.insert(__FEATURE__).values({
    uuid: newUuid(),
    title: input.title,
    notes: input.notes ?? null,
  });
}

export async function update__FEATURE_PASCAL__(
  id: number,
  input: __FEATURE_PASCAL__FormOut,
): Promise<void> {
  await db
    .update(__FEATURE__)
    .set({ title: input.title, notes: input.notes ?? null, updatedAt: new Date().toISOString() })
    .where(eq(__FEATURE__.id, id));
}

export async function delete__FEATURE_PASCAL__(id: number): Promise<void> {
  await db.delete(__FEATURE__).where(eq(__FEATURE__.id, id));
}
