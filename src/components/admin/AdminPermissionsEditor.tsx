import {
  ADMIN_ASSIGNABLE_MODULES,
  type AdminModuleKey,
  type AdminPermissionsMap,
} from "@/lib/adminPermissions";
import { Checkbox } from "@/components/ui/checkbox";

interface AdminPermissionsEditorProps {
  value: AdminPermissionsMap;
  onChange: (next: AdminPermissionsMap) => void;
  disabled?: boolean;
}

const ACTION_LABELS = {
  view: "Ver",
  edit: "Editar",
  delete: "Excluir",
} as const;

export function AdminPermissionsEditor({ value, onChange, disabled }: AdminPermissionsEditorProps) {
  function toggle(module: AdminModuleKey, action: keyof typeof ACTION_LABELS, checked: boolean) {
    onChange({
      ...value,
      [module]: {
        ...value[module],
        [action]: checked,
        ...(action === "view" && !checked ? { edit: false, delete: false } : {}),
        ...(action === "edit" && checked ? { view: true } : {}),
        ...(action === "delete" && checked ? { view: true, edit: true } : {}),
      },
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Marque o que esta pessoa pode ver, editar e excluir em cada área do painel.
      </p>
      {ADMIN_ASSIGNABLE_MODULES.map((module) => (
        <div key={module.key} className="rounded-lg border p-3">
          <div className="mb-2">
            <p className="text-sm font-medium">{module.label}</p>
            <p className="text-xs text-muted-foreground">{module.description}</p>
          </div>
          <div className="flex flex-wrap gap-4">
            {(Object.keys(ACTION_LABELS) as Array<keyof typeof ACTION_LABELS>).map((action) => (
              <label key={action} className="flex items-center gap-2 text-sm min-h-[44px]">
                <Checkbox
                  checked={value[module.key][action]}
                  disabled={disabled}
                  onCheckedChange={(checked) => toggle(module.key, action, checked === true)}
                />
                <span>{ACTION_LABELS[action]}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
