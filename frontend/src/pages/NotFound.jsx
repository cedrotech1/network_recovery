import { Link } from 'react-router-dom';
import { loginPath } from '../utils/appPaths';

export function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f3f5f8] px-4">
      <h1 className="m-0 text-3xl font-bold text-gray-900">404</h1>
      <p className="mt-2 text-sm text-gray-500">Page not found</p>
      <Link to={loginPath()} className="mt-4 text-sm text-[#00628b] hover:underline">
        Back to sign in
      </Link>
    </div>
  );
}
