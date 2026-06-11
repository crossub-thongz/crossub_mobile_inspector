'use client';

import { Award, Mail, Phone, User } from 'lucide-react';

import { InspectorShell } from '@/components/layout/inspector-shell';
import { useAuth } from '@/components/providers/auth-provider';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { displayName, formatCurrency } from '@/lib/utils';

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile } = useInspectorData();

  return (
    <InspectorShell title="Profile">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-4" />
              Inspector Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-lg font-semibold">
              {user ? displayName(user) : profile.name}
            </p>
            <p className="text-muted-foreground flex items-center gap-2">
              <Mail className="size-4" />
              {user?.email ?? profile.email}
            </p>
            <p className="text-muted-foreground flex items-center gap-2">
              <Phone className="size-4" />
              {profile.phone}
            </p>
            <p className="flex items-center gap-2">
              <Award className="size-4 text-primary" />
              Tribunal qualified:{' '}
              <span className={profile.tribunalQualified ? 'text-primary' : 'text-muted-foreground'}>
                {profile.tribunalQualified ? 'Yes' : 'No'}
              </span>
            </p>
            <p className="text-primary font-semibold">
              Weekly earnings: {formatCurrency(profile.weeklyEarnings)}
            </p>
          </CardContent>
        </Card>
      </div>
    </InspectorShell>
  );
}
