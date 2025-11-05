export function generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export function otpExpiry(minutes = 5): Date {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + minutes);
    return expiry;
}