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
    ArcElement
} from 'chart.js';
import dayjs from 'dayjs';

// Register all required components for both Bar and Doughnut charts
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const EmployeeChart = ({
    data,
    height,
    handleResize,
    setChartModalState,
    sections,
    filters,
    setFilters,
    formatDate,
    fetchModalData,
    applyFilters
}) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
                },
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
                    color: 'rgba(107, 114, 128, 1)',
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0,
                    color: 'rgba(107, 114, 128, 1)',
                },
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

    const getDoughnutChartOptions = (onClick) => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    boxWidth: 12,
                    padding: 20,
                    usePointStyle: true,
                    color: 'rgba(55, 65, 81, 1)',
                    font: {
                        size: 10
                    }
                },
                align: 'center',
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
                text: 'Overall Employee Assignments',
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

        const labels = sections.map(s => s.name);
        const counts = sections.map(s => {
            const sectionJobs = data.labels.filter(label => label.includes(s.name));
            return sectionJobs.reduce((sum, label) => {
                const index = data.labels.indexOf(label);
                return sum + data.datasets[0].data[index];
            }, 0);
        });

        const backgroundColors = [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
        ];

        return {
            labels: labels,
            datasets: [
                {
                    label: 'Assigned Employees',
                    data: counts,
                    backgroundColor: backgroundColors.slice(0, labels.length),
                    borderColor: 'rgba(255, 255, 255, 1)',
                    borderWidth: 2,
                    hoverOffset: 4
                }
            ]
        };
    };

    const handleChartClick = async (elements) => {
        if (elements.length > 0) {
            const elementIndex = elements[0].index;
            const label = isMobile ? getDoughnutData().labels[elementIndex] : data.labels[elementIndex];

            // Logic to handle click for both bar and doughnut charts
            if (isMobile) {
                // For doughnut chart, open modal with filtered data for the clicked section
                const sectionId = sections.find(s => s.name === label)?.id;
                if (sectionId) {
                    const params = new URLSearchParams();
                    params.append('filter_date_from', filters.dateRange.from);
                    params.append('filter_date_to', filters.dateRange.to);
                    params.append('filter_section', sectionId);

                    const url = `${route('dashboard.schedules.bySection', { sectionId })}?${params.toString()}`;
                    const fetchedData = await fetchModalData(url);

                    setChartModalState(prev => ({
                        ...prev,
                        open: true,
                        title: `Employee Assignments - ${label}`,
                        url: url,
                        data: fetchedData,
                        columns: [
                            { header: 'Date', field: 'date', render: formatDate },
                            { header: 'Employee', field: 'employee', render: (item) => item.employee?.name || 'N/A' },
                            { header: 'Section', field: 'subSection', render: (item) => item.subSection?.section?.name || 'N/A' },
                            { header: 'Sub Section', field: 'subSection', render: (item) => item.subSection?.name || 'N/A' },
                            { header: 'Shift', field: 'shift', render: (item) => item.man_power_request?.shift?.name || 'N/A' }
                        ]
                    }));
                }
            } else {
                // Original bar chart click logic
                const subSectionId = data.subSectionIds?.[elementIndex];
                const subSectionName = data.labels[elementIndex];
                const params = new URLSearchParams();
                params.append('filter_date_from', filters.dateRange.from);
                params.append('filter_date_to', filters.dateRange.to);
                const url = `${route('dashboard.schedules.bySubSection', { subSectionId })}?${params.toString()}`;
                const fetchedData = await fetchModalData(url);

                setChartModalState(prev => ({
                    ...prev,
                    open: true,
                    title: `Employee Assignments - ${subSectionName}`,
                    url: url,
                    data: fetchedData,
                    columns: [
                        { header: 'Date', field: 'date', render: formatDate },
                        { header: 'Employee', field: 'employee', render: (item) => item.employee?.name || 'N/A' },
                        { header: 'Section', field: 'subSection', render: (item) => item.subSection?.section?.name || 'N/A' },
                        { header: 'Sub Section', field: 'subSection', render: (item) => item.subSection?.name || 'N/A' },
                        { header: 'Shift', field: 'shift', render: (item) => item.man_power_request?.shift?.name || 'N/A' }
                    ]
                }));
            }
        }
    };

    return (
        <div className="w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/30 dark:border-gray-600/30 p-4 sm:p-6 relative transition-all duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <h3 className="text-lg font-medium whitespace-nowrap text-gray-800 dark:text-gray-100">Employee Assignments</h3>
                <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
                    {!isMobile && (
                        <select
                            value={filters.section || ''}
                            onChange={(e) => {
                                const newSection = e.target.value || null;
                                setFilters(prev => ({
                                    ...prev,
                                    section: newSection
                                }));
                                applyFilters('employeeAssignments');
                            }}
                            className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 w-full md:w-auto"
                        >
                            <option value="">All Sections</option>
                            {sections?.map(section => (
                                <option key={section.id} value={section.id}>
                                    {section.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>
            <div
                className="relative"
                style={{
                    height: `${height}px`,
                    minHeight: isMobile ? '400px' : '300px'
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
                    <div className="h-full flex items-center justify-center text-gray-500">
                        No data available for selected filters
                    </div>
                )}
            </div>
            <div className="mt-4">
                <label className="text-xs text-gray-500 dark:text-gray-400">Adjust Height:</label>
                <input
                    type="range"
                    min="300"
                    max="800"
                    value={height}
                    onChange={handleResize}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
            </div>
        </div>
    );
};

export default EmployeeChart;