import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import dayjs from 'dayjs';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ManpowerChart = ({ data, height, handleResize, setChartModalState, formatDate }) => {
    const getChartOptions = (onClick) => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    boxWidth: 12,
                    padding: 20,
                    usePointStyle: true
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
                animation: {
                    duration: 300
                },
                padding: 10,
                backgroundColor: 'rgba(0, 0, 0, 0.8)'
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    maxRotation: 45,
                    minRotation: 45
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0
                }
            }
        },
        animation: {
            duration: 1000,
            easing: 'easeOutQuart'
        },
        onClick,
        responsiveAnimationDuration: 0
    });

    const handleManpowerRequestBarClick = (datasetIndex, labelIndex) => {
        const monthLabel = data.labels[labelIndex];
        const status = datasetIndex === 0 ? 'pending' : 'fulfilled';
        const month = dayjs(monthLabel, 'MMM YYYY').format('YYYY-MM');

        setChartModalState(prev => ({
            ...prev,
            open: true,
            title: `Request Manpower - ${monthLabel} (${status === 'pending' ? 'Pending' : 'Fulfilled'})`,
            url: route('dashboard.requests.byMonth', { month, status }),
            columns: [
                {
                    header: 'Date',
                    field: 'date',
                    render: (item) => formatDate(item.date)
                },
                {
                    header: 'Sub Section',
                    field: 'sub_section',
                    render: (item) => item.sub_section?.name || 'N/A'
                },
                {
                    header: 'Shift',
                    field: 'shift',
                    render: (item) => item.shift?.name || 'N/A'
                },
                {
                    header: 'Amount',
                    field: 'requested_amount'
                }
            ]
        }));
    };

    return (
        <div className="w-full md:w-1/2 bg-white p-4 rounded-lg shadow relative">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Manpower Request Trends</h3>
            </div>
            <div 
                className="relative" 
                style={{ height: `${height}px` }}
            >
                {data.labels.length > 0 ? (
                    <Bar
                        data={data}
                        options={getChartOptions((e, elements) => {
                            if (elements.length) {
                                handleManpowerRequestBarClick(elements[0].datasetIndex, elements[0].index);
                            }
                        })}
                        redraw={true}
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        No data available for selected date range
                    </div>
                )}
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

export default ManpowerChart;