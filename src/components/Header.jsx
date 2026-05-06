import { useEffect, useRef, useState } from "react";
import { Compass, LayoutDashboard, LogOut, Plus, User } from "lucide-react";
import { signOut } from "../lib/auth";

export default function Header({ user, view, onViewChange, onLoginClick }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  async function handleSignOut() {
    await signOut();
    setMenuOpen(false);
    onViewChange("home");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <button
          onClick={() => onViewChange(user ? "dashboard" : "home")}
          className="flex items-center gap-3"
          type="button"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
            <Compass className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="text-left">
            <h1 className="text-lg font-black text-slate-950 sm:text-xl">Career GPS</h1>
            <p className="hidden text-xs font-medium text-slate-600 sm:block">
              Adaptive Decision Support
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <button
                onClick={() => onViewChange("dashboard")}
                className={`hidden h-10 items-center gap-2 rounded-md px-3 text-sm font-bold transition sm:inline-flex ${
                  view === "dashboard"
                    ? "bg-slate-950 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
                type="button"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </button>
              <button
                onClick={() => onViewChange("new")}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-600 px-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                type="button"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New plan</span>
              </button>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-700 transition hover:bg-slate-300"
                  title={user.email}
                  type="button"
                >
                  <User className="h-5 w-5" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Signed in as
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        onViewChange("dashboard");
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:hidden"
                      type="button"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      type="button"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={onLoginClick}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
              type="button"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
