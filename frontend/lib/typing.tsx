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
  Phone,
  MessageCircle,
  Smile,
  Stethoscope,
  Gift,
} from "lucide-react";

export type Task = {
  id: string;
  label: string;
  date: string;
  time: string;
  icon: string;
  completed: boolean;
  notes?: string;
  reward?: string;
};

export const taskIconMap: Record<string, React.ReactNode> = {
  pill:        <Pill className="w-5 h-5 text-blue-500" />,
  utensils:    <Utensils className="w-5 h-5 text-green-500" />,
  showerHead:  <ShowerHead className="w-5 h-5 text-cyan-500" />,
  footprints:  <Footprints className="w-5 h-5 text-orange-500" />,
  bed:         <Bed className="w-5 h-5 text-purple-500" />,    
  exercise:    <Dumbbell className="w-5 h-5 text-red-500" />,   
  hydrate:     <GlassWater className="w-5 h-5 text-sky-500" />,  
  alarm:       <AlarmClock className="w-5 h-5 text-yellow-500" />,
  vitals:      <HeartPulse className="w-5 h-5 text-rose-500" />, 
  checklist:   <ClipboardList className="w-5 h-5 text-gray-500" />, 
  call:        <Phone className="w-5 h-5 text-emerald-500" />,  
  chat:        <MessageCircle className="w-5 h-5 text-teal-500" />, 
  mood:        <Smile className="w-5 h-5 text-pink-500" />,    
  doctor:      <Stethoscope className="w-5 h-5 text-indigo-500" />, 
  reward:      <Gift className="w-5 h-5 text-yellow-500" />,     
};
