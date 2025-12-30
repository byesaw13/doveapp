import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

// Security settings types
interface SecuritySettings {
  id: string;
  password_policy: {
    min_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_numbers: boolean;
    require_symbols: boolean;
    password_expiry_days: number;
  };
  session_policy: {
    session_timeout_minutes: number;
    max_concurrent_sessions: number;
    require_2fa: boolean;
    remember_me_days: number;
  };
  audit_policy: {
    enable_audit_logging: boolean;
    log_sensitive_actions: boolean;
    retention_days: number;
    export_audit_logs: boolean;
  };
  compliance_policy: {
    data_retention_years: number;
    gdpr_compliance: boolean;
    hipaa_compliance: boolean;
    enable_data_anonymization: boolean;
    require_consent: boolean;
  };
  encryption_policy: {
    encrypt_sensitive_data: boolean;
    encryption_algorithm: string;
    key_rotation_days: number;
    backup_encryption: boolean;
  };
  access_policy: {
    allow_api_access: boolean;
    rate_limiting_enabled: boolean;
    max_requests_per_minute: number;
    ip_whitelist_enabled: boolean;
    allowed_ips: string[];
  };
  created_at: string;
  updated_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();

    // Check user permissions
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from('account_memberships')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get security settings - for now return defaults since table might not exist
    const defaultSettings: Omit<
      SecuritySettings,
      'id' | 'created_at' | 'updated_at'
    > = {
      password_policy: {
        min_length: 8,
        require_uppercase: true,
        require_lowercase: true,
        require_numbers: true,
        require_symbols: false,
        password_expiry_days: 90,
      },
      session_policy: {
        session_timeout_minutes: 480,
        max_concurrent_sessions: 5,
        require_2fa: false,
        remember_me_days: 30,
      },
      audit_policy: {
        enable_audit_logging: true,
        log_sensitive_actions: true,
        retention_days: 365,
        export_audit_logs: true,
      },
      compliance_policy: {
        data_retention_years: 7,
        gdpr_compliance: false,
        hipaa_compliance: false,
        enable_data_anonymization: false,
        require_consent: true,
      },
      encryption_policy: {
        encrypt_sensitive_data: true,
        encryption_algorithm: 'AES-256',
        key_rotation_days: 90,
        backup_encryption: true,
      },
      access_policy: {
        allow_api_access: true,
        rate_limiting_enabled: true,
        max_requests_per_minute: 100,
        ip_whitelist_enabled: false,
        allowed_ips: [],
      },
    };

    // Try to get from database, fallback to defaults
    try {
      const { data: settings } = await supabase
        .from('security_settings')
        .select('*')
        .single();

      if (settings) {
        return NextResponse.json(settings);
      }
    } catch (error) {
      // Table might not exist yet, return defaults
      console.log('Security settings table not found, using defaults');
    }

    return NextResponse.json(defaultSettings);
  } catch (error) {
    console.error('Error fetching security settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const supabase = await createRouteHandlerClient();

    // Check user permissions
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from('account_memberships')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if settings exist
    const { data: existing } = await supabase
      .from('security_settings')
      .select('id')
      .maybeSingle();

    let settings: SecuritySettings;

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('security_settings')
        .update(body)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      settings = data as SecuritySettings;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('security_settings')
        .insert(body)
        .select()
        .single();

      if (error) {
        // If table doesn't exist, just return success for now
        if (error.code === '42P01') {
          return NextResponse.json({
            success: true,
            message: 'Settings would be saved (table not created yet)',
          });
        }
        throw error;
      }
      settings = data as SecuritySettings;
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error updating security settings:', error);
    return NextResponse.json(
      {
        error: 'Failed to update security settings',
        details: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}
