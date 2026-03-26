import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { loadConfig } from "../config";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useSubmitDataset } from "../hooks/useQueries";
import { StorageClient } from "../utils/StorageClient";

let _fileRowCounter = 0;
interface FileRow {
  _key: number;
  name: string;
  size: string;
}

export function SubmitPage() {
  const navigate = useNavigate();
  const { identity, login } = useInternetIdentity();
  const { actor } = useActor();
  const submitDataset = useSubmitDataset();
  const isLoggedIn = !!identity;

  const [title, setTitle] = useState("");
  const [abstract_, setAbstract] = useState("");
  const [magnetLink, setMagnetLink] = useState("");
  const [totalSize, setTotalSize] = useState("");
  const [seeders, setSeeders] = useState("0");
  const [leechers, setLeechers] = useState("0");
  const [authors, setAuthors] = useState<string[]>([""]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [fileRows, setFileRows] = useState<FileRow[]>([
    { _key: ++_fileRowCounter, name: "", size: "" },
  ]);
  const [torrentFile, setTorrentFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <div className="tui-panel">
          <span className="tui-panel-label">AUTH_REQUIRED</span>
          <div className="pt-4">
            <p className="text-xs font-mono text-muted-foreground mb-1">
              &gt; authentication required to submit datasets.
            </p>
            <p className="text-xs font-mono text-muted-foreground mb-6">
              &gt; please sign in to continue.
            </p>
            <Button
              onClick={() => login()}
              data-ocid="submit.login.button"
              className="bg-primary text-primary-foreground hover:bg-primary/80 font-mono text-xs tracking-widest uppercase"
            >
              [SIGN_IN_TO_CONTINUE]
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const addAuthor = () => setAuthors((a) => [...a, ""]);
  const removeAuthor = (i: number) =>
    setAuthors((a) => a.filter((_, idx) => idx !== i));
  const updateAuthor = (i: number, v: string) =>
    setAuthors((a) => a.map((x, idx) => (idx === i ? v : x)));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t]);
    }
    setTagInput("");
  };
  const removeTag = (t: string) =>
    setTags((prev) => prev.filter((x) => x !== t));

  const addFileRow = () =>
    setFileRows((r) => [...r, { _key: ++_fileRowCounter, name: "", size: "" }]);
  const removeFileRow = (i: number) =>
    setFileRows((r) => r.filter((_, idx) => idx !== i));
  const updateFileRow = (i: number, field: keyof FileRow, v: string) =>
    setFileRows((r) =>
      r.map((x, idx) => (idx === i ? { ...x, [field]: v } : x)),
    );

  const triggerFileUpload = () => fileRef.current?.click();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;

    let torrentFileId:
      | { __kind__: "None" }
      | { __kind__: "Some"; value: string } = {
      __kind__: "None",
    };

    if (torrentFile) {
      try {
        setUploading(true);
        const cfg = await loadConfig();
        const bytes = new Uint8Array(await torrentFile.arrayBuffer());
        const { HttpAgent } = await import("@icp-sdk/core/agent");
        const agentInstance = new HttpAgent({
          identity: identity!,
          host: cfg.backend_host,
        });
        const storageClient = new StorageClient(
          cfg.bucket_name,
          cfg.storage_gateway_url,
          cfg.backend_canister_id,
          cfg.project_id,
          agentInstance,
        );
        const { hash } = await storageClient.putFile(bytes, (pct) =>
          setUploadProgress(pct),
        );
        torrentFileId = { __kind__: "Some", value: hash };
      } catch (_err) {
        toast.error("Failed to upload torrent file");
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    const fileList = fileRows
      .filter((r) => r.name.trim())
      .map((r) => ({
        name: r.name.trim(),
        size: BigInt(r.size || "0"),
      }));

    try {
      const id = await submitDataset.mutateAsync({
        title: title.trim(),
        abstract_: abstract_.trim(),
        authors: authors.filter((a) => a.trim()),
        tags,
        magnetLink: magnetLink.trim(),
        torrentFileId,
        fileList,
        totalSize: BigInt(totalSize || "0"),
        seeders: BigInt(seeders || "0"),
        leechers: BigInt(leechers || "0"),
      });
      toast.success("Dataset submitted successfully!");
      navigate({ to: "/dataset/$id", params: { id: id.toString() } });
    } catch (_err) {
      toast.error("Submission failed. Please try again.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
        <div className="tui-panel mb-4">
          <span className="tui-panel-label">SUBMIT_DATASET</span>
          <div className="pt-3">
            <h1 className="text-xl font-bold font-mono tracking-tight mb-1">
              &gt; SUBMIT_NEW_DATASET
            </h1>
            <p className="text-xs font-mono text-muted-foreground">
              share research data with the scientific community. submissions are
              permanent and open access.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="tui-panel">
            <span className="tui-panel-label">TITLE *</span>
            <div className="pt-3">
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. ImageNet Large Scale Visual Recognition Challenge Dataset"
                required
                className="bg-background border-border font-mono text-sm"
                data-ocid="submit.title.input"
              />
            </div>
          </div>

          {/* Abstract */}
          <div className="tui-panel">
            <span className="tui-panel-label">ABSTRACT *</span>
            <div className="pt-3">
              <Textarea
                id="abstract"
                value={abstract_}
                onChange={(e) => setAbstract(e.target.value)}
                placeholder="describe the dataset, methodology, and intended use..."
                rows={5}
                required
                className="bg-background border-border font-mono text-xs"
                data-ocid="submit.abstract.textarea"
              />
            </div>
          </div>

          {/* Authors */}
          <div className="tui-panel">
            <span className="tui-panel-label">AUTHORS</span>
            <div className="pt-3 space-y-2">
              {authors.map((author, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: order-dependent list
                <div key={i} className="flex gap-2">
                  <Input
                    value={author}
                    onChange={(e) => updateAuthor(i, e.target.value)}
                    placeholder="Author name"
                    className="bg-background border-border font-mono text-xs"
                    data-ocid={`submit.author.input.${i + 1}`}
                  />
                  {authors.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAuthor(i)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      data-ocid={`submit.author.delete_button.${i + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAuthor}
                className="font-mono text-xs tracking-widest uppercase gap-1.5"
                data-ocid="submit.add_author.button"
              >
                <Plus className="w-3 h-3" /> ADD_AUTHOR
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div className="tui-panel">
            <span className="tui-panel-label">TAGS/SUBJECTS</span>
            <div className="pt-3 space-y-2">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="e.g. machine-learning, computer-vision"
                  className="bg-background border-border font-mono text-xs"
                  data-ocid="submit.tag.input"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTag}
                  className="font-mono text-xs tracking-widest uppercase"
                  data-ocid="submit.add_tag.button"
                >
                  ADD
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="text-xs font-mono text-accent border border-accent/30 px-1.5 py-0.5 hover:border-destructive hover:text-destructive transition-colors cursor-pointer"
                      onClick={() => removeTag(tag)}
                    >
                      #{tag} ×
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Magnet link */}
          <div className="tui-panel">
            <span className="tui-panel-label">MAGNET_LINK *</span>
            <div className="pt-3">
              <Input
                id="magnet"
                value={magnetLink}
                onChange={(e) => setMagnetLink(e.target.value)}
                placeholder="magnet:?xt=urn:btih:..."
                required
                className="bg-background border-border font-mono text-xs"
                data-ocid="submit.magnet.input"
              />
            </div>
          </div>

          {/* Torrent file */}
          <div className="tui-panel">
            <span className="tui-panel-label">TORRENT_FILE (OPTIONAL)</span>
            <div className="pt-3">
              <button
                type="button"
                className="w-full border border-dashed border-border p-6 text-center cursor-pointer hover:border-primary/50 transition-colors bg-background font-mono"
                onClick={triggerFileUpload}
                onKeyDown={(e) => e.key === "Enter" && triggerFileUpload()}
                data-ocid="submit.torrent.dropzone"
              >
                <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                {torrentFile ? (
                  <p className="text-xs text-foreground">
                    &gt; {torrentFile.name}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    &gt; click to upload .torrent file
                  </p>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".torrent"
                className="hidden"
                onChange={(e) => setTorrentFile(e.target.files?.[0] ?? null)}
                data-ocid="submit.torrent.upload_button"
              />
              {uploading && (
                <p className="text-xs font-mono text-muted-foreground mt-1">
                  &gt; uploading... {uploadProgress}%
                </p>
              )}
            </div>
          </div>

          {/* File list */}
          <div className="tui-panel">
            <span className="tui-panel-label">FILE_LIST</span>
            <div className="pt-3 space-y-2">
              {fileRows.map((row, i) => (
                <div
                  key={row._key}
                  className="flex gap-2 items-center"
                  data-ocid={`submit.file.row.${i + 1}`}
                >
                  <Input
                    value={row.name}
                    onChange={(e) => updateFileRow(i, "name", e.target.value)}
                    placeholder="filename (e.g. train.csv)"
                    className="bg-background border-border font-mono text-xs flex-1"
                    data-ocid={`submit.file.name.input.${i + 1}`}
                  />
                  <Input
                    value={row.size}
                    onChange={(e) => updateFileRow(i, "size", e.target.value)}
                    placeholder="bytes"
                    className="bg-background border-border font-mono text-xs w-36"
                    type="number"
                    min="0"
                    data-ocid={`submit.file.size.input.${i + 1}`}
                  />
                  {fileRows.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFileRow(i)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      data-ocid={`submit.file.delete_button.${i + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addFileRow}
                className="font-mono text-xs tracking-widest uppercase gap-1.5"
                data-ocid="submit.add_file.button"
              >
                <Plus className="w-3 h-3" /> ADD_FILE
              </Button>
            </div>
          </div>

          {/* Sizes and swarm */}
          <div className="tui-panel">
            <span className="tui-panel-label">SWARM_STATS</span>
            <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label
                  htmlFor="totalSize"
                  className="text-xs font-mono tracking-widest uppercase text-muted-foreground"
                >
                  TOTAL_SIZE (bytes)
                </Label>
                <Input
                  id="totalSize"
                  value={totalSize}
                  onChange={(e) => setTotalSize(e.target.value)}
                  type="number"
                  min="0"
                  placeholder="0"
                  className="bg-background border-border font-mono text-xs"
                  data-ocid="submit.total_size.input"
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="seeders"
                  className="text-xs font-mono tracking-widest uppercase text-muted-foreground"
                >
                  SEEDERS
                </Label>
                <Input
                  id="seeders"
                  value={seeders}
                  onChange={(e) => setSeeders(e.target.value)}
                  type="number"
                  min="0"
                  placeholder="0"
                  className="bg-background border-border font-mono text-xs"
                  data-ocid="submit.seeders.input"
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="leechers"
                  className="text-xs font-mono tracking-widest uppercase text-muted-foreground"
                >
                  LEECHERS
                </Label>
                <Input
                  id="leechers"
                  value={leechers}
                  onChange={(e) => setLeechers(e.target.value)}
                  type="number"
                  min="0"
                  placeholder="0"
                  className="bg-background border-border font-mono text-xs"
                  data-ocid="submit.leechers.input"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={
              submitDataset.isPending ||
              uploading ||
              !title.trim() ||
              !abstract_.trim() ||
              !magnetLink.trim()
            }
            className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-mono font-bold text-sm tracking-widest uppercase h-10"
            data-ocid="submit.submit_button"
          >
            {submitDataset.isPending || uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                SUBMITTING...
              </>
            ) : (
              "[SUBMIT_DATASET]"
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
