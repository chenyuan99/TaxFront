import { Link } from 'react-router-dom';
import { Shield, ArrowRight, CheckCircle2, FileText, Cloud, Lock, ChartBar, Zap, Users, LayoutDashboard, Briefcase, Bug, Bell } from 'lucide-react';

export function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Jobs', href: '/jobs', icon: Briefcase },
        { name: 'Tickets', href: 'https://github.com/chenyuan99/TaxFront/issues', icon: Bug, external: true },
    ];

    const testimonials = [
        {
            name: "Sarah Johnson",
            role: "Small Business Owner",
            image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces&auto=format",
            content: "TaxFront has completely transformed how I manage my business taxes. The automated organization and real-time support have saved me countless hours.",
            rating: 5
        },
        {
            name: "Michael Chen",
            role: "Freelance Developer",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces&auto=format",
            content: "As a freelancer, keeping track of tax documents was always a hassle. TaxFront's intuitive interface and secure storage have made tax season stress-free.",
            rating: 5
        },
        {
            name: "Emily Rodriguez",
            role: "E-commerce Entrepreneur",
            image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=faces&auto=format",
            content: "The customer support is exceptional. Whenever I have questions about tax documentation, their team provides quick, helpful responses.",
            rating: 5
        }
    ];

    const features = [
        {
            title: 'Smart Document Processing',
            description: 'AI-powered tax document recognition and data extraction',
            icon: FileText,
        },
        {
            title: 'Cloud Integration',
            description: 'Seamless sync with major cloud storage providers',
            icon: Cloud,
        },
        {
            title: 'Enterprise Security',
            description: 'Bank-grade encryption and compliance measures',
            icon: Lock,
        },
        {
            title: 'Real-time Analytics',
            description: 'Instant insights and tax planning recommendations',
            icon: ChartBar,
        },
    ];

    const benefits = [
        'Reduce tax preparation time by up to 75%',
        'Minimize errors with automated validation',
        'Stay compliant with real-time updates',
        'Access documents securely from anywhere',
        'Integrate with existing accounting software',
        'Get instant support from tax experts'
    ];

    return (
        <div className="min-h-screen">
            {/* Navigation */}
            <nav className="bg-white shadow fixed w-full z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <span className="text-xl font-bold text-[#00AAFF]">TaxFront</span>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                {navigation.map((item) => (
                                    item.external ? (
                                        <a
                                            key={item.name}
                                            href={item.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-[#00395D] hover:border-[#00AAFF]"
                                        >
                                            <item.icon className="w-4 h-4 mr-2" />
                                            {item.name}
                                        </a>
                                    ) : (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-[#00395D] hover:border-[#00AAFF]"
                                        >
                                            <item.icon className="w-4 h-4 mr-2" />
                                            {item.name}
                                        </Link>
                                    )
                                ))}
                            </div>
                        </div>

                        <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
                            <button
                                type="button"
                                className="p-1 rounded-full text-gray-400 hover:text-[#00395D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00AAFF]"
                            >
                                <span className="sr-only">View notifications</span>
                                <Bell className="h-6 w-6" />
                            </button>

                            <button
                                onClick={onGetStarted}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#00395D] hover:bg-[#002D4A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00AAFF]"
                            >
                                Sign In
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main>
                <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
                                <h1>
                                    <span className="mt-1 block text-4xl tracking-tight font-extrabold sm:text-5xl xl:text-6xl">
                                        <span className="block text-gray-900">Smart Tax Filing</span>
                                        <span className="block text-blue-600">For Young Professional</span>
                                    </span>
                                </h1>
                                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                                    Streamline your tax documentation process with intelligent organization, real-time professional support, and bank-level security.
                                </p>
                                <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left">
                                    <p className="text-base font-medium text-gray-900">
                                        Start your free trial today. No credit card required.
                                    </p>
                                    <div className="mt-8 flex gap-x-4">
                                        <Link
                                            to="/register"
                                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#00395D] hover:bg-[#002D4A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00AAFF]"
                                        >
                                            Get Started
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </Link>
                                        <Link
                                            to="/demo"
                                            className="inline-flex items-center px-6 py-3 border border-[#00395D] text-base font-medium rounded-md text-[#00395D] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00AAFF]"
                                        >
                                            Live Demo
                                        </Link>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
                                <div className="relative mx-auto w-full rounded-lg shadow-xl lg:max-w-md overflow-hidden group">
                                    <img
                                        className="w-full rounded-lg transform transition-transform group-hover:scale-105 duration-300"
                                        src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=800&h=600"
                                        alt="Professional tax management"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-lg"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="py-16 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-[#00395D]">
                                Powerful Features for Modern Tax Management
                            </h2>
                            <p className="mt-4 text-xl text-gray-600">
                                Everything you need to manage tax documents efficiently and securely
                            </p>
                        </div>

                        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="relative bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                                >
                                    <div className="absolute -top-4 -left-4 bg-[#00AAFF] rounded-xl p-3">
                                        <feature.icon className="h-6 w-6 text-white" />
                                    </div>
                                    <h3 className="mt-4 text-xl font-semibold text-[#00395D]">
                                        {feature.title}
                                    </h3>
                                    <p className="mt-2 text-gray-600">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Testimonials */}
                <div className="bg-gray-50 py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-[#00395D]">
                                Trusted by Industry Leaders
                            </h2>
                            <p className="mt-4 text-xl text-gray-600">
                                See what our clients say about TaxFront
                            </p>
                        </div>

                        <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-3">
                            {testimonials.map((testimonial, index) => (
                                <div
                                    key={index}
                                    className="bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300"
                                >
                                    <div className="flex items-center">
                                        <img
                                            className="h-12 w-12 rounded-full object-cover"
                                            src={testimonial.image}
                                            alt={testimonial.name}
                                        />
                                        <div className="ml-4">
                                            <p className="text-lg font-semibold text-[#00395D]">
                                                {testimonial.name}
                                            </p>
                                            <p className="text-sm text-gray-500">{testimonial.role}</p>
                                        </div>
                                    </div>
                                    <p className="mt-6 text-gray-600 italic">"{testimonial.content}"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Benefits Section */}
                <div className="bg-white py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-[#00395D]">
                                Why Choose TaxFront
                            </h2>
                            <p className="mt-4 text-xl text-gray-600">
                                Experience the benefits of modern tax document management
                            </p>
                        </div>

                        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {benefits.map((benefit, index) => (
                                <div
                                    key={index}
                                    className="flex items-start space-x-4 p-6 bg-gray-50 rounded-xl hover:shadow-md transition-all duration-300"
                                >
                                    <CheckCircle2 className="h-6 w-6 text-[#00AAFF] flex-shrink-0" />
                                    <span className="text-gray-700">{benefit}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="bg-[#00395D]">
                    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
                        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                            <span className="block">Ready to get started?</span>
                            <span className="block text-[#00AAFF]">Start your free trial today.</span>
                        </h2>
                        <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0 space-x-4">
                            <Link
                                to="/register"
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-[#00395D] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00AAFF]"
                            >
                                Get Started
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                            <Link
                                to="/contact"
                                className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-[#00395D]/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00AAFF]"
                            >
                                Contact Sales
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            {/*<footer className="bg-white border-t border-gray-100">*/}
            {/*    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">*/}
            {/*        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">*/}
            {/*            <div className="flex items-center">*/}
            {/*                <span className="ml-2 text-gray-900"> 2024 TaxFront. All rights reserved.</span>*/}
            {/*            </div>*/}
            {/*            <div className="flex space-x-6">*/}
            {/*                <Link to="/privacy" className="text-gray-600 hover:text-blue-600 transition-colors">Privacy Policy</Link>*/}
            {/*                <Link to="/terms" className="text-gray-600 hover:text-blue-600 transition-colors">Terms of Service</Link>*/}
            {/*                <Link to="/contact" className="text-gray-600 hover:text-blue-600 transition-colors">Contact</Link>*/}
            {/*                <Link to="/about" className="text-gray-600 hover:text-blue-600 transition-colors">About</Link>*/}
            {/*                <Link to="/calculator" className="text-gray-600 hover:text-blue-600 transition-colors">Tax Calculator</Link>*/}
            {/*                <Link to="/forms" className="text-gray-600 hover:text-blue-600 transition-colors">Tax Forms</Link>*/}
            {/*            </div>*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*</footer>*/}
        </div>
    );
}