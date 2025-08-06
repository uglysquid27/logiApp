import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DetailModal = ({
    isOpen,
    onClose,
    title,
    data = null,
    columns = [],
    formatDate,
    onFilterOrPaginate
}) => {
    const items = data?.data || [];
    const paginationLinks = data?.links || [];
    const isPaginated = paginationLinks.length > 0;

    const [filterValues, setFilterValues] = useState({});

    useEffect(() => {
        if (isOpen && data?.path) {
            try {
                const url = new URL(data.path);
                const params = new URLSearchParams(url.search);
                const newFilterValues = {};

                columns.forEach(col => {
                    if (!col.filterable) return;

                    const filterKey = col.filterField || col.field;
                    if (col.filterType === 'date_range') {
                        if (params.has(`filter_${filterKey}_from`)) {
                            newFilterValues[`${filterKey}_from`] = params.get(`filter_${filterKey}_from`);
                        }
                        if (params.has(`filter_${filterKey}_to`)) {
                            newFilterValues[`${filterKey}_to`] = params.get(`filter_${filterKey}_to`);
                        }
                    } else if (params.has(`filter_${filterKey}`)) {
                        newFilterValues[filterKey] = params.get(`filter_${filterKey}`);
                    }
                });
                setFilterValues(newFilterValues);
            } catch (e) {
                console.error('Error parsing URL:', e);
            }
        }
    }, [isOpen, data, columns]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300"
                >
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 dark:border-gray-600/30 max-w-6xl w-full max-h-[90vh] flex flex-col transition-all duration-300"
                    >
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-transparent">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-auto flex-grow">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-white/50 dark:bg-gray-700/50">
                                    <tr>
                                        {columns.map((column, idx) => (
                                            <th
                                                key={idx}
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                            >
                                                {column.header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-transparent divide-y divide-gray-200 dark:divide-gray-700">
                                    {items.length > 0 ? (
                                        items.map((item, itemIdx) => (
                                            <tr key={itemIdx} className="hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                                                {columns.map((column, colIdx) => (
                                                    <td key={colIdx} className="px-4 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                                                        {column.render ? column.render(item) : item[column.field]}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={columns.length} className="px-4 py-4 text-center text-sm text-gray-500">
                                                No data available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {isPaginated && (
                            <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-center items-center bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm">
                                <div className="flex flex-wrap justify-center space-x-2">
                                    {paginationLinks.map((link, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => link.url && onFilterOrPaginate(link.url, null)}
                                            disabled={!link.url || link.active}
                                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${link.active
                                                ? 'bg-indigo-600 text-white shadow-md'
                                                : 'bg-white text-gray-700 border border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default DetailModal;