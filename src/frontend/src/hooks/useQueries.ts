import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Comment,
  Dataset,
  Dispute,
  DisputeStatus,
  FileEntry,
  Option,
} from "../backend.d";
import { useActor } from "./useActor";

// The generated backend.ts has an empty interface; cast through any to call methods
// (module augmentation in backend-augment.d.ts fills in the types).
type A = any;

export function useListDatasets(search: string, page: number, pageSize = 10) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["datasets", search, page, pageSize],
    queryFn: async () => {
      const a = actor as A;
      if (!a) return { items: [] as Dataset[], total: 0n };
      const result = await a.listDatasets(
        search,
        BigInt(page),
        BigInt(pageSize),
      );
      return {
        items: result.items as Dataset[],
        total: result.total as bigint,
      };
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetDataset(id: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["dataset", id?.toString()],
    queryFn: async () => {
      const a = actor as A;
      if (!a || id === null) return null;
      const result = await a.getDataset(id);
      if (result.__kind__ === "None") return null;
      return result.value as Dataset;
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useGetComments(datasetId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["comments", datasetId?.toString()],
    queryFn: async () => {
      const a = actor as A;
      if (!a || datasetId === null) return [] as Comment[];
      return (await a.getComments(datasetId)) as Comment[];
    },
    enabled: !!actor && !isFetching && datasetId !== null,
  });
}

export function useGetDisputes(datasetId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["disputes", datasetId?.toString()],
    queryFn: async () => {
      const a = actor as A;
      if (!a || datasetId === null) return [] as Dispute[];
      return (await a.getDisputes(datasetId)) as Dispute[];
    },
    enabled: !!actor && !isFetching && datasetId !== null,
  });
}

export function useGetAllDisputes() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allDisputes"],
    queryFn: async () => {
      const a = actor as A;
      if (!a) return [] as Dispute[];
      return (await a.getAllDisputes()) as Dispute[];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetDatasetsByUser(principal: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userDatasets", principal],
    queryFn: async () => {
      const a = actor as A;
      if (!a || !principal) return [] as Dataset[];
      const { Principal } = await import("@icp-sdk/core/principal");
      return (await a.getDatasetsByUser(
        Principal.fromText(principal),
      )) as Dataset[];
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useGetUserRole() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userRole"],
    queryFn: async () => {
      const a = actor as A;
      if (!a) return null;
      return a.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      const a = actor as A;
      if (!a) return false;
      return (await a.isCallerAdmin()) as boolean;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useClaimFirstAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<boolean, Error, void>({
    mutationFn: async () => {
      const a = actor as A;
      if (!a) throw new Error("Not authenticated");
      return (await a.claimFirstAdmin()) as boolean;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["userRole"] });
    },
  });
}

type SubmitParams = {
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
};

export function useSubmitDataset() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<bigint, Error, SubmitParams>({
    mutationFn: async (params) => {
      const a = actor as A;
      if (!a) throw new Error("Not authenticated");
      return (await a.submitDataset(
        params.title,
        params.abstract_,
        params.authors,
        params.tags,
        params.magnetLink,
        params.torrentFileId,
        params.fileList,
        params.totalSize,
        params.seeders,
        params.leechers,
      )) as bigint;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      queryClient.invalidateQueries({ queryKey: ["userDatasets"] });
    },
  });
}

type AddCommentParams = { datasetId: bigint; authorName: string; body: string };

export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, AddCommentParams>({
    mutationFn: async (params) => {
      const a = actor as A;
      if (!a) throw new Error("Not authenticated");
      return a.addComment(params.datasetId, params.authorName, params.body);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.datasetId.toString()],
      });
    },
  });
}

type OpenDisputeParams = { datasetId: bigint; reason: string };

export function useOpenDispute() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, OpenDisputeParams>({
    mutationFn: async (params) => {
      const a = actor as A;
      if (!a) throw new Error("Not authenticated");
      return a.openDispute(params.datasetId, params.reason);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["disputes", variables.datasetId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["dataset", variables.datasetId.toString()],
      });
    },
  });
}

type ResolveDisputeParams = {
  disputeId: bigint;
  resolution: DisputeStatus;
  evidence: Option<string>;
};

export function useResolveDispute() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, ResolveDisputeParams>({
    mutationFn: async (params) => {
      const a = actor as A;
      if (!a) throw new Error("Not authorized");
      return a.resolveDispute(
        params.disputeId,
        params.resolution,
        params.evidence,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allDisputes"] });
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
    },
  });
}

export function useAdminDeleteDataset() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, bigint>({
    mutationFn: async (id) => {
      const a = actor as A;
      if (!a) throw new Error("Not authorized");
      return a.adminDeleteDataset(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      queryClient.invalidateQueries({ queryKey: ["allDisputes"] });
    },
  });
}

export function useIncrementDownloadCount() {
  const { actor } = useActor();
  return useMutation<unknown, Error, bigint>({
    mutationFn: async (id) => {
      const a = actor as A;
      if (!a) return;
      return a.incrementDownloadCount(id);
    },
  });
}
