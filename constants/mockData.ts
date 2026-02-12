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
  distance: number; // km (calculated)
  imageUrl: string;
  mapsUrl: string;
  latitude: number;
  longitude: number;
  description?: string;
}

export const MOSQUES: Mosque[] = [
  {
    id: "m1",
    name: "مسجد الفتح",
    address: "الرغاية",
    mapsUrl: "https://maps.app.goo.gl/8c6UEqB9qy3fyjz48",
    city: "الجزائر العاصمة",
    distance: 0.8,
    imageUrl:
      "https://www.masjidie.com/wp-content/uploads/2026/02/IMG_1556-Djamel-Ouldbachir.webp",
    latitude: 36.739549,
    longitude: 3.3409669,
    description: "مسجد الفتح هو أحد أكبر مساجد المنطقة...",
  },
  {
    id: "m2",
    name: "الجامع الكبير",
    address: "ساحة الشهداء",
    city: "الجزائر العاصمة",
    mapsUrl: "https://share.google/6G2tROskf7pCERcw5",
    distance: 15.2,
    imageUrl:
      "https://lh3.googleusercontent.com/gps-cs-s/AHVAweq2IKys9W64Frik4Od42uTJGWv1evj3dHwZnU6sFFlYwuqhcyvq4WQ3SpqX6anApV-4O-jHZ0oFCDFFJZojrBVct0RFdb8F8U2PFADM2OchC2X-4TI93Z_EO0Fxq5nCqjtruBy0IwCLMAyX=s1360-w1360-h1020-rw",
    latitude: 36.73583,
    longitude: 3.13806,
    description: "الجامع الكبير هو مسجد تاريخي يقع في ساحة الشهداء...",
  },
  {
    id: "m3",
    name: "مسجد الطيب العقبي",
    address: "باش جراح",
    mapsUrl: "https://maps.app.goo.gl/ZXM5WdBfZqZLYtPR8",
    city: "الجزائر العاصمة",
    distance: 2.5,
    imageUrl:
      "https://www.masjidie.com/wp-content/uploads/2025/10/IMG_6029-%D8%B1%D8%A7%D9%85%D9%8A-%D9%85%D8%B2%D9%8A%D8%A7%D9%86w-scaled.webp",
    latitude: 36.7148187,
    longitude: 3.0935476,
    description: "مسجد التقوى مسجد حديث يتميز بطرازه المعماري الفريد...",
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
