import React, { useState, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function LicenseDateExtractor() {
    const { auth } = usePage().props;
    const [image, setImage] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [expiryDate, setExpiryDate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [debugInfo, setDebugInfo] = useState({});
    const [attemptCount, setAttemptCount] = useState(0);
    const [showManualInput, setShowManualInput] = useState(false);
    const [manualDate, setManualDate] = useState('');
    const [isMobile, setIsMobile] = useState(false);
    const [showUploadOptions, setShowUploadOptions] = useState(false);
    const fileInputRef = useRef(null);
    const galleryInputRef = useRef(null);

    // Check if user is on mobile device
    useEffect(() => {
        const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        setIsMobile(mobileCheck);
        setShowUploadOptions(mobileCheck);
    }, []);

    // Patterns for extraction
    const regNumberPattern = /Reg:\s*([A-Z0-9\/-]+)/i;
    const datePatterns = [
        /Berlaku\s*s\/d\s*:\s*(\d{1,2}\s*[A-Z]+\s*\d{4})/i,
        /Berlaku\s*s\/d\s*(\d{1,2}\s*[A-Z]+\s*\d{4})/i,
        /Berlaku\s*(\d{1,2}\s*[A-Z]+\s*\d{4})/i,
        /(\d{1,2}\s*[A-Z]+\s*20[2-9][0-9])\s*$/im
    ];

    const resetState = () => {
        setExpiryDate(null);
        setDebugInfo({});
        setAttemptCount(0);
        setShowManualInput(false);
        setManualDate('');
    };

    const triggerFileInput = (type) => {
        if (type === 'camera') {
            fileInputRef.current.click();
        } else {
            galleryInputRef.current.click();
        }
    };

    const fixImageOrientation = (file) => {
        return new Promise((resolve) => {
            const img = new Image();
            const reader = new FileReader();
            
            reader.onload = (e) => {
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    ctx.drawImage(img, 0, 0);
                    
                    const correctedUrl = canvas.toDataURL('image/jpeg', 0.9);
                    resolve(correctedUrl);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    const enhanceImage = (imageUrl) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const scaleFactor = isMobile ? 2.5 : 2;
                canvas.width = img.width * scaleFactor;
                canvas.height = img.height * scaleFactor;
                
                ctx.filter = 'contrast(1.5) brightness(1.2) grayscale(100%)';
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                if (isMobile) {
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    
                    for (let i = 0; i < data.length; i += 4) {
                        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                        const threshold = 180;
                        const value = avg > threshold ? 255 : 0;
                        
                        data[i] = value;
                        data[i + 1] = value;
                        data[i + 2] = value;
                    }
                    ctx.putImageData(imageData, 0, 0);
                }
                
                const enhancedImageUrl = canvas.toDataURL('image/jpeg', isMobile ? 0.9 : 0.85);
                resolve(enhancedImageUrl);
            };
            img.src = imageUrl;
        });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setDebugInfo({ error: 'File size too large (max 5MB)' });
            return;
        }

        resetState();
        setImageLoading(true);
        
        try {
            const imageUrl = await fixImageOrientation(file);
            setImage(imageUrl);
            
            setDebugInfo({ status: 'Enhancing image...' });
            const enhancedUrl = await enhanceImage(imageUrl);
            setProcessedImage(enhancedUrl);
            setDebugInfo(prev => ({ ...prev, status: 'Image enhanced, ready for OCR' }));
        } catch (error) {
            console.error('Error processing image:', error);
            setDebugInfo(prev => ({ ...prev, status: 'Image processing failed', error: error.message }));
        } finally {
            setImageLoading(false);
        }
    };

    const extractRegistrationYear = (text) => {
        const match = text.match(regNumberPattern);
        if (!match) return null;

        const yearMatch = match[1].match(/(?:^|\/)(20\d{2})(?:\/|$)/);
        return yearMatch ? parseInt(yearMatch[1]) : null;
    };

    const extractExpiryDateFromText = (text) => {
        let cleanedText = text;
        
        if (isMobile) {
            cleanedText = cleanedText
                .replace(/[^a-zA-Z0-9\s\/\-:]/g, ' ')
                .replace(/\s+/g, ' ')
                .replace(/(\d)([A-Za-z])/g, '$1 $2')
                .replace(/([A-Za-z])(\d)/g, '$1 $2');
        }

        for (const pattern of datePatterns) {
            const match = cleanedText.match(pattern);
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
                    tessedit_pageseg_mode: isMobile ? 11 : 6,
                    tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ/- ',
                    preserve_interword_spaces: 1,
                    tessedit_ocr_engine_mode: isMobile ? 1 : 3,
                    user_defined_dpi: isMobile ? '300' : '200'
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

            if (extractedDate) {
                const dateParts = extractedDate.split(' ');
                if (dateParts.length === 3) {
                    const months = {
                        'JANUARI': 0, 'JAN': 0, 'FEBRUARI': 1, 'FEB': 1, 'MARET': 2, 'MAR': 2,
                        'APRIL': 3, 'APR': 3, 'MEI': 4, 'MAY': 4, 'JUNI': 5, 'JUN': 5,
                        'JULI': 6, 'JUL': 6, 'AGUSTUS': 7, 'AUG': 7, 'SEPTEMBER': 8, 'SEP': 8,
                        'OKTOBER': 9, 'OKT': 9, 'NOVEMBER': 10, 'NOV': 10, 'DESEMBER': 11, 'DEC': 11
                    };
                    
                    const day = parseInt(dateParts[0]);
                    const month = months[dateParts[1].toUpperCase()];
                    const year = parseInt(dateParts[2]);
                    
                    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                        const extractedDateObj = new Date(year, month, day);
                        const today = new Date();
                        
                        if (extractedDateObj > today) {
                            setExpiryDate(extractedDate);
                            setDebugInfo(prev => ({
                                ...prev,
                                status: 'Using valid extracted expiry date',
                                processedDate: extractedDate
                            }));
                            return;
                        }
                    }
                }
            }

            if (regYear) {
                if (extractedDate) {
                    const extractedYear = extractedDate.match(/(20\d{2})/);
                    if (extractedYear && Math.abs(parseInt(extractedYear[1]) - regYear) <= 5) {
                        setExpiryDate(extractedDate);
                        setDebugInfo(prev => ({
                            ...prev,
                            status: 'Using extracted date (within 5 years of registration)',
                            processedDate: extractedDate
                        }));
                        return;
                    }
                }

                const calculatedDate = `31 DESEMBER ${regYear + 5}`;
                setExpiryDate(calculatedDate);
                setDebugInfo(prev => ({
                    ...prev,
                    status: `Using registration year +5 (${regYear} → ${regYear + 5})`,
                    processedDate: calculatedDate
                }));
                return;
            }

            if (extractedDate) {
                setExpiryDate(extractedDate);
                setDebugInfo(prev => ({
                    ...prev,
                    status: 'Using extracted date (no registration year found)',
                    processedDate: extractedDate
                }));
                return;
            }

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

   const saveLicenseData = async () => {
    if (!expiryDate) return;

    try {
        setLoading(true);
        
        // Convert the Indonesian date format to YYYY-MM-DD
        const dateParts = expiryDate.split(' ');
        const months = {
            'JANUARI': '01', 'JAN': '01', 
            'FEBRUARI': '02', 'FEB': '02',
            'MARET': '03', 'MAR': '03',
            'APRIL': '04', 'APR': '04',
            'MEI': '05', 'MAY': '05',
            'JUNI': '06', 'JUN': '06',
            'JULI': '07', 'JUL': '07',
            'AGUSTUS': '08', 'AUG': '08',
            'SEPTEMBER': '09', 'SEP': '09',
            'OKTOBER': '10', 'OKT': '10',
            'NOVEMBER': '11', 'NOV': '11',
            'DESEMBER': '12', 'DEC': '12'
        };
        
        const formattedDate = `${dateParts[2]}-${months[dateParts[1].toUpperCase()]}-${dateParts[0].padStart(2, '0')}`;

        // Send only the needed data (no FormData needed since no file upload)
        await router.post('/employee/operator-license', {
            expiry_date: formattedDate,
            license_number: debugInfo.regNumber || null,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setDebugInfo(prev => ({
                    ...prev,
                    status: 'License expiry date saved successfully!'
                }));
            },
            onError: (errors) => {
                setDebugInfo(prev => ({
                    ...prev,
                    status: 'Failed to save license data',
                    error: errors.message || 'Validation error'
                }));
            }
        });
    } finally {
        setLoading(false);
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
                                    {isMobile ? 'Take a photo or upload from gallery' : 'Upload a license image to accurately detect the expiry date'}
                                </p>
                            </div>

                            <div className="mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    accept="image/*"
                                    className="hidden"
                                    capture="environment"
                                    multiple={false}
                                />
                                <input
                                    type="file"
                                    ref={galleryInputRef}
                                    onChange={handleImageUpload}
                                    accept="image/*"
                                    className="hidden"
                                    multiple={false}
                                />
                                
                                {showUploadOptions ? (
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => triggerFileInput('camera')}
                                            disabled={imageLoading}
                                            className="w-full inline-flex items-center justify-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150 mb-2 disabled:opacity-50"
                                        >
                                            {imageLoading ? (
                                                <span className="flex items-center">
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Processing...
                                                </span>
                                            ) : (
                                                <span className="flex items-center">
                                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                    </svg>
                                                    Take Photo
                                                </span>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => triggerFileInput('gallery')}
                                            disabled={imageLoading}
                                            className="w-full inline-flex items-center justify-center px-4 py-2 bg-indigo-500 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-600 focus:bg-indigo-600 active:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50"
                                        >
                                            <span className="flex items-center">
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                </svg>
                                                Choose from Gallery
                                            </span>
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => triggerFileInput('gallery')}
                                        disabled={imageLoading}
                                        className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150 mb-4 disabled:opacity-50"
                                    >
                                        {imageLoading ? (
                                            <span className="flex items-center">
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Processing Image...
                                            </span>
                                        ) : 'Upload License Image'}
                                    </button>
                                )}
                                
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
                                                disabled={loading || imageLoading}
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
                                                placeholder="e.g. 21 SEPTEMBER 2027"
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
                                            Registration Year: {debugInfo.regYear}
                                        </p>
                                    )}
                                    <div className="mt-4">
                                        <button
                                            onClick={saveLicenseData}
                                            disabled={loading}
                                            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50"
                                        >
                                            {loading ? (
                                                <span className="flex items-center">
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Saving...
                                                </span>
                                            ) : 'Save License Data'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <h3 className="text-lg font-medium mb-2">Processing Information</h3>
                                
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                                        <p className={`text-sm ${
                                            debugInfo.error ? 'text-red-600 dark:text-red-400' : 
                                            expiryDate ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'
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

                                    {debugInfo.error && (
                                        <div>
                                            <p className="text-sm font-medium text-red-500 dark:text-red-400">Error</p>
                                            <p className="text-sm text-red-600 dark:text-red-400">{debugInfo.error}</p>
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