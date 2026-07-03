import React from "react";
import { useQuery, useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import obsidianLogo from "../assets/images/2023-Obsidian-logo.svg.png";
import { LinkIcon, PlusIcon, TrashIcon } from "./icons";
import { useToast } from "../lib/toast";
import { logger } from "../lib/logger";

export function linkTitle(raw: string): string {
  try {
    const url = new URL(raw);
    if (url.protocol === "obsidian:") {
      const file = url.searchParams.get("file");
      if (file) {
        const decoded = decodeURIComponent(file).replace(/\.md$/, "");
        return decoded.split("/").pop() ?? decoded;
      }
      return "Obsidian note";
    }
    return url.hostname + (url.pathname !== "/" ? url.pathname : "");
  } catch {
    return raw;
  }
}

export type LinkListProps = {
  cardId: Id<"Cards">;
  taskId?: Id<"Tasks">;
  /** Stops pointer-down bubbling so the list never starts a task drag when nested in an expanded row. */
  stopDragPropagation?: boolean;
};

/**
 * Renders + manages a scoped research-link list: card-level when only
 * `cardId` is given, task-level when `taskId` is also given. Shared by the
 * card detail panel (`ResearchList`) and the per-task detail panel
 * (`TaskList`'s expanded row) so the parsing/rendering/mutation logic lives
 * in exactly one place.
 */
export function LinkList({ cardId, taskId, stopDragPropagation }: LinkListProps) {
  const cardLinks = useQuery(api.ResearchLinks.getLinks, taskId === undefined ? { cardId } : "skip");
  const taskLinks = useQuery(api.ResearchLinks.getTaskLinks, taskId !== undefined ? { taskId } : "skip");
  const links = taskId === undefined ? cardLinks : taskLinks;

  const addLink = useMutation(api.ResearchLinks.addLink);
  const removeLink = useMutation(api.ResearchLinks.removeLink);
  const { toast, toastError } = useToast();
  const [draft, setDraft] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const stopPointer = stopDragPropagation
    ? {
        onMouseDown: (e: React.SyntheticEvent) => e.stopPropagation(),
        onTouchStart: (e: React.SyntheticEvent) => e.stopPropagation(),
        onPointerDown: (e: React.SyntheticEvent) => e.stopPropagation(),
      }
    : {};

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    try {
      await addLink({ cardId, link: draft.trim(), ...(taskId !== undefined ? { taskId } : {}) });
      setDraft("");
      setError(null);
    } catch (err) {
      logger.error("addLink failed", err);
      setError(
        err instanceof ConvexError ? String(err.data) : "Couldn't add the link. Try again."
      );
    }
  };

  const handleDelete = async (id: Id<"ResearchLinks">) => {
    try {
      await removeLink({ id });
      toast("Link deleted");
    } catch (err) {
      logger.error("removeLink failed", err);
      toastError("Couldn't delete the link. Try again.");
    }
  };

  return (
    <>
      {links === undefined ? (
        <span className="mono" style={{ color: "var(--ink-faint)" }}>
          Loading…
        </span>
      ) : links.length === 0 ? (
        <div className="empty">
          <span className="empty__title">No research yet</span>
          <span className="empty__hint">Link Obsidian notes or web pages you're working from.</span>
        </div>
      ) : (
        links.map((item) => (
          <div key={item._id} className="link-row">
            {item.link.startsWith("obsidian:") ? (
              <img className="link-row__icon" src={obsidianLogo} alt="" />
            ) : (
              <LinkIcon className="link-row__icon" style={{ color: "var(--ink-muted)" }} />
            )}
            <button
              className="link-row__title"
              title={item.link}
              {...stopPointer}
              onClick={() => window.open(item.link, "_blank", "noopener,noreferrer")}
            >
              {linkTitle(item.link)}
            </button>
            <button
              className="icon-btn icon-btn--danger"
              aria-label={`Delete link: ${linkTitle(item.link)}`}
              {...stopPointer}
              onClick={() => void handleDelete(item._id)}
            >
              <TrashIcon />
            </button>
          </div>
        ))
      )}
      <form className="add-row" onSubmit={handleAdd} {...stopPointer}>
        <input
          type="text"
          placeholder="obsidian://… or https://…"
          aria-label="New research link"
          value={draft}
          maxLength={2000}
          {...stopPointer}
          onChange={(e) => {
            setDraft(e.target.value);
            setError(null);
          }}
        />
        <button type="submit" className="btn" disabled={!draft.trim()} {...stopPointer}>
          <PlusIcon /> Add
        </button>
      </form>
      {error && <span className="field__error">{error}</span>}
    </>
  );
}

/** Link count for the given scope; lets callers render their own panel header count without re-fetching parsing logic. */
export function useLinkCount({ cardId, taskId }: LinkListProps): number | undefined {
  const cardLinks = useQuery(api.ResearchLinks.getLinks, taskId === undefined ? { cardId } : "skip");
  const taskLinks = useQuery(api.ResearchLinks.getTaskLinks, taskId !== undefined ? { taskId } : "skip");
  const links = taskId === undefined ? cardLinks : taskLinks;
  return links?.length;
}

export function ResearchList({ cardId }: { cardId: Id<"Cards"> }) {
  const links = useQuery(api.ResearchLinks.getLinks, { cardId });

  return (
    <section className="panel" aria-label="Research links">
      <div className="panel__header">
        <h2 className="panel__title">Research</h2>
        {links && links.length > 0 && <span className="panel__count">{links.length}</span>}
      </div>
      <div className="panel__body">
        <LinkList cardId={cardId} />
      </div>
    </section>
  );
}
