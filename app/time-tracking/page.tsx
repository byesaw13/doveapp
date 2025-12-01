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
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Time Tracking</h1>
        <p className="text-muted-foreground">
          Track your work time and manage time approvals
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tracker" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Time Tracker
          </TabsTrigger>
          <TabsTrigger value="approvals" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Approvals
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tracker" className="mt-6">
          <StableTimeTracker />
        </TabsContent>

        <TabsContent value="approvals" className="mt-6">
          <TimeApprovals />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <TimeAnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
