/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './supabaseClient';
import { 
  Check, 
  Copy, 
  Download, 
  Trash2, 
  Lock, 
  Sparkles, 
  Mail, 
  Calendar, 
  Users, 
  X as CloseIcon, 
  ArrowRight,
  TrendingUp,
  Award,
  User,
  LogIn,
  UserPlus,
  ArrowLeft,
  ShoppingBag,
  Eye,
  EyeOff,
  Heart,
  Package,
  ShieldCheck,
  LogOut,
  MapPin,
  CreditCard,
  BarChart3,
  PieChart,
  Activity,
  DollarSign,
  Sliders,
  Plus,
  Search,
  ArrowUpRight
} from 'lucide-react';

interface WaitlistEntry {
  email: string;
  timestamp: string;
  position: number;
}

interface MemberUser {
  name: string;
  email: string;
  password?: string;
  id: string;
  joinedAt: string;
  tier: string;
  points: number;
}

interface BoutiqueItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  specs: string[];
}

const BOUTIQUE_ITEMS: BoutiqueItem[] = [
  {
    id: 'chrono',
    name: 'Obelii Chrono-01',
    category: 'Horology',
    price: 890,
    image: '⌚',
    description: 'A bespoke hand-wound mechanical chronograph with flat-matte titanium casing, skeleton sapphire back, and a hand-stitched Tuscan suede strap.',
    specs: ['40mm Titanium Case', 'Manual Caliber 1801', '72hr Power Reserve']
  },
  {
    id: 'wallet',
    name: 'Obelii Card-Case',
    category: 'Leather Goods',
    price: 145,
    image: '💳',
    description: 'RFID-secure aerospace aluminium frame wrapped in full-grain vegetable-tanned leather. Includes our signature quick-ejection lever mechanism.',
    specs: ['Holds 6-8 Cards', 'RFID Shielding', 'Cognac Saffiano Finish']
  },
  {
    id: 'candle',
    name: 'Obelii Candle No. 9',
    category: 'Maison',
    price: 65,
    image: '🕯️',
    description: 'Hand-poured organic coconut wax infused with black pepper, rare agarwood, and roasted saffron, set within a brutalist custom-molded concrete vessel.',
    specs: ['60 Hours Burn Time', 'Pure Essential Oils', 'Brutalist Vessel']
  },
  {
    id: 'bag',
    name: 'Obelii Weekender',
    category: 'Travel',
    price: 380,
    image: '💼',
    description: 'Waterproof double-bonded British cotton canvas, hand-hammered solid copper rivets, and heavy-gauge brass dual zippers for lifelong endurance.',
    specs: ['42-Liter Capacity', 'Solid Brass Hardware', 'Water-Resistant Lining']
  }
];

export default function App() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [queuePosition, setQueuePosition] = useState<number>(1284);
  const [totalSignups, setTotalSignups] = useState<number>(1283);
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [countdown, setCountdown] = useState({ days: 48, hours: 14, minutes: 5, seconds: 22 });
  
  // VIP Account State Hooks
  const [activeView, setActiveView] = useState<'waitlist' | 'signin' | 'signup' | 'member'>('waitlist');
  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccessMessage, setAuthSuccessMessage] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [members, setMembers] = useState<MemberUser[]>([]);
  const [currentUser, setCurrentUser] = useState<MemberUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Boutique interactive states
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [preorders, setPreorders] = useState<string[]>([]);
  const [regionPref, setRegionPref] = useState('European Union');
  const [boutiqueNotification, setBoutiqueNotification] = useState('');
  
  // Google Auth interactive states
  const [googleAuthOpen, setGoogleAuthOpen] = useState(false);
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);
  const [googleSelectedAccount, setGoogleSelectedAccount] = useState<string | null>(null);
  const [googleCustomName, setGoogleCustomName] = useState('');
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');
  const [showGoogleCustomInput, setShowGoogleCustomInput] = useState(false);
  const [savedGoogleAccounts, setSavedGoogleAccounts] = useState<{email: string, name: string}[]>(() => {
    try {
      const saved = localStorage.getItem('obelii_saved_google_accounts');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  
  // Admin Panel states
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminKeyCounter, setAdminKeyCounter] = useState(0);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const lastClickTime = useRef<number>(0);

  // Interactive Mouse position tracking for 3D premium glare and fluid displacement
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientWidth, clientHeight } = e.currentTarget;
    const x = (e.clientX / clientWidth) - 0.5;
    const y = (e.clientY / clientHeight) - 0.5;
    setMousePosition({ x, y });
  };

  // Load waitlist and VIP member data from Supabase/LocalStorage on mount
  useEffect(() => {
    const fetchWaitlistAndSeeding = async () => {
      try {
        const { data, error } = await supabase.from('waitlist').select('*').order('position', { ascending: false });
        
        if (error || !data || data.length === 0) {
          // If there's an error (e.g. table not created yet) or no rows, fall back to local storage or seed
          const savedList = localStorage.getItem('obelii_waitlist');
          const savedCount = localStorage.getItem('obelii_total_signups');
          
          let initialWaitlist: WaitlistEntry[] = [];
          if (savedList) {
            try {
              initialWaitlist = JSON.parse(savedList);
            } catch (e) {}
          } else {
            initialWaitlist = [
              { email: 'curator@luxe-ateliers.co', timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), position: 1283 },
              { email: 'monocle.editor@aesthetic.org', timestamp: new Date(Date.now() - 14 * 3600000).toISOString(), position: 1282 },
              { email: 'minimalist.architect@soma.design', timestamp: new Date(Date.now() - 28 * 3600000).toISOString(), position: 1281 },
              { email: 'sterling.lux@curated.life', timestamp: new Date(Date.now() - 36 * 3600000).toISOString(), position: 1280 }
            ];
            localStorage.setItem('obelii_waitlist', JSON.stringify(initialWaitlist));
            
            // Try to seed database waitlist table if it exists
            try {
              const seedList = initialWaitlist.map(w => ({
                email: w.email,
                position: w.position,
                created_at: w.timestamp
              }));
              await supabase.from('waitlist').insert(seedList);
            } catch (dbErr) {
              console.log("Waitlist table might not be created yet, using localStorage fallback.");
            }
          }
          setWaitlist(initialWaitlist);
          
          if (savedCount) {
            const parsedCount = parseInt(savedCount, 10);
            setTotalSignups(parsedCount);
            setQueuePosition(parsedCount + 1);
          } else {
            setTotalSignups(1283);
            setQueuePosition(1284);
            localStorage.setItem('obelii_total_signups', '1283');
          }
        } else {
          // Successfully loaded from Supabase!
          const loadedWaitlist = data.map(d => ({
            email: d.email,
            timestamp: d.created_at || new Date().toISOString(),
            position: d.position
          }));
          setWaitlist(loadedWaitlist);
          const maxPos = Math.max(...loadedWaitlist.map(d => d.position), 1283);
          setTotalSignups(maxPos);
          setQueuePosition(maxPos + 1);
          localStorage.setItem('obelii_waitlist', JSON.stringify(loadedWaitlist));
          localStorage.setItem('obelii_total_signups', maxPos.toString());
        }
      } catch (err) {
        console.error("Error in waitlist loading process", err);
      }
    };
    fetchWaitlistAndSeeding();

    // Check for active login session and restore profile, wishlist, and preorders from Supabase
    const restoreSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const userEmail = session.user?.email || '';
          const userId = session.user?.id || '';
          const userName = session.user?.user_metadata?.name || userEmail.split('@')[0];

          // Fetch profile details or upsert
          let profile = null;
          try {
            const { data: pData } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
            profile = pData;
            if (!profile) {
              const defaultProfile = {
                id: userId,
                name: userName,
                email: userEmail,
                tier: "FOUNDING MEMBER",
                points: 100,
                region_preference: "European Union"
              };
              await supabase.from('profiles').insert(defaultProfile);
              profile = defaultProfile;
            }
          } catch (pErr) {
            console.log("Profiles table might not exist yet. Using mock fallback.", pErr);
          }

          const resolvedProfile = profile || {
            id: userId,
            name: userName,
            email: userEmail,
            tier: "FOUNDING MEMBER",
            points: 100,
            region_preference: "European Union"
          };

          // Fetch wishlist and preorders
          let resolvedWishlist: string[] = [];
          let resolvedPreorders: string[] = [];
          try {
            const { data: wishData } = await supabase.from('wishlist_items').select('product_id').eq('user_id', userId);
            if (wishData) resolvedWishlist = wishData.map(w => w.product_id);
            
            const { data: preData } = await supabase.from('preorders').select('product_id').eq('user_id', userId);
            if (preData) resolvedPreorders = preData.map(p => p.product_id);
          } catch (dbErr) {
            console.log("Wishlist/Preorders tables might not exist yet, fallback to localStorage.", dbErr);
            const savedWishlist = localStorage.getItem('obelii_wishlist');
            if (savedWishlist) resolvedWishlist = JSON.parse(savedWishlist);
            const savedPreorders = localStorage.getItem('obelii_preorders');
            if (savedPreorders) resolvedPreorders = JSON.parse(savedPreorders);
          }

          setWishlist(resolvedWishlist);
          setPreorders(resolvedPreorders);
          setRegionPref(resolvedProfile.region_preference || 'European Union');

          const loggedInUser: MemberUser = {
            name: resolvedProfile.name,
            email: resolvedProfile.email,
            id: resolvedProfile.id,
            joinedAt: session.user?.created_at || new Date().toISOString(),
            tier: resolvedProfile.tier,
            points: resolvedProfile.points
          };
          setCurrentUser(loggedInUser);
          localStorage.setItem('obelii_current_member', JSON.stringify(loggedInUser));
          localStorage.setItem('obelii_region_pref', resolvedProfile.region_preference || 'European Union');
          setActiveView('member');
        } else {
          // LocalStorage fallback for offline demonstration
          const savedSession = localStorage.getItem('obelii_current_member');
          if (savedSession) {
            try {
              const parsedUser = JSON.parse(savedSession);
              setCurrentUser(parsedUser);
              setActiveView('member');
              
              const savedWishlist = localStorage.getItem('obelii_wishlist');
              if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
              const savedPreorders = localStorage.getItem('obelii_preorders');
              if (savedPreorders) setPreorders(JSON.parse(savedPreorders));
              const savedRegion = localStorage.getItem('obelii_region_pref');
              if (savedRegion) setRegionPref(savedRegion);
            } catch (e) {
              console.error("Error restoring session", e);
            }
          }
        }
      } catch (err) {
        console.error("Error restoring session from Supabase", err);
      }
    };
    restoreSession();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        clearInterval(timer);
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Protect private views (member lounge) dynamically
  useEffect(() => {
    const protectRoute = async () => {
      if (activeView === 'member') {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
             setCurrentUser(null);
             localStorage.removeItem('obelii_current_member');
             setActiveView('signin');
             setAuthError('Please sign in to access the private VIP Lounge.');
          } else {
             // Sync wishlist and preorders from database
             try {
               const userId = session.user.id;
               const { data: wishData } = await supabase.from('wishlist_items').select('product_id').eq('user_id', userId);
               const { data: preData } = await supabase.from('preorders').select('product_id').eq('user_id', userId);
               if (wishData) setWishlist(wishData.map(w => w.product_id));
               if (preData) setPreorders(preData.map(p => p.product_id));
             } catch (dbErr) {
               console.log("Database syncing error in protectRoute, continuing with local state.");
             }
          }
        } catch (err) {
          console.error("Error verifying route protection session", err);
          setCurrentUser(null);
          localStorage.removeItem('obelii_current_member');
          setActiveView('signin');
          setAuthError('Session verification failed. Please sign in again.');
        }
      }
    };
    protectRoute();
  }, [activeView]);

  // Handle Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error("Error enabling fullscreen", err);
      });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setErrorMessage('Please enter a valid email address.');
      setStatus('error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please provide a properly formatted email.');
      setStatus('error');
      return;
    }

    setStatus('loading');

    try {
      // 1. Try to check duplicate in Supabase waitlist table
      let isDuplicate = false;
      try {
        const { data: duplicateData } = await supabase.from('waitlist').select('id').eq('email', email).limit(1);
        if (duplicateData && duplicateData.length > 0) {
          isDuplicate = true;
        }
      } catch (dbErr) {
        console.log("Error querying duplicate from Supabase, using localStorage.", dbErr);
        const savedList = localStorage.getItem('obelii_waitlist');
        if (savedList) {
          const currentList: WaitlistEntry[] = JSON.parse(savedList);
          isDuplicate = currentList.some(entry => entry.email.toLowerCase() === email.toLowerCase());
        }
      }

      if (isDuplicate) {
        setErrorMessage('This email is already registered on our waitlist.');
        setStatus('error');
        return;
      }

      // 2. Compute next queue position
      let nextPos = totalSignups + 1;
      try {
        const { data: maxPosData } = await supabase.from('waitlist').select('position').order('position', { ascending: false }).limit(1);
        if (maxPosData && maxPosData.length > 0) {
          nextPos = maxPosData[0].position + 1;
        }
      } catch (dbErr) {
        console.log("Could not compute next position via Supabase, using default.", dbErr);
      }

      // 3. Insert into Supabase waitlist table
      const newEntry: WaitlistEntry = {
        email: email,
        timestamp: new Date().toISOString(),
        position: nextPos
      };

      try {
        await supabase.from('waitlist').insert({
          email: email,
          position: nextPos,
          created_at: newEntry.timestamp
        });
      } catch (dbErr) {
        console.log("Failed to insert into Supabase waitlist, saving locally.", dbErr);
      }

      // 4. Update local states and localStorage fallback
      const savedList = localStorage.getItem('obelii_waitlist');
      let currentList: WaitlistEntry[] = [];
      if (savedList) {
        try { currentList = JSON.parse(savedList); } catch (e) {}
      }
      const updatedList = [newEntry, ...currentList];
      localStorage.setItem('obelii_waitlist', JSON.stringify(updatedList));
      localStorage.setItem('obelii_total_signups', nextPos.toString());

      setWaitlist(updatedList);
      setTotalSignups(nextPos);
      setQueuePosition(nextPos);
      setReferralCode(`OBELII-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${nextPos}`);
      setStatus('success');
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while joining the waitlist.');
      setStatus('error');
    }
  };

  // Handle VIP Member Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMessage('');
    
    if (!signinEmail || !signinPassword) {
      setAuthError('Please fill in all credentials.');
      return;
    }

    setAuthLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signinEmail,
        password: signinPassword
      });

      if (error) {
        setAuthError(error.message);
        setAuthLoading(false);
        return;
      }

      // ONLY redirect when a real session exists after login
      if (!data.session) {
        setAuthError('Authentication succeeded but no active session was returned. Please try again.');
        setAuthLoading(false);
        return;
      }

      // Successful login - Fetch profile details
      const userEmail = data.user?.email || signinEmail;
      const userId = data.user?.id;
      const userName = data.user?.user_metadata?.name || userEmail.split('@')[0];

      let profile = null;
      try {
        const { data: pData } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
        profile = pData;
        if (!profile) {
          const defaultProfile = {
            id: userId,
            name: userName,
            email: userEmail,
            tier: "FOUNDING MEMBER",
            points: 100,
            region_preference: "European Union"
          };
          await supabase.from('profiles').insert(defaultProfile);
          profile = defaultProfile;
        }
      } catch (pErr) {
        console.log("Profiles table might not exist yet, using mock fallback.", pErr);
      }

      const resolvedProfile = profile || {
        id: userId,
        name: userName,
        email: userEmail,
        tier: "FOUNDING MEMBER",
        points: 100,
        region_preference: "European Union"
      };

      // Fetch wishlist and preorders
      let resolvedWishlist: string[] = [];
      let resolvedPreorders: string[] = [];
      try {
        const { data: wishData } = await supabase.from('wishlist_items').select('product_id').eq('user_id', userId);
        if (wishData) resolvedWishlist = wishData.map(w => w.product_id);
        
        const { data: preData } = await supabase.from('preorders').select('product_id').eq('user_id', userId);
        if (preData) resolvedPreorders = preData.map(p => p.product_id);
      } catch (dbErr) {
        console.log("Wishlist/Preorders tables might not exist yet, fallback to localStorage.", dbErr);
        const savedWishlist = localStorage.getItem('obelii_wishlist');
        if (savedWishlist) resolvedWishlist = JSON.parse(savedWishlist);
        const savedPreorders = localStorage.getItem('obelii_preorders');
        if (savedPreorders) resolvedPreorders = JSON.parse(savedPreorders);
      }

      setWishlist(resolvedWishlist);
      setPreorders(resolvedPreorders);
      setRegionPref(resolvedProfile.region_preference || 'European Union');

      const loggedInUser: MemberUser = {
        name: resolvedProfile.name,
        email: resolvedProfile.email,
        id: resolvedProfile.id,
        joinedAt: data.user?.created_at || new Date().toISOString(),
        tier: resolvedProfile.tier,
        points: resolvedProfile.points
      };

      setCurrentUser(loggedInUser);
      localStorage.setItem('obelii_current_member', JSON.stringify(loggedInUser));
      localStorage.setItem('obelii_region_pref', resolvedProfile.region_preference || 'European Union');
      
      setActiveView('member'); // Redirect to Member Lounge view
      setAuthLoading(false);
      triggerBoutiqueNotification(`Welcome back, ${resolvedProfile.name}. Signed in successfully.`);
    } catch (err: any) {
      setAuthError(err?.message || 'An unexpected error occurred during sign-in.');
      setAuthLoading(false);
    }
  };

  // Handle VIP Member Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMessage('');

    if (!signupName || !signupEmail || !signupPassword) {
      setAuthError('Please fill in all fields.');
      return;
    }

    if (signupPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail)) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    setAuthLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            name: signupName
          }
        }
      });

      if (error) {
        setAuthError(error.message);
        setAuthLoading(false);
        return;
      }

      // If a session was somehow auto-established, sign out to enforce the "no auto-login" rule
      if (data.session) {
        await supabase.auth.signOut();
      }

      // Auto-add signup email to general waitlist if not already present in Supabase
      try {
        const { data: dupData } = await supabase.from('waitlist').select('id').eq('email', signupEmail).limit(1);
        if (!dupData || dupData.length === 0) {
          const { data: maxPosData } = await supabase.from('waitlist').select('position').order('position', { ascending: false }).limit(1);
          const nextPos = maxPosData && maxPosData.length > 0 ? maxPosData[0].position + 1 : 1284;
          
          await supabase.from('waitlist').insert({
            email: signupEmail,
            position: nextPos
          });

          const newWaitlistEntry: WaitlistEntry = {
            email: signupEmail,
            timestamp: new Date().toISOString(),
            position: nextPos
          };
          setWaitlist(prev => [newWaitlistEntry, ...prev]);
          setTotalSignups(nextPos);
        }
      } catch (dbErr) {
        console.log("Failed to register waitlist entry on signup. Using localStorage.", dbErr);
        const savedList = localStorage.getItem('obelii_waitlist');
        let currentWaitlist: WaitlistEntry[] = [];
        if (savedList) {
          try { currentWaitlist = JSON.parse(savedList); } catch (err) {}
        }
        if (!currentWaitlist.some(entry => entry.email.toLowerCase() === signupEmail.toLowerCase())) {
          const newWaitlistEntry: WaitlistEntry = {
            email: signupEmail,
            timestamp: new Date().toISOString(),
            position: totalSignups + 1
          };
          const updatedWaitlist = [newWaitlistEntry, ...currentWaitlist];
          setWaitlist(updatedWaitlist);
          localStorage.setItem('obelii_waitlist', JSON.stringify(updatedWaitlist));
          setTotalSignups(totalSignups + 1);
        }
      }

      // Pre-fill the email they just used into the Sign In form
      setSigninEmail(signupEmail);

      // Reset signup form fields
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');

      // Show success verification instructions message on Sign In page
      setAuthSuccessMessage("Your account has been created. Please check your email and verify your address before logging in.");

      // Redirect the user to the Sign In page
      setActiveView('signin');
      setAuthLoading(false);
      triggerBoutiqueNotification('Account created. Check your email to verify.');
    } catch (err: any) {
      setAuthError(err?.message || 'An unexpected error occurred during sign-up.');
      setAuthLoading(false);
    }
  };

  // Handle Google OAuth Action
  const handleGoogleSignIn = (emailStr: string, nameStr: string) => {
    setGoogleAuthLoading(true);
    setGoogleSelectedAccount(emailStr);
    
    setTimeout(() => {
      // Look for user with this email in members
      let foundUser = members.find(m => m.email.toLowerCase() === emailStr.toLowerCase());
      
      if (!foundUser) {
        // Sign-up process: create a brand new user
        const randomIdNum = Math.floor(10200 + Math.random() * 89000);
        foundUser = {
          name: nameStr,
          email: emailStr,
          password: `google-oauth-${Math.random().toString(36).substring(2, 10)}`, // secure random pw
          id: `OB-${randomIdNum}`,
          joinedAt: new Date().toISOString(),
          tier: "FOUNDING MEMBER",
          points: 150 // special 150 points for signing up with Google!
        };
        
        const updatedMembers = [...members, foundUser];
        setMembers(updatedMembers);
        localStorage.setItem('obelii_members', JSON.stringify(updatedMembers));
        
        // Auto-add signup email to general waitlist if not already present
        const savedList = localStorage.getItem('obelii_waitlist');
        let currentWaitlist: WaitlistEntry[] = [];
        if (savedList) {
          try { currentWaitlist = JSON.parse(savedList); } catch (err) {}
        }
        if (!currentWaitlist.some(entry => entry.email.toLowerCase() === emailStr.toLowerCase())) {
          const newWaitlistEntry: WaitlistEntry = {
            email: emailStr,
            timestamp: new Date().toISOString(),
            position: totalSignups + 1
          };
          const updatedWaitlist = [newWaitlistEntry, ...currentWaitlist];
          setWaitlist(updatedWaitlist);
          localStorage.setItem('obelii_waitlist', JSON.stringify(updatedWaitlist));
          setTotalSignups(totalSignups + 1);
        }
        
        triggerBoutiqueNotification(`Welcome, ${nameStr}! Account verified with Google.`);
      } else {
        triggerBoutiqueNotification(`Welcome back, ${foundUser.name}. Signed in with Google.`);
      }
      
      // Dynamic: save this Google account to savedGoogleAccounts so it is remembered locally
      setSavedGoogleAccounts(prev => {
        const exists = prev.some(acc => acc.email.toLowerCase() === emailStr.toLowerCase());
        if (!exists) {
          const updated = [...prev, { email: emailStr, name: nameStr }];
          localStorage.setItem('obelii_saved_google_accounts', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });

      setCurrentUser(foundUser);
      localStorage.setItem('obelii_current_member', JSON.stringify(foundUser));
      setActiveView('member');
      setGoogleAuthOpen(false);
      setGoogleAuthLoading(false);
      setGoogleSelectedAccount(null);
      setShowGoogleCustomInput(false);
      setGoogleCustomEmail('');
      setGoogleCustomName('');
    }, 1500);
  };

  // Handle Supabase Google OAuth
  const handleSupabaseGoogleLogin = async () => {
    try {
      setAuthLoading(true);
      setAuthError('');
      setAuthSuccessMessage('');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        throw error;
      }
    } catch (err: any) {
      setAuthError(err?.message || 'An error occurred during Google Sign In.');
      setAuthLoading(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signing out from Supabase", err);
    }
    setCurrentUser(null);
    localStorage.removeItem('obelii_current_member');
    setActiveView('waitlist');
    setSigninEmail('');
    setSigninPassword('');
    setSignupName('');
    setSignupEmail('');
    setSignupPassword('');
    setAuthError('');
    setAuthSuccessMessage('');
  };

  // Toggle Item Wishlist
  const toggleWishlist = async (productId: string) => {
    let updated: string[];
    if (wishlist.includes(productId)) {
      updated = wishlist.filter(id => id !== productId);
      if (currentUser) {
        try {
          await supabase.from('wishlist_items').delete().eq('user_id', currentUser.id).eq('product_id', productId);
        } catch (e) {
          console.log("Error removing from database wishlist, continuing locally.", e);
        }
      }
      triggerBoutiqueNotification('Item removed from wishlist.');
    } else {
      updated = [...wishlist, productId];
      if (currentUser) {
        try {
          await supabase.from('wishlist_items').insert({
            user_id: currentUser.id,
            product_id: productId
          });
        } catch (e) {
          console.log("Error inserting to database wishlist, continuing locally.", e);
        }
      }
      triggerBoutiqueNotification('Item added to wishlist.');
    }
    setWishlist(updated);
    localStorage.setItem('obelii_wishlist', JSON.stringify(updated));
  };

  // Toggle Item Pre-Order
  const togglePreorder = async (productId: string) => {
    let updated: string[];
    if (preorders.includes(productId)) {
      updated = preorders.filter(id => id !== productId);
      if (currentUser) {
        try {
          await supabase.from('preorders').delete().eq('user_id', currentUser.id).eq('product_id', productId);
        } catch (e) {
          console.log("Error removing from database preorders, continuing locally.", e);
        }
      }
      triggerBoutiqueNotification('Priority reservation cancelled.');
    } else {
      updated = [...preorders, productId];
      if (currentUser) {
        try {
          await supabase.from('preorders').insert({
            user_id: currentUser.id,
            product_id: productId
          });
        } catch (e) {
          console.log("Error inserting to database preorders, continuing locally.", e);
        }
      }
      triggerBoutiqueNotification('Priority reservation secured. Production queue updated.');
    }
    setPreorders(updated);
    localStorage.setItem('obelii_preorders', JSON.stringify(updated));
  };

  // Helper to trigger premium transient notification alerts
  const triggerBoutiqueNotification = (msg: string) => {
    setBoutiqueNotification(msg);
    setTimeout(() => {
      setBoutiqueNotification('');
    }, 3000);
  };

  // Copy Referral Code
  const handleCopy = () => {
    const referralLink = `${window.location.origin}?ref=${queuePosition}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export Waitlist CSV
  const exportCSV = () => {
    if (waitlist.length === 0) return;
    const headers = ['Email', 'Sign-up Date', 'Queue Position'];
    const rows = waitlist.map(entry => [
      entry.email,
      new Date(entry.timestamp).toLocaleString(),
      entry.position
    ]);
    
    const csvContent = [headers, ...rows]
      .map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(","))
      .join("\n");
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `obelii_waitlist_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delete Member Account
  const handleDeleteMembership = async () => {
    if (!currentUser) return;

    try {
      // 1. Delete user profiles, wishlist, and preorders from Supabase database
      const userId = currentUser.id;
      try {
        await supabase.from('wishlist_items').delete().eq('user_id', userId);
        await supabase.from('preorders').delete().eq('user_id', userId);
        await supabase.from('profiles').delete().eq('id', userId);
      } catch (dbErr) {
        console.log("Failed to delete database entries for user. Continuing.", dbErr);
      }

      // 2. Sign out of Supabase auth
      try {
        await supabase.auth.signOut();
      } catch (authErr) {
        console.log("Auth signout failed.", authErr);
      }

      // 3. Clear states and local storage fallback
      const updatedMembers = members.filter(m => m.email.toLowerCase() !== currentUser.email.toLowerCase());
      setMembers(updatedMembers);
      localStorage.setItem('obelii_members', JSON.stringify(updatedMembers));
      localStorage.removeItem('obelii_wishlist');
      localStorage.removeItem('obelii_preorders');
      setWishlist([]);
      setPreorders([]);
      setRegionPref('European Union');
    } catch (err) {
      console.error("Error deleting member session", err);
    }

    setCurrentUser(null);
    localStorage.removeItem('obelii_current_member');

    // Go back to waitlist home view
    setActiveView('waitlist');

    // Clear all registration & credential inputs
    setSigninEmail('');
    setSigninPassword('');
    setSignupName('');
    setSignupEmail('');
    setSignupPassword('');
    setAuthError('');
    setShowDeleteConfirm(false);

    triggerBoutiqueNotification('Account deleted successfully.');
  };

  // Clear Waitlist Local Storage & Supabase waitlist table
  const clearWaitlist = async () => {
    if (window.confirm("Are you sure you want to completely clear the waitlist data?")) {
      try {
        await supabase.from('waitlist').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
      } catch (dbErr) {
        console.log("Failed to clear Supabase waitlist table.", dbErr);
      }
      localStorage.removeItem('obelii_waitlist');
      localStorage.setItem('obelii_total_signups', '1283');
      setWaitlist([]);
      setTotalSignups(1283);
      setQueuePosition(1284);
    }
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="relative min-h-screen bg-[#050505] text-[#f5f5f5] flex flex-col justify-center items-center overflow-hidden font-sans-luxury selection:bg-orange-500/30 selection:text-white px-6 py-12"
    >
      
      {/* REALISTIC FILM GRAIN: Adds photographic texture to ambient lighting */}
      <div className="absolute inset-0 noise-bg mix-blend-overlay opacity-[0.035] pointer-events-none z-10" />
      
      {/* BACKGROUND GRAPHICS: Moving parallax metallic dark abstract fluid flow and organic glowing copper-orange streak */}
      <div 
        className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden"
        style={{
          transform: `translate(${mousePosition.x * -16}px, ${mousePosition.y * -16}px) scale(1.02)`,
          transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)'
        }}
      >
        <svg className="absolute top-0 left-0 w-full h-full opacity-80 mix-blend-screen animate-pulse" style={{ animationDuration: '15s' }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="indigo-sphere" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#1e130c" stopOpacity="0.45" />
              <stop offset="40%" stopColor="#0a0a10" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#050505" stopOpacity="0" />
            </radialGradient>
            
            <linearGradient id="neon-glow-gradient" x1="0%" y1="10%" x2="100%" y2="90%">
              <stop offset="0%" stopColor="#ea580c" stopOpacity="0" />
              <stop offset="25%" stopColor="#f97316" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#ffedd5" stopOpacity="0.95" />
              <stop offset="75%" stopColor="#ea580c" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#431407" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="chrome-reflection" x1="10%" y1="10%" x2="90%" y2="90%">
              <stop offset="0%" stopColor="#334155" stopOpacity="0.12" />
              <stop offset="50%" stopColor="#1e293b" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0" />
            </linearGradient>
            
            <filter id="ultra-blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="110" />
            </filter>
            
            <filter id="soft-lens-blur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="25" />
            </filter>
          </defs>

          {/* Deep Ambient Base Radial Gradient */}
          <rect width="100%" height="100%" fill="url(#indigo-sphere)" />

          {/* Liquid Chrome Silhouette Wave */}
          <path 
            d="M -200,300 C 150,150 400,450 300,750 C 200,1050 -150,950 -200,650 Z" 
            fill="url(#chrome-reflection)" 
            filter="url(#ultra-blur)" 
          />

          <path 
            d="M 1000,200 C 1200,50 1400,400 1300,700 C 1200,1000 900,900 1000,600 Z" 
            fill="url(#chrome-reflection)" 
            filter="url(#ultra-blur)" 
            opacity="0.9"
          />

          {/* The Gorgeous Copper-Orange Glowing Neon Sweep looping diagonally behind the glass card */}
          <path 
            d="M -100,520 Q 550,220 900,410 T 1600,250" 
            fill="none" 
            stroke="url(#neon-glow-gradient)" 
            strokeWidth="75" 
            strokeLinecap="round"
            filter="url(#ultra-blur)"
          />

          {/* Core high-intensity neon highlight inside the swoop */}
          <path 
            d="M -100,520 Q 550,220 900,410 T 1600,250" 
            fill="none" 
            stroke="#ffeedd" 
            strokeWidth="12" 
            strokeLinecap="round"
            opacity="0.45"
            filter="url(#soft-lens-blur)"
          />
        </svg>

        {/* Ambient floating light spots */}
        <div className="absolute top-[30%] left-[35%] w-[160px] h-[160px] bg-orange-500/25 rounded-full filter blur-[60px] animate-float-1" />
        <div className="absolute bottom-[25%] right-[30%] w-[200px] h-[200px] bg-amber-500/15 rounded-full filter blur-[80px] animate-float-2" />
      </div>

      {/* MAIN LAYOUT WRAPPER (Centered like the screenshot) */}
      <div className="relative z-10 flex flex-col justify-center items-center w-full max-w-4xl mx-auto space-y-10 perspective-1000">
        
        {/* TOP BADGE: ⏳ Join list */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex justify-center items-center group cursor-pointer"
        >
          <div className="px-5 py-2 bg-black/45 rounded-full flex items-center gap-2.5 border border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-300 group-hover:border-white/25 group-hover:bg-black/60 group-hover:scale-105 active:scale-95">
            {/* Hourglass Icon with gentle rotation loop on hover */}
            <svg 
              className="w-4 h-4 text-white/80 group-hover:animate-spin-slow" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M5 2h14" />
              <path d="M5 22h14" />
              <path d="M19 2v4c0 3.87-3.13 7-7 7s-7-3.13-7-7V2" />
              <path d="M12 13c-3.87 0-7 3.13-7 7v2h14v-2c0-3.87-3.13-7-7-7z" />
            </svg>
            <span className="text-xs font-semibold tracking-[0.1em] text-white/90">
              Join list
            </span>
          </div>
        </motion.div>



        {/* MAIN GLASSMORPHIC CARD - Clean, empty of titles to match the screenshot exactly, with 3D physical parallax rotation */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            rotateX: mousePosition.y * 10,
            rotateY: -mousePosition.x * 10,
          }}
          transition={{ 
            type: "spring", 
            stiffness: 75, 
            damping: 20, 
            mass: 0.8 
          }}
          style={{ transformStyle: "preserve-3d" }}
          className="w-full max-w-2xl px-6 py-12 md:px-12 md:py-14 rounded-[32px] glass-panel relative overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-white/10 backdrop-blur-[45px] group"
        >
          
          {/* Internal reflection highlight */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

          {/* SPOTLIGHT GRADIENT FLARE: Highly realistic glass reflection that follows the cursor on hover */}
          <div 
            className="absolute inset-0 pointer-events-none transition-opacity duration-500 opacity-0 group-hover:opacity-100 mix-blend-overlay"
            style={{
              background: `radial-gradient(circle at ${(mousePosition.x + 0.5) * 100}% ${(mousePosition.y + 0.5) * 100}%, rgba(255,255,255,0.15) 0%, transparent 60%)`
            }}
          />

          {/* Transient Boutique Notifications */}
          <AnimatePresence>
            {boutiqueNotification && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0d0d11]/90 border border-[#00e154]/30 px-5 py-2.5 rounded-full backdrop-blur-xl flex items-center gap-2 shadow-[0_8px_30px_rgba(0,225,84,0.15)] whitespace-nowrap"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#00e154] animate-pulse" />
                <span className="text-xs font-light text-white tracking-wide">{boutiqueNotification}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Waitlist and Member Auth Flow States */}
          <AnimatePresence mode="wait">
            {activeView === 'waitlist' && (
              <motion.div 
                key="waitlist-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="w-full"
              >
                {status !== 'success' ? (
                  <div className="w-full">
                    {/* Brand Showcase */}
                    <div className="text-center mb-10 select-none">
                      {/* Brand name matching uploaded logo exactly */}
                      <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-4 font-sans-luxury flex items-center justify-center">
                        Obelii<span className="text-[#00e154] ml-[1px] select-all drop-shadow-[0_0_12px_rgba(0,225,84,0.65)] animate-pulse">.</span>
                      </h1>
                      
                      {/* Status indicator tag */}
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/[0.02] border border-white/5 rounded-full mb-6">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e154] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00e154]"></span>
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-[#00e154] font-mono-luxury font-medium">
                          E-Commerce Store • Launching Soon
                        </span>
                      </div>

                      {/* Brand vision paragraph */}
                      <p className="text-xs md:text-[13px] text-white/55 font-light max-w-md mx-auto leading-relaxed">
                        Preparing to unveil a digital boutique of premium minimalist goods, luxury lifestyle apparel, and curated artisan items. Sign up for early access privileges and private collection previews.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="w-full flex flex-col sm:flex-row gap-4 justify-center items-center">
                      <div className="relative w-full sm:flex-1">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (status === 'error') setStatus('idle');
                          }}
                          placeholder="Enter email"
                          className="w-full bg-[#0d0d11]/70 border border-white/10 px-6 py-4 rounded-full text-white placeholder-white/25 text-sm font-light transition-all duration-300 backdrop-blur-lg focus:border-[#00e154]/40 focus:shadow-[0_0_20px_rgba(0,225,84,0.1)]"
                        />
                        {status === 'error' && (
                          <motion.span 
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute left-4 -bottom-6 text-[11px] text-red-400 font-light tracking-wide"
                          >
                            {errorMessage}
                          </motion.span>
                        )}
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full sm:w-auto bg-white hover:bg-white/95 text-black px-9 py-4 rounded-full font-semibold text-sm transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.65)] whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
                      >
                        {status === 'loading' ? (
                          <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        ) : (
                          'Join Waitlist'
                        )}
                      </motion.button>
                    </form>

                    {/* Member Account Navigation Options */}
                    <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row gap-4 justify-between items-center text-xs text-white/40">
                      <span className="font-light">
                        {currentUser ? `Signed in as ${currentUser.name}` : 'Already our launch partner?'}
                      </span>
                      <div className="flex items-center gap-4">
                        {currentUser ? (
                          <button 
                            onClick={() => { setActiveView('member'); }} 
                            className="text-[#00e154] hover:underline hover:text-[#00e154]/80 transition-colors font-medium flex items-center gap-1.5"
                          >
                            <Award className="w-3.5 h-3.5" /> Enter VIP Lounge
                          </button>
                        ) : (
                          <>
                            <button 
                              onClick={() => { setActiveView('signin'); setAuthError(''); setAuthSuccessMessage(''); }} 
                              className="text-[#00e154] hover:underline hover:text-[#00e154]/80 transition-colors font-medium flex items-center gap-1"
                            >
                              <LogIn className="w-3.5 h-3.5" /> Sign In
                            </button>
                            <span className="text-white/10">|</span>
                            <button 
                              onClick={() => { setActiveView('signup'); setAuthError(''); setAuthSuccessMessage(''); }} 
                              className="text-white/60 hover:text-white hover:underline transition-colors flex items-center gap-1"
                            >
                              <UserPlus className="w-3.5 h-3.5" /> Create Account
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Successful Signup State */
                  <div className="flex flex-col items-center text-center py-2">
                    <div className="w-14 h-14 bg-gradient-to-tr from-green-600 to-[#00e154] rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(0,225,84,0.4)] mb-5">
                      <Check className="w-7 h-7 text-white stroke-[3px]" />
                    </div>

                    <h2 className="text-3xl font-bold tracking-tight text-white mb-2 font-sans-luxury">
                      Welcome to Obelii<span className="text-[#00e154] select-all drop-shadow-[0_0_8px_rgba(0,225,84,0.5)]">.</span>
                    </h2>
                    
                    <p className="text-xs text-white/50 mb-6 max-w-sm leading-relaxed font-light">
                      Your priority reservation is confirmed. We will transmit private invitation credentials directly to your inbox immediately prior to the collection launch.
                    </p>

                    {/* Spot Details */}
                    <div className="w-full max-w-md bg-black/45 rounded-2xl border border-white/5 py-4 px-5 mb-6 flex justify-between items-center">
                      <div className="text-left">
                        <span className="text-[9px] uppercase tracking-widest text-white/40 block">Your Spot</span>
                        <span className="text-xl font-black text-white">#{queuePosition.toLocaleString()}</span>
                      </div>
                      <div className="h-6 w-[1px] bg-white/10"></div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase tracking-widest text-white/40 block">Total Queue</span>
                        <span className="text-sm font-medium text-[#00e154]">{totalSignups.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Referral Link Copy */}
                    <div className="w-full max-w-md mb-6">
                      <div className="relative flex items-center bg-black/60 rounded-full border border-white/10 p-1">
                        <span className="text-xs text-white/40 px-4 truncate flex-1 font-mono-luxury select-all">
                          obelii.com?ref={queuePosition}
                        </span>
                        <button
                          onClick={handleCopy}
                          className="bg-white hover:bg-white/95 text-black text-xs font-semibold px-4 py-2 rounded-full transition-all duration-300 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                        >
                          {copied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-black" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Return Action / Sign In action block */}
                    <div className="flex flex-col gap-3 justify-center items-center">
                      <button 
                        onClick={() => { setStatus('idle'); setEmail(''); }}
                        className="text-[10px] text-white/40 hover:text-white/70 transition-colors font-light tracking-wide underline underline-offset-4 cursor-pointer"
                      >
                        Sign up another email
                      </button>
                      
                      <div className="text-xs text-white/25 mt-3 pt-3 border-t border-white/5 w-64">
                        Want boutique options now?{' '}
                        <button 
                          onClick={() => { setActiveView('signup'); setAuthError(''); setAuthSuccessMessage(''); }} 
                          className="text-[#00e154] hover:underline"
                        >
                          Create Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeView === 'signin' && (
              <motion.div 
                key="signin-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="w-full"
              >
                {/* Header */}
                <div className="text-center mb-8 select-none">
                  <h2 className="text-3xl font-bold tracking-tight text-white mb-2 font-sans-luxury">
                    Obelii Member Access
                  </h2>
                  <p className="text-xs text-white/50 max-w-sm mx-auto leading-relaxed font-light">
                    Input your credentials to access the exclusive boutique member dashboard, private catalog, and pre-orders.
                  </p>
                </div>

                <form onSubmit={handleSignIn} className="w-full max-w-md mx-auto space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5 font-medium ml-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={signinEmail}
                      onChange={(e) => setSigninEmail(e.target.value)}
                      placeholder="e.g. tester@obelii.com"
                      className="w-full bg-[#0d0d11]/70 border border-white/10 px-5 py-3.5 rounded-full text-white placeholder-white/20 text-sm font-light transition-all duration-300 focus:border-[#00e154]/40"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5 font-medium ml-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={signinPassword}
                        onChange={(e) => setSigninPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#0d0d11]/70 border border-white/10 px-5 py-3.5 rounded-full text-white placeholder-white/20 text-sm font-light transition-all duration-300 focus:border-[#00e154]/40 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    <div className="text-[10px] text-white/35 mt-1.5 ml-1 select-none">
                      Tip: Use <span className="font-mono text-white/50">tester@obelii.com</span> / <span className="font-mono text-white/50">obelii2026</span> to immediately sign in.
                    </div>
                  </div>

                  {authError && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-400 font-light text-center"
                    >
                      {authError}
                    </motion.div>
                  )}

                  {authSuccessMessage && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-emerald-400 font-medium text-center bg-emerald-500/10 border border-emerald-500/20 py-2.5 px-4 rounded-xl"
                    >
                      {authSuccessMessage}
                    </motion.div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-white hover:bg-white/95 text-black py-3.5 rounded-full font-semibold text-sm transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2 cursor-pointer mt-6"
                  >
                    {authLoading ? (
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    ) : (
                      'Sign In to Lounge'
                    )}
                  </motion.button>

                  <div className="relative my-5 select-none flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-white/5"></div>
                    </div>
                    <div className="relative flex justify-center text-[9px] uppercase tracking-widest text-white/30 font-medium">
                      <span className="bg-[#0c0d12] px-3 py-0.5 rounded-full border border-white/5">Or continue with</span>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    onClick={handleSupabaseGoogleLogin}
                    className="w-full bg-[#12141c] hover:bg-[#161a24] border border-white/10 text-white py-3.5 rounded-full font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" strokeLinecap="round" />
                    </svg>
                    Continue with Google
                  </motion.button>
                </form>

                {/* Footer Switch */}
                <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-xs text-white/40">
                  <button 
                    onClick={() => { setActiveView('waitlist'); setAuthError(''); setAuthSuccessMessage(''); }} 
                    className="flex items-center gap-1.5 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Return to Waitlist
                  </button>
                  <button 
                    onClick={() => { setActiveView('signup'); setAuthError(''); setAuthSuccessMessage(''); }} 
                    className="text-[#00e154] hover:underline font-medium"
                  >
                    Create Account
                  </button>
                </div>
              </motion.div>
            )}

            {activeView === 'signup' && (
              <motion.div 
                key="signup-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="w-full"
              >
                {/* Header */}
                <div className="text-center mb-8 select-none">
                  <h2 className="text-3xl font-bold tracking-tight text-white mb-2 font-sans-luxury">
                    Create Account
                  </h2>
                  <p className="text-xs text-white/50 max-w-sm mx-auto leading-relaxed font-light">
                    Activate your member profile for lifetime collection archives, customized wishlists, and pre-release reservation credentials.
                  </p>
                </div>

                <form onSubmit={handleSignUp} className="w-full max-w-md mx-auto space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5 font-medium ml-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full bg-[#0d0d11]/70 border border-white/10 px-5 py-3.5 rounded-full text-white placeholder-white/20 text-sm font-light transition-all duration-300 focus:border-[#00e154]/40"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5 font-medium ml-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="e.g. name@domain.com"
                      className="w-full bg-[#0d0d11]/70 border border-white/10 px-5 py-3.5 rounded-full text-white placeholder-white/20 text-sm font-light transition-all duration-300 focus:border-[#00e154]/40"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5 font-medium ml-1">Create Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full bg-[#0d0d11]/70 border border-white/10 px-5 py-3.5 rounded-full text-white placeholder-white/20 text-sm font-light transition-all duration-300 focus:border-[#00e154]/40 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {authError && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-400 font-light text-center"
                    >
                      {authError}
                    </motion.div>
                  )}

                  {authSuccessMessage && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-emerald-400 font-medium text-center bg-emerald-500/10 border border-emerald-500/20 py-2.5 px-4 rounded-xl"
                    >
                      {authSuccessMessage}
                    </motion.div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-white hover:bg-white/95 text-black py-3.5 rounded-full font-semibold text-sm transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2 cursor-pointer mt-6"
                  >
                    {authLoading ? (
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    ) : (
                      'Create Account'
                    )}
                  </motion.button>

                  <div className="relative my-5 select-none flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-white/5"></div>
                    </div>
                    <div className="relative flex justify-center text-[9px] uppercase tracking-widest text-white/30 font-medium">
                      <span className="bg-[#0c0d12] px-3 py-0.5 rounded-full border border-white/5">Or continue with</span>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    onClick={handleSupabaseGoogleLogin}
                    className="w-full bg-[#12141c] hover:bg-[#161a24] border border-white/10 text-white py-3.5 rounded-full font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" strokeLinecap="round" />
                    </svg>
                    Continue with Google
                  </motion.button>
                </form>

                {/* Footer Switch */}
                <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-xs text-white/40">
                  <button 
                    onClick={() => { setActiveView('waitlist'); setAuthError(''); setAuthSuccessMessage(''); }} 
                    className="flex items-center gap-1.5 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Return to Waitlist
                  </button>
                  <button 
                    onClick={() => { setActiveView('signin'); setAuthError(''); setAuthSuccessMessage(''); }} 
                    className="text-[#00e154] hover:underline font-medium"
                  >
                    Already have an account?
                  </button>
                </div>
              </motion.div>
            )}

            {activeView === 'member' && currentUser && (
              <motion.div 
                key="member-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full space-y-8 text-left"
              >
                {/* Header Section */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 bg-[#00e154]/10 border border-[#00e154]/30 text-[#00e154] rounded font-medium">
                        Lounge Active
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-white mt-1.5 font-sans-luxury">
                      Welcome, {currentUser.name}
                    </h2>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSignOut}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-full text-xs font-light transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 hover:border-red-500/30 text-red-400 hover:text-red-300 rounded-full text-xs font-light transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Account
                    </button>
                  </div>
                </div>

                {/* Delete Confirmation Modal Overlay */}
                <AnimatePresence>
                  {showDeleteConfirm && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    >
                      <motion.div
                        initial={{ scale: 0.95, y: 15 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 15 }}
                        className="bg-[#0e0e12] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden text-left"
                      >
                        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-red-500/50 via-red-500 to-red-500/50" />
                        
                        <div className="space-y-2 text-center">
                          <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-5 h-5" />
                          </div>
                          <h3 className="text-lg font-bold text-white tracking-tight">Delete Account</h3>
                          <p className="text-xs text-white/50 font-light leading-relaxed">
                            This action will permanently delete your member account (<span className="font-mono-luxury text-white">{currentUser.id}</span>). You will lose all private points and pre-release priority reservations. This cannot be undone.
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="w-full sm:w-1/2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs py-3 rounded-full transition-all cursor-pointer uppercase tracking-wider text-center"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleDeleteMembership}
                            className="w-full sm:w-1/2 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs py-3 rounded-full shadow-[0_4px_15px_rgba(220,38,38,0.25)] transition-all cursor-pointer uppercase tracking-wider text-center"
                          >
                            Delete Account
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Membership Card & Status Grid */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {/* Membership Card - Col Span 3 */}
                  <div className="md:col-span-3 bg-gradient-to-br from-[#12141c] to-[#08090d] border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)] group/card select-none">
                    {/* Metallic foil reflective overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none transition-transform duration-1000 group-hover/card:translate-x-full" />
                    
                    {/* Glowing beacon */}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full border border-white/5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e154] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00e154]"></span>
                      </span>
                      <span className="text-[8px] uppercase tracking-widest text-[#00e154] font-mono-luxury font-bold">ACTIVE</span>
                    </div>

                    <div className="h-full flex flex-col justify-between min-h-[140px]">
                      <div>
                        <span className="text-[14px] font-black tracking-widest text-white/80 font-sans-luxury uppercase flex items-center gap-1">
                          Obelii<span className="text-[#00e154] font-serif">.</span>
                        </span>
                        <span className="text-[9px] uppercase tracking-widest text-white/30 block mt-1">LIFETIME MEMBER CARD</span>
                      </div>

                      <div className="mt-8">
                        <span className="text-[9px] uppercase tracking-[0.25em] text-white/40 block">Member Reference</span>
                        <span className="text-base font-medium tracking-widest text-white font-mono-luxury">{currentUser.id}</span>
                      </div>

                      <div className="flex justify-between items-end mt-4 pt-4 border-t border-white/5">
                        <div>
                          <span className="text-[8px] uppercase tracking-widest text-white/30 block">Member Tier</span>
                          <span className="text-[11px] font-semibold text-[#00e154] tracking-wider uppercase">{currentUser.tier}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] uppercase tracking-widest text-white/30 block">Member Points</span>
                          <span className="text-[11px] font-medium text-white tracking-wider">{currentUser.points} Pts</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pre-launch notifications - Col Span 2 */}
                  <div className="md:col-span-2 bg-black/20 border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-white/40 block mb-3 font-medium">Boutique News</span>
                      <div className="space-y-3.5">
                        <div className="flex gap-2.5 items-start">
                          <div className="w-1.5 h-1.5 bg-[#00e154] rounded-full mt-1.5 shrink-0" />
                          <p className="text-[11px] text-white/70 font-light leading-relaxed">
                            <strong>Early Access Reserved</strong>: Registered members bypass general public release by 48 hours.
                          </p>
                        </div>
                        <div className="flex gap-2.5 items-start">
                          <div className="w-1.5 h-1.5 bg-[#00e154] rounded-full mt-1.5 shrink-0" />
                          <p className="text-[11px] text-white/70 font-light leading-relaxed">
                            <strong>Collection Preview</strong>: 4 core items uploaded below for pre-release reservation.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-white/30">
                      <span>Status: Verified Partner</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-[#00e154]" />
                    </div>
                  </div>
                </div>

                {/* Boutique Collection Header */}
                <div className="pt-4">
                  <div className="flex items-baseline justify-between mb-4">
                    <h3 className="text-lg font-bold tracking-tight text-white font-sans-luxury flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-[#00e154]" /> Curated Pre-Release Boutique
                    </h3>
                    <span className="text-[10px] text-white/40 tracking-wider">4 Exclusive Items</span>
                  </div>

                  {/* Boutique Items list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {BOUTIQUE_ITEMS.map((item) => {
                      const isWishlisted = wishlist.includes(item.id);
                      const isPreordered = preorders.includes(item.id);
                      
                      return (
                        <div 
                          key={item.id}
                          className="bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between space-y-4 group/item"
                        >
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="text-[8px] uppercase tracking-widest text-[#00e154] font-medium block">{item.category}</span>
                                <h4 className="text-[13px] font-semibold text-white tracking-wide mt-0.5">{item.name}</h4>
                              </div>
                              <span className="text-xl shrink-0 p-1.5 bg-white/5 rounded-xl border border-white/5 group-hover/item:scale-110 transition-transform duration-300">
                                {item.image}
                              </span>
                            </div>

                            <p className="text-[11px] text-white/50 font-light leading-relaxed mt-2.5">
                              {item.description}
                            </p>

                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {item.specs.map((spec, sIdx) => (
                                <span key={sIdx} className="text-[8px] bg-white/[0.03] border border-white/5 px-2 py-0.5 rounded text-white/40 font-mono-luxury">
                                  {spec}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-white/5">
                            <span className="text-xs font-semibold text-white font-mono-luxury">
                              ${item.price} USD
                            </span>

                            <div className="flex items-center gap-2">
                              {/* Wishlist Heart button */}
                              <button
                                onClick={() => toggleWishlist(item.id)}
                                className={`p-2 rounded-full border transition-all duration-300 cursor-pointer ${
                                  isWishlisted 
                                    ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.15)]' 
                                    : 'bg-white/5 border-white/5 text-white/40 hover:text-white/80 hover:border-white/10'
                                }`}
                                title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
                              >
                                <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
                              </button>

                              {/* Pre-order reservation button */}
                              <button
                                onClick={() => togglePreorder(item.id)}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-semibold transition-all duration-300 cursor-pointer ${
                                  isPreordered
                                    ? 'bg-[#00e154] text-black shadow-[0_0_15px_rgba(0,225,84,0.3)] hover:opacity-90'
                                    : 'bg-white text-black hover:bg-white/90'
                                }`}
                              >
                                {isPreordered ? 'Priority Reserved' : 'Reserve Spot'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Shipping interest select block to make boutique 100% interactive */}
                <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 select-none text-center">
                  <span className="text-[9px] uppercase tracking-widest text-white/30 block mb-2 font-medium">Boutique Setup Preference</span>
                  <p className="text-[11px] text-white/50 font-light max-w-sm mx-auto mb-4">
                    Obelii is curating local distribution channels. Let us know where we should focus shipping optimization first:
                  </p>
                  
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['North America', 'European Union', 'United Kingdom', 'Asia-Pacific', 'Middle East'].map((region) => {
                      const isSelected = regionPref === region;
                      
                      return (
                        <button
                          key={region}
                          onClick={async () => {
                            setRegionPref(region);
                            localStorage.setItem('obelii_region_pref', region);
                            if (currentUser) {
                              try {
                                await supabase.from('profiles').update({ region_preference: region }).eq('id', currentUser.id);
                              } catch (e) {
                                console.log("Failed to update region preference in Supabase profiles, continuing locally.", e);
                              }
                            }
                            triggerBoutiqueNotification(`Shipping preference set to ${region}.`);
                          }}
                          className={`px-3 py-1.5 rounded-full text-[9px] font-light transition-all duration-300 cursor-pointer ${
                            isSelected 
                              ? 'bg-[#00e154]/10 border border-[#00e154]/40 text-[#00e154]'
                              : 'bg-white/5 border border-white/5 text-white/40 hover:text-white/70 hover:border-white/10'
                          }`}
                        >
                          {region}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}


          </AnimatePresence>
        </motion.div>

        {/* SOCIAL LINKS ROW: Centered capsules with spring transitions matching the screenshot */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="flex justify-center items-center gap-3"
        >
          {/* X (formerly Twitter) Capsule */}
          <motion.a 
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.95 }}
            href="https://x.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-11 h-11 flex items-center justify-center bg-black/40 rounded-[14px] border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all duration-300 shadow-md cursor-pointer"
            title="X (Twitter)"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </motion.a>
          
          {/* Facebook Capsule */}
          <motion.a 
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.95 }}
            href="https://facebook.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-11 h-11 flex items-center justify-center bg-black/40 rounded-[14px] border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all duration-300 shadow-md cursor-pointer"
            title="Facebook"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </motion.a>

          {/* Instagram Capsule */}
          <motion.a 
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.95 }}
            href="https://instagram.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-11 h-11 flex items-center justify-center bg-black/40 rounded-[14px] border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all duration-300 shadow-md cursor-pointer"
            title="Instagram"
          >
            <svg className="w-4 h-4 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          </motion.a>
        </motion.div>
      </div>

      {/* FLOATING ACTION TOOLBAR (Bottom Right: Fullscreen & Waitlist Manager / Search with Sparkle) */}
      <motion.div 
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        className="fixed bottom-8 right-8 z-50 flex flex-col gap-3"
      >
        {/* Top Button: Fullscreen Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleFullscreen}
          className="w-16 h-16 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-[22px] border border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur-md flex items-center justify-center transition-all duration-300 group cursor-pointer"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          <svg className="w-6 h-6 text-white/90 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6" />
            <path d="M9 21H3v-6" />
            <path d="M21 3l-7 7" />
            <path d="M3 21l7-7" />
          </svg>
        </motion.button>

        {/* Bottom Button: Search & Sparkle waitlist manager */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setAdminOpen(true)}
          className="w-16 h-16 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-[22px] border border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur-md flex items-center justify-center transition-all duration-300 group cursor-pointer"
          title="Subscriber Database & Export"
        >
          <svg className="w-6 h-6 text-white/90 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
            {/* Elegant sparkle inside the search */}
            <path d="M11 6.5l.5.85.85.5-.85.5-.5.85-.5-.85-.85-.5.85-.5z" fill="currentColor" stroke="none" />
          </svg>
        </motion.button>
      </motion.div>

      {/* SECURE VISIBLE ADMIN PANEL (Full-featured subscribers dashboard) */}
      {adminOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-3xl bg-[#0a0a0d] rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            
            {/* Admin Header */}
            <div className="px-6 py-5 bg-white/[0.02] border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-orange-400" />
                <span className="text-xs uppercase font-mono-luxury tracking-widest text-white/80 font-bold">
                  Obelii Atelier Waitlist Manager
                </span>
              </div>
              <button 
                onClick={() => setAdminOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Admin Body */}
            <div className="p-6 overflow-y-auto flex-1 no-scrollbar space-y-6">
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-mono-luxury text-white/40">Real Signups</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-bold text-white">{waitlist.length}</span>
                    <span className="text-[10px] text-green-400 flex items-center gap-0.5 font-mono-luxury">
                      <TrendingUp className="w-3 h-3" />
                      Live Data
                    </span>
                  </div>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-mono-luxury text-white/40">Total Queue Counter</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-bold text-white">{totalSignups.toLocaleString()}</span>
                    <span className="text-[10px] text-white/30 font-mono-luxury">Seed: 1283</span>
                  </div>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-mono-luxury text-white/40">Latest Email</span>
                  <span className="text-sm font-medium text-orange-400 truncate mt-2 font-mono-luxury">
                    {waitlist[0]?.email || 'None yet'}
                  </span>
                </div>
              </div>

              {/* Action row */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
                <div className="text-left">
                  <h4 className="text-sm font-semibold text-white">Database Controls</h4>
                  <p className="text-xs text-white/40 font-light mt-0.5">Export registered waitlist entries into CSV spreadsheet formats.</p>
                </div>
                <div className="flex gap-2.5 w-full sm:w-auto">
                  <button
                    onClick={exportCSV}
                    disabled={waitlist.length === 0}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white text-black font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-white/90 disabled:opacity-30 disabled:hover:bg-white transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                  <button
                    onClick={clearWaitlist}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-500/10 font-medium text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Reset List
                  </button>
                </div>
              </div>

              {/* Log Table */}
              <div className="space-y-3">
                <h3 className="text-xs uppercase font-mono-luxury tracking-widest text-white/60 font-semibold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  Real-time Sign-up Log ({waitlist.length})
                </h3>

                <div className="bg-black/50 border border-white/5 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] uppercase font-mono-luxury text-white/40">
                        <th className="py-3 px-4 font-semibold">Spot</th>
                        <th className="py-3 px-4 font-semibold">Email</th>
                        <th className="py-3 px-4 font-semibold">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-white/80 font-mono-luxury">
                      {waitlist.length > 0 ? (
                        waitlist.map((entry, index) => (
                          <tr key={index} className="hover:bg-white/[0.01] transition-colors">
                            <td className="py-3.5 px-4 font-medium text-white">#{entry.position}</td>
                            <td className="py-3.5 px-4 select-all text-orange-200/90">{entry.email}</td>
                            <td className="py-3.5 px-4 text-white/40">{new Date(entry.timestamp).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="py-12 text-center text-white/30 font-light">
                            <Mail className="w-6 h-6 text-white/10 mx-auto mb-2" />
                            No subscribers yet. Join from the main page to register entries!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 flex justify-between items-center text-[10px] font-mono-luxury text-white/30">
              <span>Local Storage Isolation Protocol</span>
              <span>v3.1 Production Mode</span>
            </div>

          </div>
        </div>
      )}

        {/* GOOGLE ACCOUNTS MODAL */}
      <AnimatePresence>
        {googleAuthOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-sm bg-[#0a0a0d] border border-white/10 rounded-3xl p-6 relative shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-left overflow-hidden"
            >
              {/* Close Button */}
              <button 
                onClick={() => {
                  if (!googleAuthLoading) {
                    setGoogleAuthOpen(false);
                    setShowGoogleCustomInput(false);
                  }
                }}
                disabled={googleAuthLoading}
                className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer disabled:opacity-20"
              >
                <CloseIcon className="w-3.5 h-3.5" />
              </button>

              {googleAuthLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="relative w-16 h-16 mb-6">
                    {/* Multi-colored Google Spinner */}
                    <div className="absolute inset-0 rounded-full border-4 border-white/5" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-green-500 border-b-yellow-500 border-l-red-500 animate-spin" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 font-sans-luxury">Connecting to Google</h3>
                  <p className="text-xs text-white/40 max-w-xs leading-relaxed font-light font-mono-luxury">
                    Verifying secure credentials for <span className="text-[#00e154] font-semibold">{googleSelectedAccount}</span>...
                  </p>
                </div>
              ) : (
                <div>
                  {/* Google Header */}
                  <div className="flex flex-col items-center text-center mt-2 mb-6 select-none">
                    <svg className="w-10 h-10 mb-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" strokeLinecap="round" />
                    </svg>
                    <h3 className="text-xl font-bold text-white tracking-tight font-sans-luxury">
                      {savedGoogleAccounts.length > 0 && !showGoogleCustomInput ? 'Choose an account' : 'Sign in with Google'}
                    </h3>
                    <p className="text-[11px] text-white/50 mt-1 font-light">to continue to <span className="font-semibold text-white">Obelii Lounge</span></p>
                  </div>

                  {/* Account List / Selection */}
                  {savedGoogleAccounts.length > 0 && !showGoogleCustomInput ? (
                    <div className="space-y-2 mb-6">
                      {savedGoogleAccounts.map((acc, idx) => {
                        const initialLetter = acc.name ? acc.name.charAt(0).toUpperCase() : 'G';
                        return (
                          <button
                            key={idx}
                            onClick={() => handleGoogleSignIn(acc.email, acc.name)}
                            className="w-full text-left bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl p-3 transition-all duration-200 flex items-center gap-3.5 group cursor-pointer"
                          >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center text-sm shadow-md select-none">
                              {initialLetter}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">{acc.name}</p>
                              <p className="text-[10px] text-white/45 truncate">{acc.email}</p>
                            </div>
                          </button>
                        );
                      })}

                      {/* Custom Input Trigger */}
                      <button
                        onClick={() => setShowGoogleCustomInput(true)}
                        className="w-full text-left bg-transparent hover:bg-white/[0.02] border border-dashed border-white/10 hover:border-white/20 rounded-2xl p-3 transition-all duration-200 flex items-center gap-3.5 group cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-full bg-white/5 text-white/50 group-hover:text-white flex items-center justify-center transition-all">
                          <Plus className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white/70 group-hover:text-white transition-colors">Use another account</p>
                        </div>
                      </button>
                    </div>
                  ) : (
                    /* Custom Account Input Form */
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (googleCustomEmail && googleCustomName) {
                          handleGoogleSignIn(googleCustomEmail, googleCustomName);
                        }
                      }}
                      className="space-y-4 mb-6"
                    >
                      <div>
                        <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1.5 font-medium ml-1">Google Display Name</label>
                        <input
                          type="text"
                          required
                          value={googleCustomName}
                          onChange={(e) => setGoogleCustomName(e.target.value)}
                          placeholder="Your Name"
                          className="w-full bg-[#0d0d11]/70 border border-white/10 px-4 py-3 rounded-xl text-white placeholder-white/20 text-xs font-light transition-all duration-300 focus:border-[#00e154]/40"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1.5 font-medium ml-1">Google Email Address</label>
                        <input
                          type="email"
                          required
                          value={googleCustomEmail}
                          onChange={(e) => setGoogleCustomEmail(e.target.value)}
                          placeholder="e.g. user@gmail.com"
                          className="w-full bg-[#0d0d11]/70 border border-white/10 px-4 py-3 rounded-xl text-white placeholder-white/20 text-xs font-light transition-all duration-300 focus:border-[#00e154]/40"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        {savedGoogleAccounts.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowGoogleCustomInput(false)}
                            className="w-1/2 bg-white/5 hover:bg-white/10 text-white font-medium text-xs py-2.5 rounded-full transition-colors cursor-pointer"
                          >
                            Back
                          </button>
                        )}
                        <button
                          type="submit"
                          className={`bg-white hover:bg-white/95 text-black font-semibold text-xs py-2.5 rounded-full shadow-lg transition-all cursor-pointer ${
                            savedGoogleAccounts.length > 0 ? 'w-1/2' : 'w-full'
                          }`}
                        >
                          Authorize
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Google Legal / Consent Disclaimer */}
                  <p className="text-[10px] text-white/30 font-light leading-relaxed select-none text-center border-t border-white/5 pt-4">
                    To continue, Google will share your name, email address, language preference, and profile picture with Obelii Lounge. Refer to our <span className="hover:underline text-white/40 cursor-pointer">Terms of Service</span> and <span className="hover:underline text-white/40 cursor-pointer">Privacy Policy</span>.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
