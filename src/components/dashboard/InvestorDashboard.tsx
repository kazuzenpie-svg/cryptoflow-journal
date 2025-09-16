import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Trade, User as AppUser } from '@/types/database';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye,
  DollarSign,
  BarChart3,
  Wallet,
  UserPlus,
  Clock,
  Copy
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function InvestorDashboard() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [traderUid, setTraderUid] = useState('');
  const [boundTrader, setBoundTrader] = useState<AppUser | null>(null);
  const [bindingStatus, setBindingStatus] = useState<'none' | 'pending' | 'approved'>('none');
  const [traderStats, setTraderStats] = useState({
    totalTrades: 0,
    totalValue: 0,
    totalPnL: 0,
  });
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // New state for binding process UI
  const [bindingProcess, setBindingProcess] = useState({
    step: 'idle' as 'idle' | 'searching' | 'confirmation' | 'binding' | 'success' | 'error',
    message: '',
    foundTrader: null as AppUser | null,
    error: null as string | null
  });
  
  // New state for trader confirmation modal
  const [showTraderConfirmation, setShowTraderConfirmation] = useState(false);
  const [confirmedTrader, setConfirmedTrader] = useState<AppUser | null>(null);

  const checkExistingBinding = useCallback(async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Checking existing binding for investor:', profile.id);
      
      // Optimized query - select only needed fields
      const { data: binding, error: bindingError } = await supabase
        .from('bindings')
        .select(`
          id,
          trader_id,
          investor_id,
          status,
          created_at,
          users!bindings_trader_id_fkey(
            id,
            username,
            bio,
            currency,
            role
          )
        `)
        .eq('investor_id', profile.id)
        .maybeSingle();

      if (bindingError) {
        console.error('❌ Error fetching binding:', bindingError);
        toast({
          title: "Database Error",
          description: "Failed to check binding status. Please try refreshing.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Binding result:', binding);

      if (binding) {
        setBindingStatus(binding.status as 'pending' | 'approved');
        setBoundTrader(binding.users as AppUser);
        
        // Only fetch trader data if approved and not already loaded
        if (binding.status === 'approved' && !traderStats.totalTrades) {
          fetchTraderData(binding.trader_id);
        }
      } else {
        console.log('🔍 No existing binding found');
        setBindingStatus('none');
      }
    } catch (error) {
      console.error('❌ Error checking binding:', error);
      toast({
        title: "Error",
        description: "Failed to check binding status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [profile?.id, traderStats.totalTrades, toast]);

  useEffect(() => {
    if (profile) {
      checkExistingBinding();
    }
  }, [profile, checkExistingBinding]);

  const fetchTraderData = useCallback(async (traderId: string) => {
    try {
      console.log('📊 Fetching trader data for:', traderId);
      
      // Optimized query - only fetch recent trades and calculate stats
      const { data: trades } = await supabase
        .from('trades')
        .select('id, price, quantity, profit_loss, asset, category, created_at')
        .eq('user_id', traderId)
        .order('created_at', { ascending: false })
        .limit(20); // Limit initial load

      if (trades) {
        const totalValue = trades.reduce((sum, trade) => sum + (trade.price * trade.quantity), 0);
        const totalPnL = trades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);

        setTraderStats({
          totalTrades: trades.length,
          totalValue,
          totalPnL,
        });

        setRecentTrades(trades.slice(0, 5) as Trade[]);
        console.log('✅ Trader data loaded successfully');
      }
    } catch (error) {
      console.error('❌ Error fetching trader data:', error);
    }
  }, []);

  const resetBindingProcess = () => {
    setBindingProcess({
      step: 'idle',
      message: '',
      foundTrader: null,
      error: null
    });
    setShowTraderConfirmation(false);
    setConfirmedTrader(null);
  };

  const handleTraderConfirmation = (confirmed: boolean) => {
    setShowTraderConfirmation(false);
    
    if (confirmed && confirmedTrader) {
      // Proceed with binding after confirmation
      proceedWithBinding(confirmedTrader);
    } else {
      // User cancelled, reset process
      setBindingProcess({
        step: 'idle',
        message: '',
        foundTrader: null,
        error: null
      });
      setSubmitting(false);
    }
  };

  const proceedWithBinding = async (trader: AppUser) => {
    if (!profile?.id) return;

    try {
      // STEP 3: Creating binding after confirmation
      setBindingProcess({
        step: 'binding',
        message: `Creating connection request to ${trader.username}...`,
        foundTrader: trader,
        error: null
      });

      const { data: existingBinding } = await supabase
        .from('bindings')
        .select('*')
        .eq('trader_id', trader.id)
        .eq('investor_id', profile.id)
        .maybeSingle();

      if (existingBinding) {
        const statusMessage = existingBinding.status === 'approved' 
          ? 'You are already connected to this trader!' 
          : 'You already have a pending request with this trader.';
        
        setBindingProcess({
          step: existingBinding.status === 'approved' ? 'success' : 'error',
          message: statusMessage,
          foundTrader: trader,
          error: existingBinding.status !== 'approved' ? statusMessage : null
        });
        return;
      }

      const { data: newBinding, error: bindingError } = await supabase
        .from('bindings')
        .insert({
          trader_id: trader.id,
          investor_id: profile.id,
          status: 'pending'
        })
        .select()
        .single();

      if (bindingError) {
        setBindingProcess({
          step: 'error',
          message: '',
          foundTrader: trader,
          error: `Failed to create request: ${bindingError.message}`
        });
        return;
      }

      // SUCCESS
      setBindingProcess({
        step: 'success',
        message: `Request sent to ${trader.username}! Waiting for approval.`,
        foundTrader: trader,
        error: null
      });
      
      setBoundTrader(trader);
      setBindingStatus('pending');
      setTraderUid('');
      
      toast({
        title: "Request Sent!",
        description: `Connection request sent to ${trader.username}.`,
      });
      
    } catch (error: any) {
      setBindingProcess({
        step: 'error',
        message: '',
        foundTrader: trader,
        error: error.message || "An unexpected error occurred."
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBindingRequest = async () => {
    if (!traderUid.trim()) {
      setBindingProcess({
        step: 'error',
        message: '',
        foundTrader: null,
        error: 'Please enter a trader UID'
      });
      return;
    }

    if (!profile?.id) {
      setBindingProcess({
        step: 'error',
        message: '',
        foundTrader: null,
        error: 'User profile not loaded. Please refresh the page.'
      });
      return;
    }

    setSubmitting(true);
    const searchUuid = traderUid.trim().toUpperCase(); // Trader UIDs are uppercase
    console.log('🔍 Starting search for trader UID:', searchUuid);

    try {
      // STEP 1: Searching with enhanced debugging
      setBindingProcess({
        step: 'searching',
        message: `Searching for trader with UID: ${searchUuid}...`,
        foundTrader: null,
        error: null
      });

      // First, let's check if the users table is accessible
      console.log('📊 Testing users table access...');
      const { data: testUsers, error: testError } = await supabase
        .from('users')
        .select('id, username, role, email')
        .limit(3);
      
      console.log('📊 Sample users from table:', testUsers);
      console.log('❌ Test query error:', testError);
      
      if (testError) {
        setBindingProcess({
          step: 'error',
          message: '',
          foundTrader: null,
          error: `Database access error: ${testError.message}. Please check your connection.`
        });
        setSubmitting(false);
        return;
      }

      // Search for the specific trader by trader_uid (not id)
      console.log('🎯 Searching for trader with trader_uid:', searchUuid);
      const { data: anyUser, error: anyUserError } = await supabase
        .from('users')
        .select('*')
        .eq('trader_uid', searchUuid)  // ✅ CORRECT: Search by trader_uid
        .eq('role', 'trader')  // ✅ Also ensure they are a trader
        .maybeSingle();

      console.log('👤 User search result:', anyUser);
      console.log('❌ User search error:', anyUserError);

      if (anyUserError) {
        console.error('Database error when searching for user:', anyUserError);
        setBindingProcess({
          step: 'error',
          message: '',
          foundTrader: null,
          error: `Database search error: ${anyUserError.message}`
        });
        setSubmitting(false);
        return;
      }

      if (!anyUser) {
        // Let's also try searching for traders by trader_uid specifically
        console.log('🔍 Trader not found by UID, checking all trader UIDs...');
        const { data: allTraders, error: tradersError } = await supabase
          .from('users')
          .select('id, username, role, email, trader_uid')
          .eq('role', 'trader')
          .not('trader_uid', 'is', null)
          .limit(10);
        
        console.log('👥 Available traders with UIDs:', allTraders?.map(t => ({ username: t.username, trader_uid: t.trader_uid })));
        console.log('❌ Traders query error:', tradersError);

        setBindingProcess({
          step: 'error',
          message: '',
          foundTrader: null,
          error: `No trader found with UID: ${searchUuid}. Please verify the trader UID is correct. Available traders: ${allTraders?.length || 0}.`
        });
        setSubmitting(false);
        return;
      }

      console.log('✅ Found trader:', anyUser);

      // STEP 2: Show confirmation modal directly (role already validated in query)
      setBindingProcess({
        step: 'confirmation',
        message: `Trader found! Please confirm you want to connect with ${anyUser.username}.`,
        foundTrader: anyUser as AppUser,
        error: null
      });

      setConfirmedTrader(anyUser as AppUser);
      setShowTraderConfirmation(true);
      
    } catch (error: any) {
      console.error('🚨 Unexpected error in search:', error);
      setBindingProcess({
        step: 'error',
        message: '',
        foundTrader: null,
        error: `Search failed: ${error.message || 'An unexpected error occurred.'}`
      });
      setSubmitting(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, className = "crypto-card" }: any) => (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="p-3 bg-primary/20 rounded-xl">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="crypto-card animate-pulse">
          <CardContent className="p-6">
            <div className="h-20 bg-muted/50 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no binding exists, show binding form
  if (bindingStatus === 'none') {
    return (
      <>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gradient-primary">Welcome, Investor</h1>
            <p className="text-muted-foreground">
              Connect with a trader to start tracking their performance
            </p>
          </div>

          <Card className="crypto-card-blue max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Connect with a Trader
              </CardTitle>
              <CardDescription>
                Enter the trader's UID to send a connection request
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trader-uid">Trader UID</Label>
                <Input
                  id="trader-uid"
                  value={traderUid}
                  onChange={(e) => {
                    setTraderUid(e.target.value);
                    if (bindingProcess.step === 'error') {
                      resetBindingProcess();
                    }
                  }}
                  placeholder="Enter trader UID (e.g., A1B2C3D4)"
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">
                  Ask your trader for their unique UID (8-character code).
                </p>
              </div>
              
              {/* Binding Process Status */}
              {bindingProcess.step !== 'idle' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-lg border">
                    {bindingProcess.step === 'searching' && (
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                        <div>
                          <p className="text-sm font-medium text-blue-600">🔍 Searching...</p>
                          <p className="text-xs text-muted-foreground">{bindingProcess.message}</p>
                        </div>
                      </div>
                    )}
                    
                    {bindingProcess.step === 'confirmation' && (
                      <div className="flex items-center gap-3">
                        <div className="animate-pulse rounded-full h-4 w-4 bg-green-500"></div>
                        <div>
                          <p className="text-sm font-medium text-green-600">✅ Trader Found!</p>
                          <p className="text-xs text-muted-foreground">{bindingProcess.message}</p>
                          {bindingProcess.foundTrader && (
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-primary">
                                  {bindingProcess.foundTrader.username.slice(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-xs font-medium">{bindingProcess.foundTrader.username}</span>
                              <Badge variant="outline" className="text-xs">Trader</Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {bindingProcess.step === 'binding' && (
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent"></div>
                        <div>
                          <p className="text-sm font-medium text-green-600">🔗 Processing Request...</p>
                          <p className="text-xs text-muted-foreground">{bindingProcess.message}</p>
                        </div>
                      </div>
                    )}
                    
                    {bindingProcess.step === 'success' && (
                      <div className="flex items-center gap-3">
                        <div className="rounded-full h-4 w-4 bg-green-500 flex items-center justify-center">
                          <span className="text-xs text-white">✓</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-600">🎉 Request Sent!</p>
                          <p className="text-xs text-muted-foreground">{bindingProcess.message}</p>
                        </div>
                      </div>
                    )}
                    
                    {bindingProcess.step === 'error' && (
                      <div className="flex items-center gap-3">
                        <div className="rounded-full h-4 w-4 bg-red-500 flex items-center justify-center">
                          <span className="text-xs text-white">✕</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-600">❌ Error</p>
                          <p className="text-xs text-red-600">{bindingProcess.error}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleBindingRequest}
                  disabled={submitting || !traderUid.trim()}
                  className="flex-1"
                >
                  {submitting ? "Processing..." : "Find & Connect"}
                </Button>
                
                {bindingProcess.step !== 'idle' && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      resetBindingProcess();
                      setTraderUid('');
                    }}
                    disabled={submitting}
                  >
                    Reset
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Trader Confirmation Modal */}
        <AlertDialog open={showTraderConfirmation} onOpenChange={setShowTraderConfirmation}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Confirm Trader Connection
              </AlertDialogTitle>
              <AlertDialogDescription>
                Please confirm you want to send a connection request to this trader:
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            {confirmedTrader && (
              <div className="space-y-4">
                {/* Trader Profile Card */}
                <div className="p-4 border rounded-lg bg-blue-50">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">
                        {confirmedTrader.username.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div>
                        <h4 className="font-semibold text-lg">{confirmedTrader.username}</h4>
                        <Badge variant="outline" className="text-xs">Trader</Badge>
                      </div>
                      
                      {/* UUID */}
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">UUID:</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                            {confirmedTrader.id}
                          </code>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              navigator.clipboard.writeText(confirmedTrader.id);
                              toast({
                                title: "Copied!",
                                description: "UUID copied to clipboard.",
                              });
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Bio */}
                      {confirmedTrader.bio && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Bio:</p>
                          <p className="text-sm text-gray-700">{confirmedTrader.bio}</p>
                        </div>
                      )}
                      
                      {!confirmedTrader.bio && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Bio:</p>
                          <p className="text-sm text-gray-500 italic">No bio provided</p>
                        </div>
                      )}
                      
                      {/* Currency */}
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Currency:</p>
                        <Badge variant="secondary" className="text-xs">{confirmedTrader.currency}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Warning Message */}
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Your connection request will be sent to this trader. 
                    They will need to approve it before you can view their trading data.
                  </p>
                </div>
              </div>
            )}
            
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => handleTraderConfirmation(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => handleTraderConfirmation(true)}
                className="bg-primary hover:bg-primary/90"
              >
                Send Connection Request
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }
  
  // Pending and Approved states
  if (bindingStatus === 'pending') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Connection Pending</h1>
          <p className="text-muted-foreground">
            Waiting for trader approval to access their portfolio
          </p>
        </div>

        <Card className="crypto-card-coral max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Awaiting Approval
            </CardTitle>
            <CardDescription>
              Your connection request has been sent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {boundTrader && (
              <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {boundTrader.username.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-medium">{boundTrader.username}</div>
                  <div className="text-sm text-muted-foreground">Trader</div>
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs mt-1">Pending Approval</Badge>
                </div>
              </div>
            )}
            
            <div className="text-center py-4">
              <div className="animate-pulse mb-2">
                <Clock className="w-8 h-8 mx-auto text-yellow-500" />
              </div>
              <p className="text-sm text-muted-foreground">
                The trader will receive your connection request and can approve it from their dashboard.
                You'll be able to view their trading data once approved.
              </p>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setBindingStatus('none');
                setBoundTrader(null);
                setTraderUid('');
                resetBindingProcess();
              }}
            >
              Send New Request
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If approved, show dashboard
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Dashboard</h1>
          <p className="text-muted-foreground">
            Tracking {boundTrader?.username}'s performance
          </p>
        </div>
        <Badge className="bg-success/20 text-success">
          Connected
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Portfolio Value"
          value={`${boundTrader?.currency === 'USD' ? '$' : '₱'}${traderStats.totalValue.toLocaleString()}`}
          subtitle="Total investment value"
          icon={Wallet}
          className="crypto-card-blue"
        />
        
        <StatCard
          title="Total P&L"
          value={`${boundTrader?.currency === 'USD' ? '$' : '₱'}${traderStats.totalPnL.toLocaleString()}`}
          subtitle={traderStats.totalPnL >= 0 ? 'Profit' : 'Loss'}
          icon={traderStats.totalPnL >= 0 ? TrendingUp : TrendingDown}
          className={traderStats.totalPnL >= 0 ? "crypto-card-success" : "crypto-card"}
        />
        
        <StatCard
          title="Total Trades"
          value={traderStats.totalTrades}
          subtitle="All transactions"
          icon={BarChart3}
          className="crypto-card-coral"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="crypto-card">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest trades from {boundTrader?.username}</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTrades.length > 0 ? (
              <div className="space-y-3">
                {recentTrades.map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {trade.asset.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">{trade.asset}</div>
                        <div className="text-xs text-muted-foreground capitalize">{trade.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {boundTrader?.currency === 'USD' ? '$' : '₱'}{trade.price.toLocaleString()}
                      </div>
                      {trade.profit_loss && (
                        <div className={`text-xs ${
                          trade.profit_loss >= 0 ? 'text-success' : 'text-destructive'
                        }`}>
                          {trade.profit_loss >= 0 ? '+' : ''}{trade.profit_loss.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <Button asChild variant="outline" className="w-full">
                  <Link to="/trades">View All Trades</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Eye className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No trades yet</h3>
                <p className="text-sm text-muted-foreground">
                  Your trader hasn't made any trades yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trader Info */}
        <Card className="crypto-card-blue">
          <CardHeader>
            <CardTitle>Connected Trader</CardTitle>
            <CardDescription>Trader information and stats</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-primary">
                  {boundTrader?.username.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="font-medium">{boundTrader?.username}</div>
                <div className="text-sm text-muted-foreground">
                  {boundTrader?.bio || 'No bio available'}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 ml-auto"
                onClick={() => {
                  if (boundTrader?.id) {
                    navigator.clipboard.writeText(boundTrader.id);
                    toast({
                      title: "Copied!",
                      description: "Trader UUID has been copied to clipboard.",
                    });
                  }
                }}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div className="text-center">
                <div className="text-lg font-bold">{traderStats.totalTrades}</div>
                <div className="text-xs text-muted-foreground">Total Trades</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">
                  {boundTrader?.currency === 'USD' ? '$' : '₱'}{Math.abs(traderStats.totalPnL).toLocaleString()}
                </div>
                <div className={`text-xs ${traderStats.totalPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {traderStats.totalPnL >= 0 ? 'Profit' : 'Loss'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}