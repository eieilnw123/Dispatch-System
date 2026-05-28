import DispatchBoard from "@/components/DispatchBoard";
import { getDashboardData } from "@/app/actions";

// Force dynamic rendering since we want real-time data from DB on every refresh
export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const params = await searchParams;
  const today = new Date().toISOString().split('T')[0];
  const selectedDate = params?.date || today;

  const data = await getDashboardData(selectedDate);

  return (
    <main className="min-h-screen bg-white">
      <DispatchBoard 
        initialJobs={data.jobs}
        customers={data.customers}
        locations={data.locations}
        drivers={data.drivers}
        selectedDate={selectedDate}
      />
    </main>
  );
}
