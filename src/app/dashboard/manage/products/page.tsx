'use client';

import React, { useState } from 'react';
import { Plus, AlertCircle, Image } from 'lucide-react';

// Mock data based on schema.sql
const mockProducts = [
    { id: '1', title: 'Premium Cinnamon Sticks', price: 1500.00, stock_quantity: 50, low_stock_threshold: 10, status: 'Active' },
    { id: '2', title: 'Roasted Curry Powder', price: 800.00, stock_quantity: 3, low_stock_threshold: 5, status: 'Low Stock' },
    { id: '3', title: 'Handloom Saree', price: 12000.00, stock_quantity: 15, low_stock_threshold: 3, status: 'Active' },
];

export default function ProductsManagementPage() {
    const [products, setProducts] = useState(mockProducts);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Products & Inventory</h1>
                    <p className="text-gray-500 mt-1">Manage your shop catalog, pricing, and stock levels.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add New Product
                </button>
            </div>

            {/* Inventory Alerts */}
            {products.some(p => p.stock_quantity <= p.low_stock_threshold) && (
                <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Attention Required: Low Stock Items</h3>
                            <div className="mt-2 text-sm text-red-700">
                                <ul className="list-disc pl-5 space-y-1">
                                    {products.filter(p => p.stock_quantity <= p.low_stock_threshold).map(product => (
                                        <li key={product.id}>
                                            <strong>{product.title}</strong> is running low (Current stock: {product.stock_quantity})
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Products Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price (LKR)</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {products.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                                                <Image className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-semibold text-gray-900">{product.title}</div>
                                                <div className="text-xs text-gray-500">ID: {product.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 font-medium">රු {product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{product.stock_quantity} units</div>
                                        <div className="text-xs text-gray-500">Alert @ {product.low_stock_threshold}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${product.stock_quantity > product.low_stock_threshold
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800 animate-pulse'
                                            }`}>
                                            {product.stock_quantity > product.low_stock_threshold ? 'In Stock' : 'Low Stock'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-blue-600 hover:text-blue-900 mr-4 font-semibold">Edit</button>
                                        <button className="text-red-600 hover:text-red-900 font-semibold">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Simple Add Modal (Mock) */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-gray-100">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900">Add New Product</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product Title</label>
                                <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Ceylon Tea Box" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (LKR)</label>
                                    <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="1000" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                                    <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="50" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert Level</label>
                                <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="10" />
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium transition shadow-sm"
                            >
                                Save Product
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
