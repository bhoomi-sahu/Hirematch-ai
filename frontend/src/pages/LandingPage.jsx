import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Users,
  Briefcase,
  ShieldCheck,
  Cpu,
  FileCheck2,
  BarChart3,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import HealthBadge from '../components/HealthBadge';
import MatchNetworkScene from '../components/MatchNetworkScene';

const LandingPage = () => {
  return (
    <div className="landing-page space-y-16 pb-16">
      {/* Hero Section */}
      <section className="landing-hero">
        <MatchNetworkScene />
        <div className="landing-hero-inner">
          <motion.div
            className="landing-hero-copy"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <div className="landing-eyebrow">
              <Sparkles className="h-4 w-4" />
              <span>Hiring, with a clearer signal</span>
            </div>
            <h1>Find the right fit.<span>Faster, and with confidence.</span></h1>
            <p>
              Bring great people and ambitious teams together with explainable
              matching, thoughtful resume insights, and a hiring flow that stays
              human.
            </p>
            <div className="landing-actions">
              <Link to="/register" className="landing-primary-action">
                Start matching <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="landing-secondary-action">
                Open your workspace
              </Link>
            </div>
            <div className="landing-proofline">
              <span className="landing-proof-dot" />
              Built for candidates, recruiters, and the people keeping it fair
            </div>
          </motion.div>
          <motion.div
            className="landing-scene-label"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.65 }}
          >
            <span className="scene-label-kicker">MATCH SIGNAL</span>
            <strong>Skills meet possibility</strong>
            <span className="scene-label-status"><span /> live talent graph</span>
          </motion.div>
        </div>
      </section>

      {/* Live Backend & Database Health Section */}
      <motion.section className="landing-section max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.55 }}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Live Infrastructure Status
              </h2>
              <p className="text-sm text-slate-500">
                Real-time health verification communicating with the Node.js Express backend and MongoDB database.
              </p>
            </div>
          </div>
          <HealthBadge />
        </div>
      </motion.section>

      {/* Three Roles Section */}
      <motion.section className="landing-section max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.55 }}>
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Tailored Workflows for Every Stakeholder
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Built with dedicated role-based access control, security, and specialized toolsets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Role 1: Candidate */}
          <div
            id="candidates"
            className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-6">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                Role 01
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1 mb-3">
                Candidate
              </h3>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Smart resume analysis, skill gap feedback, and automated job matching calibrated to your career trajectory.
              </p>

              <ul className="space-y-2.5 text-sm text-slate-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Automated resume parsing & profile builder</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Real-time match scoring against job openings</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Application pipeline & status tracking</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <span className="text-xs font-semibold text-blue-600 inline-flex items-center gap-1">
                Candidate Portal <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Role 2: Recruiter */}
          <div
            id="recruiters"
            className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6">
                <Briefcase className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                Role 02
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1 mb-3">
                Recruiter
              </h3>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Streamline requisition workflows, evaluate applicants with AI-driven scoring, and hire with confidence.
              </p>

              <ul className="space-y-2.5 text-sm text-slate-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span>Job requisition authoring & requirements indexing</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span>Instant candidate ranking & match explanations</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span>Kanban pipeline with interview scheduling</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <span className="text-xs font-semibold text-indigo-600 inline-flex items-center gap-1">
                Recruiter Suite <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Role 3: Admin */}
          <div
            id="admin"
            className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
                Role 03
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1 mb-3">
                Admin
              </h3>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Complete platform governance, security audit trails, AI provider configuration, and system telemetry.
              </p>

              <ul className="space-y-2.5 text-sm text-slate-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <span>User, role, and organization access control</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <span>AI model configuration & usage metrics</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <span>Platform health and audit logs</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <span className="text-xs font-semibold text-purple-600 inline-flex items-center gap-1">
                Admin Governance <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Production Architecture Highlights */}
      <motion.section className="landing-section max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.55 }}>
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
              Production Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-2">
              Engineered for Scalability & Reliability
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6">
              <Cpu className="w-6 h-6 text-blue-400 mb-3" />
              <h4 className="font-semibold text-base">Modular Services</h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Separation of concerns across controllers, services, middleware, and domain models.
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6">
              <FileCheck2 className="w-6 h-6 text-emerald-400 mb-3" />
              <h4 className="font-semibold text-base">Standardized Errors & Responses</h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Centralized error handling middleware with uniform API responses and HTTP status mappings.
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6">
              <BarChart3 className="w-6 h-6 text-purple-400 mb-3" />
              <h4 className="font-semibold text-base">Configurable LLM Backend</h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                AI requests strictly mediated through backend services to protect API keys and apply rate limiting.
              </p>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default LandingPage;
