// Layout do painel: barra de navegação + sessão. Protegido pelo proxy.
import Link from "next/link";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-bold">
              HubDeMidia
            </Link>
            <Link href="/dashboard/sites" className="text-sm text-gray-600 hover:text-gray-900">
              Sites
            </Link>
            <Link href="/dashboard/generate" className="text-sm text-gray-600 hover:text-gray-900">
              Gerar com IA
            </Link>
            <Link href="/dashboard/settings" className="text-sm text-gray-600 hover:text-gray-900">
              Chaves IA
            </Link>
            {isAdmin && (
              <Link
                href="/dashboard/publish"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Publicação geral
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{session?.user?.email}</span>
            <SignOutButton />
          </div>
        </div>
      </nav>
      <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
    </div>
  );
}
