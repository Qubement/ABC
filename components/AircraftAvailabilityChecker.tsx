import { supabase } from '../app/lib/supabase';

export interface AircraftAvailability {
  id: string;
  tail_number: string;
  make: string;
  model: string;
  isAvailable: boolean;
}

export async function checkAircraftAvailability(
  date: string,
  startTime: string
): Promise<AircraftAvailability[]> {
  try {
    // Get all aircraft
    const { data: allAircraft, error: aircraftError } = await supabase
      .from('aircraft')
      .select('id, tail_number, make, model');

    if (aircraftError) throw aircraftError;

    // Get scheduled aircraft for the specific date and time
    const { data: scheduledAircraft, error: scheduleError } = await supabase
      .from('schedules')
      .select('entity_id')
      .eq('entity_type', 'aircraft')
      .eq('date', date)
      .eq('start_time', startTime);

    if (scheduleError) throw scheduleError;

    const scheduledIds = new Set(
      scheduledAircraft?.map(s => s.entity_id) || []
    );

    // Mark availability for each aircraft
    const availabilityList: AircraftAvailability[] = (allAircraft || []).map(aircraft => ({
      id: aircraft.id,
      tail_number: aircraft.tail_number,
      make: aircraft.make,
      model: aircraft.model,
      isAvailable: !scheduledIds.has(aircraft.id)
    }));

    return availabilityList;
  } catch (error) {
    console.error('Error checking aircraft availability:', error);
    return [];
  }
}

export async function getAvailableAircraft(
  date: string,
  startTime: string
): Promise<{ id: string; label: string; value: string }[]> {
  const availability = await checkAircraftAvailability(date, startTime);
  
  return availability
    .filter(aircraft => aircraft.isAvailable)
    .map(aircraft => ({
      id: aircraft.id,
      label: `${aircraft.tail_number} (${aircraft.make} ${aircraft.model})`,
      value: aircraft.id
    }));
}
