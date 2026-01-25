import { BilingualText } from '../types';

export const createBilingualText = (en: string, zh: string): BilingualText => ({
  en,
  zh
});

export const getBilingualDisplay = (
  text: BilingualText, 
  language: 'en' | 'zh' | 'both'
): string => {
  switch (language) {
    case 'en':
      return text.en;
    case 'zh':
      return text.zh;
    case 'both':
      return `${text.zh} / ${text.en}`;
    default:
      return text.en;
  }
};

// Common bilingual text constants
export const COMMON_TEXT = {
  NEXT: createBilingualText('Next', '下一步'),
  PREVIOUS: createBilingualText('Previous', '上一步'),
  SUBMIT: createBilingualText('Submit', '提交'),
  SAVE: createBilingualText('Save', '保存'),
  CANCEL: createBilingualText('Cancel', '取消'),
  REQUIRED: createBilingualText('Required', '必填'),
  OPTIONAL: createBilingualText('Optional', '可选'),
  YES: createBilingualText('Yes', '是'),
  NO: createBilingualText('No', '否'),
  LOADING: createBilingualText('Loading...', '加载中...'),
  ERROR: createBilingualText('Error', '错误'),
  SUCCESS: createBilingualText('Success', '成功'),
};

// Form step labels
export const STEP_LABELS = {
  PERSONAL: createBilingualText('Personal Information', '个人信息'),
  SPOUSE: createBilingualText('Spouse Information', '配偶信息'),
  DEPENDENTS: createBilingualText('Dependents', '受抚养人'),
  ADDRESS: createBilingualText('Mailing Address', '邮寄地址'),
  PAYMENT: createBilingualText('Payment Method', '付款方式'),
  BANKING: createBilingualText('Banking Information', '银行信息'),
  EFILEPIN: createBilingualText('E-file PIN', '电子报税PIN'),
  IMMIGRATION: createBilingualText('Immigration History', '移民历史'),
  REVIEW: createBilingualText('Review & Submit', '审核提交'),
};

// Field labels
export const FIELD_LABELS = {
  FIRST_NAME: createBilingualText('First Name', '名字'),
  LAST_NAME: createBilingualText('Last Name', '姓氏'),
  EMAIL: createBilingualText('Email', '邮箱'),
  PHONE: createBilingualText('U.S. Phone Number', '美国联系电话'),
  WECHAT_ID: createBilingualText('WeChat ID', '微信号'),
  HAS_SPOUSE: createBilingualText(
    'Do you want to enter your spouse information?',
    '您是否需要提供配偶信息？'
  ),
  SPOUSE_FIRST_NAME: createBilingualText('Spouse First Name', '配偶名字'),
  SPOUSE_LAST_NAME: createBilingualText('Spouse Last Name', '配偶姓氏'),
  SPOUSE_SSN: createBilingualText('Spouse SSN/ITIN', '配偶SSN或ITIN'),
  SPOUSE_EMAIL: createBilingualText('Spouse Email', '配偶邮箱'),
  SPOUSE_DOB: createBilingualText('Spouse Date of Birth', '配偶出生日期'),
  SPOUSE_OCCUPATION: createBilingualText('Spouse Occupation', '配偶的职业'),
  HAS_DEPENDENTS: createBilingualText(
    'Do you have any dependent/child living with you in the U.S.?',
    '您有和您一起在美国生活的受赡养者（孩子）么？'
  ),
};

// Validation messages
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: createBilingualText(
    'This field is required',
    '此字段为必填项'
  ),
  INVALID_EMAIL: createBilingualText(
    'Please enter a valid email address',
    '请输入有效的邮箱地址'
  ),
  INVALID_PHONE: createBilingualText(
    'Please enter a valid 10-digit phone number or 0000000000 if no U.S. number',
    '请输入有效的10位电话号码，如无美国电话请输入0000000000'
  ),
  INVALID_DATE: createBilingualText(
    'Please enter a valid date',
    '请输入有效日期'
  ),
  INVALID_PIN: createBilingualText(
    'PIN must be 5 digits and cannot be 00000',
    'PIN必须是5位数字且不能是00000'
  ),
  ACCOUNT_MISMATCH: createBilingualText(
    'Account numbers do not match',
    '账号不匹配'
  ),
};