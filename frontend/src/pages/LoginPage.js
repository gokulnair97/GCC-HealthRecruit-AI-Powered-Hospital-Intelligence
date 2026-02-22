import { useState } from "react";
import { useAuth, API } from "@/App";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, Mail, ArrowRight, Activity } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/login`, { email, password });
      login(res.data.token, res.data.email);
      toast.success("Welcome back!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left - Image/Brand */}
      <div className="hidden lg:flex lg:w-1/2 relative login-bg">
        <div className="absolute inset-0 bg-black/80" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold font-['Outfit'] text-white">GCC HealthRecruit</span>
            </div>
            <p className="text-zinc-500 text-sm mt-1">AI-Powered Hospital Intelligence</p>
          </div>
          
          <div className="animate-fade-in-up space-y-8">
            <h1 className="text-5xl font-bold font-['Outfit'] text-white leading-tight">
              GCC Private Hospital<br />
              <span className="gradient-text">HR Intelligence</span>
            </h1>
            <p className="text-zinc-400 text-lg max-w-md leading-relaxed">
              Access recruitment and HR details from every private hospital across 
              Saudi Arabia, UAE, Qatar, Kuwait, Bahrain & Oman.
            </p>
            <div className="flex gap-6 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                6 Countries
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                15+ Cities
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                AI Updated Daily
              </div>
            </div>
          </div>

          <p className="text-zinc-600 text-xs">Powered by GPT-5.2 AI Data Intelligence</p>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#09090B]">
        <div className="w-full max-w-md login-form">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold font-['Outfit'] text-white">GCC HealthRecruit</span>
          </div>

          <div className="space-y-2 mb-10">
            <h2 className="text-3xl font-bold font-['Outfit'] text-white">Sign in</h2>
            <p className="text-zinc-500">Access the GCC hospital directory</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6" data-testid="login-form">
            <div className="space-y-2">
              <Label className="text-zinc-400 text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <Input
                  data-testid="login-email-input"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-zinc-900/50 border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-zinc-100 placeholder:text-zinc-600 h-12 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400 text-sm">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <Input
                  data-testid="login-password-input"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-zinc-900/50 border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-zinc-100 placeholder:text-zinc-600 h-12 transition-all"
                />
              </div>
            </div>

            <Button
              data-testid="login-submit-button"
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-all shadow-lg shadow-blue-900/30 hover:shadow-blue-500/30 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-zinc-800/50">
            <p className="text-zinc-600 text-xs text-center">
              Secure access to GCC hospital recruitment data
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
