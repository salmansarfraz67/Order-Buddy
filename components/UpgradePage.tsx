import React, { useEffect, useState } from 'react';
import { User, Order } from '../types';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Lock, TrendingUp, Package, MessageCircle, CheckCircle, LogOut } from 'lucide-react';

interface UpgradePageProps {
  user: User;
  onLogout: () => void;
}

const UpgradePage: React.FC<UpgradePageProps> = ({ user, onLogout }) => {
  const [stats, setStats] = useState({ revenue: 0, orders: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user.uid) return;
      try {
        const q = query(collection(db, "orders"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        let totalRev = 0;
        let totalOrders = 0;
        
        snapshot.forEach(doc => {
            const data = doc.data() as Order;
            if (data.status !== 'Cancelled') {
                totalRev += data.total || 0;
                totalOrders += 1;
            }
        });
        
        setStats({ revenue: totalRev, orders: totalOrders });
      } catch (error) {
        console.error("Error fetching stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user.uid]);

  const handleWhatsAppUpgrade = (plan: string) => {
      const text = `Hello OrderBuddy Team! My trial for shop "${user.shopName}" has expired. I want to upgrade to the ${plan} Plan. My Email is: ${user.email}`;
      const url = `https://wa.me/923078804659?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden text-center relative">
            <div className="bg-red-600 h-2"></div>
            <div className="p-8">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                    <Lock className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Your Free Trial Has Ended</h1>
                <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                    We hope you enjoyed using OrderBuddy! To continue managing your orders and generating invoices, please upgrade your plan.
                </p>
                
                {/* User Stats */}
                <div className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Your Achievements in 7 Days</h3>
                    {loading ? (
                        <div className="animate-pulse flex justify-center space-x-4">
                            <div className="h-4 w-24 bg-gray-200 rounded"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center border-r border-gray-200">
                                <div className="flex items-center justify-center text-green-600 mb-1">
                                    <TrendingUp className="h-5 w-5 mr-1" />
                                </div>
                                <div className="text-2xl font-bold text-gray-900">Rs. {stats.revenue.toLocaleString()}</div>
                                <div className="text-sm text-gray-500">Total Revenue Generated</div>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center text-blue-600 mb-1">
                                    <Package className="h-5 w-5 mr-1" />
                                </div>
                                <div className="text-2xl font-bold text-gray-900">{stats.orders}</div>
                                <div className="text-sm text-gray-500">Orders Processed</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Standard Plan */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 flex flex-col hover:border-green-400 transition-colors">
                <h3 className="text-xl font-bold text-gray-900">Standard Plan</h3>
                <p className="text-gray-500 text-sm mt-1">Perfect for growing businesses</p>
                <div className="my-4">
                    <span className="text-4xl font-extrabold text-gray-900">Rs. 499</span>
                    <span className="text-gray-500">/month</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex items-start"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /><span className="text-sm text-gray-600">Unlimited Orders</span></li>
                    <li className="flex items-start"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /><span className="text-sm text-gray-600">PDF Invoices (No Watermark)</span></li>
                    <li className="flex items-start"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /><span className="text-sm text-gray-600">WhatsApp Support</span></li>
                </ul>
                <button 
                    onClick={() => handleWhatsAppUpgrade('Standard')}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition-all"
                >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Upgrade via WhatsApp
                </button>
            </div>

            {/* Premium Plan */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-green-500 p-6 flex flex-col relative transform md:-translate-y-2">
                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">POPULAR</div>
                <h3 className="text-xl font-bold text-gray-900">Premium Plan</h3>
                <p className="text-gray-500 text-sm mt-1">For serious sellers</p>
                <div className="my-4">
                    <span className="text-4xl font-extrabold text-gray-900">Rs. 999</span>
                    <span className="text-gray-500">/month</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex items-start"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /><span className="text-sm text-gray-600">Everything in Standard</span></li>
                    <li className="flex items-start"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /><span className="text-sm text-gray-600">Advanced Analytics</span></li>
                    <li className="flex items-start"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /><span className="text-sm text-gray-600">Priority Support</span></li>
                    <li className="flex items-start"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /><span className="text-sm text-gray-600">Data Export (Excel)</span></li>
                </ul>
                <button 
                    onClick={() => handleWhatsAppUpgrade('Premium')}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-green-800 hover:bg-green-900 transition-all"
                >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Upgrade via WhatsApp
                </button>
            </div>
        </div>

        <div className="text-center">
            <button onClick={onLogout} className="text-gray-500 hover:text-red-600 text-sm font-medium flex items-center justify-center mx-auto transition-colors">
                <LogOut className="h-4 w-4 mr-1" /> Sign Out
            </button>
        </div>

      </div>
    </div>
  );
};

export default UpgradePage;