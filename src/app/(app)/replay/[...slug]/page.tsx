import { redirect } from "next/navigation";

/**
 * Catch-all route handler for legacy or dynamic /replay/* sub-paths.
 * Gracefully routes back to the main Replay state manager, preventing 404 errors.
 */
export default function ReplayCatchAllPage() {
  redirect("/replay");
}
