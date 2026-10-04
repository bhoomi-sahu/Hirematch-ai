import React from 'react';
import { Sparkles, Heart } from 'lucide-react';
import { APP_NAME } from '../utils/constants';

const Footer = () => {
  return (
    <footer className="bg-[#0c1211] border-t border-[#283632] mt-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-md bg-emerald-300 flex items-center justify-center text-[#102018] text-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-200 text-sm">
              {APP_NAME}
            </span>
            <span className="text-xs text-slate-400">
              © {new Date().getFullYear()} All rights reserved.
            </span>
          </div>

          <div className="flex items-center space-x-6 text-xs text-slate-400">
            <span className="hover:text-slate-100 cursor-pointer">Candidate Portal</span>
            <span className="hover:text-slate-100 cursor-pointer">Recruiter Suite</span>
            <span className="hover:text-slate-100 cursor-pointer">Admin Governance</span>
            <span className="hover:text-slate-100 cursor-pointer">API Docs</span>
          </div>

          <div className="flex items-center text-xs text-slate-400">
            <span>Built for intelligent hiring</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
