import React, { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement // Required for Doughnut charts
} from 'chart.js';
import dayjs from 'dayjs';

// Register all required components for both Bar and Doughnut charts
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const ManpowerChart = ({ data, height, handleResize, setChartModalState, formatDate, fetchModalData }) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

    // Effect to update isMobile state on window resize
    useEffect(() => {
        const handleWindowResize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        window.addEventListener('resize', handleWindowResize);
        return () => window.removeEventListener('resize', handleWindowResize);
    }, []);

    // Options for the Bar Chart (desktop view)
    const getBarChartOptions = (onClick) => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    boxWidth: 12,
                    padding: 20,
                    usePointStyle: true,
                    color: 'rgba(55, 65, 81, 1)',
                }
            },
            tooltip: {
                callbacks: {
                    label: ctx => `${ctx.dataset.label}: ${ctx.raw}`,
                    title: ctx => {
                        const label = ctx[0].label;
                        if (label.includes('Week')) {
                            return label;
                        }
                        return dayjs(label).isValid()
                            ? dayjs(label).format('DD MMM YYYY')
                            : label;
                    }
                },
                animation: { duration: 300 },
                padding: 10,
                backgroundColor: 'rgba(0, 0, 0, 0.8)'
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: {
                    maxRotation: 45,
                    minRotation: 45,
                    color: 'rgba(107, 114, 128, 1)'
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0,
                    color: 'rgba(107, 114, 128, 1)'
                }
            }
        },
        animation: {
            duration: 1000,
            easing: 'easeOutQuart'
        },
        onClick,
        responsiveAnimationDuration: 0,
        layout: {
            padding: { top: 20, right: 20, bottom: 20, left: 20 }
        }
    });

    // Options for the Doughnut Chart (mobile view)
    const getDoughnutChartOptions = (onClick) => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom', // Move legend to bottom for mobile
                labels: {
                    boxWidth: 12,
                    padding: 20,
                    usePointStyle: true,
                    color: 'rgba(55, 65, 81, 1)',
                    font: {
                        size: 10 // Smaller font size for mobile legend
                    }
                },
                align: 'center', // Center align legend items
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.chart.data.datasets[0].data.reduce((acc, curr) => acc + curr, 0);
                        const percentage = ((value / total) * 100).toFixed(2);
                        return `${label}: ${value} (${percentage}%)`;
                    },
                },
                padding: 10,
                backgroundColor: 'rgba(0, 0, 0, 0.8)'
            },
            title: {
                display: true,
                text: 'Overall Manpower Requests', // Title for Doughnut chart
                font: {
                    size: 16
                },
                color: 'rgba(55, 65, 81, 1)',
            }
        },
        onClick,
        animation: {
            animateScale: true,
            animateRotate: true
        }
    });

    // Function to transform bar chart data into doughnut chart data
    const getDoughnutData = () => {
        if (!data || !data.datasets || data.datasets.length === 0) {
            return { labels: [], datasets: [] };
        }

        // Calculate total pending and fulfilled requests across all months
        const pendingTotal = data.datasets[0]?.data.reduce((sum, val) => sum + val, 0) || 0;
        const fulfilledTotal = data.datasets[1]?.data.reduce((sum, val) => sum + val, 0) || 0;

        return {
            labels: ['Pending', 'Fulfilled'],
            datasets: [
                {
                    label: 'Manpower Requests',
                    data: [pendingTotal, fulfilledTotal],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)', // Color for Pending
                        'rgba(54, 162, 235, 0.8)', // Color for Fulfilled
                    ],
                    borderColor: 'rgba(255, 255, 255, 1)',
                    borderWidth: 2,
                    hoverOffset: 4
                }
            ]
        };
    };

    // Unified click handler for both chart types
    const handleChartClick = async (elements) => {
        if (elements.length > 0) {
            const elementIndex = elements[0].index;

            if (isMobile) {
                // Doughnut chart click: based on status (Pending/Fulfilled)
                const status = elementIndex === 0 ? 'pending' : 'fulfilled';
                const url = route('dashboard.requests.byStatus', { status }); // Assuming a new route for overall status
                
                const fetchedData = await fetchModalData(url);

                setChartModalState(prev => ({
                    ...prev,
                    open: true,
                    title: `Manpower Requests - ${status === 'pending' ? 'Pending' : 'Fulfilled'}`,
                    url: url,
                    data: fetchedData,
                    columns: [
                        { header: 'Date', field: 'date', render: (item) => formatDate(item.date) },
                        { header: 'Sub Section', field: 'sub_section', render: (item) => item.sub_section?.name || 'N/A' },
                        { header: 'Shift', field: 'shift', render: (item) => item.shift?.name || 'N/A' },
                        { header: 'Amount', field: 'requested_amount' }
                    ]
                }));

            } else {
                // Bar chart click: original logic based on month and status
                const monthLabel = data.labels[elementIndex];
                const status = elements[0].datasetIndex === 0 ? 'pending' : 'fulfilled';
                const month = dayjs(monthLabel, 'MMM YYYY').format('YYYY-MM');
                const url = route('dashboard.requests.byMonth', { month, status });

                const fetchedData = await fetchModalData(url);

                setChartModalState(prev => ({
                    ...prev,
                    open: true,
                    title: `Request Manpower - ${monthLabel} (${status === 'pending' ? 'Pending' : 'Fulfilled'})`,
                    url: url,
                    data: fetchedData,
                    columns: [
                        { header: 'Date', field: 'date', render: (item) => formatDate(item.date) },
                        { header: 'Sub Section', field: 'sub_section', render: (item) => item.sub_section?.name || 'N/A' },
                        { header: 'Shift', field: 'shift', render: (item) => item.shift?.name || 'N/A' },
                        { header: 'Amount', field: 'requested_amount' }
                    ]
                }));
            }
        }
    };

    return (
        <div className="w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/30 dark:border-gray-600/30 p-4 sm:p-6 relative transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Manpower Request Trends</h3>
            </div>
            <div
                className="relative"
                style={{
                    height: `${height}px`,
                    minHeight: isMobile ? '400px' : '300px' // Increased min-height for mobile doughnut
                }}
            >
                {data.labels.length > 0 && data.datasets.some(dataset => dataset.data.length > 0) ? (
                    isMobile ? (
                        <Doughnut
                            data={getDoughnutData()}
                            options={getDoughnutChartOptions((e, elements) => {
                                if (elements.length) {
                                    handleChartClick(elements);
                                }
                            })}
                        />
                    ) : (
                        <Bar
                            data={data}
                            options={getBarChartOptions((e, elements) => {
                                if (elements.length) {
                                    handleChartClick(elements);
                                }
                            })}
                            redraw={true}
                        />
                    )
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                        No data available for selected date range
                    </div>
                )}
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

export default ManpowerChart;