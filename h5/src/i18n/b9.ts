// B9 strings + overrides of B7 strings (merged after b7, deep merge). Password rule unified on the backend's 6–30 (FA User::PWD_MIN/MAX).
export const b9Messages: Record<string, any> = {
  en: {
    tip: { range: 'Tip {min}–{max} coins per time' },
    pwd: { rule: 'Password: {min}–{max} characters, no spaces.', first: 'You signed up with a verification code, so there is no password yet. Set one below with a verification code sent to your account — no current password needed.', byOld: 'Current password', byCode: 'Verification code', code: 'Verification code', send: 'Send code', sendTo: 'The code will be sent to {a}', noAccount: 'Bind an email or phone first.' },
    wd: { currency: 'Currency', noCurrency: 'Withdrawal currency is not configured yet. Please try again later or contact support.', rate: '1 {c} = {r} coins' },
  },
  'zh-TW': {
    tip: { range: '每次打賞 {min}–{max} 金幣' },
    pwd: { rule: '密碼需為 {min}–{max} 位，不能有空格。', first: '你是用驗證碼註冊的，目前還沒有密碼，請用發送到帳號的驗證碼設定，不需要舊密碼。', byOld: '用目前密碼', byCode: '用驗證碼', code: '驗證碼', send: '發送驗證碼', sendTo: '驗證碼將發送至 {a}', noAccount: '請先綁定郵箱或手機。' },
    wd: { currency: '提現幣種', noCurrency: '提現幣種尚未設定，請稍後再試或聯繫客服。', rate: '1 {c} = {r} 金幣' },
  },
  ar: {
    tip: { range: 'الإكرامية {min}–{max} عملة في كل مرة' },
    pwd: { rule: 'كلمة المرور من {min} إلى {max} حرفاً بدون مسافات.', first: 'سجّلت برمز تحقق، لذا لا توجد كلمة مرور بعد. عيّن واحدة أدناه برمز تحقق يُرسل إلى حسابك دون الحاجة لكلمة مرور حالية.', byOld: 'كلمة المرور الحالية', byCode: 'رمز التحقق', code: 'رمز التحقق', send: 'إرسال الرمز', sendTo: 'سيُرسل الرمز إلى {a}', noAccount: 'اربط بريداً أو هاتفاً أولاً.' },
    wd: { currency: 'العملة', noCurrency: 'لم يتم إعداد عملة السحب بعد. حاول لاحقاً أو تواصل مع الدعم.', rate: '1 {c} = {r} عملة' },
  },
}
export const b7Overrides: Record<string, any> = {
  en: { settings: { rule: 'Password must be 6–30 characters.' } },
  'zh-TW': { settings: { rule: '密碼需為 6–30 位。' } },
  ar: { settings: { rule: 'يجب أن تكون كلمة المرور من 6 إلى 30 حرفاً.' } },
}
