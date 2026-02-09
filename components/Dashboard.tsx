import React, { useState, useMemo, useEffect } from 'react';
import { User, Order, OrderStatus, ProductType } from '../types';
import { Plus, Search, FileText, Trash2, Edit2, TrendingUp, TrendingDown, Package, DollarSign, Clock, ListFilter, Award, XCircle, Calendar, Filter, Download, CheckCircle, ShoppingBag, X, LogOut, ChevronDown, ChevronUp, UserCheck, AlertCircle, MessageCircle, Share2, AlertTriangle, Settings, Store, Mail, MapPin, Phone, Truck, Box, Check, Send, Smartphone, Laptop, Copy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { jsPDF } from 'jspdf';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy, serverTimestamp } from 'firebase/firestore';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onUpdateUser: (data: Partial<User>) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-lg text-left">
        <p className="text-xs font-semibold text-gray-500 mb-1">{data.fullDate || label}</p>
        <p className="text-sm font-bold text-gray-900">
          Rs. {payload[0].value.toLocaleString()}
        </p>
        <p className="text-xs text-green-600 mt-1 font-medium">Click to filter</p>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onUpdateUser }) => {
  // Styles for animations
  const styles = `
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-slide-up {
      animation: slideUp 0.5s ease-out forwards;
    }
    .delay-100 { animation-delay: 0.1s; }
    .delay-200 { animation-delay: 0.2s; }
    .delay-300 { animation-delay: 0.3s; }
    .delay-400 { animation-delay: 0.4s; }
    .delay-500 { animation-delay: 0.5s; }
    
    /* Hide scrollbar for clean horizontal scrolling on mobile filters */
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `;

  // Helper for consistent date formatting (YYYY-MM-DD) using local time
  const formatDateSimple = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // State for Orders (fetched from Firestore)
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Firestore Subscription
  useEffect(() => {
    // Security Check: Ensure we have a UID before querying
    if (!user || !user.uid) {
        setIsLoadingOrders(false);
        return;
    }

    try {
        // Construct query using the verified user.uid from props
        const q = query(
            collection(db, "orders"),
            where("userId", "==", user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedOrders: Order[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Order));
            
            // Sort by date desc (client side to avoid composite index requirement for initial setup)
            fetchedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            setOrders(fetchedOrders);
            setIsLoadingOrders(false);
            setFetchError(null);
        }, (error) => {
            console.error("Error fetching orders:", error);
            if (error.code === 'permission-denied' || (error.message && error.message.includes('Missing or insufficient permissions'))) {
                // Return a specific flag to render the help UI
                setFetchError("PERMISSION_DENIED");
            } else {
                setFetchError("Unable to load orders. Please check your internet connection.");
            }
            setIsLoadingOrders(false);
        });

        return () => unsubscribe();
    } catch (err: any) {
        console.error("Query Error", err);
        setFetchError("An unexpected error occurred loading your dashboard.");
        setIsLoadingOrders(false);
    }
  }, [user?.uid]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  
  // Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    shopName: user.shopName || '',
    phone: user.phone || '',
    address: user.address || ''
  });
  
  // Delete Modal State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // WhatsApp Templates Modal
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState<{isOpen: boolean, order: Order | null}>({isOpen: false, order: null});

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | OrderStatus>('all');
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  // Filter States
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortBy, setSortBy] = useState('date-desc');

  // Smart Form State
  const [suggestedCustomer, setSuggestedCustomer] = useState<{name: string, address: string, orderCount: number} | null>(null);
  const [currentPhoneStats, setCurrentPhoneStats] = useState<{count: number, lastOrderDate: string} | null>(null);

  // New Order Form State
  const [orderForm, setOrderForm] = useState({
    type: 'Physical' as ProductType,
    customerName: '',
    phone: '',
    address: '',
    product: '',
    quantity: '1',
    price: '',
    status: 'New' as OrderStatus,
    date: '',
    trackingNumber: ''
  });

  // Derived unique products for autocomplete
  const uniqueProducts = useMemo(() => {
    const products = new Set(orders.map(o => o.product));
    return Array.from(products).sort();
  }, [orders]);

  const resetForm = () => {
    setOrderForm({ 
        type: 'Physical',
        customerName: '', 
        phone: '', 
        address: '', 
        product: '', 
        quantity: '1', 
        price: '', 
        status: 'New',
        date: '',
        trackingNumber: ''
    });
    setEditingId(null);
    setSuggestedCustomer(null);
    setCurrentPhoneStats(null);
    setIsFormOpen(false);
    setIsConfirmModalOpen(false);
  };

  const handleEdit = (order: Order) => {
    setOrderForm({
        type: order.type || 'Physical',
        customerName: order.customerName,
        phone: order.phone,
        address: order.address || '',
        product: order.product,
        quantity: order.quantity.toString(),
        price: order.price.toString(),
        status: order.status,
        date: order.date,
        trackingNumber: order.trackingNumber || ''
    });
    setEditingId(order.id);
    setIsFormOpen(true);
    
    // Calculate stats for this user
    const digitsOnly = order.phone.replace(/\D/g, '');
    const previousOrders = orders.filter(o => o.phone.replace(/\D/g, '') === digitsOnly);
    setCurrentPhoneStats({
        count: previousOrders.length,
        lastOrderDate: previousOrders.length > 0 ? previousOrders[0].date : ''
    });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const digitsOnly = val.replace(/\D/g, '');
    
    setOrderForm(prev => ({ ...prev, phone: val }));
    
    // Live lookup logic
    if (digitsOnly.length > 6) {
        // Find orders with this phone
        const previousOrders = orders.filter(o => o.phone.replace(/\D/g, '') === digitsOnly);
        
        if (previousOrders.length > 0) {
            // Sort by most recent to get latest info
            const sorted = [...previousOrders].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const latest = sorted[0];
            
            // Set live stats
            setCurrentPhoneStats({
                count: previousOrders.length,
                lastOrderDate: latest.date
            });

            // Set suggestion
            setSuggestedCustomer({ 
                name: latest.customerName, 
                address: latest.address || '',
                orderCount: previousOrders.length
            });
        } else {
            setSuggestedCustomer(null);
            setCurrentPhoneStats(null);
        }
    } else {
        setSuggestedCustomer(null);
        setCurrentPhoneStats(null);
    }
  };

  const applySuggestedCustomer = () => {
    if (suggestedCustomer) {
        setOrderForm(prev => ({ 
            ...prev, 
            customerName: suggestedCustomer.name,
            address: suggestedCustomer.address
        }));
        setSuggestedCustomer(null); 
    }
  };

  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate mandatory fields
    if (!orderForm.customerName || !orderForm.phone || !orderForm.product) {
        alert("Please fill in Name, Phone, and Product.");
        return; 
    }
    
    // Check numbers
    const price = parseFloat(orderForm.price);
    const qty = parseInt(orderForm.quantity);
    
    if (isNaN(price)) {
        alert("Please enter a valid Price.");
        return;
    }
    
    if (isNaN(qty) || qty < 1) {
        alert("Please enter a valid Quantity (at least 1).");
        return;
    }
    
    setIsConfirmModalOpen(true);
  };

  const confirmSaveOrder = async () => {
    // Ensure we use the robust user.uid from props
    if (!user || !user.uid) {
        alert("Session error. Please logout and login again.");
        return;
    }

    try {
        // Safe conversion
        const safePrice = Number(parseFloat(orderForm.price).toFixed(2)) || 0;
        const safeQty = parseInt(orderForm.quantity) || 1;
        const safeTotal = safePrice * safeQty;
        
        // Determine Date
        let orderDate = formatDateSimple(new Date());
        if (editingId && orderForm.date) {
            orderDate = orderForm.date;
        }

        const orderData = {
            userId: user.uid, // Explicitly using verified prop UID
            type: orderForm.type,
            customerName: orderForm.customerName.trim(),
            phone: orderForm.phone.trim(),
            address: orderForm.address ? orderForm.address.trim() : '',
            product: orderForm.product.trim(),
            quantity: safeQty,
            price: safePrice,
            total: safeTotal,
            status: orderForm.status,
            trackingNumber: orderForm.trackingNumber ? orderForm.trackingNumber.trim() : '',
            date: orderDate, 
            updatedAt: new Date().toISOString()
        };

        if (editingId) {
            // Edit existing
            const orderRef = doc(db, "orders", editingId);
            await updateDoc(orderRef, orderData);
        } else {
            // Create New
            await addDoc(collection(db, "orders"), {
                ...orderData,
                createdAt: new Date().toISOString()
            });
        }
        
        resetForm();
    } catch (error: any) {
        console.error("Error saving order:", error);
        alert(`Failed to save order: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
        try {
            await deleteDoc(doc(db, "orders", deleteId));
            setDeleteId(null);
        } catch (error) {
            console.error("Error deleting order:", error);
            alert("Failed to delete order.");
        }
    }
  };
  
  const openProfileModal = () => {
    setProfileData({
      shopName: user.shopName || '',
      phone: user.phone || '',
      address: user.address || ''
    });
    setIsProfileModalOpen(true);
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser(profileData);
    setIsProfileModalOpen(false);
  };

  // Helper to generate JS PDF Object
  const createInvoiceDoc = (order: Order) => {
    const doc = new jsPDF();
    const brandColor = [22, 163, 74]; // green-600
    const primaryText = [17, 24, 39]; // gray-900
    const secondaryText = [107, 114, 128]; // gray-500

    // 1. Header Section
    doc.setFillColor(249, 250, 251); // gray-50
    doc.rect(0, 0, 210, 45, "F");

    // Title
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.text("INVOICE", 20, 30);

    // Shop Details
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryText[0], primaryText[1], primaryText[2]);
    doc.text(user.shopName, 190, 20, { align: "right" });

    // Shop Sub-details (Address, Phone, Email in Header)
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(secondaryText[0], secondaryText[1], secondaryText[2]);
    
    let yPos = 25;
    if (user.address) {
       doc.text(user.address, 190, yPos, { align: "right" });
       yPos += 5;
    }
    if (user.phone) {
       doc.text(`Tel: ${user.phone}`, 190, yPos, { align: "right" });
       yPos += 5;
    }
    if (user.email) {
       doc.text(user.email, 190, yPos, { align: "right" });
    }

    // Invoice Meta
    doc.text(`Date: ${order.date}`, 20, 40);
    doc.text(`Invoice #: ${order.id.slice(0, 8)}`, 70, 40);

    // 2. Customer Info (Buyer Profile)
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(secondaryText[0], secondaryText[1], secondaryText[2]);
    doc.text("BILL TO:", 20, 60);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryText[0], primaryText[1], primaryText[2]);
    doc.text(order.customerName, 20, 68);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(secondaryText[0], secondaryText[1], secondaryText[2]);
    doc.text(order.phone, 20, 74);
    
    // Address with line wrapping if needed
    if (order.address) {
        doc.text(order.address, 20, 80, { maxWidth: 80 });
    }

    // 3. Table Header
    const tableTop = order.address ? 90 : 85;
    doc.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.rect(20, tableTop, 170, 10, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("ITEM DESCRIPTION", 25, tableTop + 7);
    doc.text("QTY", 120, tableTop + 7, { align: "center" });
    doc.text("PRICE", 145, tableTop + 7, { align: "right" });
    doc.text("TOTAL", 185, tableTop + 7, { align: "right" });

    // 4. Table Rows
    const itemY = tableTop + 20;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(primaryText[0], primaryText[1], primaryText[2]);
    
    doc.text(order.product, 25, itemY);
    doc.text(order.quantity.toString(), 120, itemY, { align: "center" });
    doc.text(order.price.toLocaleString(), 145, itemY, { align: "right" });
    doc.text(order.total.toLocaleString(), 185, itemY, { align: "right" });

    doc.setDrawColor(229, 231, 235);
    doc.line(20, itemY + 5, 190, itemY + 5);

    // 5. Totals Section
    const totalY = itemY + 20;
    const labelX = 110; 
    const valueX = 185; 

    // Subtotal
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(secondaryText[0], secondaryText[1], secondaryText[2]);
    doc.text("Subtotal", labelX, totalY);
    doc.text(order.total.toLocaleString(), valueX, totalY, { align: "right" });

    // Grand Total
    doc.setFontSize(12);
    doc.setTextColor(primaryText[0], primaryText[1], primaryText[2]);
    doc.text("Total Amount", labelX, totalY + 10);
    
    doc.setFontSize(16);
    doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.text(`Rs. ${order.total.toLocaleString()}`, valueX, totalY + 10, { align: "right" });

    // 6. Footer (Seller Contact)
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFillColor(249, 250, 251); // gray-50
    doc.rect(0, pageHeight - 30, 210, 30, "F");

    doc.setFontSize(9);
    doc.setTextColor(secondaryText[0], secondaryText[1], secondaryText[2]);
    doc.text("Thank you for your business!", 105, pageHeight - 18, { align: "center" });
    
    // Bottom Seller Contact Info
    let contactInfo = "";
    if (user.phone) contactInfo += `Phone: ${user.phone}`;
    if (user.email) contactInfo += `${user.phone ? ' | ' : ''}Email: ${user.email}`;
    
    if (contactInfo) {
        doc.setFontSize(8);
        doc.setTextColor(55, 65, 81); // gray-700
        doc.text(contactInfo, 105, pageHeight - 10, { align: "center" });
    } else {
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175); // gray-400
        doc.text("Generated by OrderBuddy", 105, pageHeight - 10, { align: "center" });
    }
    return doc;
  };

  const generateInvoice = (order: Order) => {
    const doc = createInvoiceDoc(order);
    doc.save(`Invoice_${order.id}_${order.customerName.replace(/\s+/g, '_')}.pdf`);
  };

  // WhatsApp Message Logic
  const openWhatsApp = (phone: string, message: string) => {
     let cleanPhone = phone.replace(/\D/g, '');
     if (cleanPhone.startsWith('0')) {
        cleanPhone = '92' + cleanPhone.slice(1);
     }
     const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
     window.open(url, '_blank');
  };

  const sendWhatsAppTemplate = (templateType: 'received' | 'payment' | 'confirmed' | 'shipped' | 'delivered') => {
      const { order } = whatsAppModalOpen;
      if (!order) return;

      let msg = '';
      const orderIdShort = `#${order.id.slice(0, 6)}`;
      const isDigital = order.type === 'Digital';

      switch(templateType) {
          case 'received':
              if (isDigital) {
                  msg = `Hi ${order.customerName}, thanks for your order ${orderIdShort} for ${order.product}. Total amount: Rs. ${order.total.toLocaleString()}. We are processing your request now.\n- ${user.shopName}`;
              } else {
                  msg = `Hi ${order.customerName}, thanks for your order ${orderIdShort} for ${order.product}. Total amount: Rs. ${order.total.toLocaleString()}. We will confirm it shortly.\n- ${user.shopName}`;
              }
              break;
          case 'payment':
              if (isDigital) {
                  msg = `Hi ${order.customerName}, payment received for order ${orderIdShort}. We are generating your digital content/access now. Thanks!\n- ${user.shopName}`;
              } else {
                  msg = `Hi ${order.customerName}, payment received for order ${orderIdShort}. We are packing your items now. Thanks!\n- ${user.shopName}`;
              }
              break;
          case 'confirmed':
              if (isDigital) {
                  msg = `Hi ${order.customerName}, your order ${orderIdShort} is CONFIRMED! You will receive your files/access shortly.\n- ${user.shopName}`;
              } else {
                  msg = `Hi ${order.customerName}, your order ${orderIdShort} is CONFIRMED! Estimated delivery: 3-5 days. Thank you for shopping with us.\n- ${user.shopName}`;
              }
              break;
          case 'shipped':
              // Physical only usually
              msg = `Great news ${order.customerName}! Your order ${orderIdShort} has been SHIPPED. ${order.trackingNumber ? `Tracking No: ${order.trackingNumber}` : ''}\nYou should receive it soon.\n- ${user.shopName}`;
              break;
          case 'delivered':
              if (isDigital) {
                  msg = `Hi ${order.customerName}, your order ${orderIdShort} is complete! We have sent the files/access credentials. Please check your inbox/messages.\n- ${user.shopName}`;
              } else {
                   msg = `Hi ${order.customerName}, your order ${orderIdShort} has been marked as delivered. We hope you love it! Please let us know if you have any feedback.\n- ${user.shopName}`;
              }
              break;
      }
      openWhatsApp(order.phone, msg);
      setWhatsAppModalOpen({ isOpen: false, order: null });
  };

  const handleBarClick = (data: any) => {
    if (data && data.startDate && data.endDate) {
        setDateRange({ start: data.startDate, end: data.endDate });
        if (window.innerWidth < 768) {
             const listElement = document.getElementById('orders-list');
             listElement?.scrollIntoView({ behavior: 'smooth' });
        }
    }
  };

  const handleExportCSV = () => {
    const headers = ['Order ID', 'Type', 'Customer Name', 'Phone', 'Address', 'Product', 'Quantity', 'Price', 'Total', 'Date', 'Status', 'Tracking'];
    const csvContent = orders.map(order => [
      order.id, order.type || 'Physical', `"${order.customerName}"`, order.phone, `"${order.address || ''}"`, `"${order.product}"`,
      order.quantity, order.price, order.total, order.date, order.status, `"${order.trackingNumber || ''}"`
    ].join(','));
    const csvString = [headers.join(','), ...csvContent].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `orders_export_${formatDateSimple(new Date())}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Stats Logic
  const now = new Date();
  const todayStr = formatDateSimple(now);

  const getPastDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return formatDateSimple(d);
  };

  const getRevenue = (startStr: string, endStr: string) => {
    return orders
       .filter(o => o.status !== 'Cancelled' && o.date >= startStr && o.date <= endStr)
       .reduce((acc, curr) => acc + curr.total, 0);
  };

  const dailyRevenue = getRevenue(todayStr, todayStr);
  const yesterdayRevenue = getRevenue(getPastDate(1), getPastDate(1));
  const weeklyRevenue = getRevenue(getPastDate(6), todayStr);
  const lastWeekRevenue = getRevenue(getPastDate(13), getPastDate(7));
  const monthlyRevenue = getRevenue(getPastDate(29), todayStr);
  const lastMonthRevenue = getRevenue(getPastDate(59), getPastDate(30));

  const totalOrders = orders.length;
  // Pending includes 'New', 'Confirmed', 'Packed', 'Shipped' (until Delivered)
  const actionNeeded = orders.filter(o => ['New', 'Confirmed', 'Packed', 'Shipped'].includes(o.status)).length;
  const cancelledOrders = orders.filter(o => o.status === 'Cancelled').length;

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const renderTrend = (current: number, previous: number) => {
    const change = calculateChange(current, previous);
    const isPositive = change >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
    return (
        <div className="flex items-center mt-2">
            <Icon className={`h-3 w-3 mr-1 ${colorClass}`} />
            <span className={`text-xs font-medium ${colorClass}`}>{Math.abs(change).toFixed(0)}%</span>
            <span className="text-xs text-gray-400 ml-1">vs prev.</span>
        </div>
    );
  };

  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();
    
    if (chartPeriod === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = formatDateSimple(d);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        const sales = orders.filter(o => o.status !== 'Cancelled' && o.date === dateStr).reduce((acc, curr) => acc + curr.total, 0);
        data.push({ name: dayName, date: dateStr, sales, startDate: dateStr, endDate: dateStr });
      }
    } else if (chartPeriod === 'weekly') {
      for (let i = 3; i >= 0; i--) {
        const endD = new Date(now);
        endD.setDate(endD.getDate() - (i * 7));
        const startD = new Date(endD);
        startD.setDate(startD.getDate() - 6);
        const startStr = formatDateSimple(startD);
        const endStr = formatDateSimple(endD);
        const startMonth = startD.toLocaleDateString('en-US', { month: 'short' });
        const startDay = startD.getDate();
        const shortLabel = `${startDay} ${startMonth}`;
        const sales = orders.filter(o => o.status !== 'Cancelled' && o.date >= startStr && o.date <= endStr).reduce((acc, curr) => acc + curr.total, 0);
        const endDay = endD.getDate();
        let fullLabel = startD.getMonth() === endD.getMonth() ? `${startMonth} ${startDay}-${endDay}` : `${startMonth} ${startDay}-${endD.toLocaleDateString('en-US', { month: 'short' })} ${endDay}`;
        data.push({ name: shortLabel, fullDate: fullLabel, sales, startDate: startStr, endDate: endStr });
      }
    } else if (chartPeriod === 'monthly') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = d.toLocaleDateString('en-US', { month: 'short' });
        const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        const startDate = formatDateSimple(startOfMonth);
        const endDate = formatDateSimple(endOfMonth);
        const sales = orders.filter(o => o.status !== 'Cancelled' && o.date >= startDate && o.date <= endDate).reduce((acc, curr) => acc + curr.total, 0);
        data.push({ name: monthName, sales, startDate, endDate });
      }
    }
    return data;
  }, [orders, chartPeriod]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const searchLower = searchTerm.toLowerCase();
      const searchDigits = searchTerm.replace(/\D/g, '');
      const matchesSearch = order.customerName.toLowerCase().includes(searchLower) ||
                            order.product.toLowerCase().includes(searchLower) ||
                            order.id.includes(searchTerm) ||
                            order.phone.includes(searchTerm) ||
                            (searchDigits.length > 0 && order.phone.replace(/\D/g, '').includes(searchDigits));
      let matchesTab = true;
      if (activeTab !== 'all') {
          matchesTab = order.status === activeTab;
      }
      let matchesDate = true;
      if (dateRange.start && order.date < dateRange.start) matchesDate = false;
      if (dateRange.end && order.date > dateRange.end) matchesDate = false;
      return matchesSearch && matchesTab && matchesDate;
    }).sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime() || b.id.localeCompare(a.id);
      if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime() || a.id.localeCompare(b.id);
      if (sortBy === 'amount-desc') return b.total - a.total || b.id.localeCompare(a.id);
      if (sortBy === 'amount-asc') return a.total - b.total || a.id.localeCompare(b.id);
      return 0;
    });
  }, [orders, searchTerm, activeTab, dateRange, sortBy]);

  const productStats = orders.filter(o => o.status !== 'Cancelled').reduce((acc, order) => {
        if (!acc[order.product]) acc[order.product] = { name: order.product, quantity: 0, revenue: 0 };
        acc[order.product].quantity += order.quantity;
        acc[order.product].revenue += order.total;
        return acc;
    }, {} as Record<string, { name: string; quantity: number; revenue: number }>);
  const topProducts = (Object.values(productStats) as { name: string; quantity: number; revenue: number }[]).sort((a, b) => b.revenue - a.revenue).slice(0, 4);

  // Status Badge Helper
  const getStatusBadge = (status: OrderStatus) => {
      switch(status) {
          case 'New': return 'bg-blue-100 text-blue-800';
          case 'Confirmed': return 'bg-indigo-100 text-indigo-800';
          case 'Packed': return 'bg-purple-100 text-purple-800';
          case 'Shipped': return 'bg-orange-100 text-orange-800';
          case 'Delivered': return 'bg-green-100 text-green-800';
          case 'Cancelled': return 'bg-red-100 text-red-800';
          default: return 'bg-gray-100 text-gray-800';
      }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col font-sans">
      <style>{styles}</style>
      
      {/* Removed Internal Sticky Header - Now using Global Navbar */}
      
      <div className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 animate-slide-up">
        
        {/* Top Controls Row (Settings, Plan Info) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">Welcome back, {user.shopName}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                 {/* Plan Badge */}
                 <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
                     <span className="text-xs text-green-600 font-bold uppercase mr-2">{user.planName || 'Trial'}</span>
                     <span className="text-xs text-gray-500">{user.daysRemaining || 14} days left</span>
                 </div>
                 
                 {/* Settings Button */}
                 <button onClick={openProfileModal} className="flex items-center justify-center px-3 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 shadow-sm transition-all" title="Store Settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                 </button>

                 <button onClick={handleExportCSV} className="flex items-center justify-center px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 shadow-sm transition-all">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                </button>
                <button 
                    onClick={() => { resetForm(); setIsFormOpen(true); }}
                    className="flex-1 sm:flex-none items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 shadow-lg shadow-green-200 hover:shadow-green-300 transition-all flex"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Order
                </button>
            </div>
        </div>

        {/* Loading State for Orders */}
        {isLoadingOrders && (
             <div className="w-full text-center py-8">
                 <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                 <p className="text-gray-500 text-sm mt-2">Loading your sales data...</p>
             </div>
        )}

        {fetchError === 'PERMISSION_DENIED' ? (
             <div className="w-full mb-6 p-6 bg-orange-50 border border-orange-200 rounded-xl text-left">
                 <div className="flex items-center mb-2">
                    <AlertTriangle className="h-6 w-6 text-orange-600 mr-2" />
                    <h3 className="text-lg font-bold text-orange-900">Database Setup Required</h3>
                 </div>
                 <p className="text-orange-800 mb-4">
                    Your app is connected to Firebase, but the database permissions are blocking access. 
                    This is normal for a new project.
                 </p>
                 <p className="font-semibold text-orange-900 mb-2">To fix this:</p>
                 <ol className="list-decimal list-inside text-orange-800 space-y-1 mb-4 text-sm">
                    <li>Go to the <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline font-bold">Firebase Console</a></li>
                    <li>Navigate to <strong>Build &gt; Firestore Database &gt; Rules</strong></li>
                    <li>Paste the following rules and click <strong>Publish</strong>:</li>
                 </ol>
                 <div className="bg-gray-800 text-gray-100 p-4 rounded-lg text-xs font-mono overflow-x-auto">
                    <pre>{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow create: if request.auth != null;
      allow read, write: if request.auth != null;
    }
    match /orders/{orderId} {
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}`}</pre>
                 </div>
                 <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">
                    I've Updated the Rules, Try Again
                 </button>
             </div>
        ) : fetchError && (
             <div className="w-full mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                 <p className="text-red-600 font-medium">{fetchError}</p>
                 <button onClick={() => window.location.reload()} className="mt-2 text-sm text-red-700 underline hover:text-red-800">Retry</button>
             </div>
        )}

        {!isLoadingOrders && !fetchError && (
            <>
                {/* KPI Stats Grid - 6 Items */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-8">
                    {/* 1. Daily Revenue */}
                    <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow animate-slide-up delay-100">
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 rounded-lg bg-green-50">
                                <DollarSign className="h-5 w-5 text-green-600" />
                            </div>
                        </div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Daily Revenue</p>
                        <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">Rs. {dailyRevenue.toLocaleString()}</h3>
                        {renderTrend(dailyRevenue, yesterdayRevenue)}
                    </div>

                    {/* 2. Weekly Revenue */}
                    <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow animate-slide-up delay-200">
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 rounded-lg bg-blue-50">
                                <Calendar className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Weekly Revenue</p>
                        <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">Rs. {weeklyRevenue.toLocaleString()}</h3>
                        {renderTrend(weeklyRevenue, lastWeekRevenue)}
                    </div>

                    {/* 3. Monthly Revenue */}
                    <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow animate-slide-up delay-300">
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 rounded-lg bg-purple-50">
                                <TrendingUp className="h-5 w-5 text-purple-600" />
                            </div>
                        </div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Monthly Revenue</p>
                        <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">Rs. {monthlyRevenue.toLocaleString()}</h3>
                        {renderTrend(monthlyRevenue, lastMonthRevenue)}
                    </div>

                    {/* 4. Active Orders */}
                    <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow animate-slide-up delay-400">
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 rounded-lg bg-orange-50">
                                <Clock className="h-5 w-5 text-orange-600" />
                            </div>
                            <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Action Needed</span>
                        </div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Orders</p>
                        <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{actionNeeded}</h3>
                    </div>

                    {/* 5. Total Orders */}
                    <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow animate-slide-up delay-500">
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 rounded-lg bg-indigo-50">
                                <Package className="h-5 w-5 text-indigo-600" />
                            </div>
                        </div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Orders</p>
                        <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{totalOrders}</h3>
                        <p className="text-xs text-gray-400 mt-2">Lifetime</p>
                    </div>

                    {/* 6. Cancelled Orders */}
                    <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow animate-slide-up delay-500">
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 rounded-lg bg-red-50">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                            </div>
                        </div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cancelled</p>
                        <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{cancelledOrders}</h3>
                        <p className="text-xs text-gray-400 mt-2">Needs attention</p>
                    </div>
                </div>

                {/* Analytics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Sales Chart */}
                    <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Revenue Trends</h3>
                            <div className="relative">
                                <select 
                                    value={chartPeriod}
                                    onChange={(e) => setChartPeriod(e.target.value as any)}
                                    className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-xs sm:text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2 pr-8 cursor-pointer font-medium"
                                >
                                    <option value="daily">Last 7 Days</option>
                                    <option value="weekly">Last 4 Weeks</option>
                                    <option value="monthly">Last 6 Months</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        
                        {/* CHART FIX: Added wrapper with explicit pixel height and width style to satisfy Recharts */}
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.4}/>
                                </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#9ca3af'}} dy={10} interval={0} />
                                <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#9ca3af'}} tickFormatter={(value) => `${value/1000}k`} />
                                <Tooltip cursor={{fill: '#f9fafb'}} content={<CustomTooltip />} />
                                <Bar dataKey="sales" radius={[4, 4, 0, 0]} maxBarSize={40} onClick={handleBarClick} cursor="pointer">
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={dateRange.start === entry.startDate && dateRange.end === entry.endDate ? '#16a34a' : 'url(#colorRevenue)'} />
                                    ))}
                                </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Products */}
                    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <Award className="h-5 w-5 text-yellow-500 mr-2" />
                            Top Sellers
                        </h3>
                        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                            {topProducts.map((prod, index) => (
                                <div key={index} className="flex items-center group">
                                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs group-hover:bg-green-100 group-hover:text-green-600 transition-colors">
                                        {index + 1}
                                    </div>
                                    <div className="ml-3 flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <p className="text-sm font-medium text-gray-900 truncate">{prod.name}</p>
                                            <p className="text-sm font-bold text-gray-900">Rs. {prod.revenue.toLocaleString()}</p>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                            <div className="bg-green-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${(prod.revenue / (topProducts[0]?.revenue || 1)) * 100}%` }}></div>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 text-right">{prod.quantity} sold</p>
                                    </div>
                                </div>
                            ))}
                            {topProducts.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No sales yet. Add orders to see stats.</p>}
                        </div>
                    </div>
                </div>

                {/* Orders Section */}
                <div id="orders-list" className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
                    
                    {/* Orders Header & Filters */}
                    <div className="px-4 py-4 sm:px-6 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
                                <button 
                                    className="sm:hidden p-2 text-gray-500 hover:bg-gray-200 rounded-md"
                                    onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                                >
                                {isMobileFiltersOpen ? <ChevronUp className="h-5 w-5" /> : <Filter className="h-5 w-5" />}
                                </button>
                            </div>
                            
                            {/* Filters Container */}
                            <div className={`${isMobileFiltersOpen ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row flex-wrap gap-3 w-full`}>
                                {/* Search */}
                                <div className="relative flex-grow w-full sm:w-auto sm:max-w-xs">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                        placeholder="Search by name or number"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                {/* Status */}
                                <div className="w-full sm:w-auto">
                                    <select 
                                        value={activeTab}
                                        onChange={(e) => setActiveTab(e.target.value as any)}
                                        className="block w-full py-2 pl-3 pr-8 border border-gray-300 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 cursor-pointer"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="New">New</option>
                                        <option value="Confirmed">Confirmed</option>
                                        <option value="Packed">Packed</option>
                                        <option value="Shipped">Shipped</option>
                                        <option value="Delivered">Delivered</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>

                                {/* Date */}
                                <div className="flex items-center gap-2 w-full sm:w-auto bg-white border border-gray-300 rounded-lg px-3 py-2">
                                    <input 
                                        type="date" 
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                                        className="text-sm border-none focus:ring-0 p-0 text-gray-700 w-full sm:w-28 cursor-pointer bg-transparent"
                                    />
                                    <span className="text-gray-400">-</span>
                                    <input 
                                        type="date" 
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                                        className="text-sm border-none focus:ring-0 p-0 text-gray-700 w-full sm:w-28 cursor-pointer bg-transparent"
                                    />
                                    {(dateRange.start || dateRange.end) && (
                                        <button onClick={() => setDateRange({ start: '', end: '' })} className="ml-1">
                                            <XCircle className="h-4 w-4 text-gray-400 hover:text-red-500" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content: Mobile Cards & Desktop Table */}
                    <div className="bg-white">
                        {/* Mobile Card View (< md) */}
                        <div className="block md:hidden">
                            {filteredOrders.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {filteredOrders.map(order => (
                                        <div key={order.id} className="p-4 flex flex-col gap-3 hover:bg-gray-50 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                                                        {order.customerName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-gray-900">{order.customerName}</h4>
                                                        <p className="text-xs text-gray-500">{order.phone}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm border-t border-gray-50 pt-3 mt-1">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-900 font-medium">{order.product} <span className="text-gray-400">x{order.quantity}</span></span>
                                                    <div className="flex items-center gap-2">
                                                         <span className="text-xs text-gray-400">{order.date}</span>
                                                         <span className="text-xs bg-gray-100 px-1 rounded text-gray-500">{order.type || 'Physical'}</span>
                                                    </div>
                                                </div>
                                                <span className="text-lg font-bold text-gray-900">Rs. {order.total.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-end gap-3 mt-2">
                                                <button onClick={() => setWhatsAppModalOpen({isOpen: true, order})} className="p-2 text-white bg-green-500 hover:bg-green-600 rounded-lg shadow-sm" title="WhatsApp Actions"><MessageCircle className="h-4 w-4" /></button>
                                                <button onClick={() => generateInvoice(order)} className="p-2 text-gray-500 hover:text-green-600 bg-gray-50 rounded-lg" title="Download PDF"><FileText className="h-4 w-4" /></button>
                                                <button onClick={() => handleEdit(order)} className="p-2 text-gray-500 hover:text-blue-600 bg-gray-50 rounded-lg" title="Edit"><Edit2 className="h-4 w-4" /></button>
                                                <button onClick={() => handleDeleteClick(order.id)} className="p-2 text-gray-500 hover:text-red-600 bg-gray-50 rounded-lg" title="Delete"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    <p>No orders found.</p>
                                </div>
                            )}
                        </div>

                        {/* Desktop Table View (>= md) */}
                        <table className="hidden md:table min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                                            <div className="text-xs text-gray-500">{order.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {order.type === 'Digital' ? <Laptop className="h-3 w-3 text-gray-400" /> : <Box className="h-3 w-3 text-gray-400" />}
                                                <div className="text-sm text-gray-900">{order.product}</div>
                                            </div>
                                            <div className="text-xs text-gray-500">Qty: {order.quantity}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                            Rs. {order.total.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {order.date}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button onClick={() => setWhatsAppModalOpen({isOpen: true, order})} className="text-green-500 hover:text-green-700 transition-colors" title="WhatsApp Actions"><MessageCircle className="h-5 w-5" /></button>
                                                <button onClick={() => generateInvoice(order)} className="text-gray-400 hover:text-green-600 transition-colors" title="Download PDF"><FileText className="h-5 w-5" /></button>
                                                <button onClick={() => handleEdit(order)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit"><Edit2 className="h-5 w-5" /></button>
                                                <button onClick={() => handleDeleteClick(order.id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 className="h-5 w-5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No orders found. Add your first order!</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </>
        )}

      </div>

      {/* New Order Modal */}
      {isFormOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                <div className="flex items-center justify-center min-h-screen p-4 text-center sm:block sm:p-0">
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={resetForm}></div>
                    <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                    <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Order' : 'New Order'}</h3>
                                <button onClick={resetForm} className="text-gray-400 hover:text-gray-500"><X className="h-6 w-6" /></button>
                            </div>
                            <form onSubmit={handleSaveOrder} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Product Type Toggle */}
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Product Type</label>
                                        <div className="flex space-x-4">
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name="type" 
                                                    value="Physical" 
                                                    checked={orderForm.type === 'Physical'} 
                                                    onChange={() => setOrderForm({...orderForm, type: 'Physical'})}
                                                    className="text-green-600 focus:ring-green-500 h-4 w-4"
                                                />
                                                <span className="text-sm text-gray-700">Physical (Requires Shipping)</span>
                                            </label>
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name="type" 
                                                    value="Digital" 
                                                    checked={orderForm.type === 'Digital'} 
                                                    onChange={() => setOrderForm({...orderForm, type: 'Digital'})}
                                                    className="text-green-600 focus:ring-green-500 h-4 w-4"
                                                />
                                                <span className="text-sm text-gray-700">Digital</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Phone with Auto-Lookup */}
                                    <div className="col-span-2 sm:col-span-1 relative">
                                         <label className="block text-xs font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                                         <input 
                                            type="tel" 
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-green-500 focus:border-green-500" 
                                            value={orderForm.phone} 
                                            onChange={handlePhoneChange} 
                                            placeholder="0300..." 
                                            required
                                            autoComplete="off"
                                         />
                                         {suggestedCustomer && (
                                            <div 
                                                onClick={applySuggestedCustomer}
                                                className="absolute z-10 top-full left-0 w-full mt-1 bg-white border border-green-200 rounded-lg shadow-xl p-3 cursor-pointer hover:bg-green-50 transition-all duration-200"
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-semibold text-green-700 flex items-center">
                                                        <UserCheck className="h-3 w-3 mr-1" /> Existing Customer
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">Tap to fill</span>
                                                </div>
                                                <div className="text-sm font-bold text-gray-900">{suggestedCustomer.name}</div>
                                                {suggestedCustomer.address && (
                                                    <div className="text-xs text-gray-500 mt-0.5 truncate">{suggestedCustomer.address}</div>
                                                )}
                                            </div>
                                         )}
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                         <label className="block text-xs font-medium text-gray-700 mb-1">Status <span className="text-red-500">*</span></label>
                                         <select 
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-green-500 focus:border-green-500" 
                                            value={orderForm.status} 
                                            onChange={e => setOrderForm({...orderForm, status: e.target.value as OrderStatus})}
                                         >
                                            <option value="New">New</option>
                                            <option value="Confirmed">Confirmed</option>
                                            {orderForm.type === 'Physical' && (
                                                <>
                                                    <option value="Packed">Packed</option>
                                                    <option value="Shipped">Shipped</option>
                                                    <option value="Delivered">Delivered</option>
                                                </>
                                            )}
                                            {orderForm.type === 'Digital' && (
                                                <option value="Delivered">Completed / Sent</option>
                                            )}
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Customer Name <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" 
                                            required 
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-green-500 focus:border-green-500" 
                                            value={orderForm.customerName} 
                                            onChange={e => setOrderForm({...orderForm, customerName: e.target.value})} 
                                            placeholder="e.g. Ali Khan" 
                                        />
                                    </div>

                                    {/* Repeat Customer Badge in Form */}
                                    {currentPhoneStats && (
                                        <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-2 flex items-center justify-between">
                                            <div className="flex items-center text-xs text-blue-800">
                                                <UserCheck className="h-4 w-4 mr-2" />
                                                <span className="font-semibold">Repeat Customer:</span>
                                                <span className="ml-1">{currentPhoneStats.count} previous order(s)</span>
                                            </div>
                                            <div className="text-xs text-blue-600">
                                                Last: {currentPhoneStats.lastOrderDate}
                                            </div>
                                        </div>
                                    )}

                                    {/* Address Field (Optional for Digital) */}
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Address <span className="text-gray-400 font-normal">{orderForm.type === 'Digital' ? '(Optional)' : ''}</span></label>
                                        <input 
                                            type="text" 
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-green-500 focus:border-green-500" 
                                            value={orderForm.address} 
                                            onChange={e => setOrderForm({...orderForm, address: e.target.value})} 
                                            placeholder="House #, Street, City" 
                                        />
                                    </div>

                                    {/* Tracking Number - Conditional */}
                                    {orderForm.type === 'Physical' && ['Shipped', 'Delivered', 'Packed'].includes(orderForm.status) && (
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Tracking Number</label>
                                            <div className="relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Truck className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-green-500 focus:border-green-500" 
                                                    value={orderForm.trackingNumber} 
                                                    onChange={e => setOrderForm({...orderForm, trackingNumber: e.target.value})} 
                                                    placeholder="TCS/Leopard Tracking ID" 
                                                />
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="col-span-2">
                                         <label className="block text-xs font-medium text-gray-700 mb-1">Product <span className="text-red-500">*</span></label>
                                         <input 
                                            type="text" 
                                            required 
                                            list="products-list"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-green-500 focus:border-green-500" 
                                            value={orderForm.product} 
                                            onChange={e => setOrderForm({...orderForm, product: e.target.value})} 
                                            placeholder="Item name" 
                                        />
                                         <datalist id="products-list">
                                            {uniqueProducts.map((p, i) => (
                                                <option key={i} value={p} />
                                            ))}
                                         </datalist>
                                    </div>
                                    <div>
                                         <label className="block text-xs font-medium text-gray-700 mb-1">Qty <span className="text-red-500">*</span></label>
                                         <input 
                                            type="number" 
                                            min="1" 
                                            required 
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-green-500 focus:border-green-500" 
                                            value={orderForm.quantity} 
                                            onChange={e => setOrderForm({...orderForm, quantity: e.target.value})}
                                         />
                                    </div>
                                    <div>
                                         <label className="block text-xs font-medium text-gray-700 mb-1">Price <span className="text-red-500">*</span></label>
                                         <input 
                                            type="number" 
                                            required 
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-green-500 focus:border-green-500" 
                                            value={orderForm.price} 
                                            onChange={e => setOrderForm({...orderForm, price: e.target.value})}
                                         />
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <div className="text-sm font-medium text-gray-900">Total: <span className="text-xl font-bold text-green-600">
                                        Rs. {((parseInt(orderForm.quantity) || 0) * (parseFloat(orderForm.price) || 0)).toLocaleString()}
                                    </span></div>
                                    <button type="submit" className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 shadow-lg shadow-green-200">{editingId ? 'Update' : 'Save'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* WhatsApp Actions Modal */}
        {whatsAppModalOpen.isOpen && whatsAppModalOpen.order && (
            <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
                 <div className="flex items-center justify-center min-h-screen p-4 text-center">
                     <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setWhatsAppModalOpen({isOpen: false, order: null})}></div>
                     <div className="relative inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:max-w-sm w-full">
                         <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                             <div className="flex justify-between items-center mb-4">
                                 <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                     <MessageCircle className="h-5 w-5 text-green-600 mr-2" />
                                     Send Update to Customer
                                 </h3>
                                 <button onClick={() => setWhatsAppModalOpen({isOpen: false, order: null})} className="text-gray-400 hover:text-gray-500"><X className="h-5 w-5" /></button>
                             </div>
                             
                             <div className="space-y-2">
                                 <button onClick={() => sendWhatsAppTemplate('received')} className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-green-200 transition-colors group">
                                     <div className="flex items-center justify-between">
                                         <div className="font-semibold text-gray-800">Order Received</div>
                                         <Send className="h-4 w-4 text-gray-400 group-hover:text-green-600" />
                                     </div>
                                     <div className="text-xs text-gray-500 mt-1">"Thanks for your order..."</div>
                                 </button>

                                 <button onClick={() => sendWhatsAppTemplate('payment')} className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-green-200 transition-colors group">
                                     <div className="flex items-center justify-between">
                                         <div className="font-semibold text-gray-800">Payment Received</div>
                                         <DollarSign className="h-4 w-4 text-gray-400 group-hover:text-green-600" />
                                     </div>
                                     <div className="text-xs text-gray-500 mt-1">"We received your payment..."</div>
                                 </button>

                                 <button onClick={() => sendWhatsAppTemplate('confirmed')} className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-green-200 transition-colors group">
                                     <div className="flex items-center justify-between">
                                         <div className="font-semibold text-gray-800">Order Confirmed</div>
                                         <CheckCircle className="h-4 w-4 text-gray-400 group-hover:text-green-600" />
                                     </div>
                                     <div className="text-xs text-gray-500 mt-1">"Your order is confirmed..."</div>
                                 </button>

                                 {whatsAppModalOpen.order.type === 'Physical' && (
                                     <button onClick={() => sendWhatsAppTemplate('shipped')} className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-green-200 transition-colors group">
                                         <div className="flex items-center justify-between">
                                             <div className="font-semibold text-gray-800">Order Shipped</div>
                                             <Truck className="h-4 w-4 text-gray-400 group-hover:text-green-600" />
                                         </div>
                                         <div className="text-xs text-gray-500 mt-1">"Your package is on the way..."</div>
                                     </button>
                                 )}

                                 <button onClick={() => sendWhatsAppTemplate('delivered')} className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-green-200 transition-colors group">
                                     <div className="flex items-center justify-between">
                                         <div className="font-semibold text-gray-800">Delivered / Complete</div>
                                         <Award className="h-4 w-4 text-gray-400 group-hover:text-green-600" />
                                     </div>
                                     <div className="text-xs text-gray-500 mt-1">"Hope you enjoy your purchase..."</div>
                                 </button>
                             </div>
                         </div>
                     </div>
                 </div>
            </div>
        )}
        
        {/* Profile Settings Modal */}
        {isProfileModalOpen && (
             <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
                <div className="flex items-center justify-center min-h-screen p-4 text-center">
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setIsProfileModalOpen(false)}></div>
                    <div className="relative inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:max-w-lg w-full">
                         <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div className="flex justify-between items-center mb-5">
                                <div className="flex items-center">
                                    <Store className="h-6 w-6 text-green-600 mr-2" />
                                    <h3 className="text-lg font-bold text-gray-900">Store Settings</h3>
                                </div>
                                <button onClick={() => setIsProfileModalOpen(false)} className="text-gray-400 hover:text-gray-500"><X className="h-6 w-6" /></button>
                            </div>
                            <p className="text-sm text-gray-500 mb-6">Update your store details. These will appear on your PDF invoices.</p>
                            
                            <form onSubmit={handleProfileUpdate} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Shop Name <span className="text-red-500">*</span></label>
                                    <div className="relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Store className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            className="block w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-500 focus:ring-green-500 focus:border-green-500"
                                            value={profileData.shopName}
                                            onChange={e => setProfileData({...profileData, shopName: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                                    <div className="relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="tel"
                                            className="block w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-500 focus:ring-green-500 focus:border-green-500"
                                            value={profileData.phone}
                                            onChange={e => setProfileData({...profileData, phone: e.target.value})}
                                            placeholder="0300..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                                    <div className="relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            className="block w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-500 focus:ring-green-500 focus:border-green-500"
                                            value={profileData.address}
                                            onChange={e => setProfileData({...profileData, address: e.target.value})}
                                            placeholder="Shop #1, Market, City"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex justify-end">
                                    <button type="submit" className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 shadow-md">
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};

export default Dashboard;