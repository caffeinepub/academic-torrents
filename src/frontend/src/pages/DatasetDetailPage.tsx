import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Link, useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  Copy,
  Download,
  FileText,
  Flag,
  HardDrive,
  Magnet,
  MessageSquare,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddComment,
  useGetComments,
  useGetDataset,
  useGetDisputes,
  useIncrementDownloadCount,
  useOpenDispute,
} from "../hooks/useQueries";
import {
  formatBytes,
  formatDate,
  formatRelativeDate,
  truncatePrincipal,
} from "../lib/format";

export function DatasetDetailPage() {
  const { id } = useParams({ from: "/dataset/$id" });
  const datasetId = BigInt(id);

  const { data: dataset, isLoading } = useGetDataset(datasetId);
  const { data: comments = [] } = useGetComments(datasetId);
  const { data: disputes = [] } = useGetDisputes(datasetId);
  const { identity } = useInternetIdentity();
  const isLoggedIn = !!identity;

  const addComment = useAddComment();
  const openDispute = useOpenDispute();
  const incrementDownload = useIncrementDownloadCount();

  const [commentName, setCommentName] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeOpen, setDisputeOpen] = useState(false);

  const handleMagnetClick = () => {
    if (!dataset) return;
    navigator.clipboard.writeText(dataset.magnetLink).then(() => {
      toast.success("Magnet link copied to clipboard!");
    });
    window.location.href = dataset.magnetLink;
    incrementDownload.mutate(datasetId);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    await addComment.mutateAsync({
      datasetId,
      authorName: commentName || "Anonymous",
      body: commentBody,
    });
    setCommentBody("");
    setCommentName("");
    toast.success("Comment added");
  };

  const handleDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;
    await openDispute.mutateAsync({ datasetId, reason: disputeReason });
    setDisputeReason("");
    setDisputeOpen(false);
    toast.success("Dispute submitted for review");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-5 w-3/4 mb-4" />
        <Skeleton className="h-3 w-1/3 mb-6" />
        <Skeleton className="h-24 w-full mb-4" />
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="tui-panel max-w-md mx-auto">
          <span className="tui-panel-label">ERROR</span>
          <h2 className="text-lg font-bold font-mono mt-3 mb-2">
            DATASET_NOT_FOUND
          </h2>
          <p className="text-xs font-mono text-muted-foreground mb-4">
            this dataset may have been removed.
          </p>
          <Link to="/">
            <Button
              variant="outline"
              className="font-mono text-xs tracking-widest uppercase"
            >
              [BACK_TO_BROWSE]
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isDisputed = "disputed" in dataset.status;
  const openDisputes = disputes.filter((d) => "open" in d.status);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground mb-4">
        <Link
          to="/"
          className="hover:text-primary transition-colors"
          data-ocid="detail.browse.link"
        >
          BROWSE
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground truncate max-w-xs">
          {dataset.title}
        </span>
      </div>

      {/* Dispute banner */}
      {isDisputed && openDisputes.length > 0 && (
        <motion.div
          className="disputed-banner p-3 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          data-ocid="detail.dispute.panel"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold font-mono text-amber-300">
                [DISPUTE_REVIEW_ACTIVE] — {openDisputes.length} open dispute(s)
              </p>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">
                content remains accessible during review. removal only if data
                is proven false.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {/* Title panel */}
        <div className="tui-panel">
          <span className="tui-panel-label">DATASET_INFO</span>
          <div className="pt-3">
            <h1 className="text-2xl md:text-3xl font-bold font-mono leading-tight mb-2">
              {dataset.title}
            </h1>
            {dataset.authors.length > 0 && (
              <p className="text-xs font-mono text-muted-foreground mb-3">
                &gt; AUTHORS: {dataset.authors.join(" · ")}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <span className="stat-pill">
                <HardDrive className="w-3 h-3" />
                {formatBytes(dataset.totalSize)}
              </span>
              <span className="stat-pill">
                <Download className="w-3 h-3" />
                {Number(dataset.downloadCount).toLocaleString()} downloads
              </span>
              <span className="stat-pill">
                <Users className="w-3 h-3" />
                {Number(dataset.seeders)}s · {Number(dataset.leechers)}l
              </span>
              <span className="stat-pill">
                <Clock className="w-3 h-3" />
                {formatDate(dataset.submissionDate)}
              </span>
            </div>

            {dataset.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {dataset.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-mono text-accent border border-accent/30 px-1.5 py-0.5"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Abstract panel */}
        <div className="tui-panel">
          <span className="tui-panel-label">ABSTRACT</span>
          <p className="text-sm font-mono text-foreground leading-relaxed pt-3">
            {dataset.abstract_}
          </p>
        </div>

        {/* Download panel */}
        <div className="tui-panel">
          <span className="tui-panel-label">DOWNLOAD</span>
          <div className="pt-3 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleMagnetClick}
                className="bg-primary text-primary-foreground hover:bg-primary/80 font-mono text-xs tracking-widest uppercase gap-2"
                data-ocid="detail.magnet.button"
              >
                <Magnet className="w-3.5 h-3.5" />
                [OPEN_MAGNET]
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(dataset.magnetLink);
                  toast.success("Magnet link copied!");
                }}
                className="font-mono text-xs tracking-widest uppercase gap-2"
                data-ocid="detail.copy_magnet.button"
              >
                <Copy className="w-3.5 h-3.5" />
                COPY_MAGNET
              </Button>
              {dataset.torrentFileId.__kind__ === "Some" && (
                <Button
                  variant="outline"
                  className="font-mono text-xs tracking-widest uppercase gap-2"
                  data-ocid="detail.torrent.button"
                >
                  <FileText className="w-3.5 h-3.5" />
                  DL_.TORRENT
                </Button>
              )}
            </div>
            <div className="bg-background border border-border p-2 font-mono text-xs text-muted-foreground break-all">
              <span className="text-primary">&gt; </span>
              {dataset.magnetLink.length > 120
                ? `${dataset.magnetLink.slice(0, 120)}...`
                : dataset.magnetLink}
            </div>
          </div>
        </div>

        {/* Files panel */}
        {dataset.fileList.length > 0 && (
          <div className="tui-panel">
            <span className="tui-panel-label">
              FILES ({dataset.fileList.length})
            </span>
            <div className="pt-3">
              <Table data-ocid="detail.files.table">
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                      FILENAME
                    </TableHead>
                    <TableHead className="text-right font-mono text-xs text-muted-foreground uppercase tracking-widest">
                      SIZE
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataset.fileList.map((file, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: order-stable list
                    <TableRow key={i} className="border-border">
                      <TableCell className="font-mono text-xs">
                        {file.name}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {formatBytes(file.size)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Submitter info */}
        <div className="border border-border p-3 text-xs font-mono text-muted-foreground flex items-center justify-between">
          <span>
            SUBMITTED_BY:{" "}
            <span className="text-foreground/70">
              {truncatePrincipal(dataset.submittedBy.toString())}
            </span>
          </span>
          <span>{formatDate(dataset.submissionDate)}</span>
        </div>

        {/* Dispute section */}
        <div className="tui-panel">
          <span className="tui-panel-label">DISPUTES ({disputes.length})</span>
          <div className="pt-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-muted-foreground">
                &gt; dispute_count={disputes.length}
              </span>
              {isLoggedIn && (
                <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs font-mono tracking-widest uppercase gap-1.5 h-7 border-amber-400/30 text-amber-400 hover:border-amber-400/60"
                      data-ocid="detail.dispute.open_modal_button"
                    >
                      <Flag className="w-3 h-3" />
                      [OPEN_DISPUTE]
                    </Button>
                  </DialogTrigger>
                  <DialogContent
                    className="bg-card border-border font-mono"
                    data-ocid="detail.dispute.dialog"
                  >
                    <DialogHeader>
                      <DialogTitle className="font-mono font-bold tracking-widest uppercase">
                        OPEN_DISPUTE
                      </DialogTitle>
                    </DialogHeader>
                    <p className="text-xs text-muted-foreground font-mono">
                      &gt; disputes for factually incorrect/fabricated data
                      only.
                      <br />
                      &gt; content removed only when proven false.
                    </p>
                    <form onSubmit={handleDispute}>
                      <div className="space-y-2 my-4">
                        <Label
                          htmlFor="dispute-reason"
                          className="text-xs font-mono tracking-widest uppercase text-muted-foreground"
                        >
                          REASON/EVIDENCE
                        </Label>
                        <Textarea
                          id="dispute-reason"
                          value={disputeReason}
                          onChange={(e) => setDisputeReason(e.target.value)}
                          placeholder="describe inaccuracy with supporting evidence..."
                          rows={4}
                          required
                          className="bg-background border-border font-mono text-xs"
                          data-ocid="detail.dispute.textarea"
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setDisputeOpen(false)}
                          className="font-mono text-xs tracking-widest uppercase"
                          data-ocid="detail.dispute.cancel_button"
                        >
                          CANCEL
                        </Button>
                        <Button
                          type="submit"
                          disabled={
                            openDispute.isPending || !disputeReason.trim()
                          }
                          className="font-mono text-xs tracking-widest uppercase bg-primary text-primary-foreground"
                          data-ocid="detail.dispute.submit_button"
                        >
                          SUBMIT
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {disputes.length === 0 ? (
              <p
                className="text-xs font-mono text-muted-foreground"
                data-ocid="dispute.empty_state"
              >
                &gt; no disputes filed for this dataset.
              </p>
            ) : (
              <div className="space-y-2">
                {disputes.map((dispute, i) => (
                  <div
                    key={dispute.id.toString()}
                    className="border border-border p-3"
                    data-ocid={`dispute.item.${i + 1}`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`text-xs font-mono font-bold border px-1.5 py-0.5 ${
                          "open" in dispute.status
                            ? "border-amber-400/50 text-amber-400"
                            : "dismissed" in dispute.status
                              ? "border-border text-muted-foreground"
                              : "border-destructive/50 text-destructive"
                        }`}
                      >
                        {"open" in dispute.status
                          ? "[OPEN]"
                          : "dismissed" in dispute.status
                            ? "[DISMISSED]"
                            : "[PROVEN_FALSE]"}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">
                        by {truncatePrincipal(dispute.openedBy.toString())}
                      </span>
                    </div>
                    <p className="text-xs font-mono">{dispute.reason}</p>
                    {dispute.evidence.__kind__ === "Some" && (
                      <p className="text-xs font-mono text-muted-foreground mt-2 border-t border-border pt-2">
                        <span className="text-foreground/60">EVIDENCE:</span>{" "}
                        {dispute.evidence.value}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Comments panel */}
        <div className="tui-panel">
          <span className="tui-panel-label">
            DISCUSSION ({comments.length})
          </span>
          <div className="pt-3">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                Add Comment
              </span>
            </div>

            {/* Comment form */}
            <form
              onSubmit={handleComment}
              className="border border-border p-3 mb-4 bg-background"
            >
              <div className="mb-2">
                <Label
                  htmlFor="comment-name"
                  className="text-xs font-mono tracking-widest uppercase text-muted-foreground"
                >
                  NAME (OPTIONAL)
                </Label>
                <Input
                  id="comment-name"
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  placeholder="Anonymous"
                  className="mt-1 bg-background border-border font-mono text-xs h-7"
                  data-ocid="comment.input"
                />
              </div>
              <Textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="&gt; share thoughts, methodology notes, questions..."
                rows={3}
                className="bg-background border-border font-mono text-xs mb-2"
                required
                data-ocid="comment.textarea"
              />
              <Button
                type="submit"
                disabled={addComment.isPending || !commentBody.trim()}
                size="sm"
                className="font-mono text-xs tracking-widest uppercase bg-primary text-primary-foreground hover:bg-primary/80 h-7"
                data-ocid="comment.submit_button"
              >
                POST_COMMENT
              </Button>
            </form>

            {/* Comment list */}
            {comments.length === 0 ? (
              <p
                className="text-xs font-mono text-muted-foreground"
                data-ocid="comment.empty_state"
              >
                &gt; no comments yet. start the discussion.
              </p>
            ) : (
              <div className="space-y-2">
                {comments.map((comment, i) => (
                  <div
                    key={comment.id.toString()}
                    className="border border-border p-3"
                    data-ocid={`comment.item.${i + 1}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold font-mono text-accent">
                        &gt; {comment.authorName || "Anonymous"}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">
                        :: {formatRelativeDate(comment.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-foreground leading-relaxed">
                      {comment.body}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
