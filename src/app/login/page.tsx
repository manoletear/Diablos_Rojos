import { login, pedirMagicLink } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; magicSent?: string; magicError?: string; apoderado?: string }>;
}) {
  const { error, magicSent, magicError, apoderado } = await searchParams;
  const modoApoderado = apoderado === "1";

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/logo.png" alt="DR Taktik" className="mb-2 h-20 w-20 object-contain" />
          <h1 className="text-lg font-bold text-dr-neutral-900">Diablos Rojos</h1>
          <p className="mt-1 text-sm text-neutral-500">Ingresa a tu cuenta</p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-primary-50 px-3 py-2 text-sm text-primary-600">{error}</div>
        )}
        {magicError && (
          <div className="mb-4 rounded-md bg-error-bg px-3 py-2 text-sm text-error">{magicError}</div>
        )}

        {modoApoderado ? (
          magicSent ? (
            <div className="rounded-md bg-success-bg px-3 py-2 text-sm text-success">
              Listo. Te enviamos un link a tu correo — tiene 30 minutos de duración. Ábrelo desde el mismo celular/computador.
            </div>
          ) : (
            <form action={pedirMagicLink} className="space-y-4">
              <div>
                <label htmlFor="email-ap" className="block text-sm font-medium text-neutral-700">
                  Email registrado con la academia
                </label>
                <input
                  id="email-ap"
                  name="email"
                  type="email"
                  required
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
              >
                Enviarme el link de ingreso
              </button>
            </form>
          )
        ) : (
          <form action={login} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
            >
              Ingresar
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-neutral-500">
          {modoApoderado ? (
            <a href="/login" className="font-medium text-primary-600 hover:underline">
              Soy director, admin o entrenador — ingresar con contraseña
            </a>
          ) : (
            <a href="/login?apoderado=1" className="font-medium text-primary-600 hover:underline">
              ¿Eres apoderado? Ingresa solo con tu email
            </a>
          )}
        </p>
      </div>
    </div>
  );
}
