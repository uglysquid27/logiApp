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

const EmployeeChart = ({ 
    data, 
    height, 
    handleResize, 
    setChartModalState, 
    sections, 
    filters, 
    setFilters,
    formatDate,
    fetchModalData, // Added fetchModalData
    applyFilters // Added applyFilters
}) => {
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

    const handleEmployeeAssignmentBarClick = async (labelIndex) => { // Made async
        const subSectionId = data.subSectionIds?.[labelIndex];
        const subSectionName = data.labels[labelIndex];

        const params = new URLSearchParams();
        params.append('filter_date_from', filters.dateRange.from);
        params.append('filter_date_to', filters.dateRange.to);

        const url = `${route('dashboard.schedules.bySubSection', { subSectionId })}?${params.toString()}`;

        // Fetch data before opening modal
        const fetchedData = await fetchModalData(url); // Use the passed-down fetchModalData

        setChartModalState(prev => ({
            ...prev,
            open: true,
            title: `Employee Assignments - ${subSectionName}`,
            url: url,
            data: fetchedData, // Set the fetched data here
            columns: [
                { header: 'Date', field: 'date', render: formatDate },
                { header: 'Employee', field: 'employee', render: (item) => item.employee?.name || 'N/A' },
                { header: 'Section', field: 'subSection', render: (item) => item.subSection?.section?.name || 'N/A' },
                { header: 'Sub Section', field: 'subSection', render: (item) => item.subSection?.name || 'N/A' },
                { header: 'Shift', field: 'shift', render: (item) => item.man_power_request?.shift?.name || 'N/A' }
            ]
        }));
    };

    return (
        <div className="w-full md:w-1/2 bg-white p-4 rounded-lg shadow relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <h3 className="text-lg font-medium whitespace-nowrap">Employee Assignments</h3>
                <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
                    <select
                        value={filters.section || ''}
                        onChange={(e) => {
                            const newSection = e.target.value || null;
                            setFilters(prev => ({
                                ...prev,
                                section: newSection
                            }));
                            // Immediately apply filter when section changes to update chart data
                            // The `applyFilters` function in Dashboard.jsx will handle the fetch
                            applyFilters('employeeAssignments'); 
                        }}
                        className="border rounded px-2 py-1 text-sm min-w-[150px] h-[34px]"
                    >
                        <option value="">All Sections</option>
                        {sections?.map(section => (
                            <option key={section.id} value={section.id}>
                                {section.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div 
                className="relative" 
                style={{ height: `${height}px` }}
            >
                {data.labels.length > 0 && data.datasets.some(dataset => dataset.data.length > 0) ? ( 
                    <Bar
                        data={data}
                        options={getChartOptions((e, elements) => {
                            if (elements.length) {
                                handleEmployeeAssignmentBarClick(elements[0].index);
                            }
                        })}
                        redraw={true}
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        No data available for selected filters
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

export default EmployeeChart;