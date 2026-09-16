export interface ERPNotification {
  id: string;
  type: 'warning' | 'info' | 'error' | 'success';
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  time: string;
  targetTab?: string;
  icon?: any;
}

