import { Button } from "@/components/ui/button";
import type { PagedResponse } from "@/lib/types";

export function unwrapPage<T>(data: unknown): { items: T[]; totalPages: number; total: number; page: number } {
  if (data && typeof data === "object" && "content" in (data as object)) {
    const p = data as PagedResponse<T>;
    return {
      items: p.content ?? [],
      totalPages: Math.max(p.totalPages ?? 1, 1),
      total: p.totalElements ?? 0,
      page: p.number ?? 0,
    };
  }
  const arr = Array.isArray(data) ? (data as T[]) : [];
  return { items: arr, totalPages: 1, total: arr.length, page: 0 };
}

export function PaginationBar({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number;
  totalPages: number;
  total?: number;
  onPage: (page: number) => void;
}) {
  if (totalPages <= 1 && (total ?? 0) <= 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-card px-6 py-4">
      <p className="text-xs text-muted-foreground">
        {total != null ? `${total} result${total === 1 ? "" : "s"}` : ""}
        {totalPages > 0 ? ` · Page ${page + 1} of ${Math.max(totalPages, 1)}` : ""}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages - 1}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
