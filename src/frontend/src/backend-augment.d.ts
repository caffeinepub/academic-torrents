import type { Principal } from "@icp-sdk/core/principal";
import type {
  Comment,
  Dataset,
  Dispute,
  DisputeStatus,
  FileEntry,
  ListDatasetsResult,
  Option,
  UserRole,
} from "./backend.d";

// Augment the generated backend module so the full interface methods are available.
// We override createActor's return type to backendInterface to make config.ts happy,
// and extend backendInterface so useActor.ts can call _initializeAccessControlWithSecret.
declare module "./backend" {
  interface backendInterface {
    _initializeAccessControlWithSecret(userSecret: string): Promise<void>;
    getCallerUserRole(): Promise<UserRole>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    submitDataset(
      title: string,
      abstract_: string,
      authors: string[],
      tags: string[],
      magnetLink: string,
      torrentFileId: Option<string>,
      fileList: FileEntry[],
      totalSize: bigint,
      seeders: bigint,
      leechers: bigint,
    ): Promise<bigint>;
    getDataset(id: bigint): Promise<Option<Dataset>>;
    listDatasets(
      search: string,
      page: bigint,
      pageSize: bigint,
    ): Promise<ListDatasetsResult>;
    getDatasetsByUser(user: Principal): Promise<Dataset[]>;
    incrementDownloadCount(id: bigint): Promise<void>;
    addComment(
      datasetId: bigint,
      authorName: string,
      body: string,
    ): Promise<bigint>;
    getComments(datasetId: bigint): Promise<Comment[]>;
    openDispute(datasetId: bigint, reason: string): Promise<bigint>;
    getDisputes(datasetId: bigint): Promise<Dispute[]>;
    resolveDispute(
      disputeId: bigint,
      resolution: DisputeStatus,
      evidence: Option<string>,
    ): Promise<void>;
    adminDeleteDataset(id: bigint): Promise<void>;
    getAllDisputes(): Promise<Dispute[]>;
  }

  // Override createActor return type so config.ts doesn't error on Backend vs backendInterface
  function createActor(
    canisterId: string,
    uploadFile: (file: ExternalBlob) => Promise<Uint8Array>,
    downloadFile: (file: Uint8Array) => Promise<ExternalBlob>,
    options?: CreateActorOptions,
  ): backendInterface;
}
