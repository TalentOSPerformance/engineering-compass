import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { useState } from "react";

interface PR {
  id: number;
  title: string;
  author: string;
  avatar: string;
  repo: string;
  status: "merged" | "open" | "closed";
  size: "xs" | "s" | "m" | "l" | "xl";
  cycleTime: string;
  createdAt: string;
  url: string;
}

const mockPRs: PR[] = [
  { id: 1, title: "Fix auth flow redirect issue", author: "Ana Silva", avatar: "AS", repo: "acme/api", status: "merged", size: "s", cycleTime: "8.2h", createdAt: "2025-02-10", url: "#" },
  { id: 2, title: "Add payment webhook handler", author: "Carlos Lima", avatar: "CL", repo: "acme/api", status: "merged", size: "m", cycleTime: "24.1h", createdAt: "2025-02-09", url: "#" },
  { id: 3, title: "Update onboarding UI", author: "Bruna Costa", avatar: "BC", repo: "acme/web", status: "open", size: "l", cycleTime: "—", createdAt: "2025-02-12", url: "#" },
  { id: 4, title: "Refactor user service tests", author: "João Pedro", avatar: "JP", repo: "acme/api", status: "merged", size: "l", cycleTime: "48.5h", createdAt: "2025-02-07", url: "#" },
  { id: 5, title: "Add rate limiting middleware", author: "Maria Souza", avatar: "MS", repo: "acme/api", status: "merged", size: "m", cycleTime: "16.3h", createdAt: "2025-02-08", url: "#" },
  { id: 6, title: "Fix typo in docs", author: "Lucas Alves", avatar: "LA", repo: "acme/docs", status: "merged", size: "xs", cycleTime: "1.1h", createdAt: "2025-02-11", url: "#" },
  { id: 7, title: "New dashboard charts", author: "Fernanda Reis", avatar: "FR", repo: "acme/web", status: "merged", size: "l", cycleTime: "72.0h", createdAt: "2025-02-05", url: "#" },
  { id: 8, title: "Add caching layer for queries", author: "Pedro Santos", avatar: "PS", repo: "acme/api", status: "closed", size: "m", cycleTime: "—", createdAt: "2025-02-06", url: "#" },
  { id: 9, title: "Migrate database schema v3", author: "Ana Silva", avatar: "AS", repo: "acme/api", status: "merged", size: "xl", cycleTime: "96.2h", createdAt: "2025-02-03", url: "#" },
  { id: 10, title: "Add integration tests suite", author: "Carlos Lima", avatar: "CL", repo: "acme/api", status: "merged", size: "m", cycleTime: "12.8h", createdAt: "2025-02-10", url: "#" },
  { id: 11, title: "Fix CSS layout on mobile", author: "Bruna Costa", avatar: "BC", repo: "acme/web", status: "merged", size: "s", cycleTime: "3.4h", createdAt: "2025-02-11", url: "#" },
  { id: 12, title: "Add structured logging", author: "João Pedro", avatar: "JP", repo: "acme/api", status: "open", size: "s", cycleTime: "—", createdAt: "2025-02-13", url: "#" },
];

const statusStyles: Record<string, string> = {
  merged: "bg-perf-elite/15 text-perf-elite",
  open: "bg-perf-high/15 text-perf-high",
  closed: "bg-muted text-muted-foreground",
};

const sizeStyles: Record<string, string> = {
  xs: "bg-perf-elite/15 text-perf-elite",
  s: "bg-perf-high/15 text-perf-high",
  m: "bg-primary/15 text-primary",
  l: "bg-perf-medium/15 text-perf-medium",
  xl: "bg-perf-low/15 text-perf-low",
};

export function DeliveryPullRequests() {
  const [page, setPage] = useState(0);
  const pageSize = 8;
  const totalPages = Math.ceil(mockPRs.length / pageSize);
  const currentPRs = mockPRs.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-3"
    >
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Title</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Author</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Repo</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Size</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Cycle Time</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Created</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {currentPRs.map((pr) => (
                <tr key={pr.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 max-w-[240px]">
                    <span className="font-medium text-card-foreground truncate block">{pr.title}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-semibold text-muted-foreground shrink-0">
                        {pr.avatar}
                      </div>
                      <span className="text-card-foreground whitespace-nowrap">{pr.author}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-muted-foreground">{pr.repo}</span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize", statusStyles[pr.status])}>
                      {pr.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase", sizeStyles[pr.size])}>
                      {pr.size}
                    </span>
                  </td>
                  <td className="text-right px-4 py-2.5 font-mono text-card-foreground">{pr.cycleTime}</td>
                  <td className="text-right px-4 py-2.5 text-muted-foreground">{pr.createdAt}</td>
                  <td className="px-2 py-2.5">
                    <a href={pr.url} className="text-muted-foreground hover:text-card-foreground transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {page * pageSize + 1}–{Math.min((page + 1) * pageSize, mockPRs.length)} de {mockPRs.length} PRs
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-2.5 py-1 text-xs rounded-md border border-border text-muted-foreground hover:text-card-foreground disabled:opacity-40 transition-colors"
          >
            Anterior
          </button>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="px-2.5 py-1 text-xs rounded-md border border-border text-muted-foreground hover:text-card-foreground disabled:opacity-40 transition-colors"
          >
            Próximo
          </button>
        </div>
      </div>
    </motion.div>
  );
}
