import React from 'react';
import { motion } from 'framer-motion';
import { cardVariants } from '@/Animations';
import dayjs from 'dayjs';

const SummaryCards = ({ summary, setModalState, formatDate }) => {
    const cardData = [
        {
            title: 'Active Employees',
            value: summary.activeEmployeesCount,
            total: summary.totalEmployeesCount,
            color: 'indigo',
            onClick: () => setModalState(prev => ({
                ...prev,
                open: true,
                title: 'Active Employees',
                url: route('dashboard.employees.active'),
                columns: [
                    { header: 'NIK', field: 'nik' },
                    { header: 'Name', field: 'name' },
                    { header: 'Type', field: 'type' },
                    { header: 'Status', field: 'status' }
                ]
            }))
        },
        {
            title: 'Pending Requests',
            value: summary.pendingRequestsCount,
            total: summary.totalRequestsCount,
            color: 'yellow',
            onClick: () => setModalState(prev => ({
                ...prev,
                open: true,
                title: 'Pending Requests',
                url: route('dashboard.requests.pending'),
                columns: [
                    { header: 'Date', field: 'date', render: (item) => formatDate(item.date) },
                    { header: 'Sub Section', field: 'sub_section', render: (item) => item.sub_section?.name || 'N/A' },
                    { header: 'Shift', field: 'shift', render: (item) => item.shift?.name || 'N/A' },
                    { header: 'Amount', field: 'requested_amount' }
                ]
            }))
        },
        {
            title: 'Fulfilled Requests',
            value: summary.fulfilledRequestsCount,
            total: summary.totalRequestsCount,
            color: 'green',
            onClick: () => setModalState(prev => ({
                ...prev,
                open: true,
                title: 'Fulfilled Requests',
                url: route('dashboard.requests.fulfilled'),
                columns: [
                    { header: 'Date', field: 'date', render: (item) => formatDate(item.date) },
                    { header: 'Sub Section', field: 'sub_section', render: (item) => item.sub_section?.name || 'N/A' },
                    { header: 'Shift', field: 'shift', render: (item) => item.shift?.name || 'N/A' },
                    { header: 'Amount', field: 'requested_amount' }
                ]
            }))
        },
        {
            title: 'This Week Schedules',
            value: summary.thisWeekSchedulesCount,
            total: summary.totalSchedulesCount,
            color: 'blue',
            onClick: () => setModalState(prev => ({
                ...prev,
                open: true,
                title: 'Upcoming Schedules',
                url: route('dashboard.schedules.upcoming'),
                columns: [
                    { header: 'Date', field: 'date', render: (item) => formatDate(item.date) },
                    { header: 'Employee', field: 'employee', render: (item) => item.employee?.name || 'N/A' },
                    { header: 'Sub Section', field: 'sub_section', render: (item) => item.sub_section?.name || 'N/A' },
                    { header: 'Shift', field: 'shift', render: (item) => item.man_power_request?.shift?.name || 'N/A' }
                ]
            }))
        }
    ];

    return (
        <motion.div
            className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-2 md:grid-cols-4"
        >
            {cardData.map((card, index) => (
                <motion.div
                    key={index}
                    variants={cardVariants}
                    onClick={card.onClick}
                    whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                    whileTap={{ scale: 0.98 }}
                    className={`bg-white p-4 rounded-lg shadow cursor-pointer transition-all border-t-4 border-${card.color}-500`}
                >
                    <h3 className="text-sm font-medium text-gray-600">{card.title}</h3>
                    <div className="mt-2 flex items-baseline">
                        <span className={`text-2xl sm:text-3xl font-bold text-${card.color}-600`}>
                            {typeof card.value === 'number' ? card.value.toLocaleString() : 'N/A'}
                        </span>
                        <span className="ml-2 text-xs sm:text-sm text-gray-500">
                            / {typeof card.total === 'number' ? card.total.toLocaleString() : 'N/A'}
                        </span>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
};

export default SummaryCards;