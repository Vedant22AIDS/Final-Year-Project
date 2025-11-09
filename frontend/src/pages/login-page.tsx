import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { ArrowLeft } from "lucide-react";

const LoginForm: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const paramMode = params.get("mode");
  const initialMode = paramMode === "signup" ? "signup" : "login";

  const { loginWithRedirect, isLoading: auth0Loading } = useAuth0();
  const [isRegister, setIsRegister] = useState(initialMode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    setIsRegister(initialMode === "signup");
    // keep URL consistent
    const u = new URL(window.location.href);
    u.searchParams.set("mode", initialMode);
    window.history.replaceState({}, "", u.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMode]);

  const toggleForm = () => setIsRegister((s) => !s);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      // Auth0 Universal Login: prefill email via login_hint and open login or signup flow.

      await loginWithRedirect({
        authorizationParams: {
          screen_hint: isRegister ? "signup" : "login",
          login_hint: email || undefined,
        },
      });
      // Auth0 will redirect to the callback after authentication.
    } catch (err) {
      console.error("Auth redirect error:", err);
    }
  };

  const handleSocialLogin = async (connection: string) => {
    try {
      await loginWithRedirect({
        authorizationParams: {
          connection,
        },
      });
    } catch (err) {
      console.error("Social login failed:", err);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="min-h-screen flex">
        {/* Left Panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 to-black text-white flex-col justify-between p-12 relative">
          <button
            onClick={() => navigate("/")}
            className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2.5 bg-gray-800/80 backdrop-blur-sm text-white rounded-lg shadow-lg hover:bg-gray-700/80 transition-all duration-200 border border-gray-700/50"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </button>

          <header className="flex justify-center py-4">
            <div className="flex items-center gap-2 font-bold text-xl text-white bg-gray-800 px-4 py-2 rounded-xl shadow-lg">
              <img
                className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                src='/assets/logo.png'
                alt="DATABits logo"
              />
              <span>DATABits</span>
            </div>
          </header>

          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Welcome to DATABits
            </h1>
            <p className="text-gray-300 text-xl leading-relaxed max-w-md mx-auto">
              The fastest way to preprocess your data effortlessly
            </p>
          </div>

          <main className="w-full bg-white/95 backdrop-blur-sm text-black rounded-2xl shadow-2xl flex flex-col md:flex-row items-center justify-between p-10 border border-gray-200/20">
            <div className="md:w-2/3 mb-8 md:mb-0 space-y-6">
              <h2 className="text-4xl font-bold leading-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Simplify Your Data Preprocessing
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Automate missing value handling, scaling, encoding, and more -
                no coding required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    setIsRegister(true);
                    setTimeout(() => handleSubmit(), 50);
                  }}
                  disabled={auth0Loading}
                  className="bg-gradient-to-r from-gray-900 to-black text-white px-8 py-3 rounded-lg hover:from-gray-800 hover:to-gray-900 transition-all duration-200 shadow-lg font-medium disabled:opacity-50"
                >
                  Get Started Free
                </button>
                <button
                  onClick={() => window.open("/demo", "_self")}
                  className="bg-transparent border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                >
                  Watch Demo
                </button>
              </div>
            </div>

            <div className="md:w-1/3 flex justify-center">
              <img
                src='/assets/login-left-img.png'
                alt="Illustration of Data Visualization"
                className="w-56 h-56 object-cover rounded-2xl shadow-lg"
                loading="lazy"
              />
            </div>
          </main>

          <footer className="mt-8 w-full flex justify-between items-center text-gray-400 text-sm">
            <p>© 2025 DATABits Inc. All rights reserved.</p>
            <div className="flex space-x-6 items-center">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-110 transition-transform duration-200"
              >
                <img
                  className="w-6 h-6 opacity-80 hover:opacity-100"
                  src="https://images.icon-icons.com/3685/PNG/512/github_logo_icon_229278.png"
                  alt="GitHub"
                  loading="lazy"
                />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-110 transition-transform duration-200"
              >
                <img
                  className="w-6 h-6 bg-white rounded opacity-80 hover:opacity-100"
                  src="https://images.icon-icons.com/1458/PNG/512/linkedinlogokey_99649.png"
                  alt="LinkedIn"
                  loading="lazy"
                />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-110 transition-transform duration-200"
              >
                <img
                  className="w-6 h-6 opacity-80 hover:opacity-100"
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4MO1TMYnn2oFmZyYcdCiaJfyuHSk2QO7440mhgMg1ZgXfz_nLhxlT5Zm8uS_H8WTarNI&usqp=CAU"
                  alt="Twitter/X"
                  loading="lazy"
                />
              </a>
            </div>
          </footer>
        </div>

        {/* Right Side - Auth Card */}
        <div className="relative flex flex-1 justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 overflow-hidden">
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: "url('/assets/login-right-img.png')",
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.8,
            }}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-md px-2">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
              {/* Header */}
              <div className="text-center pb-3 pt-5 px-3 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {isRegister ? "Create Account" : "Welcome Back"}
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {isRegister
                    ? "Sign up to get started with DATABits"
                    : "Sign in to your DATABits account"}
                </p>
              </div>

              {/* Form */}
              <div className="space-y-4 px-4 py-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-400 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="you@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-400 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your password"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This form uses Auth0 Universal Login. After submit you'll
                      be redirected to Auth0 where you can complete
                      signin/signup.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={auth0Loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {auth0Loading
                      ? "Working…"
                      : isRegister
                      ? "Create Account"
                      : "Sign In"}
                  </button>
                </form>

                <div className="text-center">
                  <button
                    onClick={toggleForm}
                    disabled={auth0Loading}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                  >
                    {isRegister
                      ? "Already have an account? Sign in"
                      : "Don't have an account? Sign up"}
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white text-gray-500 font-medium">
                      Or {isRegister ? "sign up" : "sign in"} with
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      provider: "google-oauth2",
                      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/800px-Google_%22G%22_logo.svg.png",
                      alt: "Google",
                    },
                    {
                      provider: "github",
                      src: "https://cdn-icons-png.flaticon.com/512/25/25231.png",
                      alt: "GitHub",
                    },
                    {
                      provider: "windowslive",
                      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/1200px-Microsoft_logo.svg.png",
                      alt: "Microsoft",
                    },
                  ].map(({ provider, src, alt }) => (
                    <button
                      key={provider}
                      type="button"
                      onClick={() => handleSocialLogin(provider)}
                      disabled={auth0Loading}
                      className="p-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-50"
                    >
                      <img
                        className="w-5 h-5 mx-auto"
                        src={src}
                        alt={alt}
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>

                <div className="text-center text-sm text-gray-600 leading-relaxed">
                  <p>
                    By signing in, you agree to our{" "}
                    <a
                      href="/terms"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                      href="/privacy"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Privacy Policy
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* end right side */}
      </div>
    </div>
  );
};

export default LoginForm;
