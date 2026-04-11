import React, { useState, useEffect } from 'react';
import { auth, db, doc, getDoc, setDoc } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Phone, X, Save, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PhonePrompt: React.FC = () => {
  const [user] = useAuthState(auth);
  const [showPrompt, setShowPrompt] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const checkPhone = async () => {
        // Check if we've already asked in this session to avoid annoying the user
        const hasAsked = sessionStorage.getItem(`asked_phone_${user.uid}`);
        if (hasAsked) return;

        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (!data.phoneNumber) {
              // Small delay to let the page load
              setTimeout(() => setShowPrompt(true), 2000);
            }
          }
        } catch (err) {
          console.error('Error checking phone number:', err);
        }
      };
      checkPhone();
    } else {
      setShowPrompt(false);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !phoneNumber.trim()) return;

    setSaving(true);
    setError(null);

    try {
      // Update in users collection
      await setDoc(doc(db, 'users', user.uid), {
        phoneNumber: phoneNumber.trim(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setShowPrompt(false);
      sessionStorage.setItem(`asked_phone_${user.uid}`, 'true');
    } catch (err) {
      console.error('Error saving phone number:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setShowPrompt(false);
    if (user) {
      sessionStorage.setItem(`asked_phone_${user.uid}`, 'true');
    }
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-[#151619] border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative"
          >
            <button 
              onClick={handleClose}
              className="absolute top-6 right-6 text-[#8E9299] hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <div className="w-16 h-16 bg-[#F27D26]/10 rounded-2xl flex items-center justify-center mb-6">
              <Phone className="text-[#F27D26]" size={32} />
            </div>

            <h2 className="text-2xl font-bold mb-2">Complete Your Profile</h2>
            <p className="text-[#8E9299] mb-8">
              Please provide your phone number to stay connected and secure your progress.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#8E9299] uppercase tracking-widest ml-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E9299]" size={20} />
                  <input 
                    type="tel" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 00000 00000"
                    className="w-full bg-black border border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:border-[#F27D26] outline-none transition-all"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm font-bold bg-red-400/10 p-3 rounded-xl border border-red-400/20">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={saving}
                className="w-full bg-[#F27D26] text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all shadow-lg shadow-[#F27D26]/20 disabled:opacity-50"
              >
                {saving ? 'Saving...' : (
                  <>
                    <Save size={20} />
                    Save & Continue
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
