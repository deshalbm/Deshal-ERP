import { loadRentalSpaces, loadConsultingServices, loadSpaceBookings, saveSpaceBookings } from '../../utils/storage';
import { SpaceBooking } from '../../types';

export interface WebsiteBookingInput {
  name: string;
  phone: string;
  email?: string;
  spaceOrServiceName: string;
  bookingType: 'SPACE' | 'SERVICE' | 'STUDIO';
  date: string;
  time: string;
  durationHours?: number;
  notes?: string;
}

export class WebsiteBookingService {
  /**
   * Reads real availability from ERP space storage.
   */
  static getAvailableSpaces() {
    return loadRentalSpaces().filter(s => s.status === 'AVAILABLE');
  }

  /**
   * Reads available consulting and support services.
   */
  static getAvailableServices() {
    return loadConsultingServices();
  }

  /**
   * Submit a space or service booking request safely.
   * 1. Validates input
   * 2. Prevents double booking for spaces on the same date/time
   * 3. Calculates prices strictly from ERP rates (never trusting frontend price)
   * 4. Queues booking as PENDING_CONFIRMATION for reception approval
   */
  static async submitBooking(input: WebsiteBookingInput): Promise<{ 
    success: boolean; 
    message: string; 
    bookingId?: string;
    calculatedPrice?: number;
  }> {
    if (!input.name || !input.phone || !input.spaceOrServiceName) {
      throw new Error('البيانات الأساسية للحجز غير مكتملة.');
    }

    const sanitizedName = input.name.trim().slice(0, 100);
    const sanitizedPhone = input.phone.trim().slice(0, 30);
    const sanitizedTarget = input.spaceOrServiceName.trim();
    const duration = Math.max(1, Number(input.durationHours) || 1);
    const bookingDate = input.date || new Date().toISOString().split('T')[0];
    const bookingTime = input.time || '10:00';

    // 1. Double Booking Check for Spaces
    const existingBookings = loadSpaceBookings();
    const allSpaces = loadRentalSpaces();
    
    // Find matching space if space booking
    const matchedSpace = allSpaces.find(s => 
      s.name.includes(sanitizedTarget) || sanitizedTarget.includes(s.name) || s.code === sanitizedTarget
    );

    if (matchedSpace) {
      const isConflicting = existingBookings.some(b => {
        if (b.spaceId !== matchedSpace.id && !b.spaceName.includes(matchedSpace.name)) return false;
        if (b.startDate !== bookingDate) return false;
        if (b.status === 'CANCELLED') return false;

        // Check time overlap
        const existingStart = parseInt(b.startTime.replace(':', ''), 10);
        const newStart = parseInt(bookingTime.replace(':', ''), 10);
        const existingEnd = existingStart + (b.duration || 1) * 100;
        const newEnd = newStart + duration * 100;

        return Math.max(existingStart, newStart) < Math.min(existingEnd, newEnd);
      });

      if (isConflicting) {
        throw new Error(`المساحة (${matchedSpace.name}) محجوزة بالفعل في التاريخ (${bookingDate}) والساعة (${bookingTime}). الرجاء اختيار موعد آخر.`);
      }
    }

    // 2. Server-Side Price Calculation (Never accept price from frontend)
    let unitPrice = 0;
    if (matchedSpace) {
      unitPrice = matchedSpace.hourlyRate || matchedSpace.dailyRate || 10;
    } else {
      const matchedService = loadConsultingServices().find(s => 
        s.name.includes(sanitizedTarget) || sanitizedTarget.includes(s.name)
      );
      unitPrice = matchedService ? matchedService.basePrice : 25;
    }

    const calculatedSubtotal = unitPrice * duration;
    const taxAmount = calculatedSubtotal * 0.05; // 5% Omani VAT
    const totalAmount = calculatedSubtotal + taxAmount;

    // 3. Post to backend Express server for security audit log
    const bookingId = `BOOK-WEB-${Date.now()}`;
    try {
      await fetch('/api/public/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sanitizedName,
          phone: sanitizedPhone,
          email: input.email ? input.email.trim() : '',
          spaceOrServiceName: sanitizedTarget,
          bookingType: input.bookingType,
          date: bookingDate,
          time: bookingTime,
          durationHours: duration,
          calculatedTotal: totalAmount
        })
      });
    } catch (err) {
      console.warn('Backend booking endpoint log fallback:', err);
    }

    // 4. Save Pending Space Booking in ERP Space Bookings storage
    if (matchedSpace) {
      const newSpaceBooking: SpaceBooking = {
        id: bookingId,
        bookingNumber: `BK-WEB-${Date.now().toString().slice(-4)}`,
        spaceId: matchedSpace.id,
        spaceName: matchedSpace.name,
        spaceType: matchedSpace.type,
        branchId: matchedSpace.branchId || 'branch-sohar',
        branchName: matchedSpace.branchName || 'فرع صحار الرئيسي',
        customerName: sanitizedName,
        customerPhone: sanitizedPhone,
        customerEmail: input.email || '',
        rentalType: 'HOURLY',
        startDate: bookingDate,
        startTime: bookingTime,
        endDate: bookingDate,
        endTime: `${parseInt(bookingTime.split(':')[0], 10) + duration}:${bookingTime.split(':')[1] || '00'}`,
        duration,
        unitPrice,
        subtotal: calculatedSubtotal,
        discountAmount: 0,
        taxAmount,
        totalAmount,
        currency: 'OMR',
        attendeesCount: matchedSpace.capacity || 4,
        purpose: `[طلب من الموقع الإلكتروني] ${input.notes || 'حجز مبدئي'}`,
        selectedAmenities: matchedSpace.amenities || [],
        status: 'PENDING_CONFIRMATION' as any,
        paymentStatus: 'UNPAID',
        paymentMethod: 'CASH',
        createdByType: 'CLIENT_SELF_SERVICE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      saveSpaceBookings([newSpaceBooking, ...existingBookings]);
    }

    return {
      success: true,
      message: `تم تقديم طلب الحجز بنجاح (المبلغ الإجمالي المحسوب: ${totalAmount.toFixed(3)} ر.ع). سيتواصل معك موظف الاستقبال لتأكيد الموعد.`,
      bookingId,
      calculatedPrice: totalAmount
    };
  }
}
