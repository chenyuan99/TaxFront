import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Target, Users, Award, Briefcase, Heart, Globe, CheckCircle2, Zap, Lock, ChartBar, FileText, Cloud } from 'lucide-react';
import { useState } from 'react';

export function About() {
    const [activeTab, setActiveTab] = useState('overview');

    const team = [
        {
            name: 'Emily Chen',
            role: 'CEO & Co-founder',
            image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&h=300&fit=crop&crop=faces&auto=format',
            bio: '15+ years in fintech and tax automation',
            linkedin: 'https://linkedin.com/in/emilychen'
        },
        {
            name: 'Marcus Rodriguez',
            role: 'CTO',
            image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=faces&auto=format',
            bio: 'Former Senior Engineer at Google Cloud',
            linkedin: 'https://linkedin.com/in/marcusrodriguez'
        },
        {
            name: 'Yaokun Shen',
            role: 'Head of Tax Services',
            image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&crop=faces&auto=format',
            bio: 'Certified CPA with 12 years experience',
            linkedin: 'https://linkedin.com/in/yaokunchen'
        }
    ];

    const features = [
        {
            icon: Lock,
            title: 'Enterprise Security',
            description: 'Bank-grade encryption and multi-factor authentication to protect your sensitive data'
        },
        {
            icon: Cloud,
            title: 'Cloud Integration',
            description: 'Seamless integration with major cloud storage providers and financial platforms'
        },
        {
            icon: FileText,
            title: 'Smart Documents',
            description: 'AI-powered document processing and automatic form recognition'
        },
        {
            icon: ChartBar,
            title: 'Analytics',
            description: 'Real-time insights and tax planning recommendations'
        }
    ];

    const values = [
        {
            icon: Shield,
            title: 'Security First',
            description: 'Bank-level encryption and security measures to protect your sensitive data'
        },
        {
            icon: Target,
            title: 'Innovation',
            description: 'Cutting-edge technology to simplify tax document management'
        },
        {
            icon: Users,
            title: 'Client Focus',
            description: 'Dedicated to providing exceptional service and support'
        },
        {
            icon: Heart,
            title: 'Integrity',
            description: 'Honest, transparent, and ethical business practices'
        }
    ];

    const milestones = [
        {
            year: '2020',
            title: 'Company Founded',
            description: 'TaxFront was established with a mission to revolutionize tax document management'
        },
        {
            year: '2021',
            title: 'Series A Funding',
            description: '$10M raised to expand our services and enhance our platform'
        },
        {
            year: '2022',
            title: 'Platform Launch',
            description: 'Successfully launched our core platform, serving over 10,000 clients'
        },
        {
            year: '2024',
            title: 'Enterprise Partnership',
            description: 'Strategic partnership with Barclays to provide enhanced financial services'
        }
    ];

    const stats = [
        { label: 'Active Users', value: '50K+', icon: Users },
        { label: 'Documents Processed', value: '1M+', icon: FileText },
        { label: 'Countries Served', value: '30+', icon: Globe },
        { label: 'Platform Uptime', value: '99.9%', icon: Cloud }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section with Video Background */}
            <div className="relative bg-[#00395D] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#00395D] to-[#00AAFF] opacity-90"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-white sm:text-5xl md:text-6xl">
                            Transforming Tax Management
                        </h1>
                        <p className="mt-3 max-w-md mx-auto text-xl text-gray-100 sm:text-2xl md:mt-5 md:max-w-3xl">
                            Empowering businesses and individuals with intelligent tax solutions
                        </p>
                        <div className="mt-8 flex justify-center space-x-4">
                            <Link
                                to="/register"
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-[#00395D] bg-white hover:bg-gray-50"
                            >
                                Get Started
                            </Link>
                            <Link
                                to="/contact"
                                className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-[#00395D]/50"
                            >
                                Contact Sales
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {['overview', 'features', 'team', 'values'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`${
                                    activeTab === tab
                                        ? 'border-[#00AAFF] text-[#00AAFF]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Features Section */}
            <div className={`py-16 bg-white ${activeTab !== 'features' && 'hidden'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-[#00395D]">Why Choose TaxFront</h2>
                        <p className="mt-4 text-xl text-gray-600">
                            Experience the future of tax document management
                        </p>
                    </div>

                    <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="relative p-8 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="flex-1">
                                    <feature.icon className="h-12 w-12 text-[#00AAFF]" />
                                    <h3 className="mt-4 text-xl font-semibold text-[#00395D]">{feature.title}</h3>
                                    <p className="mt-4 text-gray-500">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Team Section */}
            <div className={`py-16 bg-gray-50 ${activeTab !== 'team' && 'hidden'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-[#00395D]">Meet Our Team</h2>
                        <p className="mt-4 text-xl text-gray-600">
                            Expert professionals dedicated to your success
                        </p>
                    </div>

                    <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-3">
                        {team.map((member, index) => (
                            <div 
                                key={index} 
                                className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="relative">
                                    <img
                                        className="w-full h-64 object-cover"
                                        src={member.image}
                                        alt={member.name}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl font-semibold text-[#00395D]">{member.name}</h3>
                                    <p className="text-[#00AAFF] font-medium">{member.role}</p>
                                    <p className="mt-3 text-gray-500">{member.bio}</p>
                                    <a
                                        href={member.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-4 inline-flex items-center text-[#00AAFF] hover:text-[#00395D]"
                                    >
                                        Connect on LinkedIn
                                        <ArrowLeft className="ml-2 h-4 w-4 transform rotate-180" />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Values Section */}
            <div className={`py-16 bg-white ${activeTab !== 'values' && 'hidden'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-[#00395D]">Our Values</h2>
                        <p className="mt-4 text-xl text-gray-600">
                            Principles that guide our mission
                        </p>
                    </div>

                    <div className="mt-12 grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                        {values.map((value, index) => (
                            <div 
                                key={index} 
                                className="text-center p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="flex justify-center">
                                    <value.icon className="h-12 w-12 text-[#00AAFF]" />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold text-[#00395D]">{value.title}</h3>
                                <p className="mt-2 text-gray-500">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Overview Section */}
            <div className={`${activeTab !== 'overview' && 'hidden'}`}>
                {/* Stats Grid */}
                <div className="bg-white py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                            {stats.map((stat, index) => (
                                <div 
                                    key={index}
                                    className="bg-gray-50 rounded-2xl p-8 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                                >
                                    <stat.icon className="h-8 w-8 text-[#00AAFF] mx-auto" />
                                    <p className="mt-4 text-3xl font-bold text-[#00395D]">{stat.value}</p>
                                    <p className="mt-1 text-gray-500">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Timeline Section */}
                <div className="py-16 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-[#00395D]">Our Journey</h2>
                            <p className="mt-4 text-xl text-gray-600">
                                Key milestones in our growth
                            </p>
                        </div>

                        <div className="mt-12 relative">
                            <div className="absolute top-0 left-1/2 w-0.5 h-full bg-[#00AAFF] -ml-0.5"></div>
                            <div className="space-y-12">
                                {milestones.map((milestone, index) => (
                                    <div 
                                        key={index} 
                                        className={`relative ${
                                            index % 2 === 0 ? 'md:ml-auto md:pl-8' : 'md:mr-auto md:pr-8'
                                        } md:w-1/2`}
                                    >
                                        <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300">
                                            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-[#00AAFF] text-white font-semibold text-sm absolute top-6 -left-4">
                                                {milestone.year.slice(-2)}
                                            </span>
                                            <h3 className="text-lg font-semibold text-[#00395D]">{milestone.title}</h3>
                                            <p className="mt-2 text-gray-500">{milestone.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-[#00395D]">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-white">Ready to Get Started?</h2>
                        <p className="mt-4 text-xl text-gray-100">
                            Join thousands of satisfied customers who trust TaxFront
                        </p>
                        <div className="mt-8 flex justify-center space-x-4">
                            <Link
                                to="/register"
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-[#00395D] bg-white hover:bg-gray-50"
                            >
                                Start Free Trial
                            </Link>
                            <Link
                                to="/demo"
                                className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-[#00395D]/50"
                            >
                                Request Demo
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}