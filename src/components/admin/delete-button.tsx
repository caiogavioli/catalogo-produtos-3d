"use client";

export function DeleteButton({ action, label = "Excluir" }: { action: () => Promise<void>; label?: string }) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!confirm("Confirma a exclusão? Essa ação não pode ser desfeita.")) {
          event.preventDefault();
        }
      }}
    >
      <button type="submit" className="text-sm text-red-600 hover:underline">
        {label}
      </button>
    </form>
  );
}
