import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importContactsFromCsv } from "@/lib/whatsapp/importContacts";

export function useImportContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => importContactsFromCsv(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "contacts"] });
    },
  });
}
