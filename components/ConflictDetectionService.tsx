import { supabase } from '../app/lib/supabase';

interface ConflictCheckParams {
  date: string;
  startTime: string;
  endTime: string;
  cfiId: string;
  aircraftId: string;
  excludeScheduleId?: string;
}

interface Conflict {
  type: 'cfi' | 'aircraft';
  conflictingSchedule: {
    id: string;
    start_time: string;
    end_time: string;
    student_name?: string;
    cfi_name?: string;
    aircraft_tail?: string;
  };
}

export class ConflictDetectionService {
  static async checkForConflicts({
    date,
    startTime,
    endTime,
    cfiId,
    aircraftId,
    excludeScheduleId
  }: ConflictCheckParams): Promise<Conflict[]> {
    try {
      let query = supabase
        .from('schedules')
        .select(`
          *,
          students(name),
          cfis(name),
          aircraft(tail_number)
        `)
        .eq('date', date)
        .neq('status', 'canceled');

      if (excludeScheduleId) {
        query = query.neq('id', excludeScheduleId);
      }

      const { data: existingSchedules, error } = await query;
      
      if (error) {
        console.error('Error checking conflicts:', error);
        return [];
      }

      const conflicts: Conflict[] = [];

      existingSchedules?.forEach(schedule => {
        const hasTimeOverlap = this.checkTimeOverlap(
          startTime,
          endTime,
          schedule.start_time,
          schedule.end_time
        );

        if (hasTimeOverlap) {
          // Check CFI conflict
          if (schedule.cfi_id === cfiId) {
            conflicts.push({
              type: 'cfi',
              conflictingSchedule: {
                id: schedule.id,
                start_time: schedule.start_time,
                end_time: schedule.end_time,
                student_name: schedule.students?.name,
                cfi_name: schedule.cfis?.name,
                aircraft_tail: schedule.aircraft?.tail_number
              }
            });
          }

          // Check aircraft conflict
          if (schedule.aircraft_id === aircraftId) {
            conflicts.push({
              type: 'aircraft',
              conflictingSchedule: {
                id: schedule.id,
                start_time: schedule.start_time,
                end_time: schedule.end_time,
                student_name: schedule.students?.name,
                cfi_name: schedule.cfis?.name,
                aircraft_tail: schedule.aircraft?.tail_number
              }
            });
          }
        }
      });

      return conflicts;
    } catch (error) {
      console.error('Error in conflict detection:', error);
      return [];
    }
  }

  private static checkTimeOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    // Convert time strings to minutes for easier comparison
    const toMinutes = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const start1Min = toMinutes(start1);
    const end1Min = toMinutes(end1);
    const start2Min = toMinutes(start2);
    const end2Min = toMinutes(end2);

    // Check if there's any overlap
    return (
      (start1Min < end2Min && end1Min > start2Min) ||
      (start2Min < end1Min && end2Min > start1Min)
    );
  }

  static formatConflictMessage(conflicts: Conflict[]): string {
    if (conflicts.length === 0) return '';

    const messages = conflicts.map(conflict => {
      const { type, conflictingSchedule } = conflict;
      const timeRange = `${conflictingSchedule.start_time} - ${conflictingSchedule.end_time}`;
      
      if (type === 'cfi') {
        return `CFI ${conflictingSchedule.cfi_name} is already scheduled with ${conflictingSchedule.student_name} from ${timeRange}`;
      } else {
        return `Aircraft ${conflictingSchedule.aircraft_tail} is already scheduled from ${timeRange}`;
      }
    });

    return messages.join('\n\n');
  }

  static async getAvailableTimeSlots(
    date: string,
    cfiId: string,
    aircraftId: string,
    duration: number = 60 // duration in minutes
  ): Promise<{ start: string; end: string }[]> {
    try {
      const { data: existingSchedules, error } = await supabase
        .from('schedules')
        .select('start_time, end_time')
        .eq('date', date)
        .neq('status', 'canceled')
        .or(`cfi_id.eq.${cfiId},aircraft_id.eq.${aircraftId}`)
        .order('start_time');

      if (error) {
        console.error('Error getting available slots:', error);
        return [];
      }

      // Generate available time slots (8 AM to 6 PM)
      const availableSlots: { start: string; end: string }[] = [];
      const startHour = 8;
      const endHour = 18;

      for (let hour = startHour; hour < endHour; hour++) {
        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;

        // Check if this slot conflicts with existing schedules
        const hasConflict = existingSchedules?.some(schedule =>
          this.checkTimeOverlap(startTime, endTime, schedule.start_time, schedule.end_time)
        );

        if (!hasConflict) {
          availableSlots.push({ start: startTime, end: endTime });
        }
      }

      return availableSlots;
    } catch (error) {
      console.error('Error getting available time slots:', error);
      return [];
    }
  }
}

export default ConflictDetectionService;