import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function DebugPanel() {
  const { profile, isTrader } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [testUuid, setTestUuid] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    const results: any = {
      currentUser: null,
      allUsers: null,
      traders: null,
      investors: null,
      allBindings: null,
      authUser: null,
      errors: []
    };

    try {
      // Check current user profile
      if (profile) {
        results.currentUser = profile;
      }

      // Check Supabase auth user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        results.errors.push(`Auth error: ${authError.message}`);
      } else {
        results.authUser = user;
      }

      // Check all users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, role, username, trader_uid, email, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (usersError) {
        results.errors.push(`Users query error: ${usersError.message}`);
      } else {
        results.allUsers = users;
        results.traders = users?.filter(u => u.role === 'trader') || [];
        results.investors = users?.filter(u => u.role === 'investor') || [];
      }

      // Check all bindings
      const { data: bindings, error: bindingsError } = await supabase
        .from('bindings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (bindingsError) {
        results.errors.push(`Bindings query error: ${bindingsError.message}`);
      } else {
        results.allBindings = bindings;
      }

      setDebugInfo(results);
    } catch (error: any) {
      results.errors.push(`Unexpected error: ${error.message}`);
      setDebugInfo(results);
    } finally {
      setLoading(false);
    }
  };

  const testTraderLookup = async () => {
    if (!testUuid.trim()) {
      toast({
        title: "Error",
        description: "Please enter a UUID to test",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const results: any = {
      searchUuid: testUuid.trim(),
      userById: null,
      traderById: null,
      allUsersTest: null,
      tradersTest: null,
      errors: []
    };

    try {
      // Test database connectivity first
      console.log('📊 Testing database connectivity...');
      const { data: connectionTest, error: connectionError } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (connectionError) {
        results.errors.push(`Database connection error: ${connectionError.message}`);
      } else {
        results.connectionTest = 'Database accessible';
      }

      // Test 1: Get sample users to verify table structure
      const { data: allUsersTest, error: allUsersError } = await supabase
        .from('users')
        .select('id, username, role, email, created_at')
        .limit(5);

      if (allUsersError) {
        results.errors.push(`All users query error: ${allUsersError.message}`);
      } else {
        results.allUsersTest = allUsersTest;
      }

      // Test 2: Get traders specifically
      const { data: tradersTest, error: tradersError } = await supabase
        .from('users')
        .select('id, username, role, email')
        .eq('role', 'trader')
        .limit(10);

      if (tradersError) {
        results.errors.push(`Traders query error: ${tradersError.message}`);
      } else {
        results.tradersTest = tradersTest;
      }

      // Test 3: Search by ID only
      const { data: userById, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', testUuid.trim())
        .maybeSingle();

      if (userError) {
        results.errors.push(`User by ID error: ${userError.message}`);
      } else {
        results.userById = userById;
      }

      // Test 4: Search by ID + role = trader
      const { data: traderById, error: traderError } = await supabase
        .from('users')
        .select('*')
        .eq('id', testUuid.trim())
        .eq('role', 'trader')
        .maybeSingle();

      if (traderError) {
        results.errors.push(`Trader by ID error: ${traderError.message}`);
      } else {
        results.traderById = traderById;
      }

      // Test 5: Check RLS policies
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        results.errors.push(`Auth check error: ${authError.message}`);
      } else {
        results.currentAuthUser = user;
      }

      setTestResult(results);
    } catch (error: any) {
      results.errors.push(`Unexpected error: ${error.message}`);
      setTestResult(results);
    } finally {
      setLoading(false);
    }
  };

  const generateUIDForTrader = async () => {
    toast({
      title: "No longer needed",
      description: "Traders now use their UUID (user ID) for binding instead of a separate trader_uid.",
    });
  };

  return (
    <Card className="crypto-card">
      <CardHeader>
        <CardTitle>Debug Panel</CardTitle>
        <CardDescription>
          Diagnostic tools for troubleshooting the binding system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Button onClick={runDiagnostics} disabled={loading}>
              {loading ? "Running..." : "Run Full Diagnostics"}
            </Button>
          </div>
          
          <div className="space-y-2 border-t pt-4">
            <h4 className="font-semibold">Test Trader UUID Lookup</h4>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="test-uuid">UUID to test:</Label>
                <Input
                  id="test-uuid"
                  value={testUuid}
                  onChange={(e) => setTestUuid(e.target.value)}
                  placeholder="Enter UUID to test (e.g., 123e4567-e89b-12d3-a456-426614174000)"
                />
              </div>
              <Button onClick={testTraderLookup} disabled={loading || !testUuid.trim()}>
                {loading ? "Testing..." : "Test Lookup"}
              </Button>
            </div>
          </div>
        </div>

        {debugInfo && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Full Diagnostic Results:</h4>
            <pre className="text-xs overflow-auto max-h-96">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
        
        {testResult && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-2">UUID Test Results:</h4>
            <pre className="text-xs overflow-auto max-h-48">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}