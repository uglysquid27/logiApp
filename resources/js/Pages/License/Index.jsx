import React, { useState, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function LicenseDateExtractor() {
    const { auth } = usePage().props;
    const [image, setImage] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [expiryDate, setExpiryDate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [debugInfo, setDebugInfo] = useState({});
    const [attemptCount, setAttemptCount] = useState(0);
    const [showManualInput, setShowManualInput] = useState(false);
    const [manualDate, setManualDate] = useState('');
    const fileInputRef = useRef(null);

    // Enhanced patterns for both registration number and expiry date
    const regNumberPattern = /Reg:\s*([A-Z0-9\/-]+)/i;
    const datePatterns = [
        /Berlaku\s*(?:s\/d|s\.d|s\sd|\d+)?\s*(\d{1,2}\s*[A-Z]+\s*\d{4})/i,
        /(\d{1,2}\s*[A-Z]+\s*20[2-9][0-9])\s*$/im,
        /Expire?d?:\s*(\d{1,2}\s*[A-Z]+\s*\d{4})/i,
        /(\d{1,2}\s*[-/]\s*\d{1,2}\s*[-/]\s*20[2-9][0-9])/
    ];

    // Reset state when new image is uploaded
    const resetState = () => {
        setExpiryDate(null);
        setDebugInfo({});
        setAttemptCount(0);
        setShowManualInput(false);
        setManualDate('');
    };

    const enhanceImage = (imageUrl) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const scaleFactor = 2;
                canvas.width = img.width * scaleFactor;
                canvas.height = img.height * scaleFactor;
                
                ctx.filter = 'contrast(1.3) brightness(1.1) saturate(1.2)';
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                const enhancedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
                resolve(enhancedImageUrl);
            };
            img.src = imageUrl;
        });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        resetState();
        const imageUrl = URL.createObjectURL(file);
        setImage(imageUrl);
        
        setDebugInfo({ status: 'Enhancing image...' });
        const enhancedUrl = await enhanceImage(imageUrl);
        setProcessedImage(enhancedUrl);
        setDebugInfo(prev => ({ ...prev, status: 'Image enhanced, ready for OCR' }));
    };

    const extractRegistrationYear = (text) => {
        const match = text.match(regNumberPattern);
        if (!match) return null;

        const regNumber = match[1];
        // Extract year from formats like: 0004200922/A-0FK2/35/1X/2022
        const yearMatch = regNumber.match(/(?:^|\/)(20\d{2})(?:\/|$)/);
        return yearMatch ? parseInt(yearMatch[1]) : null;
    };

    const calculateExpiryFromRegYear = (regYear) => {
        return regYear ? `${regYear + 5}-12-31` : null; // Default to end of year +5
    };

    // Add this near the top of your component, with other constants
const monthNames = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 
                   'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];

const extractExpiryDate = async () => {
    if (!processedImage || attemptCount >= 3) return;

    setLoading(true);
    setAttemptCount(prev => prev + 1);
    setDebugInfo(prev => ({ ...prev, status: `OCR attempt ${attemptCount + 1} of 3...` }));

    try {
        const { data: { text } } = await Tesseract.recognize(
            processedImage,
            'ind',
            {
                logger: m => setDebugInfo(prev => ({ ...prev, status: m.status })),
                tessedit_pageseg_mode: 6,
                tessedit_char_whitelist: '01234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ/- ',
            }
        );

        const regYear = extractRegistrationYear(text);
        setDebugInfo(prev => ({
            ...prev,
            rawText: text,
            regYear: regYear,
            status: `Found registration year: ${regYear || 'Not detected'}`
        }));

        // Try to extract expiry date from text
        let extractedDate = null;
        let extractedDayMonth = null;
        let extractedYear = null;
        
        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
                extractedDate = match[1].replace(/\s+/g, ' ').trim();
                
                // Parse the full date
                const parsedDate = parseExtractedDate(extractedDate);
                if (parsedDate) {
                    extractedYear = parsedDate.getFullYear();
                    // Save just the day and month portion (without year)
                    extractedDayMonth = `${parsedDate.getDate()} ${monthNames[parsedDate.getMonth()]}`;
                }
                break;
            }
        }

        // Calculate expected expiry year (registration year + 5)
        const expectedExpiryYear = regYear ? regYear + 5 : null;

        // Determine the final expiry date
        let finalExpiryDate = null;
        let decisionReason = '';

        if (extractedDate) {
            if (extractedYear === expectedExpiryYear) {
                // Perfect match - use the exact extracted date
                finalExpiryDate = extractedDate;
                decisionReason = 'Using exact extracted date (year matches registration year +5)';
            } else if (extractedYear && expectedExpiryYear && Math.abs(extractedYear - expectedExpiryYear) <= 1) {
                // Year is close - use extracted day/month but correct the year
                finalExpiryDate = `${extractedDayMonth} ${expectedExpiryYear}`;
                decisionReason = `Adjusted year of extracted date (${extractedYear}→${expectedExpiryYear})`;
            } else if (extractedDayMonth && expectedExpiryYear) {
                // Use the extracted day/month with corrected year
                finalExpiryDate = `${extractedDayMonth} ${expectedExpiryYear}`;
                decisionReason = `Using extracted day/month with registration year +5 (${expectedExpiryYear})`;
            } else if (expectedExpiryYear) {
                // Fallback to end of expected year
                finalExpiryDate = `31 DESEMBER ${expectedExpiryYear}`;
                decisionReason = `Using registration year +5 (${expectedExpiryYear}) with default end-of-year date`;
            }
        } else if (expectedExpiryYear) {
            // No date extracted - use end of expected year
            finalExpiryDate = `31 DESEMBER ${expectedExpiryYear}`;
            decisionReason = `No date extracted - using registration year +5 (${expectedExpiryYear})`;
        }

        if (finalExpiryDate) {
            setExpiryDate(finalExpiryDate);
            setDebugInfo(prev => ({
                ...prev,
                status: decisionReason,
                processedDate: finalExpiryDate,
                warning: extractedYear && extractedYear !== expectedExpiryYear ? 
                    `Original extracted year (${extractedYear}) was adjusted to match registration year +5` : ''
            }));
        } else if (attemptCount >= 2) {
            setShowManualInput(true);
            setDebugInfo(prev => ({
                ...prev,
                status: 'Failed to detect after 3 attempts. Please enter manually.',
                error: 'Automatic detection failed'
            }));
        } else {
            setDebugInfo(prev => ({
                ...prev,
                status: 'No valid date found. Try again with better image.',
                error: 'Detection failed'
            }));
        }
    } catch (error) {
        setDebugInfo(prev => ({
            ...prev,
            status: 'OCR processing failed',
            error: error.message
        }));
    } finally {
        setLoading(false);
    }
};

// Helper function to parse dates in Indonesian format
const parseExtractedDate = (dateStr) => {
    // Try format like "19 SEPTEMBER 2025"
    const parts = dateStr.split(/\s+/);
    if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = monthNames.indexOf(parts[1].toUpperCase());
        const year = parseInt(parts[2]);
        
        if (!isNaN(day) && month >= 0 && !isNaN(year)) {
            return new Date(year, month, day);
        }
    }
    
    // Try format like "19-09-2025" or "19/09/2025"
    const dashParts = dateStr.split(/[-/]/);
    if (dashParts.length === 3) {
        const day = parseInt(dashParts[0]);
        const month = parseInt(dashParts[1]) - 1;
        const year = parseInt(dashParts[2]);
        
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            return new Date(year, month, day);
        }
    }
    
    return null;
};

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (manualDate) {
            setExpiryDate(manualDate);
            setDebugInfo(prev => ({
                ...prev,
                status: 'Using manually entered date',
                processedDate: manualDate
            }));
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    // Format date for display
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        
        // Try to parse different date formats
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            // If not ISO format, return as-is (might be "20 SEPTEMBER 2025")
            return dateStr;
        }
        
        return date.toLocaleDateString('en-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).toUpperCase();
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">License Date Extractor</h2>}
        >
            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            <div className="mb-6">
                                <h1 className="text-2xl font-bold mb-2">Extract License Expiry Date</h1>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Upload a license image to extract the expiry date (automatic fallback to Reg Year +5)
                                </p>
                            </div>

                            {/* Upload Section */}
                            <div className="mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    accept="image/*"
                                    className="hidden"
                                />
                                
                                <button
                                    onClick={triggerFileInput}
                                    className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150 mb-4"
                                >
                                    Upload License Image
                                </button>
                                
                                {image && (
                                    <div className="mt-4 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Original Image:</h4>
                                                <img 
                                                    src={image} 
                                                    alt="Original license" 
                                                    className="w-full h-auto border border-gray-300 rounded-lg"
                                                />
                                            </div>
                                            {processedImage && (
                                                <div>
                                                    <h4 className="text-sm font-medium mb-2">Enhanced Image:</h4>
                                                    <img 
                                                        src={processedImage} 
                                                        alt="Enhanced license" 
                                                        className="w-full h-auto border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        
                                        {!showManualInput && (
                                            <button
                                                onClick={extractExpiryDate}
                                                disabled={loading || !processedImage}
                                                className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 focus:bg-green-700 active:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50"
                                            >
                                                {loading ? (
                                                    <span className="flex items-center">
                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Processing...
                                                    </span>
                                                ) : 'Extract Expiry Date'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Manual Input Fallback */}
                            {showManualInput && (
                                <div className="mb-6 bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
                                    <h3 className="text-lg font-medium mb-2 text-yellow-800 dark:text-yellow-200">
                                        Manual Date Entry Required
                                    </h3>
                                    <form onSubmit={handleManualSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Expiry Date
                                            </label>
                                            <input
                                                type="date"
                                                value={manualDate}
                                                onChange={(e) => setManualDate(e.target.value)}
                                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600"
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                        >
                                            Submit Manual Date
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Results Section */}
                            {expiryDate && (
                                <div className="mt-6 bg-green-50 dark:bg-green-900 p-4 rounded-lg border border-green-200 dark:border-green-700">
                                    <h3 className="text-lg font-medium mb-2 text-green-800 dark:text-green-200">
                                        License Expiry Date
                                    </h3>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-300">
                                        {formatDate(expiryDate)}
                                    </p>
                                    {debugInfo.regYear && (
                                        <p className="mt-2 text-sm text-green-700 dark:text-green-200">
                                            Based on registration year: {debugInfo.regYear}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Debug Information */}
                            <div className="mt-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <h3 className="text-lg font-medium mb-2">Processing Details</h3>
                                
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                                    <p className={`text-sm ${
                                        debugInfo.error ? 'text-red-600' : 
                                        expiryDate ? 'text-green-600' : 'text-gray-700 dark:text-gray-300'
                                    }`}>
                                        {debugInfo.status || 'Waiting for image...'}
                                    </p>

                                    {debugInfo.regYear !== undefined && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Registration Year</p>
                                            <p className="text-sm">{debugInfo.regYear || 'Not detected'}</p>
                                        </div>
                                    )}

                                    {debugInfo.rawText && (
                                        <details className="mt-2">
                                            <summary className="text-sm font-medium cursor-pointer">Show OCR Raw Text</summary>
                                            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded mt-2 overflow-auto max-h-40">
                                                {debugInfo.rawText}
                                            </pre>
                                        </details>
                                    )}

                                    {debugInfo.error && (
                                        <div className="mt-2 p-3 bg-red-50 dark:bg-red-900 rounded border border-red-200 dark:border-red-700">
                                            <p className="text-sm font-medium text-red-600 dark:text-red-200">Error:</p>
                                            <p className="text-sm text-red-500 dark:text-red-300">{debugInfo.error}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}