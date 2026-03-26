import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  Clock,
  Database,
  Download,
  HardDrive,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetDatasetsByUser } from "../hooks/useQueries";
import { formatBytes, formatRelativeDate } from "../lib/format";

export function ProfilePage() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const isLoggedIn = !!identity;
  const isLoggingIn = loginStatus === "logging-in";
  const principal = identity?.getPrincipal().toString() ?? null;

  const { data: myDatasets = [], isLoading } = useGetDatasetsByUser(principal);

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center">
        <div className="tui-panel">
          <span className="tui-panel-label">PROFILE</span>
          <div className="pt-4">
            <User className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-lg font-bold font-mono tracking-tight mb-2">
              YOUR_PROFILE
            </h1>
            <p className="text-xs font-mono text-muted-foreground mb-6">
              &gt; sign in with internet identity to view submissions and manage
              your account.
            </p>
            <Button
              onClick={() => login()}
              disabled={isLoggingIn}
              className="bg-primary text-primary-foreground hover:bg-primary/80 font-mono text-xs tracking-widest uppercase"
              data-ocid="profile.login.button"
            >
              <LogIn className="w-3.5 h-3.5 mr-2" />
              {isLoggingIn ? "CONNECTING..." : "[SIGN_IN]"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
        {/* Profile header */}
        <div className="tui-panel mb-4">
          <span className="tui-panel-label">USER_PROFILE</span>
          <div className="pt-3 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border border-primary bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-base font-bold font-mono tracking-tight">
                  USER_SESSION
                </h1>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                  &gt; {principal}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => clear()}
              className="font-mono text-xs tracking-widest uppercase gap-1.5 h-7"
              data-ocid="profile.logout.button"
            >
              <LogOut className="w-3 h-3" />
              SIGN_OUT
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="tui-panel text-center">
            <span className="tui-panel-label">DATASETS</span>
            <p className="text-3xl font-bold font-mono text-primary mt-2">
              {myDatasets.length}
            </p>
          </div>
          <div className="tui-panel text-center">
            <span className="tui-panel-label">DOWNLOADS</span>
            <p className="text-2xl font-bold font-mono text-accent mt-2">
              {myDatasets
                .reduce((s, d) => s + Number(d.downloadCount), 0)
                .toLocaleString()}
            </p>
          </div>
          <div className="tui-panel text-center">
            <span className="tui-panel-label">DATA_SHARED</span>
            <p className="text-lg font-bold font-mono text-secondary mt-2">
              {formatBytes(myDatasets.reduce((s, d) => s + d.totalSize, 0n))}
            </p>
          </div>
        </div>

        {/* My datasets */}
        <div className="tui-panel">
          <span className="tui-panel-label">YOUR_DATASETS</span>
          <div className="pt-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-muted-foreground">
                &gt; dataset_count={myDatasets.length}
              </span>
              <Link to="/submit">
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/80 font-mono text-xs tracking-widest uppercase h-7 gap-1.5"
                  data-ocid="profile.submit.button"
                >
                  <Database className="w-3 h-3" />
                  SUBMIT_NEW
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-2" data-ocid="profile.loading_state">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border border-border p-3">
                    <Skeleton className="h-4 w-2/3 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : myDatasets.length === 0 ? (
              <div
                className="text-center py-10 border border-dashed border-border"
                data-ocid="profile.empty_state"
              >
                <Database className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <h3 className="text-sm font-bold font-mono mb-1">
                  NO_DATASETS
                </h3>
                <p className="text-xs font-mono text-muted-foreground mb-4">
                  &gt; share your research data with the community.
                </p>
                <Link to="/submit">
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-mono text-xs tracking-widest uppercase"
                    data-ocid="profile.first_submit.button"
                  >
                    [SUBMIT_FIRST_DATASET]
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {myDatasets.map((dataset, i) => (
                  <Link
                    key={dataset.id.toString()}
                    to="/dataset/$id"
                    params={{ id: dataset.id.toString() }}
                    data-ocid={`profile.dataset.item.${i + 1}`}
                  >
                    <div className="dataset-card group cursor-pointer">
                      <span className="tui-card-header">── DATASET ──</span>
                      <div className="flex items-start justify-between gap-3 mb-1.5 mt-2">
                        <h3 className="text-sm font-bold font-mono group-hover:text-primary transition-colors line-clamp-1">
                          {dataset.title}
                        </h3>
                        <span
                          className={`text-xs font-mono font-bold border px-1.5 py-0.5 flex-shrink-0 ${
                            "active" in dataset.status
                              ? "border-accent/50 text-accent"
                              : "disputed" in dataset.status
                                ? "border-amber-400/50 text-amber-400"
                                : "border-destructive/50 text-destructive"
                          }`}
                        >
                          {"active" in dataset.status
                            ? "[ACTIVE]"
                            : "disputed" in dataset.status
                              ? "[DISPUTED]"
                              : "[REMOVED]"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="stat-pill">
                          <Download className="w-3 h-3" />
                          {Number(dataset.downloadCount).toLocaleString()}
                        </span>
                        <span className="stat-pill">
                          <HardDrive className="w-3 h-3" />
                          {formatBytes(dataset.totalSize)}
                        </span>
                        <span className="stat-pill">
                          <Clock className="w-3 h-3" />
                          {formatRelativeDate(dataset.submissionDate)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
