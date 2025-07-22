import React, { useState, useRef } from 'react';
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

    // Patterns for extraction
    const regNumberPattern = /Reg:\s*([A-Z0-9\/-]+)/i;
    const datePatterns = [
        /Berlaku\s*s\/d\s*(\d{1,2}\s*[A-Z]+\s*\d{4})/i,  // "Berlaku s/d 20 SEPTEMBER 2027"
        /Berlaku\s*(\d{1,2}\s*[A-Z]+\s*\d{4})/i,          // "Berlaku 20 SEPTEMBER 2027"
        /(\d{1,2}\s*[A-Z]+\s*20[2-9][0-9])\s*$/im         // Standalone dates
    ];

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const enhanceImage = (imageUrl) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Increase resolution and enhance contrast
                const scaleFactor = 2;
                canvas.width = img.width * scaleFactor;
                canvas.height = img.height * scaleFactor;
                
                ctx.filter = 'contrast(1.4) brightness(1.1)';
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Convert to grayscale for better OCR
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = avg;     // R
                    data[i + 1] = avg;  // G
                    data[i + 2] = avg;  // B
                }
                ctx.putImageData(imageData, 0, 0);
                
                const enhancedImageUrl = canvas.toDataURL('image/jpeg', 0.85);
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

    const resetState = () => {
        setExpiryDate(null);
        setDebugInfo({});
        setAttemptCount(0);
        setShowManualInput(false);
        setManualDate('');
    };

    const extractRegistrationYear = (text) => {
        const match = text.match(regNumberPattern);
        if (!match) return null;

        // Extract year from formats like: 0004200922/A-0FK2/35/1X/2022
        const yearMatch = match[1].match(/(?:^|\/)(20\d{2})(?:\/|$)/);
        return yearMatch ? parseInt(yearMatch[1]) : null;
    };

    const extractExpiryDateFromText = (text) => {
        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1]
                    .replace(/\s+/g, ' ')
                    .replace(/(\d)([A-Z])/g, '$1 $2')
                    .replace(/([A-Z])(\d)/g, '$1 $2')
                    .trim();
            }
        }
        return null;
    };

    const validateExpiryDate = (expiryDate, regYear) => {
        if (!expiryDate || !regYear) return false;
        
        const yearMatch = expiryDate.match(/(20\d{2})/);
        if (!yearMatch) return false;
        
        const expiryYear = parseInt(yearMatch[1]);
        return expiryYear === regYear + 5;
    };

    const extractLicenseData = async () => {
        if (!processedImage || attemptCount >= 3) return;

        setLoading(true);
        setAttemptCount(prev => prev + 1);
        setDebugInfo(prev => ({ ...prev, status: `Processing attempt ${attemptCount + 1} of 3` }));

        try {
            const { data: { text } } = await Tesseract.recognize(
                processedImage,
                'ind',
                {
                    logger: m => setDebugInfo(prev => ({ ...prev, status: m.status })),
                    tessedit_pageseg_mode: 6,
                    tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ/- ',
                    preserve_interword_spaces: 1
                }
            );

            const regYear = extractRegistrationYear(text);
            const extractedDate = extractExpiryDateFromText(text);
            
            setDebugInfo(prev => ({
                ...prev,
                rawText: text,
                regYear: regYear,
                extractedDate: extractedDate,
                status: `Found registration year: ${regYear}, extracted date: ${extractedDate || 'None'}`
            }));

            // First check if extracted date is exactly 5 years after registration year
            if (extractedDate && regYear && validateExpiryDate(extractedDate, regYear)) {
                setExpiryDate(extractedDate);
                setDebugInfo(prev => ({
                    ...prev,
                    status: 'Valid 5-year expiry date found',
                    processedDate: extractedDate
                }));
                return;
            }

            // If we have a registration year but no valid expiry date, calculate it
            if (regYear) {
                const calculatedDate = `31 DECEMBER ${regYear + 5}`;
                setExpiryDate(calculatedDate);
                setDebugInfo(prev => ({
                    ...prev,
                    status: `Using registration year +5 (${regYear} → ${regYear + 5})`,
                    processedDate: calculatedDate
                }));
                return;
            }

            // If we have an extracted date but no registration year
            if (extractedDate) {
                setExpiryDate(extractedDate);
                setDebugInfo(prev => ({
                    ...prev,
                    status: 'Using extracted date (no registration year found)',
                    processedDate: extractedDate
                }));
                return;
            }

            // Final fallback
            if (attemptCount >= 2) {
                setShowManualInput(true);
                setDebugInfo(prev => ({
                    ...prev,
                    status: 'Automatic detection failed after 3 attempts',
                    error: 'Please enter date manually'
                }));
            } else {
                setDebugInfo(prev => ({
                    ...prev,
                    status: 'No valid date found. Try again with better image quality.',
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
                                    Upload a license image to accurately detect the 5-year expiry period
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
                                                onClick={extractLicenseData}
                                                disabled={loading}
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
                                        Manual Date Entry
                                    </h3>
                                    <form onSubmit={handleManualSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Expiry Date (Format: DD MMMM YYYY)
                                            </label>
                                            <input
                                                type="text"
                                                value={manualDate}
                                                onChange={(e) => setManualDate(e.target.value.toUpperCase())}
                                                placeholder="e.g. 20 SEPTEMBER 2027"
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
                                        {expiryDate}
                                    </p>
                                    {debugInfo.regYear && (
                                        <p className="mt-2 text-sm text-green-700 dark:text-green-200">
                                            Registration Year: {debugInfo.regYear} (Valid for 5 years until {debugInfo.regYear + 5})
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Debug Information */}
                            <div className="mt-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <h3 className="text-lg font-medium mb-2">Processing Information</h3>
                                
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                                        <p className={`text-sm ${
                                            debugInfo.error ? 'text-red-600' : 
                                            expiryDate ? 'text-green-600' : 'text-gray-700 dark:text-gray-300'
                                        }`}>
                                            {debugInfo.status || 'Waiting for image...'}
                                        </p>
                                    </div>

                                    {debugInfo.regYear !== undefined && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Registration Year</p>
                                            <p className="text-sm">{debugInfo.regYear || 'Not detected'}</p>
                                        </div>
                                    )}

                                    {debugInfo.extractedDate !== undefined && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Extracted Date</p>
                                            <p className="text-sm">{debugInfo.extractedDate || 'Not detected'}</p>
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
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}