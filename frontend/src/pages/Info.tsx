// // src/pages/LearnMore.tsx
import React from "react"
import { Link } from "react-router-dom"
import {
  Zap,
  Cpu,
  Database,
  BarChart2,
  ShieldOff,
  Sparkles,
  Play,
  CheckCircle,
  Users,
  Star,
  Award,
} from "lucide-react"

type Feature = {
  id: string
  title: string
  desc: string
  icon: React.ReactNode
  accent?: string
}

const FEATURES: Feature[] = [
  {
    id: "f1",
    title: "Workflow Acceleration",
    desc: "Cut standard data-preprocessing times by up to 40% with curated pipelines and parallelized transforms.",
    icon: <Zap className="w-6 h-6" />,
    accent: "from-pink-600 to-indigo-800",
  },
  {
    id: "f2",
    title: "AI-Powered Data Profiling",
    desc: "Automatic dataset scans uncover anomalies, drift, and data quality issues — with visual summaries and a single data-quality score.",
    icon: <BarChart2 className="w-6 h-6" />,
    accent: "from-green-600 to-green-800",
  },
  {
    id: "f3",
    title: "Enterprise-Grade Reliability",
    desc: "SLA-ready architecture, audit logs, role-based access, and encryption at rest & in transit.",
    icon: <ShieldOff className="w-6 h-6" />,
    accent: "from-orange-400 to-rose-800",
  },
  {
    id: "f4",
    title: "Infinite Scale",
    desc: "Auto-scaling pipelines and distributed compute for petabyte workloads with near-linear scaling.",
    icon: <Database className="w-6 h-6" />,
    accent: "from-cyan-400 to-blue-800",
  },
  {
    id: "f5",
    title: "Rich Visual Summaries",
    desc: "Interactive charts, heatmaps, and sample previews that make data quality and patterns instantly actionable.",
    icon: <Cpu className="w-6 h-6" />,
    accent: "from-indigo-400 to-violet-800",
  },
  {
    id: "f6",
    title: "Modern Tech Stack",
    desc: "Built with React, cloud-native services, and AI-assisted processing for reliability and developer productivity.",
    icon: <Sparkles className="w-6 h-6" />,
    accent: "from-amber-400 to-yellow-800",
  },
]

export default function LearnMore(): JSX.Element {
  return (
    <main className="min-h-screen bg-black text-slate-100">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-40 -right-40 w-[680px] h-[680px] rounded-full blur-[80px] opacity-20 bg-gradient-to-tr from-indigo-700 via-pink-600 to-rose-500 pointer-events-none"
        />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-medium text-indigo-300 bg-indigo-900/20 px-3 py-1 rounded-full">
                <Award className="w-4 h-4 text-indigo-300" /> Trusted by modern data teams
              </p>

              <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">
                DATABits 
              </h1>
<h1 className="text-pink-800 text-xl sm:text-2xl font-extrabold leading-tight tracking-tight">
                Data preprocessing, reimagined.
              </h1>

              <p className="mt-4 text-lg text-slate-300 max-w-2xl">
                Accelerate your data workflows, fix data quality issues before they reach production, and deploy with confidence.
                AI-powered profiling, visual summaries and scalable pipelines — all in one platform.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/demo"
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white px-5 py-3 rounded-xl font-semibold shadow-lg"
                  aria-label="Watch live demo"
                >
                  <Play className="w-4 h-4" />
                  Watch Live Demo
                </Link>

                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-2 border border-slate-700 text-slate-100 px-4 py-3 rounded-xl hover:bg-white/5"
                >
                  <Users className="w-4 h-4" />
                  Get Pricing
                </Link>
              </div>

              {/* Quick metrics */}
              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Metric value="40%" label="Faster preprocessing" />
                <Metric value="100ms" label="Avg transform latency" />
                <Metric value="AI" label="Profiling & insights" />
                <Metric value="99.9%" label="Uptime SLA" />
              </div>
            </div>

            {/* Right visual */}
            <aside className="relative">
              <div className="w-full h-full rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-800/40 border border-slate-700 p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold">AI Data Profile</h3>
                    <p className="text-sm text-slate-400 mt-1">Quality score, anomalies, and drift overview</p>
                  </div>
                  <div className="text-sm text-slate-300">
                    <div>Score</div>
                    <div className="mt-2 text-3xl font-bold text-emerald-400">86</div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-slate-900/50 p-4 border border-slate-700">
                    {/* Simple sparkline / mini chart placeholder (SVG) */}
                    <svg viewBox="0 0 120 40" className="w-full h-20" aria-hidden>
                      <polyline fill="none" stroke="#7c3aed" strokeWidth="3" points="0,30 20,20 40,24 60,12 80,18 100,8 120,10" />
                    </svg>
                    <div className="mt-2 text-xs text-slate-400">Anomaly count over time</div>
                  </div>

                  <div className="rounded-lg bg-slate-900/50 p-4 border border-slate-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-400">Missing values</div>
                        <div className="mt-1 font-semibold">12 columns affected</div>
                      </div>
                      <div className="text-xs text-slate-400">Top issues</div>
                    </div>

                    <ul className="mt-3 space-y-2">
                      <li className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-rose-600/20 text-rose-400 text-xs">1</span>
                        <div className="text-sm">Inconsistent dates in <b>created_at</b></div>
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-amber-400/20 text-amber-300 text-xs">2</span>
                        <div className="text-sm">Nulls in <b>customer_id</b></div>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-xs text-slate-400">Preview sample</div>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {/* sample chips */}
                    <div className="rounded bg-slate-800/60 p-2 text-xs border border-slate-700">Alice, 31, NY</div>
                    <div className="rounded bg-slate-800/60 p-2 text-xs border border-slate-700">Bob, 28, SF</div>
                    <div className="rounded bg-slate-800/60 p-2 text-xs border border-slate-700">Charlie, 44, LD</div>
                  </div>
                </div>
              </div>

              {/* small badges */}
              <div className="mt-4 flex gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-slate-900/60 border border-slate-700 text-xs text-slate-300">
                  <Star className="w-4 h-4 text-yellow-400" /> AI-driven
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-slate-900/60 border border-slate-700 text-xs text-slate-300">
                  <Cpu className="w-4 h-4 text-cyan-300" /> Serverless-ready
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold">What makes DATABits different</h2>
          <p className="mt-3 text-slate-400 max-w-2xl">A unified platform combining automation, AI-driven insights and enterprise-grade reliability.</p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <article
                key={f.id}
                className="group rounded-2xl border border-slate-700/50 bg-gradient-to-b from-slate-900/40 to-slate-900/10 p-6 hover:shadow-xl transition-shadow"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${f.accent} text-white`}>
                  {f.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-slate-400 text-sm">{f.desc}</p>

                <div className="mt-4">
                  <Link to="/learn-more" className="text-indigo-300 text-sm hover:underline inline-flex items-center gap-2">
                    Learn more
                    <ChevronRightIcon />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="bg-slate-900/40 border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl font-bold">From Raw to Ready: Optimized Workflows</h2>
              <p className="mt-3 text-slate-400 max-w-xl">
                Create repeatable, auditable pipelines with visual operators, preview results at each step, and push transforms to production with a single click.
              </p>

              <ol className="mt-8 space-y-6">
                <li className="flex items-start gap-4">
                  <span className="mt-1 inline-flex items-center justify-center w-9 h-9 rounded-full bg-indigo-600 text-white font-semibold">1</span>
                  <div>
                    <div className="font-semibold">Ingest & profile</div>
                    <div className="text-slate-400 text-sm">Auto-detect schema, quality issues and field types.</div>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <span className="mt-1 inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-600 text-white font-semibold">2</span>
                  <div>
                    <div className="font-semibold">Transform & validate</div>
                    <div className="text-slate-400 text-sm">Composable transforms, schema checks and test assertions.</div>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <span className="mt-1 inline-flex items-center justify-center w-9 h-9 rounded-full bg-rose-500 text-white font-semibold">3</span>
                  <div>
                    <div className="font-semibold">Deploy & monitor</div>
                    <div className="text-slate-400 text-sm">Run in serverless or cluster mode; track drift and alerts.</div>
                  </div>
                </li>
              </ol>

              <div className="mt-8 flex gap-3">
                <Link to="/signup" className="inline-flex items-center gap-3 bg-emerald-600 px-5 py-3 rounded-lg text-black font-bold">
                  <CheckCircle className="w-4 h-4" />
                  Start free trial
                </Link>
                <Link to="/contact" className="inline-flex items-center gap-2 border px-4 py-3 rounded-lg text-slate-200 hover:bg-white/5">
                  Contact Sales
                </Link>
              </div>
            </div>

            <div>
              {/* Large mock screenshot - replace /assets/screenshots with real screenshot */}
              <div className="rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
                <img src="/assets/dashboard.png" alt="DATABits dashboard" className="w-full h-72 object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison / ROI */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold">The ROI speaks for itself</h2>
          <p className="mt-3 text-slate-400 max-w-2xl mx-auto">Faster pipelines, fewer incidents, and high-confidence data ready for analytics and ML.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl bg-slate-900/40 p-6 border border-slate-700 text-center">
            <div className="text-sm text-slate-400">Avg cost savings</div>
            <div className="mt-3 text-3xl font-extrabold">35%</div>
            <div className="mt-2 text-slate-400 text-sm">Reduced time spent on data ops</div>
          </div>

          <div className="rounded-xl bg-slate-900/40 p-6 border border-slate-700 text-center">
            <div className="text-sm text-slate-400">Time to value</div>
            <div className="mt-3 text-3xl font-extrabold">2–4 weeks</div>
            <div className="mt-2 text-slate-400 text-sm">From trial to production</div>
          </div>

          <div className="rounded-xl bg-slate-900/40 p-6 border border-slate-700 text-center">
            <div className="text-sm text-slate-400">Data quality increase</div>
            <div className="mt-3 text-3xl font-extrabold">+28 pts</div>
            <div className="mt-2 text-slate-400 text-sm">Average improvement in data quality score</div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gradient-to-b from-slate-900/20 to-transparent border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-center">What customers say</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Testimonial
              quote="DATABits cut our preprocessing cycle by half and surfaced data quality issues before they impacted ML training."
              name="Samantha Lee"
              role="Director of Data Engineering, FinX"
            />
            <Testimonial
              quote="The AI profiling is a game changer actionable findings and a single quality score make collaboration so much easier."
              name="Rajan Patel"
              role="Head of Data Science, RetailX"
            />
            <Testimonial
              quote="From prototype to production in under a month. The platform scales and the team loves it."
              name="Marie Dupont"
              role="CTO, HealthAI"
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold">FAQ</h2>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <FAQ q="How does the AI profiling work?" a="We run a set of statistical, ML and rule-based checks that detect anomalies, drift and data format problems. Results are grouped and scored for easy triage." />
          <FAQ q="Can I run this on-prem or in my cloud account?" a="Yes. DATABits supports cloud-hosted and self-hosted deployments. Contact Sales for an architecture workshop." />
          <FAQ q="How does billing work?" a="We offer tiered plans and enterprise contracts. Billing is based on usage and cluster resources. See pricing or contact our sales team." />
          <FAQ q="Can I preview data without sending it to cloud?" a="Yes. You can profile locally or via a secure connector; preview-only workflows never store raw data in our cloud unless you opt-in." />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-tr from-indigo-900/40 to-pink-900/20 border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold">Ready to supercharge your data pipelines?</h3>
            <p className="mt-2 text-slate-400">Start a free trial or schedule a demo — get value in weeks, not months.</p>
          </div>

          <div className="flex gap-3">
            <Link to="/signup" className="inline-flex items-center gap-3 bg-emerald-500 px-5 py-3 rounded-lg font-bold text-black shadow">
              Start free trial
            </Link>
            <Link to="/demo" className="inline-flex items-center gap-2 border border-slate-700 px-5 py-3 rounded-lg text-slate-200 hover:bg-white/5">
              Schedule demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900/60 bg-black">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/assets/logo.png" alt="DATABits" className="w-8 h-8 rounded" />
            <div>
              <div className="font-bold">DATABits</div>
              <div className="text-xs text-slate-500">Data preprocessing platform</div>
            </div>
          </div>

          <nav className="flex gap-4 text-sm text-slate-400">
            <Link to="/features" className="hover:text-white">Features</Link>
            <Link to="/docs" className="hover:text-white">Docs</Link>
            <Link to="/pricing" className="hover:text-white">Pricing</Link>
            <Link to="/privacy" className="hover:text-white">Privacy</Link>
          </nav>

          <div className="text-sm text-slate-500">© {new Date().getFullYear()} DATABits Inc. All rights reserved.</div>
        </div>
      </footer>
    </main>
  )
}

/* small helpers / subcomponents */

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-700 text-center">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-extrabold">{value}</div>
    </div>
  )
}

function Testimonial({ quote, name, role }: { quote: string; name: string; role: string }) {
  return (
    <blockquote className="rounded-xl p-6 border border-slate-700 bg-slate-900/40">
      <p className="text-slate-200 text-sm">“{quote}”</p>
      <footer className="mt-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-emerald-300">
          <Users className="w-4 h-4" />
        </div>
        <div>
          <div className="font-semibold">{name}</div>
          <div className="text-xs text-slate-400">{role}</div>
        </div>
      </footer>
    </blockquote>
  )
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-lg p-4 border border-slate-700 bg-slate-900/20">
      <summary className="flex items-center justify-between cursor-pointer">
        <span className="font-semibold">{q}</span>
        <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="mt-3 text-slate-400">{a}</div>
    </details>
  )
}

/* simple right-chevron icon used in features */
function ChevronRightIcon() {
  return (
    <svg className="w-4 h-4 opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M9 6l6 6-6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
