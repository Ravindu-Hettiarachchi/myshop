'use client';

import React from 'react';

const PLANS = [
    { name: 'Starter', price: 'Rs. 1,500', period: '/month', features: ['1 storefront', '50 products', 'Basic templates', 'Email support'], color: 'border-gray-700', badge: '' },
    { name: 'Business', price: 'Rs. 3,500', period: '/month', features: ['3 storefronts', '500 products', 'All templates', 'Custom domain', 'Priority support'], color: 'border-blue-600', badge: 'Most Popular' },
    { name: 'Enterprise', price: 'Rs. 8,000', period: '/month', features: ['Unlimited storefronts', 'Unlimited products', 'Custom branding', 'Dedicated support', 'Analytics'], color: 'border-purple-600', badge: 'Best Value' },
];

export default function AdminSubscriptionsPage() {
    return (
        <div className="p-6 lg:p-8 space-y-8 text-white">
            <div>
                <h1 className="text-2xl font-bold text-white">Subscription Plans</h1>
                <p className="text-gray-400 text-sm mt-1">Platform subscription tiers and revenue overview.</p>
            </div>

            {/* Revenue Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'MRR (Monthly Recurring Revenue)', value: 'Rs. —', note: 'Connect payment provider' },
                    { label: 'Active Subscriptions', value: '—', note: 'Connect payment provider' },
                    { label: 'Churn Rate', value: '—%', note: 'Connect payment provider' },
                ].map(card => (
                    <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                        <p className="text-gray-500 text-xs uppercase tracking-wider">{card.label}</p>
                        <p className="text-3xl font-black text-white mt-2">{card.value}</p>
                        <p className="text-xs text-gray-600 mt-1">{card.note}</p>
                    </div>
                ))}
            </div>

            {/* Plan Cards */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">Available Plans</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {PLANS.map(plan => (
                        <div key={plan.name} className={`bg-gray-900 border-2 ${plan.color} rounded-2xl p-6 relative`}>
                            {plan.badge && (
                                <span className="absolute -top-3 left-6 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-bold">{plan.badge}</span>
                            )}
                            <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                            <div className="mb-5">
                                <span className="text-3xl font-black text-white">{plan.price}</span>
                                <span className="text-gray-500 text-sm">{plan.period}</span>
                            </div>
                            <ul className="space-y-2">
                                {plan.features.map(f => (
                                    <li key={f} className="text-sm text-gray-400 flex items-center gap-2">
                                        <span className="text-green-500">✓</span> {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-gray-600 mt-4">
                    Note: Connect a payment provider like Stripe or PayHere (Sri Lanka) to activate real subscription billing.
                </p>
            </div>
        </div>
    );
}
