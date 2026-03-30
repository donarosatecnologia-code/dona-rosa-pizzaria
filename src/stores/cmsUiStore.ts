import { create } from "zustand";

export interface ConfirmDialogPayload {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
}

interface CmsUiState {
  confirmDialog: (ConfirmDialogPayload & { id: string }) | null;
  openConfirmDialog: (payload: ConfirmDialogPayload) => void;
  closeConfirmDialog: () => void;
}

let confirmId = 0;

export const useCmsUiStore = create<CmsUiState>((set) => ({
  confirmDialog: null,
  openConfirmDialog: (payload) => {
    confirmId += 1;
    set({ confirmDialog: { ...payload, id: String(confirmId) } });
  },
  closeConfirmDialog: () => set({ confirmDialog: null }),
}));

export function handleDeleteConfirmation(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
): void {
  useCmsUiStore.getState().openConfirmDialog({
    title,
    message,
    variant: "destructive",
    confirmLabel: "Excluir",
    onConfirm,
  });
}
