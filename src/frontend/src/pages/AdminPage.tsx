import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Loader2,
  Shield,
  Trash2,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Dispute } from "../backend.d";
import {
  useAdminDeleteDataset,
  useGetAllDisputes,
  useIsAdmin,
  useResolveDispute,
} from "../hooks/useQueries";
import { formatRelativeDate, truncatePrincipal } from "../lib/format";

function DisputeCard({ dispute, index }: { dispute: Dispute; index: number }) {
  const [evidence, setEvidence] = useState("");
  const [resolving, setResolving] = useState(false);
  const resolveDispute = useResolveDispute();
  const deleteDataset = useAdminDeleteDataset();

  const isOpen = "open" in dispute.status;
  const isProvenFalse = "provenFalse" in dispute.status;

  const handleDismiss = async () => {
    setResolving(true);
    try {
      await resolveDispute.mutateAsync({
        disputeId: dispute.id,
        resolution: { dismissed: null },
        evidence: evidence.trim()
          ? { __kind__: "Some", value: evidence.trim() }
          : { __kind__: "None" },
      });
      toast.success("Dispute dismissed");
    } catch {
      toast.error("Failed to resolve dispute");
    } finally {
      setResolving(false);
    }
  };

  const handleMarkFalse = async () => {
    if (!evidence.trim()) {
      toast.error("Evidence is required when marking as proven false");
      return;
    }
    setResolving(true);
    try {
      await resolveDispute.mutateAsync({
        disputeId: dispute.id,
        resolution: { provenFalse: null },
        evidence: { __kind__: "Some", value: evidence.trim() },
      });
      toast.success("Dispute marked as proven false");
    } catch {
      toast.error("Failed to resolve dispute");
    } finally {
      setResolving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDataset.mutateAsync(dispute.datasetId);
      toast.success("Dataset deleted");
    } catch {
      toast.error("Failed to delete dataset");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="tui-panel"
      data-ocid={`admin.dispute.item.${index + 1}`}
    >
      <span className="tui-panel-label">DISPUTE_{index + 1}</span>
      <div className="pt-3">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-mono font-bold border px-1.5 py-0.5 ${
                isOpen
                  ? "border-amber-400/50 text-amber-400"
                  : isProvenFalse
                    ? "border-destructive/50 text-destructive"
                    : "border-border text-muted-foreground"
              }`}
            >
              {isOpen
                ? "[OPEN]"
                : isProvenFalse
                  ? "[PROVEN_FALSE]"
                  : "[DISMISSED]"}
            </span>
            <Link
              to="/dataset/$id"
              params={{ id: dispute.datasetId.toString() }}
              className="text-xs font-mono text-accent hover:text-primary transition-colors flex items-center gap-0.5"
              data-ocid={`admin.dispute.dataset.link.${index + 1}`}
            >
              DATASET_#{dispute.datasetId.toString()}
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {formatRelativeDate(
              dispute.resolvedAt.__kind__ === "Some"
                ? dispute.resolvedAt.value
                : 0n,
            )}
          </span>
        </div>

        <p className="text-xs font-mono mb-1.5">{dispute.reason}</p>
        <p className="text-xs font-mono text-muted-foreground mb-2">
          &gt; filed_by: {truncatePrincipal(dispute.openedBy.toString())}
        </p>

        {dispute.evidence.__kind__ === "Some" && (
          <div className="bg-background border border-border p-2 mb-3">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
              EVIDENCE:
            </p>
            <p className="text-xs font-mono">{dispute.evidence.value}</p>
          </div>
        )}

        {isOpen && (
          <div className="space-y-2 mt-3 pt-3 border-t border-border">
            <Textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="&gt; add resolution evidence (required for PROVEN_FALSE)..."
              rows={2}
              className="bg-background border-border font-mono text-xs"
              data-ocid={`admin.dispute.evidence.textarea.${index + 1}`}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDismiss}
                disabled={resolving}
                className="font-mono text-xs tracking-widest uppercase gap-1.5 h-7"
                data-ocid={`admin.dispute.dismiss.button.${index + 1}`}
              >
                {resolving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCircle className="w-3 h-3 text-accent" />
                )}
                DISMISS
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleMarkFalse}
                disabled={resolving}
                className="font-mono text-xs tracking-widest uppercase gap-1.5 h-7 border-amber-400/30 text-amber-400 hover:border-amber-400/60"
                data-ocid={`admin.dispute.mark_false.button.${index + 1}`}
              >
                {resolving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                MARK_PROVEN_FALSE
              </Button>
            </div>
          </div>
        )}

        {isProvenFalse && (
          <div className="mt-3 pt-3 border-t border-border">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  className="font-mono text-xs tracking-widest uppercase gap-1.5 h-7"
                  data-ocid={`admin.dispute.delete.open_modal_button.${index + 1}`}
                >
                  <Trash2 className="w-3 h-3" />
                  DELETE_DATASET
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent
                className="bg-card border-border font-mono"
                data-ocid={`admin.delete.dialog.${index + 1}`}
              >
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-mono font-bold tracking-widest uppercase">
                    DELETE_DATASET
                  </AlertDialogTitle>
                  <AlertDialogDescription className="font-mono text-xs">
                    &gt; this will permanently delete the dataset.
                    <br />
                    &gt; action cannot be undone.
                    <br />
                    &gt; only proceed if data has been proven false.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    className="font-mono text-xs tracking-widest uppercase"
                    data-ocid={`admin.delete.cancel_button.${index + 1}`}
                  >
                    CANCEL
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono text-xs tracking-widest uppercase"
                    data-ocid={`admin.delete.confirm_button.${index + 1}`}
                  >
                    CONFIRM_DELETE
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function AdminPage() {
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();
  const { data: disputes = [], isLoading } = useGetAllDisputes();

  const openDisputes = disputes.filter((d) => "open" in d.status);
  const resolvedDisputes = disputes.filter((d) => !("open" in d.status));

  if (checkingAdmin) {
    return (
      <div
        className="container mx-auto px-4 py-16 text-center"
        data-ocid="admin.loading_state"
      >
        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
        <p className="text-xs font-mono text-muted-foreground mt-2">
          &gt; verifying_admin_credentials...
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center">
        <div className="tui-panel">
          <span className="tui-panel-label">ACCESS_DENIED</span>
          <div className="pt-4">
            <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h1 className="text-base font-bold font-mono tracking-tight mb-2">
              ADMIN_ACCESS_REQUIRED
            </h1>
            <p className="text-xs font-mono text-muted-foreground">
              &gt; insufficient permissions to access this panel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Admin header */}
      <div className="tui-panel mb-4">
        <span className="tui-panel-label">ADMIN_PANEL</span>
        <div className="pt-3 flex items-center gap-3">
          <Shield className="w-5 h-5 text-primary" />
          <div>
            <h1 className="text-lg font-bold font-mono tracking-tight">
              DISPUTE_RESOLUTION_SYSTEM
            </h1>
            <p className="text-xs font-mono text-muted-foreground">
              &gt; content removed only when data is proven false
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="tui-panel text-center">
          <span className="tui-panel-label">OPEN</span>
          <p className="text-3xl font-bold font-mono text-amber-400 mt-2">
            {openDisputes.length}
          </p>
        </div>
        <div className="tui-panel text-center">
          <span className="tui-panel-label">RESOLVED</span>
          <p className="text-3xl font-bold font-mono text-accent mt-2">
            {resolvedDisputes.length}
          </p>
        </div>
        <div className="tui-panel text-center">
          <span className="tui-panel-label">TOTAL</span>
          <p className="text-3xl font-bold font-mono text-foreground mt-2">
            {disputes.length}
          </p>
        </div>
      </div>

      {/* Open disputes */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-amber-400">
            OPEN_DISPUTES ({openDisputes.length})
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-2" data-ocid="admin.loading_state">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : openDisputes.length === 0 ? (
          <div
            className="tui-panel text-center py-8"
            data-ocid="admin.open_disputes.empty_state"
          >
            <CheckCircle className="w-7 h-7 text-accent mx-auto mb-2" />
            <p className="text-xs font-mono text-muted-foreground">
              &gt; no open disputes. archive integrity verified.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {openDisputes.map((dispute, i) => (
              <DisputeCard
                key={dispute.id.toString()}
                dispute={dispute}
                index={i}
              />
            ))}
          </div>
        )}
      </div>

      {/* Resolved disputes */}
      {resolvedDisputes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-muted-foreground">
              RESOLVED_DISPUTES ({resolvedDisputes.length})
            </span>
          </div>
          <div className="space-y-2">
            {resolvedDisputes.map((dispute, i) => (
              <DisputeCard
                key={dispute.id.toString()}
                dispute={dispute}
                index={i}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
