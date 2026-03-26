import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Clock,
  Download,
  HardDrive,
  Tag,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Dataset } from "../backend.d";
import { useListDatasets } from "../hooks/useQueries";
import { formatBytes, formatRelativeDate } from "../lib/format";

const PAGE_SIZE = 10;

function DatasetCard({ dataset, index }: { dataset: Dataset; index: number }) {
  const isDisputed = "disputed" in dataset.status;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      data-ocid={`dataset.item.${index + 1}`}
    >
      <Link to="/dataset/$id" params={{ id: dataset.id.toString() }}>
        <div className="dataset-card group cursor-pointer">
          <span className="tui-card-header">── DATASET ──</span>

          {isDisputed && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 mb-2 font-mono">
              <AlertTriangle className="w-3 h-3" />
              [UNDER_DISPUTE_REVIEW]
            </div>
          )}

          <div className="flex items-start justify-between gap-4 mb-1.5 mt-2">
            <h3 className="text-base font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2 font-mono">
              {dataset.title}
            </h3>
            <span className="text-xs font-mono text-secondary flex-shrink-0 border border-secondary/40 px-1.5 py-0.5">
              {formatBytes(dataset.totalSize)}
            </span>
          </div>

          {dataset.authors.length > 0 && (
            <p className="text-xs text-muted-foreground mb-1.5 font-mono">
              &gt; {dataset.authors.slice(0, 3).join(" · ")}
              {dataset.authors.length > 3 && ` +${dataset.authors.length - 3}`}
            </p>
          )}

          <p className="text-xs text-muted-foreground line-clamp-2 mb-2.5 leading-relaxed">
            {dataset.abstract_}
          </p>

          {dataset.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2.5">
              {dataset.tags.slice(0, 5).map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-mono text-accent border border-accent/30 px-1.5 py-0.5"
                >
                  #{tag}
                </span>
              ))}
              {dataset.tags.length > 5 && (
                <span className="text-xs font-mono text-muted-foreground border border-border px-1.5 py-0.5">
                  +{dataset.tags.length - 5}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 text-xs">
            <span className="stat-pill">
              <Download className="w-3 h-3" />
              {Number(dataset.downloadCount).toLocaleString()} dl
            </span>
            <span className="stat-pill">
              <Users className="w-3 h-3" />
              {Number(dataset.seeders)}s/{Number(dataset.leechers)}l
            </span>
            <span className="stat-pill">
              <Clock className="w-3 h-3" />
              {formatRelativeDate(dataset.submissionDate)}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function DatasetSkeleton() {
  return (
    <div className="dataset-card">
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/3 mb-2" />
      <Skeleton className="h-3 w-full mb-1" />
      <Skeleton className="h-3 w-5/6 mb-3" />
      <div className="flex gap-2 mb-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function HomePage() {
  const [search, setSearch] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading, isError } = useListDatasets(search, page, PAGE_SIZE);

  const datasets = data?.items ?? [];
  const total = Number(data?.total ?? 0n);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(inputValue);
    setPage(0);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero */}
      <motion.div
        className="mb-10"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="tui-panel tui-panel-bg max-w-4xl mx-auto">
          <span className="tui-panel-label">SYSTEM_INIT</span>
          <div className="pt-3 pb-2">
            <div className="text-xs font-mono text-muted-foreground mb-3 space-y-0.5">
              <p>&gt; loading academic_torrents v2.0...</p>
              <p>&gt; connecting to distributed archive...</p>
              <p className="text-accent">
                &gt; status: <span className="text-primary">ONLINE</span>
              </p>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-mono tracking-tight leading-tight mb-1">
              <span className="text-primary tui-glow">RESEARCH_DATA</span>
              <br />
              <span className="text-accent">FREELY_SHARED</span>
              <span className="blink-cursor"> </span>
            </h1>
            <p className="text-sm font-mono text-muted-foreground mt-3 leading-relaxed max-w-2xl">
              &gt; torrent-powered open archive for scientific datasets.
              <br />
              &gt; data permanence guaranteed. open access. forever.
            </p>
            <div className="flex items-center gap-4 mt-4 text-xs">
              <span className="stat-pill">
                <HardDrive className="w-3 h-3" />
                {total.toLocaleString()} datasets
              </span>
              <span className="stat-pill">
                <Tag className="w-3 h-3" />
                open_access
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        className="max-w-4xl mx-auto mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <form onSubmit={handleSearch}>
          <div className="tui-panel tui-panel-bg">
            <span className="tui-panel-label">QUERY</span>
            <div className="tui-prompt pt-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="title / author / subject / tag..."
                className="flex-1 bg-background border-border font-mono text-sm h-8"
                data-ocid="search.search_input"
              />
              <Button
                type="submit"
                data-ocid="search.submit_button"
                className="bg-primary text-primary-foreground hover:bg-primary/80 font-mono font-bold text-xs tracking-widest uppercase h-8 px-3 ml-2"
              >
                EXEC
              </Button>
            </div>
          </div>
        </form>
      </motion.div>

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        {!isLoading && (
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-mono text-muted-foreground">
              {search
                ? `&gt; ${total.toLocaleString()} results :: query="${search}"`
                : `&gt; ${total.toLocaleString()} datasets indexed`}
            </p>
          </div>
        )}

        {isError && (
          <div
            className="tui-panel text-center py-10"
            data-ocid="dataset.error_state"
          >
            <span className="tui-panel-label">ERROR</span>
            <p className="text-xs font-mono text-destructive mt-2">
              [ERR] failed to load datasets. retry.
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2" data-ocid="dataset.loading_state">
            {Array.from({ length: 5 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
              <DatasetSkeleton key={i} />
            ))}
          </div>
        ) : datasets.length === 0 ? (
          <div
            className="tui-panel text-center py-14"
            data-ocid="dataset.empty_state"
          >
            <span className="tui-panel-label">RESULT</span>
            <p className="text-4xl font-mono text-border mb-3">∅</p>
            <h3 className="font-bold text-base mb-1 font-mono">
              NO_DATASETS_FOUND
            </h3>
            <p className="text-xs font-mono text-muted-foreground mb-4">
              {search
                ? "&gt; try different query parameters."
                : "&gt; archive is empty. be the first to contribute."}
            </p>
            <Link to="/submit">
              <Button
                variant="outline"
                data-ocid="dataset.submit.button"
                className="font-mono text-xs tracking-widest uppercase border-primary text-primary hover:bg-primary/10"
              >
                [SUBMIT_DATASET]
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {datasets.map((dataset, i) => (
              <DatasetCard
                key={dataset.id.toString()}
                dataset={dataset}
                index={i}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              data-ocid="dataset.pagination_prev"
              className="font-mono text-xs tracking-widest uppercase h-7"
            >
              &lt;&lt; PREV
            </Button>
            <span className="text-xs font-mono text-muted-foreground border border-border px-3 py-1">
              PAGE {page + 1}/{totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              data-ocid="dataset.pagination_next"
              className="font-mono text-xs tracking-widest uppercase h-7"
            >
              NEXT &gt;&gt;
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
