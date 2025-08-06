import React from 'react';
import { motion } from 'framer-motion';

const PendingRequestsTable = ({ data, height, handleResize, formatDate }) => {
    return (
        <div className="w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/30 dark:border-gray-600/30 p-6 relative transition-all duration-300">
            <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-100">Recent Pending Requests</h3>
            <div 
                className="overflow-auto relative"
                style={{ height: `${height}px` }}
            >
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-white/50 dark:bg-gray-700/50 sticky top-0 backdrop-blur-sm">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sub Section</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Shift</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="bg-transparent divide-y divide-gray-200 dark:divide-gray-700">
                        {data.length > 0 ? (
                            data.map((request, index) => (
                                <motion.tr
                                    key={request.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                                >
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{formatDate(request.date)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{request.sub_section?.name || 'N/A'}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{request.shift?.name || 'N/A'}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{request.requested_amount}</td>
                                </motion.tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                    No pending requests
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="mt-4">
                <label className="text-xs text-gray-500 dark:text-gray-400">Adjust Height:</label>
                <input
                    type="range"
                    min="200"
                    max="800"
                    value={height}
                    onChange={handleResize}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
            </div>
        </div>
    );
};

export default PendingRequestsTable;