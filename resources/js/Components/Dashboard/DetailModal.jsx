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
                    className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4"
                >
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col"
                    >
                        <div className="px-6 py-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-medium">{title}</h3>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-auto flex-grow">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {columns.map((column, idx) => (
                                            <th
                                                key={idx}
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                {column.header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {items.length > 0 ? (
                                        items.map((item, itemIdx) => (
                                            <tr key={itemIdx} className="hover:bg-gray-50">
                                                {columns.map((column, colIdx) => (
                                                    <td key={colIdx} className="px-4 py-4 whitespace-nowrap text-sm">
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
                            <div className="px-6 py-3 border-t flex justify-between items-center bg-gray-50">
                                <div className="flex space-x-2">
                                    {paginationLinks.map((link, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => onFilterOrPaginate(link.url, null)}
                                            disabled={!link.url || link.active}
                                            className={`px-3 py-1 rounded text-sm ${link.active ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border'} ${!link.url ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                                        >
                                            {link.label.replace('&laquo;', '«').replace('&raquo;', '»')}
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