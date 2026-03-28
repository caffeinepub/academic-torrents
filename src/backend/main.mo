import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import Prim "mo:prim";
import Storage "blob-storage/Storage";

actor {
  // ── Authorization ──────────────────────────────────────────────
  let _accessControlState : AccessControl.AccessControlState = AccessControl.initState();

  public shared ({ caller }) func claimFirstAdmin() : async Bool {
    AccessControl.claimFirstAdmin(_accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(_accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(_accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(_accessControlState, caller);
  };

  // ── Blob Storage ───────────────────────────────────────────────
  transient let _caffeineStorageState : Storage.State = Storage.new();

  type _CaffeineStorageRefillInformation = { proposed_top_up_amount : ?Nat };
  type _CaffeineStorageRefillResult = { success : ?Bool; topped_up_amount : ?Nat };
  type _CaffeineStorageCreateCertificateResult = { method : Text; blob_hash : Text };

  public shared ({ caller }) func _caffeineStorageRefillCashier(info : ?_CaffeineStorageRefillInformation) : async _CaffeineStorageRefillResult {
    let cashier = await Storage.getCashierPrincipal();
    if (cashier != caller) Runtime.trap("Unauthorized");
    await Storage.refillCashier(_caffeineStorageState, cashier, info);
  };

  public shared func _caffeineStorageUpdateGatewayPrincipals() : async () {
    await Storage.updateGatewayPrincipals(_caffeineStorageState);
  };

  public query func _caffeineStorageBlobIsLive(hash : Blob) : async Bool {
    Prim.isStorageBlobLive(hash);
  };

  public query ({ caller }) func _caffeineStorageBlobsToDelete() : async [Blob] {
    if (not Storage.isAuthorized(_caffeineStorageState, caller)) Runtime.trap("Unauthorized");
    switch (Prim.getDeadBlobs()) {
      case (null) { [] };
      case (?deadBlobs) { deadBlobs.sliceToArray(0, 10000) };
    };
  };

  public shared ({ caller }) func _caffeineStorageConfirmBlobDeletion(blobs : [Blob]) : async () {
    if (not Storage.isAuthorized(_caffeineStorageState, caller)) Runtime.trap("Unauthorized");
    Prim.pruneConfirmedDeadBlobs(blobs);
    type GC = actor { __motoko_gc_trigger : () -> async () };
    let myGC = actor (debug_show (Prim.getSelfPrincipal<system>())) : GC;
    await myGC.__motoko_gc_trigger();
  };

  public shared func _caffeineStorageCreateCertificate(blobHash : Text) : async _CaffeineStorageCreateCertificateResult {
    { method = "upload"; blob_hash = blobHash };
  };

  // ── Types ──────────────────────────────────────────────────────
  public type FileEntry = { name : Text; size : Nat };

  public type DatasetStatus = { #active; #disputed; #provenFalse };

  public type Dataset = {
    id : Nat;
    title : Text;
    abstract_ : Text;
    authors : [Text];
    tags : [Text];
    magnetLink : Text;
    torrentFileId : ?Text;
    fileList : [FileEntry];
    totalSize : Nat;
    seeders : Nat;
    leechers : Nat;
    downloadCount : Nat;
    submittedBy : Principal;
    submissionDate : Int;
    status : DatasetStatus;
  };

  public type Comment = {
    id : Nat;
    datasetId : Nat;
    author : Principal;
    authorName : Text;
    body : Text;
    timestamp : Int;
  };

  public type DisputeStatus = { #open; #dismissed; #provenFalse };

  public type Dispute = {
    id : Nat;
    datasetId : Nat;
    openedBy : Principal;
    reason : Text;
    status : DisputeStatus;
    evidence : ?Text;
    resolvedBy : ?Principal;
    resolvedAt : ?Int;
  };

  // ── State ──────────────────────────────────────────────────────
  var nextDatasetId : Nat = 0;
  var nextCommentId : Nat = 0;
  var nextDisputeId : Nat = 0;

  let datasets : Map.Map<Nat, Dataset> = Map.empty();
  let comments : Map.Map<Nat, Comment> = Map.empty();
  let disputes : Map.Map<Nat, Dispute> = Map.empty();

  // ── Helpers ────────────────────────────────────────────────────
  func textContainsCI(haystack : Text, needle : Text) : Bool {
    Prim.textLowercase(haystack).contains(#text (Prim.textLowercase(needle)));
  };

  func arrayContainsText(arr : [Text], needle : Text) : Bool {
    let n = Prim.textLowercase(needle);
    var found = false;
    for (t in arr.vals()) {
      if (Prim.textLowercase(t).contains(#text n)) { found := true };
    };
    found;
  };

  func datasetsToArray() : [Dataset] {
    let varArr = datasets.toVarArray();
    Prim.Array_tabulate(varArr.size(), func(i : Nat) : Dataset { varArr[i].1 });
  };

  func commentsToArray() : [Comment] {
    let varArr = comments.toVarArray();
    Prim.Array_tabulate(varArr.size(), func(i : Nat) : Comment { varArr[i].1 });
  };

  func disputesToArray() : [Dispute] {
    let varArr = disputes.toVarArray();
    Prim.Array_tabulate(varArr.size(), func(i : Nat) : Dispute { varArr[i].1 });
  };

  // ── Dataset API ────────────────────────────────────────────────
  public shared ({ caller }) func submitDataset(
    title : Text,
    abstract_ : Text,
    authors : [Text],
    tags : [Text],
    magnetLink : Text,
    torrentFileId : ?Text,
    fileList : [FileEntry],
    totalSize : Nat,
    seeders : Nat,
    leechers : Nat
  ) : async Nat {
    if (caller.isAnonymous()) Runtime.trap("Must be logged in");
    let id = nextDatasetId;
    nextDatasetId += 1;
    datasets.add(id, {
      id;
      title;
      abstract_;
      authors;
      tags;
      magnetLink;
      torrentFileId;
      fileList;
      totalSize;
      seeders;
      leechers;
      downloadCount = 0;
      submittedBy = caller;
      submissionDate = Time.now();
      status = #active;
    });
    id;
  };

  public query func getDataset(id : Nat) : async ?Dataset {
    datasets.get(id);
  };

  public query func listDatasets(search : Text, page : Nat, pageSize : Nat) : async { items : [Dataset]; total : Nat } {
    let all = datasetsToArray();
    let filtered = if (search == "") {
      all.filter(func(d : Dataset) : Bool { d.status != #provenFalse });
    } else {
      all.filter(func(d : Dataset) : Bool {
        d.status != #provenFalse and (
          textContainsCI(d.title, search) or
          arrayContainsText(d.authors, search) or
          arrayContainsText(d.tags, search)
        );
      });
    };
    let total = filtered.size();
    let start = page * pageSize;
    let end_ = Nat.min(start + pageSize, total);
    let items = if (start >= total) { [] } else {
      filtered.sliceToArray(start, end_);
    };
    { items; total };
  };

  public query func getDatasetsByUser(user : Principal) : async [Dataset] {
    datasetsToArray().filter(func(d : Dataset) : Bool { d.submittedBy == user });
  };

  public shared func incrementDownloadCount(id : Nat) : async () {
    switch (datasets.get(id)) {
      case (null) { Runtime.trap("Dataset not found") };
      case (?d) {
        datasets.add(id, { d with downloadCount = d.downloadCount + 1 });
      };
    };
  };

  // ── Comment API ────────────────────────────────────────────────
  public shared ({ caller }) func addComment(datasetId : Nat, authorName : Text, body : Text) : async Nat {
    if (caller.isAnonymous()) Runtime.trap("Must be logged in");
    switch (datasets.get(datasetId)) {
      case (null) { Runtime.trap("Dataset not found") };
      case (?_) {};
    };
    let id = nextCommentId;
    nextCommentId += 1;
    comments.add(id, { id; datasetId; author = caller; authorName; body; timestamp = Time.now() });
    id;
  };

  public query func getComments(datasetId : Nat) : async [Comment] {
    commentsToArray().filter(func(c : Comment) : Bool { c.datasetId == datasetId });
  };

  // ── Dispute API ────────────────────────────────────────────────
  public shared ({ caller }) func openDispute(datasetId : Nat, reason : Text) : async Nat {
    if (caller.isAnonymous()) Runtime.trap("Must be logged in");
    switch (datasets.get(datasetId)) {
      case (null) { Runtime.trap("Dataset not found") };
      case (?d) {
        datasets.add(datasetId, { d with status = #disputed });
      };
    };
    let id = nextDisputeId;
    nextDisputeId += 1;
    disputes.add(id, {
      id;
      datasetId;
      openedBy = caller;
      reason;
      status = #open;
      evidence = null;
      resolvedBy = null;
      resolvedAt = null;
    });
    id;
  };

  public query func getDisputes(datasetId : Nat) : async [Dispute] {
    disputesToArray().filter(func(dsp : Dispute) : Bool { dsp.datasetId == datasetId });
  };

  public shared ({ caller }) func resolveDispute(disputeId : Nat, resolution : DisputeStatus, evidence : ?Text) : async () {
    if (not AccessControl.isAdmin(_accessControlState, caller)) Runtime.trap("Admin only");
    switch (disputes.get(disputeId)) {
      case (null) { Runtime.trap("Dispute not found") };
      case (?dsp) {
        let newStatus : DisputeStatus = switch (resolution) {
          case (#provenFalse) { #provenFalse };
          case (#dismissed) { #dismissed };
          case (#open) { Runtime.trap("Cannot resolve to open") };
        };
        disputes.add(disputeId, {
          dsp with
          status = newStatus;
          evidence;
          resolvedBy = ?caller;
          resolvedAt = ?Time.now();
        });
        switch (resolution) {
          case (#provenFalse) {
            switch (datasets.get(dsp.datasetId)) {
              case (null) {};
              case (?d) {
                datasets.add(dsp.datasetId, { d with status = #provenFalse });
              };
            };
          };
          case (#dismissed) {
            switch (datasets.get(dsp.datasetId)) {
              case (null) {};
              case (?d) {
                datasets.add(dsp.datasetId, { d with status = #active });
              };
            };
          };
          case (#open) {};
        };
      };
    };
  };

  // Admin delete -- only allowed when provenFalse
  public shared ({ caller }) func adminDeleteDataset(id : Nat) : async () {
    if (not AccessControl.isAdmin(_accessControlState, caller)) Runtime.trap("Admin only");
    switch (datasets.get(id)) {
      case (null) { Runtime.trap("Dataset not found") };
      case (?d) {
        if (d.status != #provenFalse) Runtime.trap("Cannot delete: dataset not proven false");
        datasets.remove(id);
      };
    };
  };

  public query func getAllDisputes() : async [Dispute] {
    disputesToArray();
  };
};
