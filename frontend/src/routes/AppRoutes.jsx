import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import CandidateLayout from '../layouts/CandidateLayout';
import RecruiterLayout from '../layouts/RecruiterLayout';
import AdminLayout from '../layouts/AdminLayout';

import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import NotFoundPage from '../pages/NotFoundPage';

import ProtectedRoute from './ProtectedRoute';

// Candidate pages
import CandidateOverview from '../pages/candidate/CandidateOverview';
import JobsListPage from '../pages/candidate/JobsListPage';
import JobDetailPage from '../pages/candidate/JobDetailPage';
import ResumesPage from '../pages/candidate/ResumesPage';
import MatchAnalysisPage from '../pages/candidate/MatchAnalysisPage';
import ImproveResumePage from '../pages/candidate/ImproveResumePage';
import MyApplicationsPage from '../pages/candidate/MyApplicationsPage';
import CandidateProfilePage from '../pages/candidate/CandidateProfilePage';
import CandidateSettingsPage from '../pages/candidate/CandidateSettingsPage';

// Recruiter pages
import RecruiterOverview from '../pages/recruiter/RecruiterOverview';
import RecruiterJobsPage from '../pages/recruiter/RecruiterJobsPage';
import CreateJobPage from '../pages/recruiter/CreateJobPage';
import JobApplicantsPage from '../pages/recruiter/JobApplicantsPage';
import RecruiterApplicationsPage from '../pages/recruiter/RecruiterApplicationsPage';
import RecruiterCandidatesPage from '../pages/recruiter/RecruiterCandidatesPage';
import BulkScreeningPage from '../pages/recruiter/BulkScreeningPage';
import RecruiterProfilePage from '../pages/recruiter/RecruiterProfilePage';
import RecruiterSettingsPage from '../pages/recruiter/RecruiterSettingsPage';

// Admin pages
import AdminOverview from '../pages/admin/AdminOverview';
import UsersPage from '../pages/admin/UsersPage';
import AdminJobsPage from '../pages/admin/AdminJobsPage';
import AdminApplicationsPage from '../pages/admin/AdminApplicationsPage';
import AnalyticsPage from '../pages/admin/AnalyticsPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages with Main Layout */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Protected Candidate Routes */}
      <Route
        path="/candidate"
        element={
          <ProtectedRoute allowedRoles={['candidate']}>
            <CandidateLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CandidateOverview />} />
        <Route path="jobs" element={<JobsListPage />} />
        <Route path="jobs/:jobId" element={<JobDetailPage />} />
        <Route path="jobs/:jobId/match" element={<MatchAnalysisPage />} />
        <Route path="resumes" element={<ResumesPage />} />
        <Route path="resumes/:resumeId/improve/:jobId" element={<ImproveResumePage />} />
        <Route path="applications" element={<MyApplicationsPage />} />
        <Route path="profile" element={<CandidateProfilePage />} />
        <Route path="settings" element={<CandidateSettingsPage />} />
      </Route>

      {/* Protected Recruiter Routes */}
      <Route
        path="/recruiter"
        element={
          <ProtectedRoute allowedRoles={['recruiter']}>
            <RecruiterLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RecruiterOverview />} />
        <Route path="jobs" element={<RecruiterJobsPage />} />
        <Route path="jobs/new" element={<CreateJobPage />} />
        <Route path="jobs/:jobId/edit" element={<CreateJobPage />} />
        <Route path="jobs/:jobId/applicants" element={<JobApplicantsPage />} />
        <Route path="applications" element={<RecruiterApplicationsPage />} />
        <Route path="candidates" element={<RecruiterCandidatesPage />} />
        <Route path="bulk-screening" element={<BulkScreeningPage />} />
        <Route path="bulk-screening/:jobId" element={<BulkScreeningPage />} />
        <Route path="profile" element={<RecruiterProfilePage />} />
        <Route path="settings" element={<RecruiterSettingsPage />} />
      </Route>

      {/* Protected Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="users" element={<UsersPage roleFilter="all" />} />
        <Route path="recruiters" element={<UsersPage roleFilter="recruiter" />} />
        <Route path="candidates" element={<UsersPage roleFilter="candidate" />} />
        <Route path="jobs" element={<AdminJobsPage />} />
        <Route path="applications" element={<AdminApplicationsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
