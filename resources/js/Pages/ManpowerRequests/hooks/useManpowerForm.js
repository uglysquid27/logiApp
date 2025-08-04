// js/pages/ManpowerRequests/Create/hooks/useManpowerForm.js
import { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { formatTimeToSeconds } from '../utils/helpers';

export default function useManpowerForm(subSections, shifts) {
  // Group subSections by section for better organization
  const sectionsWithSubs = subSections.reduce((acc, subSection) => {
    const sectionName = subSection.section?.name || 'Uncategorized';
    if (!acc[sectionName]) {
      acc[sectionName] = [];
    }
    acc[sectionName].push(subSection);
    return acc;
  }, {});

  // Initialize timeSlots with gender fields
  const initialTimeSlots = {};
  if (shifts && Array.isArray(shifts)) {
    shifts.forEach(shift => {
      initialTimeSlots[shift.id] = {
        requested_amount: '',
        male_count: 0,
        female_count: 0,
        start_time: shift.start_time || '',
        end_time: shift.end_time || '',
        reason: '',
        is_additional: false,
      };
    });
  }

  const { data, setData, post, processing, errors, reset } = useForm({
    sub_section_id: '',
    sub_section_name: '',
    date: '',
    time_slots: initialTimeSlots,
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [duplicateRequests, setDuplicateRequests] = useState([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  useEffect(() => {
    const currentShiftIds = Object.keys(data.time_slots).map(Number);
    const allShiftIds = shifts.map(s => s.id);

    if (!data.time_slots || allShiftIds.some(id => !currentShiftIds.includes(id))) {
      const newInitialTimeSlots = {};
      shifts.forEach(shift => {
        newInitialTimeSlots[shift.id] = {
          requested_amount: '',
          male_count: 0,
          female_count: 0,
          start_time: shift.start_time || '',
          end_time: shift.end_time || '',
          reason: '',
          is_additional: false,
        };
      });
      setData('time_slots', newInitialTimeSlots);
    }
  }, [shifts]);

  const handleSlotChange = (shiftId, field, value) => {
    // Remove leading zeros from number inputs
    if (field === 'requested_amount' || field === 'male_count' || field === 'female_count') {
      if (value === '' || value === '0') {
        value = '';
      } else if (value.startsWith('0') && value.length > 1) {
        value = value.replace(/^0+/, '');
      }
    }

    setData(prevData => {
      const newTimeSlots = {
        ...prevData.time_slots,
        [shiftId]: {
          ...prevData.time_slots[shiftId],
          [field]: (field === 'start_time' || field === 'end_time') ? formatTimeToSeconds(value) : value,
        },
      };

      // Reset time and gender counts when requested amount is cleared or set to 0
      if (field === 'requested_amount') {
        const amount = value === '' ? 0 : parseInt(value, 10);
        if (amount <= 0) {
          const originalShift = shifts.find(s => s.id === shiftId);
          newTimeSlots[shiftId] = {
            ...newTimeSlots[shiftId],
            start_time: originalShift?.start_time || '',
            end_time: originalShift?.end_time || '',
            male_count: 0,
            female_count: 0,
            is_additional: false,
            reason: '',
          };
        }
      }

      return {
        ...prevData,
        time_slots: newTimeSlots,
      };
    });
  };

  const checkForDuplicates = async () => {
    try {
      const response = await fetch(route('manpower-requests.check-duplicates'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          sub_section_id: data.sub_section_id,
          date: data.date,
          shift_ids: Object.keys(data.time_slots)
            .filter(shiftId => data.time_slots[shiftId].requested_amount > 0)
            .map(Number),
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return { duplicates: [], has_duplicates: false };
    }
  };

  const hasAtLeastOneShiftFilled = () => {
    return Object.values(data.time_slots).some(
      slot => slot.requested_amount && parseInt(slot.requested_amount) > 0
    );
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!data.sub_section_id || !data.date || !hasAtLeastOneShiftFilled()) {
      alert('Please fill all required fields and at least one shift');
      return;
    }

    try {
      const { duplicates, has_duplicates } = await checkForDuplicates();

      if (has_duplicates) {
        setDuplicateRequests(duplicates);
        setShowDuplicateWarning(true);

        setData(prevData => {
          const newTimeSlots = { ...prevData.time_slots };
          duplicates.forEach(dup => {
            if (newTimeSlots[dup.shift_id]) {
              newTimeSlots[dup.shift_id] = {
                ...newTimeSlots[dup.shift_id],
                is_additional: true,
                reason: newTimeSlots[dup.shift_id].reason || 'Duplicate request - additional manpower needed'
              };
            }
          });
          return { ...prevData, time_slots: newTimeSlots };
        });
        return;
      }

      await processSubmission();
    } catch (error) {
      console.error('Error during submission:', error);
      alert('An error occurred during submission. Please try again.');
    }
  };

  const processSubmission = async () => {
    const payloadTimeSlots = [];

    Object.keys(data.time_slots).forEach(shiftId => {
      const slot = data.time_slots[shiftId];
      const requestedAmount = slot.requested_amount ? parseInt(slot.requested_amount, 10) : 0;

      if (requestedAmount > 0) {
        const payloadSlot = {
          shift_id: parseInt(shiftId, 10),
          requested_amount: requestedAmount,
          male_count: parseInt(slot.male_count) || 0,
          female_count: parseInt(slot.female_count) || 0,
          start_time: formatTimeToSeconds(slot.start_time),
          end_time: formatTimeToSeconds(slot.end_time),
          is_additional: slot.is_additional || false,
        };

        if (payloadSlot.is_additional) {
          payloadSlot.reason = slot.reason || 'Duplicate request - additional manpower needed';
        }

        payloadTimeSlots.push(payloadSlot);
      }
    });

    try {
      await post('/manpower-requests', {
        sub_section_id: data.sub_section_id,
        date: data.date,
        time_slots: payloadTimeSlots,
      }, {
        onSuccess: () => {
          reset();
        },
      });
    } catch (error) {
      console.error('Submission failed:', error);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  // Filter sub-sections based on search term
  const filteredSections = Object.keys(sectionsWithSubs).reduce((acc, sectionName) => {
    const filteredSubs = sectionsWithSubs[sectionName].filter(subSection =>
      subSection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sectionName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredSubs.length > 0) {
      acc[sectionName] = filteredSubs;
    }
    return acc;
  }, {});

  const selectSubSection = (subSection) => {
    setData({
      ...data,
      sub_section_id: subSection.id,
      sub_section_name: subSection.name
    });
    setIsModalOpen(false);
    setSearchTerm('');
  };

  const handleNumberFocus = (e) => {
    if (e.target.value === '0') {
      e.target.value = '';
    }
  };

  return {
    data,
    setData,
    errors,
    processing,
    sectionsWithSubs,
    isModalOpen,
    setIsModalOpen,
    searchTerm,
    setSearchTerm,
    filteredSections,
    selectSubSection,
    duplicateRequests,
    showDuplicateWarning,
    setShowDuplicateWarning,
    handleSlotChange,
    handleNumberFocus,
    submit,
    today
  };
}