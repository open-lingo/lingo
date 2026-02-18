import { Link } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";

export function HomePage() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Welcome to Open Lingo</h1>

      {isAuthenticated && user ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-gray-600">
            Logged in as <span className="font-medium text-gray-900">{user.email ?? user.name}</span>
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              to="/logout"
              className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Log out
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-gray-600">Sign in to start learning.</p>
          <div className="flex gap-3">
            <Link
              to="/login"
              className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Log in
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
