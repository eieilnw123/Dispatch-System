"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// OSRM Routing Function
async function fetchRouteDistance(originLat: number, originLng: number, destLat: number, destLng: number) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      const distanceKm = parseFloat((data.routes[0].distance / 1000).toFixed(2));
      const estimatedHours = parseFloat((data.routes[0].duration / 3600).toFixed(2));
      return { distanceKm, estimatedHours };
    }
  } catch (error) {
    console.error("OSRM Error:", error);
  }
  return { distanceKm: 0, estimatedHours: 0 };
}

export async function getDashboardData(dateStr?: string) {
  let dateFilter = {};
  if (dateStr) {
    // Treat the dateStr as local time for simplicity or just exact match
    // Next.js inputs type="date" give "YYYY-MM-DD"
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);
    dateFilter = {
      date: {
        gte: startOfDay,
        lte: endOfDay
      }
    };
  }

  const [jobs, customers, locations, drivers] = await Promise.all([
    prisma.job.findMany({
      where: dateFilter,
      include: {
        customer: true,
        legs: {
          include: {
            origin: true,
            destination: true,
            driver: true,
            truck: true,
          },
          orderBy: { sequenceOrder: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.customer.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.location.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.driver.findMany({ 
      orderBy: { createdAt: 'desc' },
      include: {
        legs: {
          where: { 
            status: { notIn: ["COMPLETED"] },
            job: { status: { notIn: ["COMPLETED", "CANCELLED"] } }
          },
          include: { origin: true, destination: true, job: true }
        }
      }
    })
  ]);
  
  return { jobs, customers, locations, drivers };
}

// CREATE ACTIONS
export async function createCustomer(formData: FormData) {
  const name = formData.get("name") as string;
  if (!name) return;
  await prisma.customer.create({ data: { name } });
  revalidatePath("/");
}

export async function createLocation(formData: FormData) {
  const name = formData.get("name") as string;
  const type = formData.get("type") as any;
  const latStr = formData.get("latitude") as string;
  const lngStr = formData.get("longitude") as string;
  
  const latitude = latStr ? parseFloat(latStr) : null;
  const longitude = lngStr ? parseFloat(lngStr) : null;

  if (!name || !type) return;
  await prisma.location.create({ data: { name, type, latitude, longitude } });
  revalidatePath("/");
}

export async function createDriver(formData: FormData) {
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  if (!name) return;
  await prisma.driver.create({ data: { name, phone } });
  revalidatePath("/");
}

export async function createJob(data: any) {
  const firstLeg = data.legs[0];
  const origin = await prisma.location.findUnique({ where: { id: firstLeg.originId } });
  const destination = await prisma.location.findUnique({ where: { id: firstLeg.destinationId } });

  let distanceKm = 0;
  let estimatedHours = 0;

  if (origin?.latitude && origin?.longitude && destination?.latitude && destination?.longitude) {
    const route = await fetchRouteDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
    distanceKm = route.distanceKm;
    estimatedHours = route.estimatedHours;
  }

  await prisma.job.create({
    data: {
      date: new Date(data.date),
      customerId: data.customerId,
      containerSize: data.containerSize,
      codeRef: data.codeRef,
      invoiceRef: data.invoiceRef,
      vgm: data.vgm,
      cutOffTime: data.cutOffTime ? new Date(data.cutOffTime) : null,
      legs: {
        create: data.legs.map((leg: any, index: number) => ({
          sequenceOrder: index + 1,
          originId: leg.originId,
          destinationId: leg.destinationId,
          driverId: leg.driverId,
          status: "PENDING",
          distanceKm: distanceKm,
          estimatedHours: estimatedHours
        }))
      }
    }
  });
  revalidatePath("/");
}

// DELETE ACTIONS
export async function deleteCustomer(id: string) {
  await prisma.customer.delete({ where: { id } });
  revalidatePath("/");
}

export async function deleteLocation(id: string) {
  await prisma.location.delete({ where: { id } });
  revalidatePath("/");
}

export async function deleteDriver(id: string) {
  await prisma.driver.delete({ where: { id } });
  revalidatePath("/");
}

export async function deleteJob(id: string) {
  await prisma.job.delete({ where: { id } });
  revalidatePath("/");
}

// UPDATE ACTIONS
export async function updateJobStatus(id: string, status: any) {
  await prisma.job.update({ where: { id }, data: { status } });
  
  if (status === "COMPLETED") {
    await prisma.jobLeg.updateMany({
      where: { jobId: id },
      data: { status: "COMPLETED" }
    });
  }
  
  revalidatePath("/");
}

export async function updateLegStatus(id: string, status: any) {
  await prisma.jobLeg.update({ where: { id }, data: { status } });
  revalidatePath("/");
}

export async function updateLegDriver(id: string, driverId: string) {
  await prisma.jobLeg.update({ where: { id }, data: { driverId } });
  revalidatePath("/");
}

// INJECT TRANSFER
export async function injectTransfer(jobId: string, legIdToSplit: string, transferYardId: string, newDriverId: string) {
  // 1. Find the job and all its legs
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { legs: { orderBy: { sequenceOrder: 'asc' } } }
  });
  if (!job) return;

  // 2. Find the leg to split
  const legIndex = job.legs.findIndex(l => l.id === legIdToSplit);
  if (legIndex === -1) return;
  
  const legToSplit = job.legs[legIndex];
  const oldDestinationId = legToSplit.destinationId;

  // 3. Update the existing leg's destination to the transfer yard
  const origin = await prisma.location.findUnique({ where: { id: legToSplit.originId } });
  const transferYard = await prisma.location.findUnique({ where: { id: transferYardId } });
  const originalDestination = await prisma.location.findUnique({ where: { id: oldDestinationId } });

  let dist1 = 0, hours1 = 0;
  if (origin?.latitude && origin?.longitude && transferYard?.latitude && transferYard?.longitude) {
    const route = await fetchRouteDistance(origin.latitude, origin.longitude, transferYard.latitude, transferYard.longitude);
    dist1 = route.distanceKm;
    hours1 = route.estimatedHours;
  }

  await prisma.jobLeg.update({
    where: { id: legIdToSplit },
    data: {
      destinationId: transferYardId,
      distanceKm: dist1,
      estimatedHours: hours1
    }
  });

  // 4. Shift subsequent legs sequenceOrder + 1
  for (let i = legIndex + 1; i < job.legs.length; i++) {
    await prisma.jobLeg.update({
      where: { id: job.legs[i].id },
      data: { sequenceOrder: job.legs[i].sequenceOrder + 1 }
    });
  }

  // 5. Create the new leg from Transfer Yard to Old Destination
  let dist2 = 0, hours2 = 0;
  if (transferYard?.latitude && transferYard?.longitude && originalDestination?.latitude && originalDestination?.longitude) {
    const route = await fetchRouteDistance(transferYard.latitude, transferYard.longitude, originalDestination.latitude, originalDestination.longitude);
    dist2 = route.distanceKm;
    hours2 = route.estimatedHours;
  }

  await prisma.jobLeg.create({
    data: {
      jobId: jobId,
      sequenceOrder: legToSplit.sequenceOrder + 1,
      originId: transferYardId,
      destinationId: oldDestinationId,
      driverId: newDriverId,
      status: "PENDING",
      distanceKm: dist2,
      estimatedHours: hours2
    }
  });

  revalidatePath("/");
}
