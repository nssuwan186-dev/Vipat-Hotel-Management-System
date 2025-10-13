import type { Booking, Guest, Room } from '../types';

// Function to convert number to Thai Baht text, crucial for formal documents.
export function numberToThaiWords(n: number): string {
    const numbersText = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
    const units = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
    
    const convertInteger = (numStr: string): string => {
        let result = "";
        const len = numStr.length;
        if (len === 0) return "";

        for (let i = 0; i < len; i++) {
            const digit = parseInt(numStr[i]);
            const pos = len - 1 - i;

            if (digit === 0) continue;

            if (pos === 1 && digit === 2) result += "ยี่";
            else if (pos === 1 && digit === 1) result += "";
            else if (pos === 0 && digit === 1 && len > 1 && numStr[len - 2] !== '0') result += "เอ็ด";
            else result += numbersText[digit];
            
            if (digit !== 0) result += units[pos];
        }
        return result;
    };

    const [integerPart, decimalPart] = n.toFixed(2).split('.');
    
    let bahtStr = "";
    if (integerPart === '0') {
        bahtStr = "ศูนย์บาท";
    } else {
        const millions = Math.floor(parseInt(integerPart) / 1000000);
        const remainder = parseInt(integerPart) % 1000000;
        if (millions > 0) {
            bahtStr += convertInteger(millions.toString()) + "ล้าน";
        }
        if (remainder > 0) {
            bahtStr += convertInteger(remainder.toString());
        }
        bahtStr += "บาท";
    }

    if (parseInt(decimalPart) > 0) {
        bahtStr += convertInteger(decimalPart) + "สตางค์";
    } else {
        bahtStr += "ถ้วน";
    }
    return bahtStr;
}


interface DocumentData {
    booking: Booking;
    guest: Guest;
    room: Room;
    totalAmount: number;
}

export const generateReceiptHtml = async ({ booking, guest, room, totalAmount }: DocumentData): Promise<string> => {
    const response = await fetch('/templates/receiptTemplate.html');
    if (!response.ok) throw new Error('ไม่สามารถโหลดเทมเพลตใบเสร็จได้');
    let template = await response.text();

    const duration = Math.ceil((new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 3600 * 24)) || 1;

    const replacements = {
        '{{COMPANY_NAME}}': 'VIPAT HMS',
        '{{COMPANY_ADDRESS}}': '426 หมู่ที่9 ต.บึงกาฬ อ.เมืองบึงกาฬ จ.บึงกาฬ 38000',
        '{{COMPANY_PHONE}}': '080-6254859',
        '{{RECEIPT_ID}}': `VP-RCPT-${booking.id}`,
        '{{DATE}}': new Date().toLocaleDateString('th-TH'),
        '{{CUSTOMER_NAME}}': guest.name,
        '{{DESCRIPTION}}': `ค่าห้องพัก ${room.number} จำนวน ${duration} คืน`,
        '{{AMOUNT}}': totalAmount.toLocaleString('th-TH', { style: 'currency', currency: 'THB' }),
    };

    for (const [key, value] of Object.entries(replacements)) {
        template = template.replace(new RegExp(key, 'g'), value);
    }
    return template;
};

export const generateTaxInvoiceHtml = async ({ booking, guest, room, totalAmount }: DocumentData): Promise<string> => {
    const response = await fetch('/templates/taxInvoiceTemplate.html');
    if (!response.ok) throw new Error('ไม่สามารถโหลดเทมเพลตใบกำกับภาษีได้');
    let template = await response.text();

    const amountBeforeVat = totalAmount / 1.07;
    const vatAmount = totalAmount - amountBeforeVat;
    const duration = Math.ceil((new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 3600 * 24)) || 1;

    const formatDateForInvoice = (date: Date) => {
        const d = new Date(date);
        const year = (d.getFullYear() + 543).toString().slice(-2);
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${day}/${month}/${year}`;
    };

    const replacements = {
        '{{COMPANY_NAME}}': 'บริษัท วิพัฒน์โฮเทล.ดีเวลอปเมนท์ จำกัด',
        '{{COMPANY_ADDRESS}}': '426 หมู่ที่9 ตำบลบึงกาฬ อำเภอเมืองบึงกาฬ จังหวัดบึงกาฬ 38000',
        '{{COMPANY_PHONE}}': '080-6254859,042-492641',
        '{{COMPANY_TAX_ID}}': '0-3855-59000-07-5',
        '{{INVOICE_ID}}': `VP-TINV-${booking.id}`,
        '{{DATE}}': new Date().toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }),
        '{{CUSTOMER_NAME}}': guest.name,
        '{{CUSTOMER_PHONE}}': guest.phone || '',
        '{{ITEM_DESCRIPTION}}': `ค่าห้องพัก ${room.number} (${formatDateForInvoice(booking.checkInDate)} - ${formatDateForInvoice(booking.checkOutDate)})`,
        '{{ITEM_DURATION}}': `${duration} คืน`,
        '{{TOTAL_AMOUNT_FORMATTED}}': totalAmount.toFixed(2),
        '{{SUBTOTAL_NO_VAT_FORMATTED}}': amountBeforeVat.toFixed(2),
        '{{VAT_AMOUNT_FORMATTED}}': vatAmount.toFixed(2),
        '{{AMOUNT_IN_WORDS}}': numberToThaiWords(totalAmount),
    };

    for (const [key, value] of Object.entries(replacements)) {
        template = template.replace(new RegExp(key, 'g'), value);
    }
    return template;
};
