import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importContactsFromFile, type ImportContactsOptions } from "@/lib/whatsapp/importContacts";

interface ImportContactsInput extends ImportContactsOptions {
  file: File;
}

export function useImportContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, onProgress }: ImportContactsInput) =>
      importContactsFromFile(file, { onProgress }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "contacts"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "import-batches"] });
    },
  });
}
