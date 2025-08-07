// Mock Supabase client for development
export const supabase = {
  from: (table: string) => ({
    select: (columns?: string) => createQueryBuilder(table),
    insert: (data: any) => ({ data: null, error: null }),
    update: (data: any) => ({ eq: (col: string, val: any) => ({ data: null, error: null }) }),
    delete: () => ({ eq: (col: string, val: any) => ({ data: null, error: null }) })
  }),
  auth: {
    getUser: () => Promise.resolve({
      data: { user: { id: 'mock-user-id', email: 'test@example.com' } },
      error: null
    })
  },
  functions: {
    invoke: (name: string, options?: any) => Promise.resolve({ data: null, error: null })
  }
};

function getMockData(table: string) {
  const mockSchedules = [
    {
      id: '1',
      date: '2024-01-15',
      start_time: '09:00:00',
      end_time: '11:00:00',
      student_id: 'student1',
      cfi_id: 'cfi1',
      aircraft_id: 'aircraft1',
      status: 'approved',
      students: { first_name: 'John', last_name: 'Doe' },
      cfis: { first_name: 'Jane', last_name: 'Smith' },
      aircraft: { tail_number: 'N123AB' }
    },
    {
      id: '2',
      date: '2024-01-16',
      start_time: '14:00:00',
      end_time: '16:00:00',
      student_id: 'student1',
      cfi_id: 'cfi1',
      aircraft_id: 'aircraft1',
      status: 'pending',
      students: { first_name: 'John', last_name: 'Doe' },
      cfis: { first_name: 'Jane', last_name: 'Smith' },
      aircraft: { tail_number: 'N123AB' }
    }
  ];

  const mockStudents = [
    { id: 'student1', first_name: 'John', last_name: 'Doe', name: 'John Doe' }
  ];

  const mockCfis = [
    { id: 'cfi1', first_name: 'Jane', last_name: 'Smith', name: 'Jane Smith' }
  ];

  const mockAircraft = [
    { id: 'aircraft1', tail_number: 'N123AB' }
  ];

  switch (table) {
    case 'schedules': return mockSchedules;
    case 'students': return mockStudents;
    case 'cfis': return mockCfis;
    case 'aircraft': return mockAircraft;
    default: return [];
  }
}

function createQueryBuilder(table: string) {
  const builder = {
    eq: (column: string, value: any) => builder,
    order: (column: string, options?: any) => builder,
    gte: (column: string, value: any) => builder,
    lte: (column: string, value: any) => builder,
    in: (column: string, values: any[]) => builder,
    neq: (column: string, value: any) => builder,
    or: (query: string) => builder,
    limit: (count: number) => builder,
    data: getMockData(table),
    error: null
  };
  return builder;
}