import React, { useState } from 'react';
import { UserProfile } from '../types';
import {
  ShieldCheck,
  Key,
  X,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  UserCheck,
  Lock,
  ExternalLink,
} from 'lucide-react';

interface OAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onUpdateSession: (newProfile: UserProfile) => void;
}

export const OAuthModal: React.FC<OAuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateSession,
}) => {
  const [copiedToken, setCopiedToken] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleOAuthLogin = async (roleName: string, email: string, avatar: string, providerName: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/oauth-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerName,
          customUser: {
            name: roleName,
            email,
            avatar,
            role: roleName,
          },
        }),
      });
      const data = await res.json();
      if (data.user) {
        onUpdateSession(data.user);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    if (user?.token) {
      navigator.clipboard.writeText(user.token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 1600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-lg p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                OAuth 2.0 Session & Security Controller
              </h2>
              <div className="text-xs text-slate-500">RFC 6749 Protocol Authentication</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Session Card */}
        {user && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-blue-500 shadow-sm"
                />
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {user.name}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">{user.email}</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified
              </span>
            </div>

            <div className="space-y-1.5 pt-2 text-xs font-mono border-t border-slate-200 dark:border-slate-800">
              <div className="flex justify-between text-slate-500">
                <span>OAuth Identity Provider:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{user.provider}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Role Access Tier:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{user.role}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Token Protocol:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Bearer Token (RFC 6750)</span>
              </div>
            </div>

            {/* Token Copy Box */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                <span>Active Bearer Token:</span>
                <button
                  onClick={copyToken}
                  className="flex items-center gap-1 text-blue-500 hover:text-blue-600 font-mono text-[11px]"
                >
                  {copiedToken ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedToken ? 'Copied' : 'Copy Token'}</span>
                </button>
              </div>
              <div className="p-2 rounded bg-slate-900 text-slate-300 font-mono text-[11px] truncate border border-slate-800">
                {user.token}
              </div>
            </div>
          </div>
        )}

        {/* Switch OAuth Profiles / Re-authenticate */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Switch Role or Exchange OAuth 2.0 Credentials:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              {
                role: 'Alex Mercer (Lead NetOps)',
                email: 'alex.mercer@netscope.internal',
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
                provider: 'Google Workspace OAuth 2.0',
              },
              {
                role: 'Dr. Sarah Lin (Cloud Architect)',
                email: 'sarah.lin@enterprise.cloud',
                avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
                provider: 'Google Workspace Enterprise',
              },
              {
                role: 'Marcus Vance (Security Lead)',
                email: 'marcus.vance@secops.io',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
                provider: 'Okta / OAuth 2.0 SSO',
              },
              {
                role: 'Elena Rostova (DevOps SRE)',
                email: 'elena.rostova@infra.net',
                avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
                provider: 'GitHub OAuth 2.0 App',
              },
            ].map((prof, i) => (
              <button
                key={i}
                disabled={loading}
                onClick={() => handleOAuthLogin(prof.role, prof.email, prof.avatar, prof.provider)}
                className="p-3 text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-600 bg-white dark:bg-slate-900 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <img src={prof.avatar} alt={prof.role} className="w-7 h-7 rounded-full object-cover" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {prof.role}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{prof.provider}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Security Footer */}
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-200">
          <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            All network commands, monitoring daemons, and developer REST calls are cryptographically signed with session tokens and TLS 1.3 forward secrecy.
          </p>
        </div>
      </div>
    </div>
  );
};
