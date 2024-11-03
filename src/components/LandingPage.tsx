import { Shield, FileCheck, Clock, ArrowRight, Users, Sparkles, Check, Star, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 fixed w-full z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Shield className="h-8 w-8 text-blue-600" />
                            <span className="ml-2 text-xl font-bold text-gray-900">TaxFront</span>
                        </div>
                        <button
                            onClick={onGetStarted}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                        >
                            Sign In
                        </button>
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
                                    <button
                                        onClick={onGetStarted}
                                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-105"
                                    >
                                        Get Started <ArrowRight className="ml-2 h-5 w-5" />
                                    </button>
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

                <div className="py-16 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
                                <div className="relative p-6 bg-white ring-1 ring-gray-900/5 rounded-lg leading-none flex items-top justify-start space-x-6 hover:shadow-lg transition-shadow">
                                    <Shield className="w-8 h-8 text-blue-600" />
                                    <div className="space-y-2">
                                        <p className="text-slate-800 font-medium">Enterprise Security</p>
                                        <p className="text-slate-600 text-sm">Military-grade encryption and secure document storage</p>
                                    </div>
                                </div>
                            </div>

                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
                                <div className="relative p-6 bg-white ring-1 ring-gray-900/5 rounded-lg leading-none flex items-top justify-start space-x-6 hover:shadow-lg transition-shadow">
                                    <Users className="w-8 h-8 text-blue-600" />
                                    <div className="space-y-2">
                                        <p className="text-slate-800 font-medium">Expert Guidance</p>
                                        <p className="text-slate-600 text-sm">Direct access to certified tax professionals</p>
                                    </div>
                                </div>
                            </div>

                            <div className="relative group sm:col-span-2 lg:col-span-1">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
                                <div className="relative p-6 bg-white ring-1 ring-gray-900/5 rounded-lg leading-none flex items-top justify-start space-x-6 hover:shadow-lg transition-shadow">
                                    <Sparkles className="w-8 h-8 text-blue-600" />
                                    <div className="space-y-2">
                                        <p className="text-slate-800 font-medium">Smart Features</p>
                                        <p className="text-slate-600 text-sm">AI-powered organization and instant document retrieval</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Testimonials Section */}
                <div className="py-24 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                                Trusted by Businesses Everywhere
                            </h2>
                            <p className="mt-4 text-xl text-gray-600">
                                See what our customers have to say about TaxFront
                            </p>
                        </div>

                        <div className="mt-16 grid gap-8 lg:grid-cols-3">
                            {testimonials.map((testimonial, index) => (
                                <div
                                    key={index}
                                    className="relative bg-white p-8 rounded-2xl shadow-lg transform transition-transform hover:-translate-y-1"
                                >
                                    <div className="absolute -top-4 -left-4">
                                        <Quote className="h-8 w-8 text-blue-500 transform rotate-180" />
                                    </div>

                                    <div className="flex items-center mb-6">
                                        <img
                                            src={testimonial.image}
                                            alt={testimonial.name}
                                            className="h-12 w-12 rounded-full object-cover"
                                        />
                                        <div className="ml-4">
                                            <h3 className="text-lg font-medium text-gray-900">{testimonial.name}</h3>
                                            <p className="text-sm text-gray-600">{testimonial.role}</p>
                                        </div>
                                    </div>

                                    <div className="flex mb-4">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                                        ))}
                                    </div>

                                    <p className="text-gray-600 italic">"{testimonial.content}"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="py-24 bg-gradient-to-b from-white to-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                                Simple, Transparent Pricing
                            </h2>
                            <p className="mt-4 text-xl text-gray-600">
                                Choose the plan that best fits your needs
                            </p>
                        </div>

                        <div className="mt-16 grid gap-8 lg:grid-cols-3 lg:gap-x-8">
                            {/* Basic Plan */}
                            <div className="relative p-8 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col">
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-gray-900">Smart</h3>
                                    <p className="mt-4 flex items-baseline text-gray-900">
                                        <span className="text-5xl font-extrabold tracking-tight">$0</span>
                                        <span className="ml-1 text-xl font-semibold">/Tax year</span>
                                    </p>
                                    <p className="mt-6 text-gray-500">Perfect for freelancers and individuals</p>

                                    <ul className="mt-6 space-y-4">
                                        {["5GB secure storage", "Basic document scanning", "Email support", "Mobile app access"].map((feature) => (
                                            <li key={feature} className="flex">
                                                <Check className="flex-shrink-0 w-5 h-5 text-blue-500" />
                                                <span className="ml-3 text-gray-500">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <button
                                    onClick={onGetStarted}
                                    className="mt-8 w-full bg-blue-600 text-white rounded-md py-2 px-4 hover:bg-blue-700 transition-colors"
                                >
                                    Get Started
                                </button>
                            </div>

                            {/* Professional Plan */}
                            <div className="relative p-8 bg-white border-2 border-blue-600 rounded-2xl shadow-sm flex flex-col">
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                    Most Popular
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-gray-900">Smart Plus</h3>
                                    <p className="mt-4 flex items-baseline text-gray-900">
                                        <span className="text-5xl font-extrabold tracking-tight">$29</span>
                                        <span className="ml-1 text-xl font-semibold">/Tax year</span>
                                    </p>
                                    <p className="mt-6 text-gray-500">Perfect for small businesses</p>

                                    <ul className="mt-6 space-y-4">
                                        {[
                                            "25GB secure storage",
                                            "Advanced document scanning",
                                            "Priority email & chat support",
                                            "Mobile app access",
                                            "Tax professional consultation",
                                            "Document analytics"
                                        ].map((feature) => (
                                            <li key={feature} className="flex">
                                                <Check className="flex-shrink-0 w-5 h-5 text-blue-500" />
                                                <span className="ml-3 text-gray-500">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <button
                                    onClick={onGetStarted}
                                    className="mt-8 w-full bg-blue-600 text-white rounded-md py-2 px-4 hover:bg-blue-700 transition-colors"
                                >
                                    Get Started
                                </button>
                            </div>

                            {/* Enterprise Plan */}
                            <div className="relative p-8 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col">
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-gray-900">Smart Max</h3>
                                    <p className="mt-4 flex items-baseline text-gray-900">
                                        <span className="text-5xl font-extrabold tracking-tight">$99</span>
                                        <span className="ml-1 text-xl font-semibold">/Tax year</span>
                                    </p>
                                    <p className="mt-6 text-gray-500">Perfect for large organizations</p>

                                    <ul className="mt-6 space-y-4">
                                        {[
                                            "Unlimited secure storage",
                                            "Advanced document scanning",
                                            "24/7 priority support",
                                            "Mobile app access",
                                            "Dedicated tax professional",
                                            "Advanced analytics & reporting",
                                            "Custom integrations",
                                            "Team collaboration tools"
                                        ].map((feature) => (
                                            <li key={feature} className="flex">
                                                <Check className="flex-shrink-0 w-5 h-5 text-blue-500" />
                                                <span className="ml-3 text-gray-500">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <button
                                    onClick={onGetStarted}
                                    className="mt-8 w-full bg-blue-600 text-white rounded-md py-2 px-4 hover:bg-blue-700 transition-colors"
                                >
                                    Contact Sales
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="bg-white border-t border-gray-100">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <div className="flex items-center">
                            <span className="ml-2 text-gray-900">© 2024 TaxFront. All rights reserved.</span>
                        </div>
                        <div className="flex space-x-6">
                            <Link to="/privacy" className="text-gray-600 hover:text-blue-600 transition-colors">Privacy Policy</Link>
                            <Link to="/terms" className="text-gray-600 hover:text-blue-600 transition-colors">Terms of Service</Link>
                            <Link to="/contact" className="text-gray-600 hover:text-blue-600 transition-colors">Contact</Link>
                            <Link to="/about" className="text-gray-600 hover:text-blue-600 transition-colors">About</Link>
                            <Link to="/calculator" className="text-gray-600 hover:text-blue-600 transition-colors">Tax Calculator</Link>
                            <Link to="/forms" className="text-gray-600 hover:text-blue-600 transition-colors">Tax Forms</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}