// Mock data for A/B testing court availability UI patterns

// View A: Single court hourly availability (Micro-Timeline)
export interface CourtHour {
  time: string;
  hour: number;
  isAvailable: boolean;
}

export interface MockCourtData {
  courtName: string;
  date: string;
  hours: CourtHour[];
}

export const mockCourtData: MockCourtData = {
  courtName: "Court 1",
  date: "Today",
  hours: [
    { time: "6:00 AM", hour: 6, isAvailable: true },
    { time: "7:00 AM", hour: 7, isAvailable: true },
    { time: "8:00 AM", hour: 8, isAvailable: false },
    { time: "9:00 AM", hour: 9, isAvailable: false },
    { time: "10:00 AM", hour: 10, isAvailable: true },
    { time: "11:00 AM", hour: 11, isAvailable: false },
    { time: "12:00 PM", hour: 12, isAvailable: true },
    { time: "1:00 PM", hour: 13, isAvailable: true },
    { time: "2:00 PM", hour: 14, isAvailable: false },
    { time: "3:00 PM", hour: 15, isAvailable: true },
    { time: "4:00 PM", hour: 16, isAvailable: true },
    { time: "5:00 PM", hour: 17, isAvailable: false },
    { time: "6:00 PM", hour: 18, isAvailable: false },
    { time: "7:00 PM", hour: 19, isAvailable: true },
    { time: "8:00 PM", hour: 20, isAvailable: true },
    { time: "9:00 PM", hour: 21, isAvailable: false },
    { time: "10:00 PM", hour: 22, isAvailable: true },
  ],
};

// View B: Park aggregate availability (Capacity Bar)
export interface ParkHour {
  time: string;
  hour: number;
  totalCourts: number;
  availableCourts: number;
}

export interface MockParkData {
  parkName: string;
  hours: ParkHour[];
}

export const mockParkData: MockParkData = {
  parkName: "Lower Woodland",
  hours: [
    { time: "4 PM", hour: 16, totalCourts: 10, availableCourts: 7 },
    { time: "5 PM", hour: 17, totalCourts: 10, availableCourts: 5 },
    { time: "6 PM", hour: 18, totalCourts: 10, availableCourts: 3 },
    { time: "7 PM", hour: 19, totalCourts: 4, availableCourts: 1 },
    { time: "8 PM", hour: 20, totalCourts: 4, availableCourts: 2 },
    { time: "9 PM", hour: 21, totalCourts: 6, availableCourts: 4 },
    { time: "10 PM", hour: 22, totalCourts: 6, availableCourts: 6 },
  ],
};
