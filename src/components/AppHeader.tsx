import { AppNav } from "@/components/AppNav";
import { logout } from "@/app/actions/auth";

// Separado del nav (no en la misma fila) a propósito: con 5 tabs, "Salir"
// quedaba pegado al último tab y era fácil tocarlo por error.
export function AppHeader() {
  return (
    <header className="mb-6">
      <AppNav />
      <form action={logout} className="mt-2 flex justify-end">
        <button type="submit" className="text-xs text-zinc-400 underline dark:text-zinc-500">
          Salir
        </button>
      </form>
    </header>
  );
}
