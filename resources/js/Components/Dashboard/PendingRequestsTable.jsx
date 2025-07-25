import React from 'react';
import { motion } from 'framer-motion';

const PendingRequestsTable = ({ data, height, handleResize, formatDate }) => {
    return (
        <div className="w-full md:w-1/2 bg-white p-4 rounded-lg shadow relative">
            <h3 className="text-lg font-medium mb-4">Recent Pending Requests</h3>
            <div 
                className="overflow-auto relative"
                style={{ height: `${height}px` }}
            >
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sub Section</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Shift</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.length > 0 ? (
                            data.map((request, index) => (
                                <motion.tr
                                    key={request.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="hover:bg-gray-50"
                                >
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{formatDate(request.date)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{request.sub_section?.name || 'N/A'}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{request.shift?.name || 'N/A'}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{request.requested_amount}</td>
                                </motion.tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">
                                    No pending requests
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="mt-2">
                <label className="text-xs text-gray-500">Adjust Height:</label>
                <input
                    type="range"
                    min="200"
                    max="800"
                    value={height}
                    onChange={handleResize}
                    className="w-full"
                />
            </div>
        </div>
    );
};

export default PendingRequestsTable;