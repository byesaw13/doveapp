import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo purposes
// In production, you'd store this in a database
const subscriptions = new Map();

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();

    // Generate a unique ID for this subscription
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store the subscription
    subscriptions.set(subscriptionId, {
      ...subscription,
      createdAt: new Date().toISOString(),
      id: subscriptionId,
    });


    return NextResponse.json({
      success: true,
      subscriptionId,
      message: 'Push subscription registered successfully',
    });
  } catch (error) {
    console.error('Failed to register push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to register push subscription' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return list of subscriptions (for debugging)
  const subs = Array.from(subscriptions.values());
  return NextResponse.json({
    subscriptions: subs,
    count: subs.length,
  });
}

// Function to send push notifications (can be called from other parts of the app)
export async function sendPushNotification(
  subscriptionId: string,
  payload: any
) {
  const subscription = subscriptions.get(subscriptionId);
  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // In a real implementation, you'd use a service like Firebase Cloud Messaging
  // or send directly to the push service

  // For demo purposes, we'll just log it
  return { success: true, message: 'Notification queued' };
}
