import {
  Phone,
  Mail,
  Globe,
  Share2,
  UserPlus,
  Users,
  TrendingUp,
  Target,
} from 'lucide-react';
import type { LeadSource, Lead } from '@/types/lead';

/**
 * Get icon component for lead source
 */
export const getSourceIcon = (source: LeadSource) => {
  const icons = {
    phone: Phone,
    email: Mail,
    website: Globe,
    social_media: Share2,
    referral: UserPlus,
    walk_in: Users,
    advertisement: TrendingUp,
    other: Target,
  };
  return icons[source] || Target;
};

/**
 * Get color class for lead source
 */
export const getSourceColor = (source: LeadSource): string => {
  const colors = {
    phone: 'bg-blue-100 text-blue-800',
    email: 'bg-purple-100 text-purple-800',
    website: 'bg-green-100 text-green-800',
    social_media: 'bg-pink-100 text-pink-800',
    referral: 'bg-orange-100 text-orange-800',
    walk_in: 'bg-indigo-100 text-indigo-800',
    advertisement: 'bg-amber-100 text-amber-800',
    other: 'bg-gray-100 text-gray-800',
  };
  return colors[source] || 'bg-gray-100 text-gray-800';
};

/**
 * Get gradient color for lead source
 */
export const getSourceGradient = (source: LeadSource): string => {
  const colors = {
    phone: 'from-blue-500 to-blue-600',
    email: 'from-purple-500 to-purple-600',
    website: 'from-green-500 to-green-600',
    social_media: 'from-pink-500 to-pink-600',
    referral: 'from-orange-500 to-orange-600',
    walk_in: 'from-indigo-500 to-indigo-600',
    advertisement: 'from-amber-500 to-amber-600',
    other: 'from-gray-500 to-gray-600',
  };
  return colors[source] || 'from-gray-500 to-gray-600';
};

/**
 * Calculate urgency score for a lead
 * Higher score = more urgent
 */
export const calculateUrgencyScore = (lead: Lead): number => {
  let score = 0;

  // New leads are urgent
  if (lead.status === 'new') score += 50;

  // High priority adds urgency
  if (lead.priority === 'urgent') score += 100;
  if (lead.priority === 'high') score += 50;
  if (lead.priority === 'medium') score += 25;

  // High value leads are more urgent
  if (lead.estimated_value && lead.estimated_value > 10000) score += 50;
  else if (lead.estimated_value && lead.estimated_value > 5000) score += 25;

  // Recency matters - leads older than 24h lose points
  const hoursOld =
    (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60);
  if (hoursOld < 1)
    score += 50; // Very fresh
  else if (hoursOld < 4)
    score += 30; // Fresh
  else if (hoursOld < 24)
    score += 10; // Recent
  else if (hoursOld > 72) score -= 20; // Old

  // Phone leads are often more urgent than email/web
  if (lead.source === 'phone') score += 20;
  if (lead.source === 'walk_in') score += 30;

  return score;
};

/**
 * Handle calling a lead
 */
export const handleCallLead = (phone: string) => {
  if (phone) {
    window.location.href = `tel:${phone}`;
  }
};

/**
 * Handle texting a lead
 */
export const handleTextLead = (phone: string) => {
  if (phone) {
    window.location.href = `sms:${phone}`;
  }
};

/**
 * Handle emailing a lead
 */
export const handleEmailLead = (email: string) => {
  if (email) {
    window.location.href = `mailto:${email}`;
  }
};

/**
 * Sort leads by urgency score
 */
export const sortLeadsByUrgency = (leads: Lead[]): Lead[] => {
  return [...leads].sort((a, b) => {
    const scoreA = calculateUrgencyScore(a);
    const scoreB = calculateUrgencyScore(b);
    if (scoreA !== scoreB) {
      return scoreB - scoreA; // Higher urgency first
    }
    // If same urgency, sort by created date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
};
