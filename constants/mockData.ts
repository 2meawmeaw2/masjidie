import { CategoryId } from "./categories";

export interface Activity {
  id: string;
  mosqueId: string;
  title: string;
  description: string;
  categoryId: CategoryId;
  type: "recurring" | "one_off";
  date?: string; // ISO date for one-off
  startTime: string;
  endTime?: string;
  dayOfWeek?: number; // 0=Sunday, ... 6=Saturday
  instructor?: string;
}

export interface Mosque {
  id: string;
  name: string;
  address: string;
  city: string;
  distance: number; // km (mock)
  imageUrl: string;
}

export const MOSQUES: Mosque[] = [
  {
    id: "m1",
    name: "مسجد الفتح",
    address: "حي 500 مسكن، الرغاية",
    city: "الجزائر العاصمة",
    distance: 0.8,
    imageUrl:
      "https://images.unsplash.com/photo-1542043689-53b75435a293?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "m2",
    name: "الجامع الكبير",
    address: "ساحة الشهداء",
    city: "الجزائر العاصمة",
    distance: 15.2,
    imageUrl:
      "https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "m3",
    name: "مسجد التقوى",
    address: "حي البساتين",
    city: "بومرداس",
    distance: 2.5,
    imageUrl:
      "https://images.unsplash.com/photo-1595155102573-09419b44199c?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "m4",
    name: "مسجد عمر بن الخطاب",
    address: "وسط المدينة",
    city: "البليدة",
    distance: 45.0,
    imageUrl:
      "https://images.unsplash.com/photo-1588656811462-8e7ce6c05d04?q=80&w=800&auto=format&fit=crop",
  },
];

export const ACTIVITIES: Activity[] = [
  {
    id: "a1",
    mosqueId: "m1",
    title: "درس في التفسير",
    description: "تفسير سورة الكهف مع الشيخ محمد",
    categoryId: "tafsir",
    type: "recurring",
    dayOfWeek: 6, // Saturday
    startTime: "18:30",
    endTime: "19:30",
    instructor: "الشيخ محمد",
  },
  {
    id: "a2",
    mosqueId: "m1",
    title: "مجلس الفقه المالكي",
    description: "شرح رسالة ابن أبي زيد القيرواني",
    categoryId: "fiqh",
    type: "recurring",
    dayOfWeek: 2, // Tuesday
    startTime: "19:00",
    endTime: "20:00",
    instructor: "الشيخ أحمد",
  },
  {
    id: "a3",
    mosqueId: "m3",
    title: "تاريخ السيرة النبوية",
    description: "دروس وعبر من حياة النبي صلى الله عليه وسلم",
    categoryId: "seerah",
    type: "recurring",
    dayOfWeek: 5, // Friday
    startTime: "16:00",
    endTime: "17:00",
    instructor: "الشيخ عبد الله",
  },
  {
    id: "a4",
    mosqueId: "m2",
    title: "محاضرة: استقبال رمضان",
    description: "كيف نستعد للشهر الفضيل إيمانياً وعملياً",
    categoryId: "lecture",
    type: "one_off",
    date: "2026-03-10",
    startTime: "20:00",
    endTime: "21:30",
    instructor: "د. علي بلقاسم",
  },
  {
    id: "a5",
    mosqueId: "m4",
    title: "حلقة تحفيظ للأطفال",
    description: "مراجعة جزء عم",
    categoryId: "children",
    type: "recurring",
    dayOfWeek: 3, // Wednesday
    startTime: "15:00",
    endTime: "17:00",
    instructor: "الأستاذة عائشة",
  },
];
