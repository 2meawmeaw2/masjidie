import { supabase } from "@/lib/supabase";
import { create } from "zustand";

export interface PendingRequest {
  id: string;
  created_at: string;
  requester_id: string;
  requester_email: string | null;
  action_type: string;
  target_table: string;
  target_record_id: string | null;
  payload: Record<string, unknown> | null;
  status: "pending" | "approved" | "rejected";
  reviewer_note: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

interface RequestsState {
  myRequests: PendingRequest[];
  allRequests: PendingRequest[];
  pendingCount: number;
  isLoading: boolean;
  error: string | null;
  mosqueApproved: boolean;

  submitRequest: (
    actionType: string,
    targetTable: string,
    targetRecordId: string | null,
    payload: Record<string, unknown>,
  ) => Promise<boolean>;
  fetchMyRequests: () => Promise<void>;
  fetchAllPending: () => Promise<void>;
  fetchAllRequests: (statusFilter?: string) => Promise<void>;
  approveRequest: (id: string, note?: string) => Promise<boolean>;
  rejectRequest: (id: string, note?: string) => Promise<boolean>;
  fetchPendingCount: () => Promise<void>;
  checkMosqueApproval: () => Promise<void>;
}

export const useRequestsStore = create<RequestsState>((set) => ({
  myRequests: [],
  allRequests: [],
  pendingCount: 0,
  isLoading: false,
  error: null,
  mosqueApproved: true,

  submitRequest: async (actionType, targetTable, targetRecordId, payload) => {
    set({ isLoading: true, error: null });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      set({ error: "Not authenticated", isLoading: false });
      return false;
    }

    const { error } = await supabase.from("pending_requests").insert({
      requester_id: user.id,
      requester_email: user.email,
      action_type: actionType,
      target_table: targetTable,
      target_record_id: targetRecordId,
      payload,
    });

    if (error) {
      set({ error: error.message, isLoading: false });
      return false;
    }
    set({ isLoading: false });
    return true;
  },

  fetchMyRequests: async () => {
    set({ isLoading: true });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      set({ isLoading: false });
      return;
    }

    const { data, error } = await supabase
      .from("pending_requests")
      .select("*")
      .eq("requester_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      set({ myRequests: data as PendingRequest[] });
    }
    set({ isLoading: false });
  },

  fetchAllPending: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from("pending_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!error && data) {
      set({ allRequests: data as PendingRequest[], pendingCount: data.length });
    }
    set({ isLoading: false });
  },

  fetchAllRequests: async (statusFilter?: string) => {
    set({ isLoading: true });
    let query = supabase
      .from("pending_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (!error && data) {
      set({ allRequests: data as PendingRequest[] });
    }
    set({ isLoading: false });
  },

  approveRequest: async (id, note) => {
    set({ isLoading: true, error: null });
    const { error } = await supabase.rpc("approve_request", {
      request_id: id,
      note: note ?? null,
    });

    if (error) {
      set({ error: error.message, isLoading: false });
      return false;
    }
    set({ isLoading: false });
    return true;
  },

  rejectRequest: async (id, note) => {
    set({ isLoading: true, error: null });
    const { error } = await supabase.rpc("reject_request", {
      request_id: id,
      note: note ?? null,
    });

    if (error) {
      set({ error: error.message, isLoading: false });
      return false;
    }
    set({ isLoading: false });
    return true;
  },

  fetchPendingCount: async () => {
    const { count, error } = await supabase
      .from("pending_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    if (!error && count !== null) {
      set({ pendingCount: count });
    }
  },

  checkMosqueApproval: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (user.user_metadata?.role === "super_admin") {
      set({ mosqueApproved: true });
      return;
    }

    const { data, error } = await supabase
      .from("pending_requests")
      .select("id")
      .eq("requester_id", user.id)
      .in("action_type", ["register_mosque", "register_school"])
      .eq("status", "pending")
      .limit(1);

    if (!error && data) {
      set({ mosqueApproved: data.length === 0 });
    }
  },
}));
