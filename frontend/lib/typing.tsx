import {
  Pill,
  Utensils,
  ShowerHead,
  Footprints,
  Bed,
  Dumbbell,
  GlassWater,
  AlarmClock,
  HeartPulse,
  ClipboardList,
  Stethoscope,
  ShoppingCart,
  Shirt,
  CarFront,
  AlertTriangle,
} from 'lucide-react';

export type Task = {
  id: number;
  label: string;
  date: string;
  time: string;
  icon: string;
  completed: boolean;
  notes?: string;
  reward?: string;
};

export const taskIconMap: Record<string, React.ReactNode> = {
  medication: <Pill className="w-5 h-5 text-blue-500" />,
  meal: <Utensils className="w-5 h-5 text-green-500" />,
  bath: <ShowerHead className="w-5 h-5 text-cyan-500" />,
  walk: <Footprints className="w-5 h-5 text-orange-500" />,
  rest: <Bed className="w-5 h-5 text-purple-500" />,
  exercise: <Dumbbell className="w-5 h-5 text-red-500" />,
  hydrate: <GlassWater className="w-5 h-5 text-sky-500" />,
  wake_up: <AlarmClock className="w-5 h-5 text-yellow-500" />,
  vitals_check: <HeartPulse className="w-5 h-5 text-rose-500" />,
  checklist: <ClipboardList className="w-5 h-5 text-gray-500" />,
  doctor_visit: <Stethoscope className="w-5 h-5 text-indigo-500" />,
  laundry: <Shirt className="w-5 h-5 text-fuchsia-500" />,
  groceries: <ShoppingCart className="w-5 h-5 text-amber-500" />,
  transport: <CarFront className="w-5 h-5 text-cyan-600" />,
  emergency: <AlertTriangle className="w-5 h-5 text-red-600" />,
};
