import React, { useState, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function LicenseDateExtractor() {
    const { auth, employeeLicense } = usePage().props;
    const [image, setImage] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [expiryDate, setExpiryDate] = useState(null);
    const [licenseNumber, setLicenseNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [debugInfo, setDebugInfo] = useState({});
    const [attemptCount, setAttemptCount] = useState(0);
    const [showManualInput, setShowManualInput] = useState(false);
    const [manualDate, setManualDate] = useState('');
    const [isMobile, setIsMobile] = useState(false);
    const [showUploadOptions, setShowUploadOptions] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [convertedDate, setConvertedDate] = useState(null);
    const [showDateConversion, setShowDateConversion] = useState(false);
    const fileInputRef = useRef(null);
    const galleryInputRef = useRef(null);

    // Format date from YYYY-MM-DD to DD MMMM YYYY
    const formatDisplayDate = (dateString) => {
        if (!dateString) return null;
        
        const date = new Date(dateString);
        const months = [
            'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
            'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
        ];
        
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        
        return `${day} ${month} ${year}`;
    };

    // Initialize with existing data if available
    useEffect(() => {
        if (employeeLicense) {
            if (employeeLicense.expiry_date) {
                const formatted = formatDisplayDate(employeeLicense.expiry_date);
                setExpiryDate(formatted);
                setConvertedDate(employeeLicense.expiry_date);
            }
            if (employeeLicense.license_number) {
                setLicenseNumber(employeeLicense.license_number);
                setDebugInfo(prev => ({ ...prev, regNumber: employeeLicense.license_number }));
            }
        }
    }, [employeeLicense]);

    // Check if user is on mobile device
    useEffect(() => {
        const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        setIsMobile(mobileCheck);
        setShowUploadOptions(mobileCheck);
    }, []);

    const resetState = () => {
        setExpiryDate(null);
        setConvertedDate(null);
        setDebugInfo({});
        setAttemptCount(0);
        setShowManualInput(false);
        setManualDate('');
        setShowDateConversion(false);
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
        setImageFile(file);
        
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

    const extractRegistrationNumber = (text) => {
        // Improved pattern to match various license number formats including the new type
        const regNumberPatterns = [
            /Reg\.?\s*([A-Za-z0-9\.\-]+\/[A-Za-z0-9\.\-]+\/[A-Za-z0-9\.\-]+\/[0-9]+)/i,  // Matches formats with slashes (e.g., P.11.8794-OPK3-LT/PAA/IX/2021)
            /([A-Z0-9]{1,}\.[0-9]{6,}\/[A-Z0-9]+\/[A-Z0-9]+\/[A-Z0-9]+\/[0-9]{4})/i, // For new type like 0713230623/A-OPK2/35/VI/2023
            /([A-Z0-9]+\/[A-Z0-9]+\/[0-9]+\/[A-Z]+\/[0-9]{4})/i, // More general for new type
            /([A-Za-z0-9\.\-]+\/[A-Za-z0-9\.\-]+)/i,  // Matches formats with one slash
            /([A-Za-z0-9\.\-]+)/i,  // Matches simple formats
            /No\.?\s*Reg\.?:\s*([A-Za-z0-9\.\-]+)/i,  // Matches "No Reg:" format
        ];

        for (const pattern of regNumberPatterns) {
            const match = text.match(pattern);
            if (match) {
                let regNumber = match[1]
                    .replace(/\s/g, '')  // Remove any spaces
                    .replace(/[^A-Za-z0-9\.\-\/]/g, '');  // Remove special characters except .-/

                // Additional cleanup for common OCR errors
                regNumber = regNumber
                    .replace(/O/g, '0')  // Replace O with 0
                    .replace(/I/g, '1')  // Replace I with 1
                    .replace(/S/g, '5')  // Replace S with 5
                    .replace(/Z/g, '2')  // Replace Z with 2
                    .replace(/B/g, '8'); // Replace B with 8

                return regNumber;
            }
        }
        return null;
    };

    const extractRegistrationYear = (text) => {
        const regNumber = extractRegistrationNumber(text);
        if (!regNumber) return null;

        setLicenseNumber(regNumber);
        setDebugInfo(prev => ({ ...prev, regNumber: regNumber }));

        // Try to extract year from various positions in the registration number
        const yearPatterns = [
            /(?:^|\/)(20\d{2})(?:\/|$)/,  // Matches years in format 20XX
            /(?:^|\-)(\d{4})(?:\-|$)/,    // Matches 4-digit numbers after - or at start
            /(?:^|\.)(\d{2})(?:\-|$)/      // Matches 2-digit numbers that might be years
        ];

        for (const pattern of yearPatterns) {
            const match = regNumber.match(pattern);
            if (match) {
                let year = parseInt(match[1]);
                // If we got a 2-digit year, assume it's 2000+
                if (year < 100) year += 2000;
                return year;
            }
        }
        return null;
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

        // Patterns for the old card type ('Berlaku s/d' or similar)
        const oldCardPatterns = [
            /Berlaku\s*s\/d\s*:\s*(\d{1,2}\s*[A-Z]+\s*\d{4})/i,
            /Berlaku\s*s\/d\s*(\d{1,2}\s*[A-Z]+\s*\d{4})/i,
            /Berlaku\s*(\d{1,2}\s*[A-Z]+\s*\d{4})/i,
            /(\d{1,2}\s*[A-Z]+\s*20[2-9][0-9])\s*$/im
        ];

        for (const pattern of oldCardPatterns) {
            const match = cleanedText.match(pattern);
            if (match) {
                return match[1]
                    .replace(/\s+/g, ' ')
                    .replace(/(\d)([A-Z])/g, '$1 $2')
                    .replace(/([A-Z])(\d)/g, '$1 $2')
                    .trim();
            }
        }

        // Pattern for the new card type (date after number 4.)
        const newCardPattern = /4\.\s*(\d{1,2}\s*[A-Z]+\s*\d{4})/i;
        const newCardMatch = cleanedText.match(newCardPattern);
        if (newCardMatch) {
            return newCardMatch[1]
                .replace(/\s+/g, ' ')
                .replace(/(\d)([A-Z])/g, '$1 $2')
                .replace(/([A-Z])(\d)/g, '$1 $2')
                .trim();
        }

        return null;
    };

    const calculateSimilarity = (s1, s2) => {
        // Simple similarity calculation - count matching characters
        const set1 = new Set(s1);
        const set2 = new Set(s2);
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        return intersection.size / Math.max(set1.size, set2.size);
    };

    const findBestMonthMatch = (inputMonth) => {
        const monthMappings = {
            // Full month names
            'JANUARI': '01', 'FEBRUARI': '02', 'MARET': '03', 'APRIL': '04', 
            'MEI': '05', 'JUNI': '06', 'JULI': '07', 'AGUSTUS': '08', 
            'SEPTEMBER': '09', 'OKTOBER': '10', 'NOVEMBER': '11', 'DESEMBER': '12',
            
            // Common abbreviations
            'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 
            'MEI': '05', 'JUN': '06', 'JUL': '07', 'AGS': '08', 'AUG': '08',
            'SEP': '09', 'OKT': '10', 'NOV': '11', 'DES': '12', 'DEC': '12',
            
            // Common OCR mistakes with their corrections (expanded and refined)
            'SEPTEMBOR': '09', 'SEPTEBER': '09', 'SEPTEMBERR': '09', 'SEPTEMER': '09',
            'SEPTEMBE': '09', 'SEPYEMBER': '09', 'SEPTEMEBR': '09', 'SEPTEMBRE': '09',
            'SEPTMBER': '09', 'SEPTEEMBER': '09', 'SEPTERMBER': '09', 'SPTEMBER': '09',
            'OKTOBERR': '10', 'OKTOBR': '10', 'OKTOBE': '10', 'OCTOBER': '10',
            'NOFEMBER': '11', 'NOVEMEBR': '11', 'NOVEMER': '11', 'NOVEMBR': '11',
            'DESEMBERR': '12', 'DESEMEBR': '12', 'DESEMER': '12', 'DECEMBER': '12',
            'AGUSTU': '08', 'AGUSTOS': '08', 'AUGUST': '08',
            'JULYY': '07', 'JULY': '07', 'JLI': '07',
            'MARETT': '03', 'MARERT': '03', 'MART': '03',
            'APRILL': '04', 'APRL': '04', 'APRIAL': '04',
            'FEBRUAR': '02', 'PEBRUARI': '02', 'FEBUARI': '02'
        };

        // First try exact match
        if (monthMappings[inputMonth]) {
            return { month: monthMappings[inputMonth], matched: inputMonth, confidence: 1 };
        }

        // Then try to find the best match
        const possibleMonths = Object.keys(monthMappings);
        let bestMatch = null;
        let highestScore = 0;

        for (const month of possibleMonths) {
            const similarity = calculateSimilarity(inputMonth, month);
            // Bonus if the input starts with the month (common OCR error is trailing characters)
            const startsWithBonus = month.startsWith(inputMonth.substring(0, 3)) ? 0.2 : 0;
            
            const totalScore = similarity + startsWithBonus;
            
            if (totalScore > highestScore) {
                highestScore = totalScore;
                bestMatch = month;
            }
        }

        // Only accept if we have a reasonably good match
        if (highestScore > 0.6) { // Adjusted threshold for better accuracy
            return { 
                month: monthMappings[bestMatch], 
                matched: bestMatch, 
                confidence: highestScore 
            };
        }

        return null;
    };

    const parseIndonesianDate = (dateString) => {
        const parts = dateString.split(' ');
        if (parts.length !== 3) return null;

        const day = parts[0].padStart(2, '0');
        const extractedMonth = parts[1].toUpperCase();
        const year = parts[2];

        // Find the best month match
        const monthMatch = findBestMonthMatch(extractedMonth);
        if (!monthMatch) {
            return null;
        }

        // Log the correction for debugging
        if (monthMatch.matched !== extractedMonth) {
            setDebugInfo(prev => ({
                ...prev,
                monthCorrection: `Corrected '${extractedMonth}' to '${monthMatch.matched}' (confidence: ${Math.round(monthMatch.confidence * 100)}%)`
            }));
        }

        return `${year}-${monthMatch.month}-${day}`;
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
                    tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ./- ',
                    preserve_interword_spaces: 1,
                    tessedit_ocr_engine_mode: isMobile ? 1 : 3,
                    user_defined_dpi: isMobile ? '300' : '200'
                }
            );

            const regNumber = extractRegistrationNumber(text);
            const regYear = extractRegistrationYear(text);
            const extractedDate = extractExpiryDateFromText(text);
            
            setDebugInfo(prev => ({
                ...prev,
                rawText: text,
                regNumber: regNumber,
                regYear: regYear,
                extractedDate: extractedDate,
                status: `Found registration number: ${regNumber || 'None'}, extracted date: ${extractedDate || 'None'}`
            }));

            if (extractedDate) {
                const formattedDate = parseIndonesianDate(extractedDate);
                if (formattedDate) {
                    const extractedDateObj = new Date(formattedDate);
                    const today = new Date();
                    
                    if (extractedDateObj > today) {
                        setExpiryDate(extractedDate);
                        setConvertedDate(formattedDate);
                        setDebugInfo(prev => ({
                            ...prev,
                            status: 'Using valid extracted expiry date',
                            processedDate: extractedDate
                        }));
                        return;
                    }
                }
            }

            if (regYear) {
                // Prioritize extracted date if available and reasonable
                if (extractedDate) {
                    const extractedYear = extractedDate.match(/(20\d{2})/);
                    if (extractedYear && Math.abs(parseInt(extractedYear[1]) - regYear) <= 5) {
                        setExpiryDate(extractedDate);
                        setConvertedDate(parseIndonesianDate(extractedDate));
                        setDebugInfo(prev => ({
                            ...prev,
                            status: 'Using extracted date (within 5 years of registration)',
                            processedDate: extractedDate
                        }));
                        return;
                    }
                }

                // Fallback to reg year + 5 if no valid extracted date or not close
                const calculatedDate = `31 DESEMBER ${regYear + 5}`;
                setExpiryDate(calculatedDate);
                setConvertedDate(`${regYear + 5}-12-31`);
                setDebugInfo(prev => ({
                    ...prev,
                    status: `Using registration year +5 (${regYear} → ${regYear + 5})`,
                    processedDate: calculatedDate
                }));
                return;
            }

            // If only extractedDate is found but no regYear
            if (extractedDate) {
                setExpiryDate(extractedDate);
                setConvertedDate(parseIndonesianDate(extractedDate));
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
            const formattedDate = parseIndonesianDate(manualDate);
            setConvertedDate(formattedDate);
            setDebugInfo(prev => ({
                ...prev,
                status: 'Using manually entered date',
                processedDate: manualDate
            }));
        }
    };

    const handleConvertDate = () => {
        if (!expiryDate) return;
        
        const formattedDate = parseIndonesianDate(expiryDate);
        if (formattedDate) {
            setConvertedDate(formattedDate);
            setShowDateConversion(true);
            setDebugInfo(prev => ({
                ...prev,
                status: 'Date successfully converted',
                convertedDate: formattedDate
            }));
        } else {
            setDebugInfo(prev => ({
                ...prev,
                status: 'Date conversion failed',
                error: 'Invalid date format. Please use DD MMMM YYYY format'
            }));
        }
    };

    const saveLicenseData = async () => {
        if (!expiryDate || !convertedDate) {
            setDebugInfo(prev => ({
                ...prev,
                status: 'Cannot save - date not converted',
                error: 'Please convert the date first'
            }));
            return;
        }

        try {
            setLoading(true);
            
            // Create FormData to include the file
            const formData = new FormData();
            formData.append('expiry_date', convertedDate);
            formData.append('license_number', licenseNumber || '');
            if (imageFile) {
                formData.append('license_image', imageFile);
            }

            await router.post('/employee/operator-license', formData, {
                preserveScroll: true,
                onSuccess: () => {
                    setDebugInfo(prev => ({
                        ...prev,
                        status: 'License data saved successfully!'
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

                            {/* Show existing license if available */}
                            {employeeLicense && (
                                <div className="mb-6 bg-blue-50 dark:bg-blue-900 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                                    <h3 className="text-lg font-medium mb-2 text-blue-800 dark:text-blue-200">
                                        Current License Information
                                    </h3>
                                    {employeeLicense.image_path && (
                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium mb-2">License Image:</h4>
                                            <img 
                                                src={`/storage/${employeeLicense.image_path}`}
                                                alt="Current license"
                                                className="w-full max-w-md h-auto border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {employeeLicense.expiry_date && (
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Expiry Date</p>
                                                <p className="text-lg font-semibold text-blue-600 dark:text-blue-300">
                                                    {formatDisplayDate(employeeLicense.expiry_date)}
                                                </p>
                                            </div>
                                        )}
                                        {employeeLicense.license_number && (
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">License Number</p>
                                                <p className="text-lg font-semibold text-blue-600 dark:text-blue-300">
                                                    {employeeLicense.license_number}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

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
                                    {licenseNumber && (
                                        <p className="mt-2 text-sm text-green-700 dark:text-green-200">
                                            License Number: {licenseNumber}
                                        </p>
                                    )}
                                    
                                    {!convertedDate && (
                                        <div className="mt-4">
                                            <button
                                                onClick={handleConvertDate}
                                                className="inline-flex items-center px-4 py-2 bg-purple-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-purple-700 focus:bg-purple-700 active:bg-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                            >
                                                Convert to Date Format
                                            </button>
                                        </div>
                                    )}
                                    
                                    {(convertedDate || showDateConversion) && (
                                        <div className="mt-4 bg-blue-50 dark:bg-blue-900 p-3 rounded-lg">
                                            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                                                Converted Date (YYYY-MM-DD):
                                            </h4>
                                            <p className="text-lg font-semibold text-blue-600 dark:text-blue-300">
                                                {convertedDate || 'Not converted'}
                                            </p>
                                            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                                                This is the format that will be saved to the database
                                            </p>
                                        </div>
                                    )}
                                    
                                    {convertedDate && (
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
                                    )}
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

                                    {debugInfo.regNumber !== undefined && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">License Number</p>
                                            <p className="text-sm">{debugInfo.regNumber || 'Not detected'}</p>
                                        </div>
                                    )}

                                    {debugInfo.extractedDate !== undefined && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Extracted Date</p>
                                            <p className="text-sm">{debugInfo.extractedDate || 'Not detected'}</p>
                                        </div>
                                    )}

                                    {debugInfo.monthCorrection && (
                                        <div>
                                            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Month Correction</p>
                                            <p className="text-sm text-yellow-700 dark:text-yellow-300">{debugInfo.monthCorrection}</p>
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