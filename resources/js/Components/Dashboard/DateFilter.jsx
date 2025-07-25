import React from 'react';
import { motion } from 'framer-motion';

const DateFilter = ({ filters, setFilters, applyFilters, resetFilters }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="text-lg font-medium whitespace-nowrap">Date Range Filter</h3>
                <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
                    <div className="flex items-center gap-2 min-w-[150px]">
                        <label className="text-sm text-gray-600 whitespace-nowrap">From:</label>
                        <input
                            type="date"
                            value={filters.dateRange.from}
                            onChange={(e) => setFilters(prev => ({
                                ...prev,
                                dateRange: { ...prev.dateRange, from: e.target.value }
                            }))}
                            className="border rounded px-2 py-1 text-sm w-full"
                        />
                    </div>
                    <div className="flex items-center gap-2 min-w-[150px]">
                        <label className="text-sm text-gray-600 whitespace-nowrap">To:</label>
                        <input
                            type="date"
                            value={filters.dateRange.to}
                            onChange={(e) => setFilters(prev => ({
                                ...prev,
                                dateRange: { ...prev.dateRange, to: e.target.value }
                            }))}
                            className="border rounded px-2 py-1 text-sm w-full"
                        />
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            applyFilters('manpowerRequests');
                            applyFilters('employeeAssignments');
                        }}
                        className="bg-indigo-600 text-white px-3 py-1 rounded text-sm whitespace-nowrap h-[34px]"
                    >
                        Apply Filters
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={resetFilters}
                        className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm whitespace-nowrap h-[34px]"
                    >
                        Reset
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default DateFilter;