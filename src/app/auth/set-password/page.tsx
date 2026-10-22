import { setPassword } from "./actions";

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-bold text-dr-neutral-900">Crea tu contraseña</h1>
          <p className="mt-1 text-sm text-neutral-500">Última vez que la necesitarás pedir — úsala para entrar a tu cuenta.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-error-bg px-3 py-2 text-sm text-error">{error}</div>
        )}

        <form action={setPassword} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
          >
            Guardar y entrar
          </button>
        </form>
      </div>
    </div>
  );
}
