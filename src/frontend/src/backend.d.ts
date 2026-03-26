import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;

export interface FileEntry {
    name: string;
    size: bigint;
}

export type DatasetStatus = { active: null } | { disputed: null } | { provenFalse: null };
export type DisputeStatus = { open: null } | { dismissed: null } | { provenFalse: null };
export type UserRole = { admin: null } | { user: null } | { guest: null };

export interface Dataset {
    id: bigint;
    title: string;
    abstract_: string;
    authors: string[];
    tags: string[];
    magnetLink: string;
    torrentFileId: Option<string>;
    fileList: FileEntry[];
    totalSize: bigint;
    seeders: bigint;
    leechers: bigint;
    downloadCount: bigint;
    submittedBy: Principal;
    submissionDate: bigint;
    status: DatasetStatus;
}

export interface Comment {
    id: bigint;
    datasetId: bigint;
    author: Principal;
    authorName: string;
    body: string;
    timestamp: bigint;
}

export interface Dispute {
    id: bigint;
    datasetId: bigint;
    openedBy: Principal;
    reason: string;
    status: DisputeStatus;
    evidence: Option<string>;
    resolvedBy: Option<Principal>;
    resolvedAt: Option<bigint>;
}

export interface ListDatasetsResult {
    items: Dataset[];
    total: bigint;
}

export interface backendInterface {
    // Auth
    _initializeAccessControlWithSecret(userSecret: string): Promise<void>;
    getCallerUserRole(): Promise<UserRole>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    // Datasets
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
        leechers: bigint
    ): Promise<bigint>;
    getDataset(id: bigint): Promise<Option<Dataset>>;
    listDatasets(search: string, page: bigint, pageSize: bigint): Promise<ListDatasetsResult>;
    getDatasetsByUser(user: Principal): Promise<Dataset[]>;
    incrementDownloadCount(id: bigint): Promise<void>;
    // Comments
    addComment(datasetId: bigint, authorName: string, body: string): Promise<bigint>;
    getComments(datasetId: bigint): Promise<Comment[]>;
    // Disputes
    openDispute(datasetId: bigint, reason: string): Promise<bigint>;
    getDisputes(datasetId: bigint): Promise<Dispute[]>;
    resolveDispute(disputeId: bigint, resolution: DisputeStatus, evidence: Option<string>): Promise<void>;
    adminDeleteDataset(id: bigint): Promise<void>;
    getAllDisputes(): Promise<Dispute[]>;
}
