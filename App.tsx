import React, { useState, useEffect } from 'react';
import { User, ViewState } from './types';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import UpgradePage from './components/UpgradePage';
import AdminPanel from './components/AdminPanel';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LegalPage from './components/LegalPage';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { AlertOctagon, Phone } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      if (firebaseUser) {
        // Strict check: Only allow if email is verified
        if (firebaseUser.emailVerified) {
            
            let subscriptionStatus: 'trial' | 'active' | 'expired' | 'suspended' = 'trial';
            let creationTime = firebaseUser.metadata.creationTime;
            let subscriptionExpiryDate: string | undefined = undefined;

            // 1. Check or Create User Document in Firestore
            try {
                const userRef = doc(db, 'users', firebaseUser.uid);
                let userDoc = await getDoc(userRef);

                if (!userDoc.exists()) {
                    await setDoc(userRef, {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        shopName: firebaseUser.displayName || 'My Shop',
                        createdAt: creationTime,
                        subscriptionStatus: 'trial'
                    });
                } else {
                    const data = userDoc.data();
                    subscriptionStatus = data.subscriptionStatus || 'trial';
                    subscriptionExpiryDate = data.subscriptionExpiryDate;
                }
            } catch (error: any) {
                console.error("Firestore Error (App.tsx):", error.code);
                subscriptionStatus = 'trial';
            }

            // 2. DYNAMIC DAYS CALCULATION
            // This ensures days decrease automatically as time passes
            let daysRemaining = 0;
            const now = new Date().getTime();

            if (subscriptionExpiryDate) {
                // Scenario A: Admin set a specific expiry date (e.g. for Monthly/Yearly pro)
                const expiryTime = new Date(subscriptionExpiryDate).getTime();
                const diffTime = expiryTime - now;
                daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            } else {
                // Scenario B: Default Trial (7 Days from Signup)
                if (creationTime) {
                    const startTime = new Date(creationTime).getTime();
                    const trialEndTime = startTime + (7 * 24 * 60 * 60 * 1000); // +7 days
                    const diffTime = trialEndTime - now;
                    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                } else {
                    daysRemaining = 7; 
                }
            }

            // Clamp negative to 0
            if (daysRemaining < 0) daysRemaining = 0;

            // 3. Status Logic Overrides
            let isAccessDenied = false;

            // If explicitly suspended, deny access
            if (subscriptionStatus === 'suspended') {
                isAccessDenied = true;
            } 
            // If explicitly expired, deny access (even if calc says 1 day left due to timezone drift, though unlikely)
            else if (subscriptionStatus === 'expired') {
                daysRemaining = 0;
                isAccessDenied = true;
            }
            // If days ran out naturally (0), treat as expired
            else if (daysRemaining === 0) {
                isAccessDenied = true;
            }

            // 4. Build User Object
            const userData: User = {
              uid: firebaseUser.uid,
              shopName: firebaseUser.displayName || 'My Shop',
              email: firebaseUser.email || '',
              phone: '', 
              address: '',
              planName: subscriptionStatus === 'active' ? 'Premium Plan' : 'Free Trial',
              daysRemaining: daysRemaining,
              subscriptionStatus: subscriptionStatus,
              subscriptionExpiryDate: subscriptionExpiryDate
            };
            
            setUser(userData);
            
            // 5. Routing Logic
            if (view === 'admin') {
                setLoading(false);
                return;
            }

            // Suspended Screen
            if (subscriptionStatus === 'suspended') {
                setLoading(false);
                return;
            }

            // Expiration Redirect
            if (isAccessDenied) {
                // If they are on allowed public pages, let them be
                if (view !== 'landing' && view !== 'privacy' && view !== 'terms') {
                    setView('upgrade');
                }
            } else {
                // Valid Access
                if (view === 'login' || view === 'upgrade') {
                    setView('dashboard');
                }
            }

        } else {
            setUser(null);
        }
      } else {
        // User is signed out
        setUser(null);
        if (view === 'dashboard' || view === 'upgrade') {
          setView('landing');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [view]);

  const handleLogin = (details: { shopName: string }) => {
     // No-op
  };

  const handleUpdateUser = async (updatedData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updatedData });
      if (updatedData.shopName || updatedData.phone || updatedData.address) {
          try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, updatedData);
          } catch(e) {
              console.error("Error updating profile", e);
          }
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setView('landing'); 
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const navigateTo = (target: ViewState) => {
    setView(target);
    if (target !== 'landing') {
      window.scrollTo(0, 0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // SUSPENDED VIEW
  if (user && user.subscriptionStatus === 'suspended') {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-6 text-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-100">
                <div className="flex justify-center mb-6">
                    <div className="bg-red-100 p-4 rounded-full">
                        <AlertOctagon className="h-10 w-10 text-red-600" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Suspended</h1>
                <p className="text-gray-600 mb-8">
                    Your access to OrderBuddy has been suspended due to a violation of our terms or payment issues.
                </p>
                <button 
                    onClick={() => {
                        window.open(`https://wa.me/923078804659?text=${encodeURIComponent(`Hello Support, my account (${user.email}) is suspended. Please help.`)}`, '_blank');
                    }}
                    className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors mb-3"
                >
                    <Phone className="h-5 w-5 mr-2" />
                    Contact Support
                </button>
                <button 
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-gray-600 text-sm font-medium"
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Show Navbar everywhere except full-screen 'upgrade' or 'admin' pages */}
      {(view !== 'upgrade' && view !== 'admin') && (
        <Navbar 
          view={view} 
          user={user} 
          onNavigate={navigateTo} 
          onLogout={handleLogout} 
        />
      )}
      
      <main className="flex-grow">
        {view === 'landing' && <LandingPage user={user} onGetStarted={() => user ? setView('dashboard') : setView('login')} />}
        {view === 'login' && <LoginPage onLogin={handleLogin} />}
        
        {view === 'dashboard' && user && (
          <Dashboard 
            user={user} 
            onLogout={handleLogout} 
            onUpdateUser={handleUpdateUser}
          />
        )}
        
        {view === 'upgrade' && user && (
           <UpgradePage user={user} onLogout={handleLogout} />
        )}

        {view === 'admin' && (
            <AdminPanel onExit={() => setView('landing')} onNavigate={navigateTo} />
        )}

        {(view === 'privacy' || view === 'terms') && (
            <LegalPage type={view} onBack={() => navigateTo('landing')} />
        )}
      </main>

      {/* Show Footer everywhere except full-screen 'upgrade' or 'admin' pages */}
      {(view !== 'upgrade' && view !== 'admin') && (
        <Footer onNavigate={navigateTo} currentView={view} />
      )}
    </div>
  );
};

export default App;