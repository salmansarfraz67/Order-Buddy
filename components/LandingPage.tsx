import React, { useState } from 'react';
import { CheckCircle, FileText, BarChart2, Star, ArrowRight, Smartphone, Zap, Shield, Users, Quote, PenTool, Share2, UserPlus, HelpCircle, Mail, MapPin, Phone, ShoppingBag, Shirt, Utensils, LayoutDashboard, ChevronDown, ChevronUp } from 'lucide-react';
import { PricingPlan, User } from '../types';

interface LandingPageProps {
  onGetStarted: () => void;
  user?: User | null;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, user }) => {
  const [isYearly, setIsYearly] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePlanClick = (planName: string) => {
    if (planName === "Free Trial") {
      onGetStarted();
    } else {
      const text = `Hello, I am interested in subscribing to the OrderBuddy ${planName} Plan.`;
      const url = `https://wa.me/923078804659?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    }
  };

  const features = [
    {
      title: "Quick Order Entry",
      description: "Log orders in seconds. Capture customer details, products, and quantities without the hassle of pen and paper.",
      icon: <Zap className="h-6 w-6 text-white" />,
      color: "bg-blue-500"
    },
    {
      title: "Professional Invoices",
      description: "Generate beautiful PDF invoices instantly. Add your logo and share directly to WhatsApp with a single click.",
      icon: <FileText className="h-6 w-6 text-white" />,
      color: "bg-green-500"
    },
    {
      title: "Sales Insights",
      description: "Understand your business with clear dashboards. Track daily sales, top products, and growth trends.",
      icon: <BarChart2 className="h-6 w-6 text-white" />,
      color: "bg-purple-500"
    },
     {
      title: "Mobile First",
      description: "Designed for your phone. Manage your business from anywhere, whether you're at the market or at home.",
      icon: <Smartphone className="h-6 w-6 text-white" />,
      color: "bg-orange-500"
    },
     {
      title: "Secure Data",
      description: "Your customer data is safe and private. We use industry-standard security to protect your business information.",
      icon: <Shield className="h-6 w-6 text-white" />,
      color: "bg-teal-500"
    },
     {
      title: "Team Access",
      description: "Growing fast? Add staff members to help manage orders while you focus on expanding your business.",
      icon: <Users className="h-6 w-6 text-white" />,
      color: "bg-pink-500"
    }
  ];

  const plans: PricingPlan[] = [
    {
      name: "Free Trial",
      monthlyPrice: 0,
      yearlyPrice: 0,
      buttonText: "Start Free Trial",
      features: [
        "7 Days Full Access",
        "Unlimited Orders",
        "PDF Invoices (Demo Watermark)",
        "Basic Dashboard"
      ]
    },
    {
      name: "Standard",
      monthlyPrice: 499,
      yearlyPrice: 5030,
      isPopular: true,
      buttonText: "Get Standard",
      features: [
        "Unlimited Orders",
        "Professional PDF Invoices",
        "Remove Watermark",
        "Add Your Logo",
        "WhatsApp Sharing",
        "Payment Tracking"
      ]
    },
    {
      name: "Premium",
      monthlyPrice: 999,
      yearlyPrice: 10070,
      buttonText: "Get Premium",
      features: [
        "Everything in Standard",
        "Multi-user Access",
        "Excel/CSV Data Export",
        "Advanced Analytics",
        "Auto Payment Reminders",
        "Priority Support"
      ]
    }
  ];

  const testimonials = [
    {
      name: "Ahmed Raza",
      role: "Owner, Raza Fabrics",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
      quote: "I used to spend 2 hours every night writing bills in a notebook. With OrderBuddy, I make invoices while talking to customers on WhatsApp. It's a lifesaver!"
    },
    {
      name: "Sana Mir",
      role: "Home Baker (Sweet Delights)",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
      quote: "My customers love the PDF receipts. It makes my small home business look like a big professional brand. The 16% yearly discount was a no-brainer for me."
    },
    {
      name: "Kashif Siddiqui",
      role: "Mobile Accessories Wholesaler",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
      quote: "Tracking pending payments was my biggest headache. Now the dashboard shows me exactly who owes money. I've recovered Rs. 50,000 in just one month."
    }
  ];

  const faqs = [
    {
      question: "Is OrderBuddy free to use?",
      answer: "OrderBuddy offers a 7-day free trial with full access. After that, you can choose our Standard plan for Rs. 499/month or Premium for Rs. 999/month."
    },
    {
      question: "Can I use it on my mobile phone?",
      answer: "Yes! OrderBuddy is 100% mobile-friendly. You can use it on any smartphone, tablet, or laptop without installing any app."
    },
    {
      question: "How do I share invoices on WhatsApp?",
      answer: "Once you create an order, just click the 'PDF Invoice' button. It will generate a professional invoice link that you can directly share on WhatsApp."
    },
    {
      question: "Is my data safe?",
      answer: "Absolutely. We use secure cloud storage to protect your customer data and sales records. Your data is never shared with third parties."
    }
  ];

  return (
    <div className="flex flex-col font-sans">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        
        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .scrollbar-hide {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
        }
      `}</style>

      {/* Hero Section */}
      <section id="home" className="relative overflow-hidden bg-white pt-16 pb-20 lg:pt-32 lg:pb-32">
         {/* Background decorative blob */}
        <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 transform pointer-events-none">
            <div className="absolute -top-24 left-0 h-96 w-96 rounded-full bg-green-100 opacity-50 blur-3xl filter animate-pulse"></div>
            <div className="absolute top-32 right-0 h-96 w-96 rounded-full bg-blue-50 opacity-50 blur-3xl filter animate-pulse delay-700"></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            
            {/* Hero Text */}
            <div className="z-10 animate-fade-in-up">
              <div className="inline-flex items-center rounded-full bg-green-50 px-4 py-1.5 text-sm font-semibold text-green-700 mb-8 border border-green-200 hover:bg-green-100 transition-colors cursor-default shadow-sm animate-float">
                <span className="flex h-2 w-2 relative mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span>🚀 Made for Pakistani Sellers</span>
              </div>
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-6xl md:text-7xl mb-8 leading-tight">
                Manage your <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-800">WhatsApp Orders</span> like a Pro
              </h1>
              <p className="mt-4 text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                Stop using notebooks. OrderBuddy helps you track orders, send professional invoices, and grow your sales. Simple, fast, and 100% mobile-friendly.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button 
                    onClick={onGetStarted} 
                    className="flex items-center justify-center px-8 py-4 border border-transparent text-lg font-bold rounded-xl text-white bg-green-600 hover:bg-green-700 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
                >
                  {user ? (
                      <>
                        <LayoutDashboard className="ml-2 h-5 w-5 mr-2" />
                        Go to Dashboard
                      </>
                  ) : (
                      <>
                        Start Free Trial
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                  )}
                </button>
                <button 
                    onClick={() => scrollToSection('features')}
                    className="flex items-center justify-center px-8 py-4 border border-gray-200 text-lg font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 shadow-md hover:shadow-lg transition-all"
                >
                    Learn More
                </button>
              </div>
            </div>
            
            {/* Social Proof */}
            <div className="mt-12 animate-fade-in-up delay-200">
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Trusted by 1,000+ businesses</p>
                <div className="flex flex-wrap justify-center items-center gap-8 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                     {/* Placeholder Logos */}
                     <div className="flex items-center space-x-2"><ShoppingBag className="h-6 w-6" /><span className="font-bold text-lg">FashionHub</span></div>
                     <div className="flex items-center space-x-2"><Utensils className="h-6 w-6" /><span className="font-bold text-lg">TastyBites</span></div>
                     <div className="flex items-center space-x-2"><Shirt className="h-6 w-6" /><span className="font-bold text-lg">StyleLoft</span></div>
                </div>
            </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-20">
                  <h2 className="text-base text-green-600 font-semibold tracking-wide uppercase">Features</h2>
                  <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">Everything you need to grow</p>
                  <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">We've built tools specifically for Instagram and WhatsApp sellers in Pakistan.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {features.map((feature, index) => (
                      <div key={index} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
                          <div className={`flex items-center justify-center h-12 w-12 rounded-xl ${feature.color} mb-6 shadow-lg`}>
                              {feature.icon}
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                          <p className="text-gray-500 leading-relaxed">{feature.description}</p>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                  <h2 className="text-base text-green-600 font-semibold tracking-wide uppercase">Pricing</h2>
                  <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">Simple, transparent pricing</p>
                  
                  {/* Toggle */}
                  <div className="mt-8 flex justify-center items-center">
                      <span className={`text-sm font-medium ${!isYearly ? 'text-gray-900' : 'text-gray-500'}`}>Monthly</span>
                      <button 
                        onClick={() => setIsYearly(!isYearly)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mx-4 ${isYearly ? 'bg-green-600' : 'bg-gray-200'}`}
                      >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isYearly ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                      <span className={`text-sm font-medium ${isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
                          Yearly <span className="text-green-600 font-bold ml-1">(Save 16%)</span>
                      </span>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                  {plans.map((plan, index) => (
                      <div key={index} className={`rounded-2xl shadow-lg overflow-hidden flex flex-col ${plan.isPopular ? 'border-2 border-green-500 relative transform md:-translate-y-4 z-10' : 'border border-gray-100 bg-white'}`}>
                          {plan.isPopular && (
                              <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
                          )}
                          <div className="p-8 bg-white flex-1 flex flex-col">
                              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                              <div className="mt-4 flex items-baseline">
                                  <span className="text-4xl font-extrabold text-gray-900">
                                    Rs. {isYearly ? (plan.yearlyPrice > 0 ? Math.round(plan.yearlyPrice/12) : 0) : plan.monthlyPrice}
                                  </span>
                                  <span className="ml-1 text-gray-500">/month</span>
                              </div>
                              {isYearly && plan.yearlyPrice > 0 && (
                                  <p className="text-xs text-green-600 font-semibold mt-1">Billed Rs. {plan.yearlyPrice} yearly</p>
                              )}
                              
                              <ul className="mt-8 space-y-4 flex-1">
                                  {plan.features.map((feature, i) => (
                                      <li key={i} className="flex items-start">
                                          <CheckCircle className="flex-shrink-0 h-5 w-5 text-green-500" />
                                          <span className="ml-3 text-sm text-gray-600">{feature}</span>
                                      </li>
                                  ))}
                              </ul>
                              
                              <button 
                                onClick={() => handlePlanClick(plan.name)}
                                className={`mt-8 w-full py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-white transition-all ${plan.isPopular ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-gray-800 hover:bg-gray-900'}`}
                              >
                                  {plan.buttonText}
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* Founder Section (Contact Us) */}
      <section id="contact" className="py-24 bg-gradient-to-b from-white to-green-50 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-30">
            <div className="absolute top-10 left-10 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
            <div className="absolute top-10 right-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-1/2 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-10 tracking-tight">Meet the Visionary</h2>
            
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 sm:p-12 shadow-2xl border border-white/50 transform transition-all hover:scale-[1.01] duration-500">
                <div className="flex flex-col items-center">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-blue-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <img 
                            src="https://sahaafii.com/wp-content/uploads/2026/02/WhatsApp-Image-2024-12-04-at-05.13.40_03c490cf.jpg" 
                            alt="Salman Sarfraz" 
                            className="relative w-40 h-40 rounded-full object-cover border-4 border-white shadow-xl mb-6 transform transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute bottom-6 right-2 bg-blue-500 rounded-full p-1.5 border-4 border-white shadow-lg z-20">
                            <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">Salman Sarfraz</h3>
                    <p className="text-green-600 font-bold text-sm uppercase tracking-wider mb-6">Founder & CEO, OrderBuddy</p>
                    
                    <div className="relative mb-8">
                        <Quote className="absolute -top-4 -left-6 h-8 w-8 text-green-200 transform -scale-x-100" />
                        <p className="text-gray-600 text-lg sm:text-xl font-medium italic leading-relaxed max-w-2xl mx-auto">
                            "I built OrderBuddy because I know the hustle of Pakistani entrepreneurs. We are a nation of creators and sellers, but we get stuck in manual work. <span className="text-gray-900 font-bold">My mission is simple:</span> to give you a tool that feels professional, works instantly, and helps you scale your business from a WhatsApp number to a brand."
                        </p>
                        <Quote className="absolute -bottom-4 -right-6 h-8 w-8 text-green-200" />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                         <a href="https://wa.me/923078804659" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 hover:shadow-green-200 hover:-translate-y-1 transition-all duration-300">
                            <Phone className="h-5 w-5 mr-2" />
                            <span>Chat on WhatsApp</span>
                         </a>
                         <a href="mailto:Salmansarfraz558@gmail.com" className="flex items-center justify-center px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-1 transition-all duration-300">
                            <Mail className="h-5 w-5 mr-2" />
                            <span>Email Me Directly</span>
                         </a>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-extrabold text-center mb-16">Loved by Pakistani Sellers</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {testimonials.map((t, index) => (
                      <div key={index} className="bg-gray-800 p-8 rounded-2xl relative">
                          <Quote className="absolute top-6 right-6 h-8 w-8 text-gray-700 opacity-50" />
                          <div className="flex items-center mb-6">
                              <img src={t.image} alt={t.name} className="h-12 w-12 rounded-full border-2 border-green-500 object-cover" />
                              <div className="ml-4">
                                  <h4 className="font-bold text-lg">{t.name}</h4>
                                  <p className="text-sm text-gray-400">{t.role}</p>
                              </div>
                          </div>
                          <p className="text-gray-300 italic leading-relaxed">"{t.quote}"</p>
                          <div className="mt-4 flex text-yellow-400">
                              {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-extrabold text-center mb-12 text-gray-900">Frequently Asked Questions</h2>
              <div className="space-y-4">
                  {faqs.map((faq, index) => (
                      <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                          <button 
                            onClick={() => toggleFaq(index)}
                            className="w-full px-6 py-4 flex justify-between items-center bg-white hover:bg-gray-50 focus:outline-none"
                          >
                              <span className="font-bold text-gray-900 text-left">{faq.question}</span>
                              {openFaqIndex === index ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
                          </button>
                          {openFaqIndex === index && (
                              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                                  <p className="text-gray-600">{faq.answer}</p>
                              </div>
                          )}
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* CTA Bottom */}
      <section id="start-trial" className="py-20 bg-green-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
              <h2 className="text-3xl font-extrabold mb-4">Ready to organize your business?</h2>
              <p className="text-xl text-green-100 mb-8">Join thousands of Pakistani sellers managing their orders with OrderBuddy.</p>
              <button 
                onClick={onGetStarted}
                className="bg-white text-green-600 font-bold py-4 px-10 rounded-xl shadow-xl hover:bg-gray-100 transition-all transform hover:-translate-y-1 text-lg"
              >
                  Start Your 7-Day Free Trial
              </button>
              <p className="mt-4 text-sm text-green-200 opacity-80">No credit card required • Cancel anytime</p>
          </div>
      </section>
    </div>
  );
};

export default LandingPage;