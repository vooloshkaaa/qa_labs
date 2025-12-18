import { GET, PUT, DELETE } from '@/app/api/user/preferences/route';
import { NextRequest } from 'next/server';
import { createClient } from '@/supabase/server';

describe('INTEGRATION: user preferences API', () => {
  let supabase: ReturnType<typeof createClient>;
  let testUserId: string;

  beforeAll(async () => {
    supabase = await createClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email: `test_${Date.now()}@example.com`,
      password: 'Test123456!',
      email_confirm: true,
    });

    if (error || !data.user) {
      throw new Error('Failed to create test user');
    }

    testUserId = data.user.id;
  });

  afterAll(async () => {
    await supabase.from('user_preferences').delete().eq('user_id', testUserId);
    await supabase.auth.admin.deleteUser(testUserId);
  });

  it('GET returns preferences from database', async () => {
    const req = {
      headers: new Headers({
        'authorization': `Bearer test-token-for-${testUserId}`,
      }),
    } as NextRequest;

    const res = await GET(req);

    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.preferences).toBeDefined();
  });

  it('PUT persists preferences in database', async () => {
    const req = {
      headers: new Headers({
        'authorization': `Bearer test-token-for-${testUserId}`,
      }),
      json: async () => ({
        email_notifications: false,
      }),
    } as NextRequest;

    const res = await PUT(req);
    expect(res.status).toBe(200);

    const { data } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    expect(data.email_notifications).toBe(false);
  });

  it('DELETE removes preferences from database', async () => {
    const req = {
      headers: new Headers({
        'authorization': `Bearer test-token-for-${testUserId}`,
      }),
    } as NextRequest;

    const res = await DELETE(req);
    expect(res.status).toBe(200);

    const { data } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    expect(data).toBeNull();
  });
});
