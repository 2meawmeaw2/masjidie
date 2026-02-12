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
  imageUrl: string;
}

export interface Mosque {
  id: string;
  name: string;
  address: string;
  city: string;
  distance: number; // km (mock)
  imageUrl: string;
  mapsUrl: string;
}

export const MOSQUES: Mosque[] = [
  {
    id: "m1",
    name: "مسجد الفتح",
    address: "حي 500 مسكن، الرغاية",
    mapsUrl: "https://maps.app.goo.gl/rrEhFB1TdzGBU6KT8",
    city: "الجزائر العاصمة",
    distance: 0.8,
    imageUrl:
      "https://www.masjidie.com/wp-content/uploads/2026/02/IMG_1556-Djamel-Ouldbachir.webp",
  },
  {
    id: "m2",
    name: "الجامع الكبير",
    address: "ساحة الشهداء",
    city: "الجزائر العاصمة",
    mapsUrl: "https://maps.app.goo.gl/rrEhFB1TdzGBU6KT8",
    distance: 15.2,
    imageUrl:
      "http://plus.unsplash.com/premium_photo-1678563876224-dbb520ffef17?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8bW9zcXVlfGVufDB8fDB8fHww",
  },
  {
    id: "m3",
    name: "مسجد التقوى",
    address: "حي البساتين",
    mapsUrl: "https://maps.app.goo.gl/rrEhFB1TdzGBU6KT8",
    city: "بومرداس",
    distance: 2.5,
    imageUrl:
      "https://images.pexels.com/photos/2079666/pexels-photo-2079666.jpeg",
  },
  {
    id: "m4",
    name: "مسجد عمر بن الخطاب",
    address: "وسط المدينة",
    city: "البليدة",
    distance: 45.0,
    mapsUrl: "https://maps.app.goo.gl/rrEhFB1TdzGBU6KT8",
    imageUrl:
      "https://images.pexels.com/photos/2079666/pexels-photo-2079666.jpeg",
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
    imageUrl:
      "https://img.freepik.com/free-photo/holy-communion-concept-with-bible_23-2149337542.jpg",
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
    imageUrl:
      "https://i.pinimg.com/474x/cd/f4/f2/cdf4f22a83dd589974b5440e3ba8e2e0.jpg",
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
    imageUrl:
      "https://i.pinimg.com/736x/32/cd/e4/32cde4798573038a4f664ec850891e78.jpg",
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
    imageUrl:
      "https://images.pexels.com/photos/2079666/pexels-photo-2079666.jpeg",
  },
];
