import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Mail, Eye, EyeOff, LogIn, ArrowLeft, UserPlus, ShieldCheck } from "lucide-react";
import logo from "@/assets/logo-icon.png";

type Screen = "login" | "forgot" | "reset_sent" | "request_access" | "request_sent";

const AdminLogin = () => {
  const [screen, setScreen] = useState<Screen>("login");
  const [email, setEmail] = useState("Harivemula.a4@gmail.com");
  const [password, setPassword] = useState("Chitrashala@123");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const reset = () => setError("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      setError("Access denied. Your account does not have admin privileges.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    navigate("/admin");
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    if (!email.trim()) { setError("Enter your email address first."); return; }
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/login`,
    });

    if (error) { setError(error.message); setLoading(false); return; }
    setScreen("reset_sent");
    setLoading(false);
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    if (!email.trim() || !displayName.trim()) { setError("All fields are required."); return; }
    setLoading(true);

    const { data: existing } = await supabase
      .from("admin_requests")
      .select("status")
      .eq("email", email.trim())
      .single();

    if (existing) {
      if (existing.status === "pending") setError("A request for this email is already pending.");
      else if (existing.status === "approved") setError("This email is already approved. Please sign in.");
      else setError("Your previous request was rejected.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("admin_requests")
      .insert({ email: email.trim(), display_name: displayName.trim() });

    if (error) { setError("Failed to submit: " + error.message); setLoading(false); return; }
    setScreen("request_sent");
    setLoading(false);
  };

  const inputClass = "w-full pl-12 pr-4 py-3 bg-card border border-border text-foreground text-sm tracking-wider placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-colors";
  const btnClass = "w-full py-3 bg-primary text-primary-foreground text-sm tracking-[0.2em] uppercase hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <Link to="/" className="fixed top-6 left-6 flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors duration-300 group">
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-300" />
        Back
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-10">
          <img src={logo} alt="Chitrashala" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-3xl font-light text-foreground tracking-[0.15em]" style={{ fontFamily: "var(--font-display)" }}>
            {screen === "forgot" ? "Reset Password" :
             screen === "reset_sent" ? "Email Sent" :
             screen === "request_access" ? "Request Access" :
             screen === "request_sent" ? "Request Sent" :
             "Admin Panel"}
          </h1>
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mt-2">Chitrashala Studio</p>
        </div>

        <AnimatePresence mode="wait">

          {screen === "login" && (
            <motion.form key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Email" className={inputClass} required />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type={showPassword ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="Password"
                  className="w-full pl-12 pr-12 py-3 bg-card border border-border text-foreground text-sm tracking-wider placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-colors" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && <p className="text-destructive text-xs text-center">{error}</p>}
              <button type="submit" disabled={loading} className={btnClass}>
                {loading ? "Signing in..." : <><LogIn className="w-4 h-4" /> Sign In</>}
              </button>
              <div className="flex justify-between pt-1">
                <button type="button" onClick={() => { reset(); setScreen("forgot"); }}
                  className="text-xs tracking-[0.15em] text-muted-foreground hover:text-primary transition-colors">
                  Forgot Password?
                </button>
                <button type="button" onClick={() => { reset(); setScreen("request_access"); }}
                  className="text-xs tracking-[0.15em] text-muted-foreground hover:text-primary transition-colors">
                  Request Access
                </button>
              </div>
            </motion.form>
          )}

          {screen === "forgot" && (
            <motion.form key="forgot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-xs text-center text-muted-foreground tracking-wide">
                Enter your admin email and we'll send a password reset link.
              </p>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Email" className={inputClass} required />
              </div>
              {error && <p className="text-destructive text-xs text-center">{error}</p>}
              <button type="submit" disabled={loading} className={btnClass}>
                {loading ? "Sending..." : <><Mail className="w-4 h-4" /> Send Reset Link</>}
              </button>
              <button type="button" onClick={() => { reset(); setScreen("login"); }}
                className="w-full text-xs tracking-[0.15em] text-muted-foreground hover:text-primary transition-colors text-center pt-1">
                ← Back to Login
              </button>
            </motion.form>
          )}

          {screen === "reset_sent" && (
            <motion.div key="reset_sent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-full border border-primary/30 flex items-center justify-center">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-sm text-foreground tracking-wide">Password reset email sent!</p>
                <p className="text-xs text-muted-foreground mt-2">Check your inbox at <span className="text-primary">{email}</span>.</p>
              </div>
              <button onClick={() => { reset(); setScreen("login"); }}
                className="text-xs tracking-[0.15em] text-muted-foreground hover:text-primary transition-colors">
                ← Back to Login
              </button>
            </motion.div>
          )}

          {screen === "request_access" && (
            <motion.form key="request" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onSubmit={handleRequestAccess} className="space-y-4">
              <p className="text-xs text-center text-muted-foreground tracking-wide">
                Submit a request to get admin access. The owner will review and approve it.
              </p>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Your Email" className={inputClass} required />
              </div>
              <div className="relative">
                <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your Name" className={inputClass} required />
              </div>
              {error && <p className="text-destructive text-xs text-center">{error}</p>}
              <button type="submit" disabled={loading} className={btnClass}>
                {loading ? "Submitting..." : <><UserPlus className="w-4 h-4" /> Submit Request</>}
              </button>
              <button type="button" onClick={() => { reset(); setScreen("login"); }}
                className="w-full text-xs tracking-[0.15em] text-muted-foreground hover:text-primary transition-colors text-center pt-1">
                ← Back to Login
              </button>
            </motion.form>
          )}

          {screen === "request_sent" && (
            <motion.div key="request_sent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-full border border-primary/30 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-sm text-foreground tracking-wide">Request submitted!</p>
                <p className="text-xs text-muted-foreground mt-2">You'll receive access once approved.</p>
              </div>
              <button onClick={() => { reset(); setScreen("login"); }}
                className="text-xs tracking-[0.15em] text-muted-foreground hover:text-primary transition-colors">
                ← Back to Login
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
