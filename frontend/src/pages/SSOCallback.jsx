import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';

function SSOCallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] text-slate-900">
      <div className="text-center space-y-4">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-sage border-t-transparent" />
        <p className="text-sm font-medium text-slate-600">Completing sign in...</p>
        <AuthenticateWithRedirectCallback />
      </div>
    </div>
  );
}

export default SSOCallback;
