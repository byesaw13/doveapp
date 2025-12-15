'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StableTimeTracker } from './components/StableTimeTracker';
import { TimeApprovals } from './components/TimeApprovals';
import { TimeAnalyticsDashboard } from './components/TimeAnalyticsDashboard';
import { Clock, CheckCircle, BarChart3 } from 'lucide-react';

export default function TimeTrackingPage() {
  const [activeTab, setActiveTab] = useState('tracker');

  return (
    <div className="space-y-6">
      {/* Header - Jobber style with emerald gradient */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 sm:px-8 lg:px-10 py-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white">Time Tracking</h1>
              <p className="mt-2 text-emerald-50 text-sm">
                Track your work time and manage time approvals
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container - Jobber style */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <TabsList className="grid w-full grid-cols-3 bg-white p-1 rounded-lg">
              <TabsTrigger
                value="tracker"
                className="flex items-center gap-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
              >
                <Clock className="w-4 h-4" />
                Time Tracker
              </TabsTrigger>
              <TabsTrigger
                value="approvals"
                className="flex items-center gap-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
              >
                <CheckCircle className="w-4 h-4" />
                Approvals
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="flex items-center gap-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="tracker" className="p-6">
            <StableTimeTracker />
          </TabsContent>

          <TabsContent value="approvals" className="p-6">
            <TimeApprovals />
          </TabsContent>

          <TabsContent value="analytics" className="p-6">
            <TimeAnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
