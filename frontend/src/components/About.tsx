import {Link} from 'react-router-dom';
import {Shield, ArrowLeft, Target, Users, Award, Briefcase, Heart, Globe} from 'lucide-react';

export function About() {
    const team = [
        {
            name: 'Emily Chen',
            role: 'CEO & Co-founder',
            image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&h=300&fit=crop&crop=faces&auto=format',
            bio: '15+ years in fintech and tax automation'
        },
        {
            name: 'Marcus Rodriguez',
            role: 'CTO',
            image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=faces&auto=format',
            bio: 'Former Senior Engineer at Google Cloud'
        },
        {
            name: 'Sarah Williams',
            role: 'Head of Tax Services',
            image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&crop=faces&auto=format',
            bio: 'Certified CPA with 12 years experience'
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
            year: '2023',
            title: 'Industry Recognition',
            description: 'Named "Most Innovative Tax Tech Solution" by Finance Monthly'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Shield className="h-8 w-8 text-blue-600"/>
                            <span className="ml-2 text-xl font-bold text-gray-900">TaxFront</span>
                        </div>
                        <Link
                            to="/"
                            className="inline-flex items-center px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2"/>
                            Back to Home
                        </Link>
                    </div>
                </div>
            </nav>

            <main>
                {/* Hero Section */}
                <div className="relative bg-white overflow-hidden">
                    <div className="max-w-7xl mx-auto">
                        <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
                            <div
                                className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                                <div className="text-center lg:text-left">
                                    <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                                        <span className="block">Revolutionizing</span>
                                        <span className="block text-blue-600">Tax Management</span>
                                    </h1>
                                    <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                                        We're on a mission to make tax document management simple, secure, and efficient
                                        for businesses and individuals alike.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Values Section */}
                <div className="py-16 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-extrabold text-gray-900">Our Values</h2>
                            <p className="mt-4 text-xl text-gray-600">
                                The principles that guide everything we do
                            </p>
                        </div>

                        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                            {values.map((value, index) => (
                                <div
                                    key={index}
                                    className="relative bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                                >
                                    <div className="absolute -top-4 -left-4 bg-blue-600 rounded-lg p-3">
                                        <value.icon className="h-6 w-6 text-white"/>
                                    </div>
                                    <h3 className="mt-4 text-xl font-semibold text-gray-900">{value.title}</h3>
                                    <p className="mt-2 text-gray-600">{value.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Team Section */}
                <div className="py-16 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-extrabold text-gray-900">Meet Our Team</h2>
                            <p className="mt-4 text-xl text-gray-600">
                                The experts behind TaxFront's success
                            </p>
                        </div>

                        <div className="mt-12 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
                            {team.map((member, index) => (
                                <div key={index} className="flex flex-col items-center">
                                    <div className="relative">
                                        <img
                                            className="w-48 h-48 rounded-full object-cover"
                                            src={member.image}
                                            alt={member.name}
                                        />
                                        <div
                                            className="absolute inset-0 rounded-full bg-gradient-to-b from-transparent to-black/30"></div>
                                    </div>
                                    <h3 className="mt-6 text-xl font-semibold text-gray-900">{member.name}</h3>
                                    <p className="text-blue-600">{member.role}</p>
                                    <p className="mt-2 text-center text-gray-600">{member.bio}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Timeline Section */}
                <div className="py-16 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-extrabold text-gray-900">Our Journey</h2>
                            <p className="mt-4 text-xl text-gray-600">
                                Key milestones in our growth story
                            </p>
                        </div>

                        <div className="mt-12 relative">
                            <div className="absolute left-1/2 transform -translate-x-px h-full w-0.5 bg-gray-200"></div>
                            <div className="space-y-12">
                                {milestones.map((milestone, index) => (
                                    <div key={index} className="relative">
                                        <div className="flex items-center">
                                            <div className="flex-1 text-right pr-8">
                                                <h3 className="text-xl font-semibold text-gray-900">{milestone.year}</h3>
                                                <h4 className="text-lg font-medium text-blue-600">{milestone.title}</h4>
                                                <p className="mt-2 text-gray-600">{milestone.description}</p>
                                            </div>
                                            <div className="absolute left-1/2 transform -translate-x-1/2">
                                                <div
                                                    className="w-4 h-4 rounded-full bg-blue-600 border-4 border-white"></div>
                                            </div>
                                            <div className="flex-1 pl-8"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Global Impact Section */}
                <div className="py-16 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
                            <div>
                                <h2 className="text-3xl font-extrabold text-gray-900">
                                    Global Impact
                                </h2>
                                <p className="mt-4 text-lg text-gray-600">
                                    We're proud to serve clients across the globe, helping businesses and individuals
                                    manage their tax documents efficiently and securely.
                                </p>
                                <div className="mt-8 grid grid-cols-2 gap-6">
                                    <div className="bg-gray-50 rounded-lg p-6">
                                        <div className="text-3xl font-bold text-blue-600">50K+</div>
                                        <div className="mt-2 text-gray-600">Active Users</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-6">
                                        <div className="text-3xl font-bold text-blue-600">30+</div>
                                        <div className="mt-2 text-gray-600">Countries Served</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-6">
                                        <div className="text-3xl font-bold text-blue-600">1M+</div>
                                        <div className="mt-2 text-gray-600">Documents Processed</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-6">
                                        <div className="text-3xl font-bold text-blue-600">99.9%</div>
                                        <div className="mt-2 text-gray-600">Uptime</div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-10 lg:mt-0">
                                <Globe className="mx-auto h-64 w-64 text-blue-600"/>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

        </div>
    );
}